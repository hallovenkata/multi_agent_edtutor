export interface LLMConfig {
  id: string
  name: string
  provider: "openai" | "anthropic" | "groq" | "ollama" | "custom"
  baseUrl?: string
  apiKey: string
  modelId: string
  temperature?: number
  maxTokens?: number
  isDefault?: boolean
}

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AgentPrompt {
  system: string
  context?: string
  examples?: Array<{
    user: string
    assistant: string
  }>
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
}
