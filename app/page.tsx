"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Camera,
  Bot,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Atom,
  Calculator,
  Beaker,
  Cpu,
} from "lucide-react"

import { Onboarding } from "@/components/onboarding"
import { Navigation } from "@/components/navigation"
import { AgentsPage } from "@/components/agents-page"
import { HistoryPanel } from "@/components/history-panel"
import { LLMConfigModal } from "@/components/llm-config-modal"
import { useEnhancedLLMAgents } from "@/hooks/use-enhanced-llm-agents"

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

  // App state
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [currentPage, setCurrentPage] = useState("tutor")

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

  // Context Management Agent (CMA) state
  const [currentProblem, setCurrentProblem] = useState<STEMProblem | null>(null)
  const [sessionHistory, setSessionHistory] = useState<AgentResponse[]>([])

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
  const [solutionStepsExpanded, setSolutionStepsExpanded] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState<string>("")
  const [processingAgent, setProcessingAgent] = useState<string | null>(null)
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean
    title: string
    description: string
    type: "success" | "warning" | "question"
    onConfirm: () => void
  }>({
    open: false,
    title: "",
    description: "",
    type: "question",
    onConfirm: () => {},
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle onboarding completion
  const handleOnboardingComplete = async (userData: {
    name: string
    location: string
    gradeLevel: string
    stemLevel: string
    preferredSubjects: string[]
  }) => {
    setStudent((prev) => ({
      ...prev,
      ...userData,
    }))
    setIsOnboarded(true)

    // Generate personalized greeting using CVA
    if (agents.cva && isConfigured) {
      try {
        setProcessingAgent("CVA")
        const greeting = await agents.cva.generateGreeting(userData.name, userData.stemLevel)
        addAgentResponse("CVA", greeting, "greeting")

        if (voiceStatus.enabled) {
          speakMessage(greeting, "normal", "greeting")
        }
      } catch (error) {
        console.error("Error generating greeting:", error)
        addAgentResponse(
          "CVA",
          `Hello ${userData.name}! Welcome to STEM Tutor AI. I'm here to help you with science, technology, engineering, and math problems step by step.`,
          "greeting",
        )
      } finally {
        setProcessingAgent(null)
      }
    } else {
      addAgentResponse("CVA", `Hello ${userData.name}! Please configure your LLM settings to get started.`, "greeting")
    }
  }

  // Enhanced voice control
  const handleVoiceToggle = () => {
    setVoiceEnabled(!voiceStatus.enabled)
  }

  const handleVoicePause = () => {
    setVoicePaused(!voiceStatus.paused)
  }

  // Enhanced speak message with type information
  const speakMessage = (message: string, priority: "high" | "normal" = "normal", type = "general") => {
    speak(message, priority, type)
  }

  // Iterative control functions
  const handleNextStep = () => {
    if (!currentProblem || currentStep >= currentProblem.steps.length - 1) return

    setConfirmationDialog({
      open: true,
      title: "Ready for Next Step?",
      description: "Are you ready to move to the next step in solving this problem?",
      type: "question",
      onConfirm: () => {
        setCurrentStep(currentStep + 1)
        const nextStepData = currentProblem.steps[currentStep + 1]
        addAgentResponse("TA", `Moving to step ${currentStep + 2}: ${nextStepData.description}`, "instruction")
        speakMessage("Moving to the next step", "normal", "instruction")
      },
    })
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      const prevStepData = currentProblem.steps[currentStep - 1]
      addAgentResponse("TA", `Going back to step ${currentStep}: ${prevStepData.description}`, "instruction")
      speakMessage("Going back to the previous step", "normal", "instruction")
    }
  }

  const handlePauseSession = () => {
    setIsPaused(!isPaused)
    if (!isPaused) {
      addAgentResponse("TA", "Session paused. Take your time to think about the current step.", "instruction")
      speakMessage("Session paused", "normal", "instruction")
    } else {
      addAgentResponse("TA", "Session resumed. Let's continue!", "instruction")
      speakMessage("Session resumed", "normal", "instruction")
    }
  }

  const handleExplainStep = async () => {
    if (!currentProblem || !agents.nlg || !isConfigured) return

    try {
      setProcessingAgent("NLG")
      const explanation = await agents.nlg.generateExplanation(
        currentProblem.steps[currentStep].description,
        student.stemLevel
      )
      addAgentResponse("NLG", `📚 Detailed Explanation: ${explanation}`, "instruction")
      speakMessage("Here's a detailed explanation", "normal", "instruction")
    } catch (error) {
      console.error("Error generating explanation:", error)
      addAgentResponse("NLG", "Let me break down this step for you in more detail...", "instruction")
    } finally {
      setProcessingAgent(null)
    }
  }

  // Get STEM subject icon
  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case "mathematics": return <Calculator className="h-4 w-4" />
      case "physics": return <Atom className="h-4 w-4" />
      case "chemistry": return <Beaker className="h-4 w-4" />
      case "biology": return <Atom className="h-4 w-4" />
      case "engineering": return <Cpu className="h-4 w-4" />
      case "computer-science": return <Cpu className="h-4 w-4" />
      default: return <Atom className="h-4 w-4" />
    }
  }

  // Sample STEM problems for different subjects
  const getSampleProblems = () => {
    return [
      { subject: "Mathematics", problem: "2x + 5 = 11", icon: <Calculator className="h-4 w-4" /> },
      { subject: "Physics", problem: "Calculate the velocity of an object with mass 5kg and kinetic energy 100J", icon: <Atom className="h-4 w-4" /> },
      { subject: "Chemistry", problem: "Balance the equation: H₂ + O₂ → H₂O", icon: <Beaker className="h-4 w-4" /> },
      { subject: "Biology", problem: "Explain the process of photosynthesis in plants", icon: <Atom className="h-4 w-4" /> },
      { subject: "Engineering", problem: "Design a simple lever system with mechanical advantage of 3", icon: <Cpu className="h-4 w-4" /> },
    ]
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

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setUserAnswer(transcript)
      processUserInput(transcript)
    }

    recognition.onerror = () => {
      setIsListening(false)
      addAgentResponse("CVA", "Sorry, I couldn't hear you clearly. Please try again.", "error")
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

      // Simulate OCR processing
      setTimeout(() => {
        simulateOCR(imageUrl)
      }, 2000)
    }

    reader.readAsDataURL(file)
  }

  // Vision Agent (VA) - Simulated OCR Processing with LLM
  const simulateOCR = async (imageUrl: string) => {
    if (!agents.va || !isConfigured) {
      // Fallback to hardcoded behavior
      const sampleProblems = getSampleProblems()
      const randomProblem = sampleProblems[Math.floor(Math.random() * sampleProblems.length)]
      setExtractedProblem(randomProblem.problem)
      addAgentResponse("VA", `I've extracted this ${randomProblem.subject} problem from your image: "${randomProblem.problem}"`, "instruction")
      processSTEMProblem(randomProblem.problem, randomProblem.subject)
      setIsProcessing(false)
      return
    }

    try {
      setProcessingAgent("VA")
      // Simulate OCR text extraction (in real implementation, you'd use actual OCR)
      const mockOcrText = "Solve for x: 2x + 5 = 11 (Chapter 3, Exercise 4)"

      const extractedProblem = await agents.va.extractProblem(mockOcrText)
      setExtractedProblem(extractedProblem)

      addAgentResponse("VA", `I've extracted this problem from your image: "${extractedProblem}"`, "instruction")
      speakMessage("I found a problem in your image", "normal", "instruction")

      // Validate the problem
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

  // Content Agent (CA) - Analyze and process problem with LLM
  const processSTEMProblem = async (problemText: string, subject = "Mathematics") => {
    if (!agents.ca || !isConfigured) {
      // Fallback to hardcoded behavior
      addAgentResponse("CA", "Please configure your LLM settings to enable AI-powered problem solving.", "error")
      return
    }

    try {
      setProcessingAgent("CA")

      // Analyze the problem using Content Agent
      const analysis = await agents.ca.analyzeProblem(problemText)

      // Generate solution steps
      const steps = await agents.ca.generateSolutionSteps(problemText, student.stemLevel)

      const problem: STEMProblem = {
        id: `stem_${Date.now()}`,
        original: problemText,
        subject: subject,
        type: analysis.type,
        difficulty: analysis.difficulty,
        concepts: analysis.concepts,
        steps: steps.map((step) => ({
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

      addAgentResponse("CA", `Problem analyzed: ${subject} - ${analysis.type} (${analysis.difficulty} level)`, "instruction")
      speakMessage("I've analyzed your problem", "normal", "instruction")

      // Teaching Agent starts the lesson
      startTeaching(problem)
    } catch (error) {
      console.error("Content Agent error:", error)
      addAgentResponse("CA", "Sorry, I couldn't analyze this problem. Please try a different one.", "error")
    } finally {
      setProcessingAgent(null)
    }
  }

  // Teaching Agent (TA) - Start teaching with LLM
  const startTeaching = async (problem: STEMProblem) => {
    if (!agents.ta || !isConfigured) {
      addAgentResponse("TA", "Please configure your LLM settings to enable AI-powered teaching.", "error")
      return
    }

    try {
      setProcessingAgent("TA")

      const guidance = await agents.ta.generateStepGuidance(
        `Solve this ${problem.subject} problem: ${problem.original} - Step 1: ${problem.steps[0]?.description}`,
        student.stemLevel,
      )

      addAgentResponse("TA", guidance, "instruction")
      speakMessage("Let's start solving this step by step", "normal", "instruction")
    } catch (error) {
      console.error("Teaching Agent error:", error)
      addAgentResponse(
        "TA",
        `Let's solve this ${problem.subject} problem: "${problem.original}" step by step. ${problem.steps[0]?.explanation}`,
        "instruction",
      )
    } finally {
      setProcessingAgent(null)
    }
  }

  // Process user input through multiple agents
  const processUserInput = async (input: string) => {
    if (!currentProblem || !isConfigured || isPaused) return

    const currentStepData = currentProblem.steps[currentStep]
    currentStepData.attempts += 1

    try {
      // Assessment Agent - Evaluate answer
      if (agents.aa) {
        setProcessingAgent("AA")
        const assessment = await agents.aa.evaluateAnswer(input, currentStepData.description, currentStepData.content)

        currentStepData.userInput = input
        currentStepData.isCorrect = assessment.isCorrect

        // Feedback Agent - Generate feedback
        if (agents.fa) {
          setProcessingAgent("FA")

          // Stream feedback for better UX
          let feedbackMessage = ""
          addAgentResponse("FA", "", "feedback", true)

          for await (const chunk of agents.fa.streamFeedback(assessment.isCorrect, input, currentStepData.attempts)) {
            feedbackMessage += chunk
            setStreamingResponse(feedbackMessage)
          }

          // Update the last message with complete feedback
          setSessionHistory((prev) => {
            const updated = [...prev]
            const lastIndex = updated.length - 1
            if (updated[lastIndex]?.streaming) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                message: feedbackMessage,
                streaming: false,
              }
            }
            return updated
          })
          setStreamingResponse("")

          // Speak feedback
          speakMessage(feedbackMessage, "normal", "feedback")

          if (assessment.isCorrect) {
            // Ask for confirmation before moving to next step
            if (currentStep < currentProblem.steps.length - 1) {
              setConfirmationDialog({
                open: true,
                title: "Great Job!",
                description: "You got it right! Are you ready to move to the next step?",
                type: "success",
                onConfirm: () => {
                  const nextStep = currentStep + 1
                  setCurrentStep(nextStep)
                  const nextStepData = currentProblem.steps[nextStep]
                  
                  setTimeout(async () => {
                    if (agents.ta) {
                      try {
                        setProcessingAgent("TA")
                        const nextGuidance = await agents.ta.generateStepGuidance(
                          `Step ${nextStep + 1}: ${nextStepData.description}`,
                          student.stemLevel,
                        )
                        addAgentResponse("TA", nextGuidance, "instruction")
                        speakMessage("Moving to the next step", "normal", "instruction")
                      } catch (error) {
                        addAgentResponse("TA", `${nextStepData.explanation}`, "instruction")
                      } finally {
                        setProcessingAgent(null)
                      }
                    }
                  }, 1000)
                },
              })
            } else {
              addAgentResponse("TA", "🎉 Congratulations! You've successfully solved the problem!", "feedback")
              speakMessage("Congratulations! You solved it!", "high", "feedback")
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing user input:", error)
      addAgentResponse("System", "Sorry, there was an error processing your answer. Please try again.", "error")
    } finally {
      setProcessingAgent(null)
    }

    setUserAnswer("")
    setShowHint(false)
  }

  const addAgentResponse = (agent: string, message: string, type: AgentResponse["type"], streaming = false) => {
    const response: AgentResponse = { agent, message, type, streaming }
    setSessionHistory((prev) => [...prev, response])
  }

  const handleHint = async () => {
    if (!currentProblem || !agents.nlg || !isConfigured) return

    try {
      setProcessingAgent("NLG")
      const hint = await agents.nlg.generateHint(
        currentProblem.steps[currentStep].description,
        student.stemLevel,
        currentProblem.steps[currentStep].attempts,
      )
      addAgentResponse("NLG", `💡 Hint: ${hint}`, "hint")
      speakMessage(hint, "normal", "hint")
      setShowHint(true)
    } catch (error) {
      console.error("Error generating hint:", error)
      addAgentResponse("NLG", "Think about what you need to do next in this step.", "hint")
    } finally {
      setProcessingAgent(null)
    }
  }

  const handleManualInput = () => {
    if (!extractedProblem.trim()) return
    
    // Determine subject based on content
    let subject = "Mathematics"
    if (extractedProblem.toLowerCase().includes("velocity") || extractedProblem.toLowerCase().includes("force")) {
      subject = "Physics"
    } else if (extractedProblem.toLowerCase().includes("balance") || extractedProblem.toLowerCase().includes("reaction")) {
      subject = "Chemistry"
    } else if (extractedProblem.toLowerCase().includes("photosynthesis") || extractedProblem.toLowerCase().includes("cell")) {
      subject = "Biology"
    }
    
    processSTEMProblem(extractedProblem, subject)
  }

  const resetSession = () => {
    setCurrentProblem(null)
    setCurrentStep(0)
    setUserAnswer("")
    setShowHint(false)
    setUploadedImage(null)
    setExtractedProblem("")
    setIsPaused(false)
    setSessionHistory([
      {
        agent: "CVA",
        message: `Welcome back ${student.name}! Ready for another STEM problem?`,
        type: "greeting",
      },
    ])
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        student={student}
        voiceEnabled={voiceStatus.enabled}
        onVoiceToggle={handleVoiceToggle}
      />

      <div className="max-w-7xl mx-auto p-4">
        {/* LLM Configuration Alert */}
        {!isConfigured && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Please configure your LLM settings to enable AI-powered STEM tutoring.</span>
              <LLMConfigModal
                configs={configs}
                onConfigsChange={saveConfigs}
                onDefaultConfigChange={setDefaultConfig}
              />
            </AlertDescription>
          </Alert>
        )}

        {currentPage === "agents" && <AgentsPage />}

        {currentPage === "history" && (
          <div className="max-w-4xl mx-auto">
            <HistoryPanel onLoadProblem={handleLoadProblem} />
          </div>
        )}

        {currentPage === "tutor" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Input and Problem Setup */}
            <div className="lg:col-span-2 space-y-6">
              {/* LLM Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">LLM Configuration</CardTitle>
                    <LLMConfigModal
                      configs={configs}
                      onConfigsChange={saveConfigs}
                      onDefaultConfigChange={setDefaultConfig}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {isConfigured ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Using: {defaultConfig?.name} ({defaultConfig?.provider})
                      </span>
                      <Badge variant="outline">{defaultConfig?.modelId}</Badge>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">No LLM configured. Click settings to add one.</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Upload - Vision Agent */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Vision Agent (VA) - Image Upload & OCR
                    {processingAgent === "VA" && <Loader2 className="h-4 w-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded problem"
                          className="max-w-full h-48 object-contain mx-auto rounded"
                        />
                        {isProcessing && (
                          <div className="space-y-2">
                            <Progress value={66} className="w-full" />
                            <p className="text-sm text-gray-600">Processing image with AI-powered OCR...</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-lg font-medium">Upload a STEM problem image</p>
                          <p className="text-sm text-gray-600">AI will extract and analyze problems from any STEM subject</p>
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
                        <strong>Extracted Problem:</strong> {extractedProblem}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Manual Input with STEM Examples */}
              <Card>
                <CardHeader>
                  <CardTitle>Or Enter STEM Problem Manually</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter any STEM problem (Math, Physics, Chemistry, Biology, Engineering, etc.)"
                    value={extractedProblem}
                    onChange={(e) => setExtractedProblem(e.target.value)}
                    rows={3}
                  />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Try these examples:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {getSampleProblems().map((example, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setExtractedProblem(example.problem)}
                          className="justify-start text-left h-auto p-2"
                        >
                          <div className="flex items-start gap-2">
                            {example.icon}
                            <div>
                              <div className="font-medium text-xs">{example.subject}</div>
                              <div className="text-xs text-gray-600">{example.problem}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleManualInput} className="w-full" disabled={!isConfigured}>
                    Start AI-Powered STEM Solving
                  </Button>
                </CardContent>
              </Card>

              {/* Current Problem Status */}
              {currentProblem && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getSubjectIcon(currentProblem.subject)}
                      Current {currentProblem.subject} Problem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-lg bg-gray-100 p-3 rounded">{currentProblem.original}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{currentProblem.subject}</Badge>
                        <Badge variant="outline">{currentProblem.type}</Badge>
                        <Badge variant="outline">{currentProblem.difficulty}</Badge>
                        {isPaused && <Badge variant="secondary">Paused</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Progress:</span>
                        <Progress value={(currentStep / (currentProblem.steps.length - 1)) * 100} className="flex-1" />
                        <span className="text-sm text-gray-600">
                          {currentStep + 1}/{currentProblem.steps.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Middle Column - Conversation and Interaction */}
            <div className="lg:col-span-1 space-y-6">
              {/* Agent Conversation History */}
              <Card className="h-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Agent Conversation
                    {processingAgent && (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs">{processingAgent}</span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto space-y-3 border rounded p-3">
                    {sessionHistory.map((response, index) => (
                      <div key={index} className="flex gap-3">
                        <Badge variant={response.agent === "CVA" ? "default" : "secondary"} className="text-xs">
                          {response.agent}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">
                            {response.streaming ? streamingResponse : response.message}
                            {response.streaming && <span className="animate-pulse">|</span>}
                          </p>
                        </div>
                        {response.type === "feedback" && response.message.includes("Excellent") && (
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        )}
                        {response.type === "error" && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Student Input Interface */}
              {currentProblem && currentStep < currentProblem.steps.length && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2\
