import { generateText, streamText } from "ai"
import { openai, createOpenAI } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import type { LLMConfig, LLMMessage, LLMResponse } from "@/types/llm"

export class LLMService {
  private getProvider(config: LLMConfig) {
    switch (config.provider) {
      case "openai":
        if (!config.apiKey) {
          throw new Error("OpenAI API key is required")
        }
        // Use default OpenAI instance for official OpenAI API
        if (!config.baseUrl || config.baseUrl === "https://api.openai.com/v1") {
          return openai(config.modelId, {
            apiKey: config.apiKey,
          })
        }
        // Use createOpenAI for custom OpenAI endpoints
        const customOpenAI = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
        })
        return customOpenAI(config.modelId)

      case "anthropic":
        if (!config.apiKey) {
          throw new Error("Anthropic API key is required")
        }
        return anthropic(config.modelId, {
          apiKey: config.apiKey,
          baseURL: config.baseUrl || undefined,
        })

      case "gemini":
        if (!config.apiKey) {
          throw new Error("Google AI API key is required")
        }
        // Set the environment variable for Google AI SDK
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = config.apiKey
        return google(config.modelId, {
          apiKey: config.apiKey,
        })

      case "groq":
        if (!config.apiKey) {
          throw new Error("Groq API key is required")
        }
        const groqProvider = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl || "https://api.groq.com/openai/v1",
        })
        return groqProvider(config.modelId)

      case "ollama":
        const ollamaProvider = createOpenAI({
          apiKey: "ollama", // Ollama doesn't require a real API key
          baseURL: config.baseUrl || "http://localhost:11434/v1",
        })
        return ollamaProvider(config.modelId)

      case "custom":
        if (!config.apiKey) {
          throw new Error("API key is required for custom provider")
        }
        if (!config.baseUrl) {
          throw new Error("Base URL is required for custom provider")
        }
        const customProvider = createOpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseUrl,
        })
        return customProvider(config.modelId)

      default:
        throw new Error(`Unsupported provider: ${config.provider}`)
    }
  }

  async chat(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    try {
      const model = this.getProvider(config)

      const result = await generateText({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000,
      })

      return {
        content: result.text,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        model: config.modelId,
      }
    } catch (error) {
      console.error("LLM Service Error:", error)
      throw new Error(`LLM request failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<string> {
    try {
      const model = this.getProvider(config)

      const result = await streamText({
        model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000,
      })

      for await (const delta of result.textStream) {
        yield delta
      }
    } catch (error) {
      console.error("LLM Streaming Error:", error)
      throw new Error(`LLM streaming failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async testConnection(config: LLMConfig): Promise<boolean> {
    try {
      // Validate config first
      if (!config.apiKey && config.provider !== "ollama") {
        throw new Error("API key is required")
      }
      if (!config.modelId) {
        throw new Error("Model ID is required")
      }

      const testMessages: LLMMessage[] = [
        { role: "user", content: "Hello, please respond with exactly: Connection successful" },
      ]

      const response = await this.chat(testMessages, config)
      return (
        response.content.toLowerCase().includes("connection successful") ||
        response.content.toLowerCase().includes("hello")
      )
    } catch (error) {
      console.error("Connection test failed:", error)
      return false
    }
  }
}

export const llmService = new LLMService()
