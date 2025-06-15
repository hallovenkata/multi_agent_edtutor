"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, Camera, Loader2, AlertCircle, Atom, Calculator, Beaker, Cpu, Volume2, VolumeX } from "lucide-react"

import { Onboarding } from "@/components/onboarding"
import { AgentsPage } from "@/components/agents-page"
import { HistoryPanel } from "@/components/history-panel"
import { LLMConfigModal } from "@/components/llm-config-modal"
import { useEnhancedLLMAgents } from "@/hooks/use-enhanced-llm-agents"
import { VoiceControls } from "@/components/voice-controls"
import { SystemStatus } from "@/components/system-status"
import { LoadingOverlay } from "@/components/loading-overlay"
import { EnhancedNavigation } from "@/components/enhanced-navigation"
import { ChatInterface } from "@/components/chat-interface"
import { ParallelAgentManager } from "@/services/parallel-agent-manager"
import { learningHistoryManager } from "@/services/learning-history"

// Types for our multi-agent system
interface Student {
  id: string
  name: string
  location: string
  gradeLevel: string
  stemLevel: string
  preferredSubjects: string[]
  currentProblem?: STEMProblem
  sessionStartTime: Date
}

interface STEMProblem {
  id: string
  original: string
  subject: string
  type: string
  difficulty: string
  concepts: string[]
  steps: SolutionStep[]
  currentStep: number
}

interface SolutionStep {
  id: number
  description: string
  content: string
  explanation: string
  userInput?: string
  isCorrect?: boolean
  attempts: number
  requiresConfirmation?: boolean
}

interface AgentResponse {
  agent: string
  message: string
  type: "greeting" | "instruction" | "feedback" | "hint" | "question" | "error" | "confirmation"
  streaming?: boolean
  timestamp: Date
}

interface SessionStats {
  problemsSolved: number
  timeSpent: number
  accuracy: number
  streak: number
}

