import { llmService } from "./llm-service"
import { agentPrompts } from "./agent-prompts"
import type { LLMConfig, LLMMessage } from "@/types/llm"

export class Agent {
  constructor(
    public name: string,
    public config: LLMConfig,
    public systemPrompt: string,
  ) {}

  protected async callLLM(messages: LLMMessage[], context?: string): Promise<string> {
    const systemMessage: LLMMessage = {
      role: "system",
      content: context ? `${this.systemPrompt}\n\nContext: ${context}` : this.systemPrompt,
    }

    const allMessages = [systemMessage, ...messages]
    const response = await llmService.chat(allMessages, this.config)
    return response.content
  }

  protected async *streamLLM(messages: LLMMessage[], context?: string): AsyncGenerator<string> {
    const systemMessage: LLMMessage = {
      role: "system",
      content: context ? `${this.systemPrompt}\n\nContext: ${context}` : this.systemPrompt,
    }

    const allMessages = [systemMessage, ...messages]
    for await (const chunk of llmService.stream(allMessages, this.config)) {
      yield chunk
    }
  }
}

export class ConversationalVoiceAgent extends Agent {
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

    return await this.callLLM(messages)
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

export class VisionAgent extends Agent {
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

    return await this.callLLM(messages)
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

export class NaturalLanguageUnderstandingAgent extends Agent {
  constructor(config: LLMConfig) {
    super("NLU", config, agentPrompts.NLU.system)
  }

  async parseStudentInput(
    input: string,
    currentStep: string,
  ): Promise<{
    intent: string
    confidence: number
    mathConcepts: string[]
    needsHelp: boolean
  }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Parse this student input: "${input}" in the context of solving step: "${currentStep}". Provide intent, confidence (0-1), math concepts mentioned, and whether they need help.`,
      },
    ]

    const response = await this.callLLM(messages)

    // Parse the structured response (in a real implementation, you'd use JSON)
    return {
      intent: "SOLVING_STEP",
      confidence: 0.8,
      mathConcepts: ["subtraction", "equation_balance"],
      needsHelp: response.toLowerCase().includes("help") || response.toLowerCase().includes("confused"),
    }
  }
}

export class TeachingAgent extends Agent {
  constructor(config: LLMConfig) {
    super("TA", config, agentPrompts.TA.system)
  }

  async createLessonPlan(
    problem: string,
    studentLevel: string,
  ): Promise<{
    steps: Array<{
      id: number
      description: string
      explanation: string
      hint: string
    }>
  }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Create a step-by-step lesson plan for solving: "${problem}". Student level: ${studentLevel}. Format as numbered steps with descriptions, explanations, and hints.`,
      },
    ]

    const response = await this.callLLM(messages)

    // In a real implementation, you'd parse this more carefully
    // For now, we'll create a basic structure
    return {
      steps: [
        {
          id: 1,
          description: "Identify the equation structure",
          explanation: response.split("\n")[0] || "Let's start by understanding what we're working with.",
          hint: "Look for the variable and constants in the equation.",
        },
      ],
    }
  }

  async generateStepGuidance(step: string, studentLevel: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Provide guidance for this math step: "${step}". Student level: ${studentLevel}. Be encouraging and clear.`,
      },
    ]

    return await this.callLLM(messages)
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

export class AssessmentAgent extends Agent {
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

    const response = await this.callLLM(messages)

    // Parse the response (simplified for demo)
    const isCorrect = response.toLowerCase().includes("correct")

    return {
      isCorrect,
      partialCredit: isCorrect ? 1.0 : 0.5,
      feedback: response,
      nextStepReady: isCorrect,
    }
  }
}

export class FeedbackAgent extends Agent {
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

export class NaturalLanguageGenerationAgent extends Agent {
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

  async generateExplanation(concept: string, studentLevel: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Explain this math concept: "${concept}" for a ${studentLevel} level student. Use simple language and examples.`,
      },
    ]

    return await this.callLLM(messages)
  }
}

export class ContentAgent extends Agent {
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

    const response = await this.callLLM(messages)

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

    const response = await this.callLLM(messages)

    // Parse response into structured steps (simplified for demo)
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

export class StudentProfileAgent extends Agent {
  constructor(config: LLMConfig) {
    super("SPA", config, agentPrompts.SPA.system)
  }

  async updateProfile(
    studentData: any,
    sessionData: any,
  ): Promise<{
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    nextDifficulty: string
  }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Update student profile based on this session data: ${JSON.stringify(sessionData)}. Current student data: ${JSON.stringify(studentData)}.`,
      },
    ]

    const response = await this.callLLM(messages)

    return {
      strengths: ["Basic algebra"],
      weaknesses: ["Multi-step equations"],
      recommendations: ["Practice more linear equations"],
      nextDifficulty: "intermediate",
    }
  }
}
