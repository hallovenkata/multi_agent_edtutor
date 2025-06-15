import type { LLMConfig, LLMMessage, LLMResponse } from "@/types/llm"
import { llmService } from "./llm-service"

interface RequestOptions {
  timeout?: number
  retries?: number
  priority?: "high" | "medium" | "low"
  cancellable?: boolean
}

interface QueuedRequest {
  id: string
  agentName: string
  messages: LLMMessage[]
  config: LLMConfig
  options: RequestOptions
  resolve: (value: LLMResponse) => void
  reject: (error: Error) => void
  abortController: AbortController
  timestamp: number
  retryCount: number
}

interface StreamRequest {
  id: string
  agentName: string
  messages: LLMMessage[]
  config: LLMConfig
  options: RequestOptions
  generator: AsyncGenerator<string>
  abortController: AbortController
  timestamp: number
}

export class RequestManager {
  private requestQueue: QueuedRequest[] = []
  private activeRequests: Map<string, QueuedRequest> = new Map()
  private streamingRequests: Map<string, StreamRequest> = new Map()
  private agentStatus: Map<string, "idle" | "processing" | "error" | "cancelled"> = new Map()
  private requestCache: Map<string, { response: LLMResponse; timestamp: number }> = new Map()
  private maxConcurrentRequests = 1 // Process requests sequentially
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.processQueue()
    this.cleanupCache()
  }

  // Generate cache key for requests
  private getCacheKey(messages: LLMMessage[], config: LLMConfig): string {
    const messageHash = messages.map((m) => `${m.role}:${m.content}`).join("|")
    return `${config.provider}:${config.modelId}:${messageHash}`
  }

  // Check if request is cacheable and return cached response
  private getCachedResponse(messages: LLMMessage[], config: LLMConfig): LLMResponse | null {
    const key = this.getCacheKey(messages, config)
    const cached = this.requestCache.get(key)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response
    }

    if (cached) {
      this.requestCache.delete(key) // Remove expired cache
    }

    return null
  }

  // Cache successful response
  private cacheResponse(messages: LLMMessage[], config: LLMConfig, response: LLMResponse) {
    const key = this.getCacheKey(messages, config)
    this.requestCache.set(key, { response, timestamp: Date.now() })
  }

  // Get agent status
  getAgentStatus(agentName: string): "idle" | "processing" | "error" | "cancelled" {
    return this.agentStatus.get(agentName) || "idle"
  }

  // Cancel all requests for a specific agent
  cancelAgentRequests(agentName: string) {
    // Cancel queued requests
    this.requestQueue = this.requestQueue.filter((req) => {
      if (req.agentName === agentName) {
        req.abortController.abort()
        req.reject(new Error("Request cancelled"))
        return false
      }
      return true
    })

    // Cancel active requests
    for (const [id, req] of this.activeRequests.entries()) {
      if (req.agentName === agentName) {
        req.abortController.abort()
        req.reject(new Error("Request cancelled"))
        this.activeRequests.delete(id)
      }
    }

    // Cancel streaming requests
    for (const [id, req] of this.streamingRequests.entries()) {
      if (req.agentName === agentName) {
        req.abortController.abort()
        this.streamingRequests.delete(id)
      }
    }

    this.agentStatus.set(agentName, "cancelled")
    setTimeout(() => this.agentStatus.set(agentName, "idle"), 1000)
  }

  // Make a request with proper queuing and error handling
  async makeRequest(
    agentName: string,
    messages: LLMMessage[],
    config: LLMConfig,
    options: RequestOptions = {},
  ): Promise<LLMResponse> {
    // Only cancel existing requests if explicitly requested
    if (options.cancellable === false) {
      this.cancelAgentRequests(agentName)
    }

    // Check cache first
    const cached = this.getCachedResponse(messages, config)
    if (cached) {
      return cached
    }

    const requestId = `${agentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const abortController = new AbortController()

    const defaultOptions: RequestOptions = {
      timeout: 30000, // 30 seconds
      retries: 2,
      priority: "medium",
      cancellable: true, // Default to allowing concurrent requests
      ...options,
    }

    return new Promise<LLMResponse>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: requestId,
        agentName,
        messages,
        config,
        options: defaultOptions,
        resolve,
        reject,
        abortController,
        timestamp: Date.now(),
        retryCount: 0,
      }

      // Add to queue based on priority
      if (defaultOptions.priority === "high") {
        this.requestQueue.unshift(queuedRequest)
      } else {
        this.requestQueue.push(queuedRequest)
      }

      this.agentStatus.set(agentName, "processing")
      this.processQueue()
    })
  }

  // Make a streaming request
  async *makeStreamRequest(
    agentName: string,
    messages: LLMMessage[],
    config: LLMConfig,
    options: RequestOptions = {},
  ): AsyncGenerator<string> {
    // Cancel any existing requests for this agent
    this.cancelAgentRequests(agentName)

    const requestId = `${agentName}_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const abortController = new AbortController()

    try {
      this.agentStatus.set(agentName, "processing")

      const generator = llmService.stream(messages, config)

      const streamRequest: StreamRequest = {
        id: requestId,
        agentName,
        messages,
        config,
        options,
        generator,
        abortController,
        timestamp: Date.now(),
      }

      this.streamingRequests.set(requestId, streamRequest)

      // Set timeout
      const timeout = setTimeout(() => {
        abortController.abort()
        this.streamingRequests.delete(requestId)
        this.agentStatus.set(agentName, "error")
      }, options.timeout || 30000)

      try {
        for await (const chunk of generator) {
          if (abortController.signal.aborted) {
            break
          }
          yield chunk
        }
        this.agentStatus.set(agentName, "idle")
      } finally {
        clearTimeout(timeout)
        this.streamingRequests.delete(requestId)
      }
    } catch (error) {
      this.agentStatus.set(agentName, "error")
      throw error
    }
  }

  // Process the request queue
  private async processQueue() {
    // If we're already at max concurrent requests, wait for one to finish
    if (this.activeRequests.size >= this.maxConcurrentRequests) {
      return;
    }

    const nextRequest = this.requestQueue.shift();
    if (!nextRequest) return;

    this.activeRequests.set(nextRequest.id, nextRequest);
    this.agentStatus.set(nextRequest.agentName, 'processing');
    
    try {
      await this.executeRequest(nextRequest);
    } catch (error) {
      console.error('Error in request execution:', error);
    } finally {
      // Process next request in queue after current one completes
      this.processQueue();
    }
  }

  // Execute a single request with retry logic
  private async executeRequest(request: QueuedRequest) {
    const { id, agentName, messages, config, options, resolve, reject, abortController } = request
    const { timeout = 30000 } = options

    try {
      // Set timeout
      const timeoutId = setTimeout(() => {
        abortController.abort()
        this.handleRequestError(request, new Error("Request timeout"))
      }, timeout)

      const response = await llmService.chat(messages, config)

      clearTimeout(timeoutId)

      if (!abortController.signal.aborted) {
        // Cache successful response
        this.cacheResponse(messages, config, response)
        this.agentStatus.set(agentName, "idle")
        resolve(response)
      }
    } catch (error) {
      this.handleRequestError(request, error as Error)
    } finally {
      this.activeRequests.delete(id)
      // The processQueue() will be called by the queue processor
    }
  }

  // Handle request errors with retry logic
  private handleRequestError(request: QueuedRequest, error: Error) {
    const { agentName, options, reject } = request

    if (request.abortController.signal.aborted) {
      this.agentStatus.set(agentName, "cancelled")
      reject(new Error("Request cancelled"))
      return
    }

    request.retryCount++

    if (request.retryCount <= (options.retries || 0)) {
      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, request.retryCount - 1), 10000)
      const jitter = Math.random() * 1000 // Add up to 1s jitter
      const delay = Math.floor(baseDelay + jitter)

      // Add back to the front of the queue with a delay
      setTimeout(() => {
        this.requestQueue.unshift(request)
        this.processQueue()
      }, delay)
    } else {
      this.agentStatus.set(agentName, "error")
      reject(error)
    }
  }

  // Clean up old cache entries
  private cleanupCache() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.requestCache.entries()) {
        if (now - cached.timestamp > this.cacheTimeout) {
          this.requestCache.delete(key)
        }
      }
    }, 60000) // Clean up every minute
  }

  // Get queue status
  getQueueStatus() {
    return {
      queued: this.requestQueue.length,
      active: this.activeRequests.size,
      streaming: this.streamingRequests.size,
      agentStatuses: Object.fromEntries(this.agentStatus),
    }
  }

  // Emergency stop all requests
  emergencyStop() {
    // Cancel all queued requests
    this.requestQueue.forEach((req) => {
      req.abortController.abort()
      req.reject(new Error("Emergency stop"))
    })
    this.requestQueue = []

    // Cancel all active requests
    this.activeRequests.forEach((req) => {
      req.abortController.abort()
      req.reject(new Error("Emergency stop"))
    })
    this.activeRequests.clear()

    // Cancel all streaming requests
    this.streamingRequests.forEach((req) => {
      req.abortController.abort()
    })
    this.streamingRequests.clear()

    // Reset all agent statuses
    this.agentStatus.clear()
  }
}

export const requestManager = new RequestManager()
