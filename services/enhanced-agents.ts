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
        content: `Generate a welcoming greeting for a student named ${studentName} who is at ${studentLevel} level. Keep it encouraging and brief (under 50 words).`,
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

  async generateSTEMExamples(subject: string, difficulty: string): Promise<string[]> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate 5 diverse ${subject} problems suitable for ${difficulty} level students. Each problem should be different in type and complexity. Return each problem on a new line, without numbering or bullet points. Make them practical and engaging.

Example format:
Calculate the force needed to accelerate a 10kg object at 5m/s²
Find the pH of a solution with hydrogen ion concentration of 1×10⁻⁴ M
Solve the quadratic equation: x² + 5x + 6 = 0`,
      },
    ]

    let response = ""
    try {
      response = await this.callLLM(messages, undefined, "medium")

      // Try to parse JSON response first (in case LLM returns JSON)
      if (response.includes("[") && response.includes("]")) {
        try {
          const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
          const examples = JSON.parse(cleanResponse)
          if (Array.isArray(examples) && examples.length > 0) {
            return examples.slice(0, 5)
          }
        } catch (jsonError) {
          console.log("JSON parsing failed, trying text parsing")
        }
      }

      // Parse as text response
      const lines = response
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 10 && // Minimum length for a meaningful problem
            !line.match(/^[\d\-*+\s]*$/) && // Not just numbers/symbols
            !line.toLowerCase().includes("example") &&
            !line.toLowerCase().includes("format") &&
            !line.includes("```") &&
            (line.includes("?") ||
              line.includes("=") ||
              line.toLowerCase().includes("solve") ||
              line.toLowerCase().includes("calculate") ||
              line.toLowerCase().includes("find") ||
              line.toLowerCase().includes("determine") ||
              line.toLowerCase().includes("what") ||
              line.toLowerCase().includes("how")),
        )
        .slice(0, 5)

      if (lines.length > 0) {
        return lines
      }

      // If no good lines found, return fallback examples
      return this.getFallbackExamples(subject, difficulty)
    } catch (error) {
      console.error(`Error generating ${subject} examples:`, error)
      return this.getFallbackExamples(subject, difficulty)
    }
  }

  private getFallbackExamples(subject: string, difficulty: string): string[] {
    const fallbackExamples: Record<string, string[]> = {
      mathematics: [
        "Solve for x: 2x + 5 = 11",
        "Find the area of a circle with radius 7 cm",
        "Calculate the slope of the line passing through (2,3) and (5,9)",
        "Simplify: 3x² + 2x - 5x² + 7x",
        "What is 15% of 240?",
      ],
      physics: [
        "Calculate the velocity of an object with mass 5kg and kinetic energy 100J",
        "Find the force needed to accelerate a 10kg object at 3m/s²",
        "What is the wavelength of light with frequency 5×10¹⁴ Hz?",
        "Calculate the potential energy of a 2kg object at height 10m",
        "Find the resistance of a circuit with voltage 12V and current 3A",
      ],
      chemistry: [
        "Balance the equation: H₂ + O₂ → H₂O",
        "Calculate the molarity of a solution with 2 moles of NaCl in 500mL",
        "Find the pH of a solution with [H⁺] = 1×10⁻³ M",
        "How many grams are in 2.5 moles of CO₂?",
        "What is the empirical formula of a compound with 40% C, 6.7% H, 53.3% O?",
      ],
      biology: [
        "Explain the process of photosynthesis in plants",
        "What are the four stages of mitosis?",
        "Describe the structure and function of DNA",
        "How does natural selection lead to evolution?",
        "What is the difference between prokaryotic and eukaryotic cells?",
      ],
      engineering: [
        "Design a simple lever system with mechanical advantage of 3",
        "Calculate the stress in a steel beam under 1000N load",
        "What is the efficiency of a machine that outputs 800J for 1000J input?",
        "Design a gear system to reduce speed by factor of 4",
        "Calculate the flow rate through a pipe with diameter 5cm and velocity 2m/s",
      ],
      "computer science": [
        "Write an algorithm to sort an array of numbers",
        "What is the time complexity of binary search?",
        "Explain the difference between stack and queue data structures",
        "How does a hash table work?",
        "What are the principles of object-oriented programming?",
      ],
    }

    const subjectKey = subject.toLowerCase().replace(/[-\s]/g, "")
    return fallbackExamples[subjectKey] || fallbackExamples.mathematics
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
        content: `Extract the main problem or question from this OCR text: "${ocrText}". Return only the clean, readable problem statement without any extra formatting or metadata.`,
      },
    ]

    return await this.callLLM(messages, undefined, "high")
  }

  async validateProblem(problem: string): Promise<{ isValid: boolean; reason?: string }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Is this a valid STEM problem that can be solved step-by-step? "${problem}". Respond with "VALID" if it's solvable, or "INVALID: [reason]" if not.`,
      },
    ]

    const response = await this.callLLM(messages)
    const isValid = response.toUpperCase().startsWith("VALID")
    const reason = isValid ? undefined : response.replace(/INVALID:\s*/i, "")

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
        content: `Provide clear, encouraging guidance for this step: "${step}". Student level: ${studentLevel}. Be concise but helpful (under 100 words). Focus on what the student should do next.`,
      },
    ]

    return await this.callLLM(messages, undefined, "high")
  }

  async *streamStepGuidance(step: string, studentLevel: string): AsyncGenerator<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Provide clear, encouraging guidance for this step: "${step}". Student level: ${studentLevel}. Be concise but helpful. Focus on what the student should do next.`,
      },
    ]

    for await (const chunk of this.streamLLM(messages)) {
      yield chunk
    }
  }

  async generateInitialGuidance(
    problem: string, 
    subject: string, 
    studentLevel: string,
    options: { cancellable?: boolean } = {}
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Welcome the student and provide initial guidance for solving this ${subject} problem: "${problem}". Student level: ${studentLevel}. Be encouraging and explain what we'll do step by step. Keep it under 80 words.`,
      },
    ]

    return await this.callLLM(messages, undefined, "high")
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
        content: `Evaluate this student answer: "${studentAnswer}" for the step: "${expectedStep}". Expected answer: "${correctAnswer}". 
        
        Respond in this format:
        CORRECT: [true/false]
        PARTIAL_CREDIT: [0.0-1.0]
        FEEDBACK: [brief encouraging feedback]
        NEXT_STEP_READY: [true/false]`,
      },
    ]

    const response = await this.callLLM(messages, undefined, "high")

    // Parse the structured response
    const isCorrect = response.includes("CORRECT: true")
    const partialCreditMatch = response.match(/PARTIAL_CREDIT: ([\d.]+)/)
    const partialCredit = partialCreditMatch ? Number.parseFloat(partialCreditMatch[1]) : isCorrect ? 1.0 : 0.3
    const feedbackMatch = response.match(/FEEDBACK: (.+?)(?:\n|$)/)
    const feedback = feedbackMatch ? feedbackMatch[1] : response

    return {
      isCorrect,
      partialCredit,
      feedback,
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
        content: `Generate ${isCorrect ? "positive" : "constructive"} feedback for student answer: "${studentAnswer}". This is attempt #${attempt}. Be encouraging and specific. Keep it under 60 words.`,
      },
    ]

    return await this.callLLM(messages)
  }

  async *streamFeedback(isCorrect: boolean, studentAnswer: string, attempt: number): AsyncGenerator<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Generate ${isCorrect ? "positive" : "constructive"} feedback for student answer: "${studentAnswer}". This is attempt #${attempt}. Be encouraging and specific.`,
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
        content: `Generate a helpful hint for step: "${currentStep}". Student level: ${studentLevel}. Previous attempts: ${previousAttempts}. Don't give away the answer. Be encouraging and guide them toward the solution. Keep it under 50 words.`,
      },
    ]

    return await this.callLLM(messages)
  }

  async generateExplanation(concept: string, studentLevel: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Explain this concept: "${concept}" for a ${studentLevel} level student. Use simple language and examples. Keep it under 100 words.`,
      },
    ]

    return await this.callLLM(messages)
  }
}

export class EnhancedContentAgent extends EnhancedAgent {
  constructor(config: LLMConfig) {
    super("CA", config, agentPrompts.CA.system)
  }

  async analyzeProblem(
    problem: string,
    options: { cancellable?: boolean } = {}
  ): Promise<{
    type: string
    difficulty: string
    concepts: string[]
    estimatedSteps: number
    solutionStrategy: string
    subject: string
  }> {
    const messages: LLMMessage[] = [
      {
        role: "user",
        content: `Analyze this STEM problem: "${problem}". 
        
        Respond in this format:
        SUBJECT: [Mathematics/Physics/Chemistry/Biology/Engineering/Computer Science]
        TYPE: [specific problem type like "Linear Equation", "Kinematics", "Chemical Balancing", etc.]
        DIFFICULTY: [Beginner/Intermediate/Advanced]
        CONCEPTS: [concept1, concept2, concept3]
        ESTIMATED_STEPS: [number]
        STRATEGY: [brief solution approach]`,
      },
    ]

    const response = await this.callLLM(messages, undefined, "high")

    // Parse the structured response
    const subjectMatch = response.match(/SUBJECT: (.+?)(?:\n|$)/)
    const typeMatch = response.match(/TYPE: (.+?)(?:\n|$)/)
    const difficultyMatch = response.match(/DIFFICULTY: (.+?)(?:\n|$)/)
    const conceptsMatch = response.match(/CONCEPTS: (.+?)(?:\n|$)/)
    const stepsMatch = response.match(/ESTIMATED_STEPS: (\d+)/)
    const strategyMatch = response.match(/STRATEGY: (.+?)(?:\n|$)/)

    return {
      subject: subjectMatch ? subjectMatch[1].trim() : "Mathematics",
      type: typeMatch ? typeMatch[1].trim() : "Problem Solving",
      difficulty: difficultyMatch ? difficultyMatch[1].trim() : "Intermediate",
      concepts: conceptsMatch ? conceptsMatch[1].split(",").map((c) => c.trim()) : ["problem solving"],
      estimatedSteps: stepsMatch ? Number.parseInt(stepsMatch[1]) : 3,
      solutionStrategy: strategyMatch ? strategyMatch[1].trim() : response,
    }
  }

  async generateSolutionSteps(
    problem: string,
    studentLevel: string,
    options: { cancellable?: boolean } = {}
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
        content: `Generate detailed solution steps for: "${problem}". Student level: ${studentLevel}. 
        
        Format each step as:
        STEP [number]: [brief description]
        EQUATION: [mathematical expression or key concept]
        EXPLANATION: [detailed explanation]
        
        Provide 3-5 logical steps.`,
      },
    ]

    const response = await this.callLLM(messages, undefined, "high")

    // Parse the response into structured steps
    const stepMatches = response.match(/STEP \d+:[\s\S]+?(?=STEP \d+:|$)/g)

    if (stepMatches) {
      return stepMatches.map((stepText, index) => {
        const descMatch = stepText.match(/STEP \d+: (.+?)(?:\n|$)/)
        const equationMatch = stepText.match(/EQUATION: (.+?)(?:\n|$)/)
        const explanationMatch = stepText.match(/EXPLANATION: ([\s\S]+?)(?=STEP|$)/)

        return {
          id: index + 1,
          description: descMatch ? descMatch[1].trim() : `Step ${index + 1}`,
          equation: equationMatch ? equationMatch[1].trim() : "",
          explanation: explanationMatch ? explanationMatch[1].trim() : "Complete this step.",
        }
      })
    }

    // Fallback if parsing fails
    return [
      {
        id: 1,
        description: "Analyze the problem",
        equation: problem,
        explanation: "Let's start by understanding what we need to solve.",
      },
    ]
  }
}
