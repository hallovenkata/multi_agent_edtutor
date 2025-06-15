import { requestManager } from "./request-manager"
import { agentPrompts } from "./agent-prompts"
import type { LLMConfig, LLMMessage } from "@/types/llm"

export class EnhancedAgent {
  constructor(
    public name: string,
    public config: LLMConfig,
    public systemPrompt: string,
  ) {}

  protected async callLLM(
    messages: LLMMessage[],
    context?: string,
    priority: "high" | "medium" | "low" = "medium",
  ): Promise<string> {
    const systemMessage: LLMMessage = {
      role: "system",
      content: context ? `${this.systemPrompt}\n\nContext: ${context}` : this.systemPrompt,
    }

    const allMessages = [systemMessage, ...messages]

    const response = await requestManager.makeRequest(this.name, allMessages, this.config, {
      priority,
      timeout: 30000,
      retries: 2,
    })

    return response.content
  }

  protected async *streamLLM(messages: LLMMessage[], context?: string): AsyncGenerator<string> {
    const systemMessage: LLMMessage = {
      role: "system",
      content: context ? `${this.systemPrompt}\n\nContext: ${context}` : this.systemPrompt,
    }

    const allMessages = [systemMessage, ...messages]

    for await (const chunk of requestManager.makeStreamRequest(this.name, allMessages, this.config)) {
      yield chunk
    }
  }

  // Cancel any ongoing requests for this agent
  cancel() {
    requestManager.cancelAgentRequests(this.name)
  }

  // Get agent status
  getStatus() {
    return requestManager.getAgentStatus(this.name)
  }
}

// Enhanced versions of all agents
export class EnhancedConversationalVoiceAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("CVA", config, agentPrompts.CVA.system)
  }

  async generateGreeting(studentName: string, studentLevel: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate a welcoming greeting for a student named ${studentName} who is at ${studentLevel} level in math. Keep it encouraging and brief.`,
      },
    ]

    return await this.callLLM(messages, undefined, "high")
  }

  async generateResponse(userInput: string, context: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: userInput,
      },
    ]

    return await this.callLLM(messages, context)
  }
}

export class EnhancedVisionAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("VA", config, agentPrompts.VA.system)
  }

  async extractProblem(ocrText: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Extract the mathematical equation from this OCR text: "${ocrText}"`,
      },
    ]

    return await this.callLLM(messages, undefined, "high")
  }

  async validateProblem(problem: string): Promise<{ isValid: boolean; reason?: string }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Is this a valid mathematical equation that can be solved? "${problem}". Respond with "VALID" or "INVALID: reason"`,
      },
    ]

    const response = await this.callLLM(messages)
    const isValid = response.startsWith("VALID")
    const reason = isValid ? undefined : response.replace("INVALID: ", "")

    return { isValid, reason }
  }
}

export class EnhancedTeachingAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("TA", config, agentPrompts.TA.system)
  }

  async generateStepGuidance(step: string, studentLevel: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Provide guidance for this math step: "${step}". Student level: ${studentLevel}. Be encouraging and clear.`,
      },
    ]

    return await this.callLLM(messages, undefined, "high")
  }

  async *streamStepGuidance(step: string, studentLevel: string): AsyncGenerator<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Provide guidance for this math step: "${step}". Student level: ${studentLevel}. Be encouraging and clear.`,
      },
    ]

    for await (const chunk of this.streamLLM(messages)) {
      yield chunk
    }
  }
}

export class EnhancedAssessmentAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("AA", config, agentPrompts.AA.system)
  }

  async evaluateAnswer(
    studentAnswer: string,
    expectedStep: string,
    correctAnswer: string,
  ): Promise<{
    isCorrect: boolean
    partialCredit: number
    feedback: string
    nextStepReady: boolean
  }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Evaluate this student answer: "${studentAnswer}" for the step: "${expectedStep}". The correct answer is: "${correctAnswer}". Provide assessment with partial credit (0-1), feedback, and whether they're ready for the next step.`,
      },
    ]

    const response = await this.callLLM(messages, undefined, "high")
    const isCorrect = response.toLowerCase().includes("correct")

    return {
      isCorrect,
      partialCredit: isCorrect ? 1.0 : 0.5,
      feedback: response,
      nextStepReady: isCorrect,
    }
  }
}

export class EnhancedFeedbackAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("FA", config, agentPrompts.FA.system)
  }

  async generateFeedback(isCorrect: boolean, studentAnswer: string, attempt: number): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate ${isCorrect ? "positive" : "constructive"} feedback for student answer: "${studentAnswer}". This is attempt #${attempt}. Be encouraging.`,
      },
    ]

    return await this.callLLM(messages)
  }

  async *streamFeedback(isCorrect: boolean, studentAnswer: string, attempt: number): AsyncGenerator<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate ${isCorrect ? "positive" : "constructive"} feedback for student answer: "${studentAnswer}". This is attempt #${attempt}. Be encouraging.`,
      },
    ]

    for await (const chunk of this.streamLLM(messages)) {
      yield chunk
    }
  }
}

export class EnhancedNaturalLanguageGenerationAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("NLG", config, agentPrompts.NLG.system)
  }

  async generateHint(currentStep: string, studentLevel: string, previousAttempts: number): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate a helpful hint for step: "${currentStep}". Student level: ${studentLevel}. Previous attempts: ${previousAttempts}. Don't give away the answer.`,
      },
    ]

    return await this.callLLM(messages)
  }
}

export class EnhancedContentAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("CA", config, agentPrompts.CA.system)
  }

  async analyzeProblem(problem: string): Promise<{
    type: string
    difficulty: string
    concepts: string[]
    estimatedSteps: number
    solutionStrategy: string
  }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Analyze this math problem: "${problem}". Provide type, difficulty level, concepts involved, estimated steps, and solution strategy.`,
      },
    ]

    const response = await this.callLLM(messages, undefined, "high")

    return {
      type: "Linear Equation",
      difficulty: "Beginner",
      concepts: ["variable isolation", "inverse operations"],
      estimatedSteps: 3,
      solutionStrategy: response,
    }
  }

  async generateSolutionSteps(
    problem: string,
    studentLevel: string,
  ): Promise<
    Array<{
      id: number
      description: string
      equation: string
      explanation: string
    }>
  > {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate detailed solution steps for: "${problem}". Student level: ${studentLevel}. Include step descriptions, equations, and explanations.`,
      },
    ]

    const response = await this.callLLM(messages, undefined, "high")

    return [
      {
        id: 1,
        description: "Identify the equation",
        equation: problem,
        explanation: "We start with the given equation.",
      },
    ]
  }
}