export default function STEMTutorMVP() {
  // LLM Agents Hook
  const {
    configs,
    defaultConfig,
    agents,
    isConfigured,
    queueStatus,
    voiceStatus,
    saveConfigs,
    setDefaultConfig,
    setVoiceEnabled,
    setVoicePaused,
    speak,
    stopVoice,
    cancelAgent,
    emergencyStop,
  } = useEnhancedLLMAgents()

  // Parallel Agent Manager
  const [parallelManager, setParallelManager] = useState<ParallelAgentManager | null>(null)

  // App state
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [currentPage, setCurrentPage] = useState("tutor")
  const [viewMode, setViewMode] = useState<"setup" | "chat">("setup")

  // Student Profile Agent (SPA) state
  const [student, setStudent] = useState<Student>({
    id: "student_001",
    name: "",
    location: "",
    gradeLevel: "",
    stemLevel: "",
    preferredSubjects: [],
    sessionStartTime: new Date(),
  })

  // Session stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    problemsSolved: 0,
    timeSpent: 0,
    accuracy: 85,
    streak: 3,
  })

  // Context Management Agent (CMA) state
  const [currentProblem, setCurrentProblem] = useState<STEMProblem | null>(null)
  const [sessionHistory, setSessionHistory] = useState<AgentResponse[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Conversational Voice Agent (CVA) state
  const [isListening, setIsListening] = useState(false)

  // Vision Agent (VA) state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedProblem, setExtractedProblem] = useState<string>("")

  // Teaching Agent (TA) state
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [showHint, setShowHint] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  // UI state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAgent, setProcessingAgent] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState<Record<string, number>>({})
  const [processingStatus, setProcessingStatus] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Dynamic examples state
  const [dynamicExamples, setDynamicExamples] = useState<
    Array<{
      subject: string
      problem: string
      icon: React.ReactNode
    }>
  >([])
  const [loadingExamples, setLoadingExamples] = useState(false)

  // Initialize parallel manager when config changes
  useEffect(() => {
    if (defaultConfig) {
      setParallelManager(new ParallelAgentManager(defaultConfig))
    }
  }, [defaultConfig])

  // Update session time and load progress
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionStats((prev) => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - student.sessionStartTime.getTime()) / 1000),
      }))

      // Update stats from learning history
      const progress = learningHistoryManager.getStudentProgress()
      if (progress) {
        setSessionStats((prev) => ({
          ...prev,
          problemsSolved: progress.completedSessions,
          accuracy: Math.round(progress.averageAccuracy),
          streak: progress.currentStreak,
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [student.sessionStartTime])

  // Load dynamic examples when component mounts
  useEffect(() => {
    if (isOnboarded && agents.cva && isConfigured && dynamicExamples.length === 0) {
      loadDynamicExamples()
    }
  }, [isOnboarded, agents.cva, isConfigured])

  // Handle onboarding completion
  const handleOnboardingComplete = async (userData: {
    name: string
    location: string
    gradeLevel: string
    stemLevel: string
    preferredSubjects: string[]
  }) => {
    const studentData = {
      ...userData,
      id: `student_${Date.now()}`,
      sessionStartTime: new Date(),
    }

    setStudent((prev) => ({
      ...prev,
      ...studentData,
    }))
    setIsOnboarded(true)

    // Load student progress
    learningHistoryManager.loadStudentProgress?.(studentData.id)

    // Generate personalized greeting using CVA
    if (agents.cva && isConfigured) {
      try {
        setProcessingAgent("CVA")
        speakMessage("Generating personalized greeting...", "normal", "status")
        const greeting = await agents.cva.generateGreeting(userData.name, userData.stemLevel)
        addAgentResponse("CVA", greeting, "greeting")

        setTimeout(() => {
          addAgentResponse(
            "CVA",
            "To get started, either upload an image of a STEM problem or type one manually below. I'll analyze it and we'll solve it together step by step in an interactive chat!",
            "instruction",
          )
          speakMessage("Upload an image or type a problem to get started", "normal", "instruction")
        }, 1000)

        speakMessage(greeting, "high", "greeting")
      } catch (error) {
        console.error("Error generating greeting:", error)
        const fallbackGreeting = `Hello ${userData.name}! Welcome to STEM Tutor. I'm here to help you with science, technology, engineering, and math problems step by step.`
        addAgentResponse("CVA", fallbackGreeting, "greeting")
        speakMessage(fallbackGreeting, "high", "greeting")
      } finally {
        setProcessingAgent(null)
      }
    }
  }

  // Load dynamic examples from LLM
  const loadDynamicExamples = async () => {
    if (!agents.cva || !isConfigured || loadingExamples) return

    setLoadingExamples(true)
    try {
      const subjects =
        student.preferredSubjects.length > 0 ? student.preferredSubjects : ["Mathematics", "Physics", "Chemistry"]
      const examples = []

      for (const subject of subjects.slice(0, 3)) {
        try {
          const subjectExamples = await agents.cva.generateSTEMExamples(subject, student.stemLevel)
          if (subjectExamples.length > 0) {
            examples.push({
              subject,
              problem: subjectExamples[0],
              icon: getSubjectIcon(subject),
            })
          }
        } catch (error) {
          console.error(`Error loading examples for ${subject}:`, error)
          examples.push({
            subject,
            problem: getFallbackProblem(subject),
            icon: getSubjectIcon(subject),
          })
        }
      }

      setDynamicExamples(examples.length > 0 ? examples : getStaticExamples())
    } catch (error) {
      console.error("Error loading dynamic examples:", error)
      setDynamicExamples(getStaticExamples())
    } finally {
      setLoadingExamples(false)
    }
  }

  // Enhanced progress tracking
  const handleProgressUpdate = (agent: string, status: string, progress = 0) => {
    setProcessingAgent(agent)
    setProcessingStatus((prev) => ({ ...prev, [agent]: status }))
    setProcessingProgress((prev) => ({ ...prev, [agent]: progress }))
  }

  // Content Agent (CA) - Enhanced parallel processing
  const processSTEMProblem = async (problemText: string, subject = "Mathematics") => {
    if (!parallelManager || !isConfigured) {
      addAgentResponse("CA", "Please configure your LLM settings to enable interactive problem solving.", "error")
      return
    }

    try {
      setIsProcessing(true)
      speakMessage("Analyzing the problem...", "normal", "status")

      // Use parallel processing for faster analysis
      const result = await parallelManager.analyzeProblemParallel(problemText, student.stemLevel, handleProgressUpdate)

      const problem: STEMProblem = {
        id: `stem_${Date.now()}`,
        original: problemText,
        subject: result.analysis.subject || subject,
        type: result.analysis.type,
        difficulty: result.analysis.difficulty,
        concepts: result.analysis.concepts,
        steps: result.steps.map((step) => ({
          ...step,
          content: step.equation,
          userInput: undefined,
          isCorrect: undefined,
          attempts: 0,
          requiresConfirmation: true,
        })),
        currentStep: 0,
      }

      setCurrentProblem(problem)
      setCurrentStep(0)

      // Start learning session
      const sessionId = learningHistoryManager.startSession(student.id, problem)
      setCurrentSessionId(sessionId)

      addAgentResponse(
        "CA",
        `Problem analyzed: ${problem.type} (${problem.difficulty} level) with ${problem.steps.length} steps. Starting interactive learning session...`,
        "instruction",
      )
      speakMessage("Problem analyzed. Starting interactive learning session.", "normal", "instruction")

      // Start teaching immediately
      startTeaching(problem, result.initialGuidance)
    } catch (error) {
      console.error("Content Agent error:", error)
      addAgentResponse("CA", "Sorry, I couldn't analyze this problem. Please try a different one.", "error")
      speakMessage("Sorry, I couldn't analyze this problem.", "normal", "error")
    } finally {
      setIsProcessing(false)
      setProcessingAgent(null)
      setProcessingProgress({})
      setProcessingStatus({})
    }
  }

  // Teaching Agent (TA) - Start teaching with initial guidance
  const startTeaching = async (problem: STEMProblem, initialGuidance?: string) => {
    try {
      setViewMode("chat")

      addAgentResponse(
        "TA",
        `🎓 Welcome to your interactive ${problem.subject} lesson! I'm your Teaching Agent and I'll guide you through solving: "${problem.original}"`,
        "instruction",
      )
      speakMessage(`Starting your ${problem.subject} lesson`, "high", "instruction")

      if (initialGuidance) {
        addAgentResponse("TA", initialGuidance, "instruction")
        speakMessage(initialGuidance, "normal", "instruction")
      }
    } catch (error) {
      console.error("Teaching Agent error:", error)
      const fallbackMessage = `Let's solve this ${problem.subject} problem: "${problem.original}" step by step.`
      addAgentResponse("TA", fallbackMessage, "instruction")
      speakMessage(fallbackMessage, "normal", "instruction")
      setViewMode("chat")
    }
  }

  // Enhanced chat submit with parallel processing
  const handleChatSubmitAnswer = async (answer: string) => {
    if (!currentProblem || !isConfigured || isPaused || !parallelManager) return

    const currentStepData = currentProblem.steps[currentStep]
    currentStepData.attempts += 1

    // Record the attempt in learning history
    learningHistoryManager.recordStepAttempt(currentStep + 1, answer, false) // We'll update this after assessment

    try {
      setProcessingAgent("AA")

      // Use parallel processing for faster feedback
      const result = await parallelManager.generateFeedbackParallel(
        answer,
        currentStepData.description,
        currentStepData.content,
        student.stemLevel,
        currentStepData.attempts,
        (agent, status) => handleProgressUpdate(agent, status),
      )

      currentStepData.userInput = answer
      currentStepData.isCorrect = result.assessment?.isCorrect || false

      // Update learning history with correct result
      learningHistoryManager.recordStepAttempt(
        currentStep + 1,
        answer,
        result.assessment?.isCorrect || false,
        result.hint ? 1 : 0,
      )

      // Add feedback to chat
      if ((window as any).chatInterface) {
        ; (window as any).chatInterface.addFeedbackMessage(
          result.feedback,
          result.assessment?.isCorrect || false,
          currentStepData.attempts,
        )
      }

      if (result.assessment?.isCorrect) {
        // Move to next step or complete problem
        if (currentStep < currentProblem.steps.length - 1) {
          setTimeout(() => {
            setCurrentStep(currentStep + 1)
          }, 2000)
        } else {
          // Problem completed
          learningHistoryManager.completeSession("completed")
          setSessionStats((prev) => ({
            ...prev,
            problemsSolved: prev.problemsSolved + 1,
            streak: prev.streak + 1,
          }))
        }
      }

      // Add hint if provided
      if (result.hint && (window as any).chatInterface) {
        setTimeout(() => {
          ; (window as any).chatInterface.addHintMessage(result.hint)
        }, 1000)
      }
    } catch (error) {
      console.error("Error processing user input:", error)
    } finally {
      setProcessingAgent(null)
      setProcessingProgress({})
      setProcessingStatus({})
    }
  }

  const handleChatRequestHint = async () => {
    if (!currentProblem || !agents.nlg || !isConfigured) return

    try {
      setProcessingAgent("NLG")
      const hint = await agents.nlg.generateHint(
        currentProblem.steps[currentStep].description,
        student.stemLevel,
        currentProblem.steps[currentStep].attempts,
      )

      // Record hint usage
      learningHistoryManager.recordStepAttempt(currentStep + 1, "", false, 1)

      if ((window as any).chatInterface) {
        ; (window as any).chatInterface.addHintMessage(hint)
      }
    } catch (error) {
      console.error("Error generating hint:", error)
    } finally {
      setProcessingAgent(null)
    }
  }

  // Enhanced voice control
  const handleVoiceToggle = () => {
    const newState = !voiceStatus.enabled
    setVoiceEnabled(newState)
    console.log("Voice toggled to:", newState)

    if (newState) {
      setTimeout(() => {
        speakMessage("Voice is now enabled", "high", "confirmation")
      }, 500)
    }
  }

  const handleVoicePause = () => {
    setVoicePaused(!voiceStatus.paused)
  }

  // Enhanced speak message with type information
  const speakMessage = useCallback(
    (message: string, priority: "high" | "normal" = "normal", type = "general") => {
      console.log("speakMessage called:", { message: message.substring(0, 30), priority, type })
      speak(message, priority, type)
    },
    [speak],
  )

  const handleBackToSetup = () => {
    // Complete current session if active
    if (currentSessionId) {
      learningHistoryManager.completeSession("abandoned")
    }

    setViewMode("setup")
    setCurrentProblem(null)
    setCurrentStep(0)
    setCurrentPage("tutor")
    setCurrentSessionId(null)
  }

  // Iterative control functions
  const handleNextStep = () => {
    if (!currentProblem || currentStep >= currentProblem.steps.length - 1) return
    setCurrentStep(currentStep + 1)
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleExplainStep = async () => {
    if (!currentProblem || !agents.nlg || !isConfigured) return

    try {
      setProcessingAgent("NLG")
      const explanation = await agents.nlg.generateExplanation(
        currentProblem.steps[currentStep].description,
        student.stemLevel,
      )

      if (viewMode === "chat" && (window as any).chatInterface) {
        ; (window as any).chatInterface.addHintMessage(`Detailed explanation: ${explanation}`)
      }
    } catch (error) {
      console.error("Error generating explanation:", error)
    } finally {
      setProcessingAgent(null)
    }
  }

  // Get STEM subject icon
  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case "mathematics":
        return <Calculator className="h-4 w-4" />
      case "physics":
        return <Atom className="h-4 w-4" />
      case "chemistry":
        return <Beaker className="h-4 w-4" />
      case "biology":
        return <Atom className="h-4 w-4" />
      case "engineering":
        return <Cpu className="h-4 w-4" />
      case "computer-science":
      case "computer science":
        return <Cpu className="h-4 w-4" />
      default:
        return <Atom className="h-4 w-4" />
    }
  }

  // Get fallback problem for a subject
  const getFallbackProblem = (subject: string): string => {
    const fallbacks: Record<string, string> = {
      mathematics: "Solve for x: 2x + 5 = 11",
      physics: "Calculate the velocity of an object with mass 5kg and kinetic energy 100J",
      chemistry: "Balance the equation: H₂ + O₂ → H₂O",
      biology: "Explain the process of photosynthesis in plants",
      engineering: "Design a simple lever system with mechanical advantage of 3",
      "computer-science": "Write an algorithm to sort an array of numbers",
    }

    const key = subject.toLowerCase().replace(/[-\s]/g, "")
    return fallbacks[key] || fallbacks.mathematics
  }

  // Static fallback examples
  const getStaticExamples = () => {
    return [
      { subject: "Mathematics", problem: "Solve for x: 2x + 5 = 11", icon: <Calculator className="h-4 w-4" /> },
      {
        subject: "Physics",
        problem: "Calculate the velocity of an object with mass 5kg and kinetic energy 100J",
        icon: <Atom className="h-4 w-4" />,
      },
      { subject: "Chemistry", problem: "Balance the equation: H₂ + O₂ → H₂O", icon: <Beaker className="h-4 w-4" /> },
    ]
  }

  // Get current examples (dynamic or static)
  const getCurrentExamples = () => {
    return dynamicExamples.length > 0 ? dynamicExamples : getStaticExamples()
  }

  // Conversational Voice Agent (CVA) - Speech-to-Text
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      addAgentResponse("CVA", "Speech recognition not supported in this browser.", "error")
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      speakMessage("I'm listening", "high", "confirmation")
    }
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setUserAnswer(transcript)
      addAgentResponse("User", transcript, "question")

      if (viewMode === "chat") {
        handleChatSubmitAnswer(transcript)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      addAgentResponse("CVA", "Sorry, I couldn't hear you clearly. Please try again.", "error")
      speakMessage("Sorry, I couldn't hear you clearly", "normal", "error")
    }

    recognition.start()
  }

  // Vision Agent (VA) - Simulated OCR
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setUploadedImage(imageUrl)

      setTimeout(() => {
        simulateOCR(imageUrl)
      }, 2000)
    }

    reader.readAsDataURL(file)
  }

  // Vision Agent (VA) - Simulated OCR Processing with LLM
  const simulateOCR = async (imageUrl: string) => {
    if (!agents.va || !isConfigured) {
      const sampleProblems = getCurrentExamples()
      const randomProblem = sampleProblems[Math.floor(Math.random() * sampleProblems.length)]
      setExtractedProblem(randomProblem.problem)
      addAgentResponse(
        "VA",
        `I've extracted this ${randomProblem.subject} problem from your image: "${randomProblem.problem}"`,
        "instruction",
      )
      speakMessage("I found a problem in your image", "normal", "instruction")
      processSTEMProblem(randomProblem.problem, randomProblem.subject)
      setIsProcessing(false)
      return
    }

    try {
      setProcessingAgent("VA")
      speakMessage("Extracting problem from image...", "normal", "status")
      const mockOcrText = "Solve for x: 2x + 5 = 11 (Chapter 3, Exercise 4)"

      const extractedProblem = await agents.va.extractProblem(mockOcrText)
      setExtractedProblem(extractedProblem)

      addAgentResponse("VA", `I've extracted this problem from your image: "${extractedProblem}"`, "instruction")
      speakMessage("I found a problem in your image", "normal", "instruction")

      const validation = await agents.va.validateProblem(extractedProblem)
      if (validation.isValid) {
        processSTEMProblem(extractedProblem, "Mathematics")
      } else {
        addAgentResponse("VA", `Problem validation failed: ${validation.reason}`, "error")
      }
    } catch (error) {
      console.error("Vision Agent error:", error)
      addAgentResponse(
        "VA",
        "Sorry, I couldn't process the image. Please try again or enter the problem manually.",
        "error",
      )
    } finally {
      setProcessingAgent(null)
      setIsProcessing(false)
    }
  }

  const addAgentResponse = (agent: string, message: string, type: AgentResponse["type"], streaming = false) => {
    const response: AgentResponse = { agent, message, type, streaming, timestamp: new Date() }
    setSessionHistory((prev) => [...prev, response])
  }

  const handleManualInput = () => {
    if (!extractedProblem.trim()) return

    setIsProcessing(true)
    setProcessingAgent("CA")
    addAgentResponse("CA", `Analyzing your problem: "${extractedProblem}"`, "instruction")
    speakMessage("Analyzing your problem", "normal", "instruction")

    let subject = "Mathematics"
    if (extractedProblem.toLowerCase().includes("velocity") || extractedProblem.toLowerCase().includes("force")) {
      subject = "Physics"
    } else if (
      extractedProblem.toLowerCase().includes("balance") ||
      extractedProblem.toLowerCase().includes("reaction")
    ) {
      subject = "Chemistry"
    } else if (
      extractedProblem.toLowerCase().includes("photosynthesis") ||
      extractedProblem.toLowerCase().includes("cell")
    ) {
      subject = "Biology"
    }

    processSTEMProblem(extractedProblem, subject)
  }

  const resetSession = () => {
    // Complete current session
    if (currentSessionId) {
      learningHistoryManager.completeSession("abandoned")
    }

    setCurrentProblem(null)
    setCurrentStep(0)
    setUserAnswer("")
    setShowHint(false)
    setUploadedImage(null)
    setExtractedProblem("")
    setIsPaused(false)
    setViewMode("setup")
    setCurrentSessionId(null)
    setSessionHistory([
      {
        agent: "CVA",
        message: `Welcome back ${student.name}! Ready for another STEM problem?`,
        type: "greeting",
        timestamp: new Date(),
      },
    ])
    speakMessage("Ready for a new problem?", "normal", "greeting")
  }

  const handleLoadProblem = (problem: string) => {
    setExtractedProblem(problem)
    processSTEMProblem(problem)
    setCurrentPage("tutor")
  }

  // Show onboarding if not completed
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // Show chat interface when in chat mode
  if (viewMode === "chat" && currentProblem) {
    return (
      <ChatInterface
        problem={currentProblem}
        currentStep={currentStep}
        onBack={handleBackToSetup}
        onSubmitAnswer={handleChatSubmitAnswer}
        onRequestHint={handleChatRequestHint}
        onNextStep={handleNextStep}
        onPreviousStep={handlePreviousStep}
        onExplainStep={handleExplainStep}
        onResetProblem={resetSession}
        isProcessing={processingAgent !== null}
        processingAgent={processingAgent}
        voiceEnabled={voiceStatus.enabled}
        onSpeak={speakMessage}
        isListening={isListening}
        onStartListening={startListening}
        onStopListening={() => setIsListening(false)}
        studentLevel={student.stemLevel}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Enhanced Loading Overlay with Progress */}
      <LoadingOverlay
        isVisible={isProcessing}
        processingAgent={processingAgent}
        message={processingAgent ? processingStatus[processingAgent] : "Processing..."}
        progress={processingAgent ? processingProgress[processingAgent] : undefined}
      />

      {/* Left Sidebar */}
      <EnhancedNavigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        student={student}
        currentProblem={currentProblem}
        currentStep={currentStep}
        sessionStats={sessionStats}
        processingAgent={processingAgent}
        queueStatus={queueStatus}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">STEM Tutor</h1>
              <Badge variant="outline" className="capitalize">
                {currentPage.replace("-", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceToggle}
                className={voiceStatus.enabled ? "bg-green-50 border-green-200" : ""}
              >
                {voiceStatus.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Voice {voiceStatus.enabled ? "On" : "Off"}
              </Button>
              <LLMConfigModal
                configs={configs}
                onConfigsChange={saveConfigs}
                onDefaultConfigChange={setDefaultConfig}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* LLM Configuration Alert */}
          {!isConfigured && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please configure your LLM settings to enable interactive STEM tutoring with parallel processing.
              </AlertDescription>
            </Alert>
          )}

          {currentPage === "agents" && <AgentsPage />}

          {currentPage === "history" && <HistoryPanel onLoadProblem={handleLoadProblem} />}

          {currentPage === "settings" && (
            <div className="max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VoiceControls
                    voiceStatus={voiceStatus}
                    onToggleEnabled={handleVoiceToggle}
                    onTogglePaused={handleVoicePause}
                    onStop={stopVoice}
                  />
                  <SystemStatus queueStatus={queueStatus} onEmergencyStop={emergencyStop} />
                </CardContent>
              </Card>
            </div>
          )}

          {currentPage === "tutor" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Welcome Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Welcome to STEM Tutor, {student.name}!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600">
                    I'm your AI-powered STEM tutor with parallel processing for faster analysis. Upload an image of a
                    problem or type one manually to get started with interactive, step-by-step learning.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">{student.stemLevel} Level</Badge>
                    <Badge variant="outline">{student.preferredSubjects.length} Subjects</Badge>
                    <Badge variant="outline">Parallel Processing</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Agent Activity Indicator */}
              {(processingAgent || Object.keys(processingStatus).length > 0) && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {Object.entries(processingStatus).map(([agent, status]) => (
                        <div key={agent} className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">
                              {agent} Agent: {status}
                            </p>
                            {processingProgress[agent] !== undefined && (
                              <Progress value={processingProgress[agent]} className="h-2 mt-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Problem Input Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Upload Problem Image
                      {processingAgent === "VA" && <Loader2 className="h-4 w-4 animate-spin" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {uploadedImage ? (
                        <div className="space-y-4">
                          <img
                            src={uploadedImage || "/placeholder.svg"}
                            alt="Uploaded problem"
                            className="max-w-full h-40 object-contain mx-auto rounded"
                          />
                          {isProcessing && (
                            <div className="space-y-2">
                              <Progress value={processingProgress["VA"] || 66} className="w-full" />
                              <p className="text-sm text-gray-600">Processing with AI vision...</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                          <div>
                            <p className="font-medium">Upload STEM Problem</p>
                            <p className="text-sm text-gray-600">AI will extract and analyze the problem</p>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4"
                        disabled={isProcessing || !isConfigured}
                      >
                        {uploadedImage ? "Upload New Image" : "Choose Image"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>

                    {extractedProblem && (
                      <Alert>
                        <AlertDescription>
                          <strong>Extracted:</strong> {extractedProblem}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Manual Input */}
                <Card>
                  <CardHeader>
                    <CardTitle>Or Type Problem Manually</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Enter any STEM problem here..."
                      value={extractedProblem}
                      onChange={(e) => setExtractedProblem(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />

                    <Button
                      onClick={handleManualInput}
                      className="w-full"
                      disabled={!isConfigured || !extractedProblem.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {processingAgent} Analyzing...
                        </>
                      ) : (
                        "Start Interactive Learning"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Dynamic Examples */}
              <Card>
                <CardHeader>
                  <CardTitle>Try These Examples</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {loadingExamples ? (
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500">Loading examples...</p>
                    </div>
                  ) : (
                    getCurrentExamples().map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start gap-2"
                        onClick={() => handleLoadProblem(example.problem)}
                        disabled={isProcessing}
                      >
                        {example.icon}
                        {example.problem.length > 50 ? example.problem.substring(0, 50) + "..." : example.problem}
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
