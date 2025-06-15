"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, Camera, Loader2, AlertCircle, Atom, Calculator, Beaker, Cpu, Volume2, VolumeX } from "lucide-react"
import { useUserData } from "@/hooks/use-user-data"
import type { UserData } from "@/hooks/use-user-data"

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
  // Next.js navigation hooks
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  // User data and onboarding state
  const { userData, isLoading: isLoadingUserData } = useUserData()
  const [isNewSession, setIsNewSession] = useState(false)
  
  // App state
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState("tutor")
  const [viewMode, setViewMode] = useState<"setup" | "chat">("setup")
  const [isLoading, setIsLoading] = useState(true)
  
  // Chat state management
  const handleChatSelect = useCallback((problemId: string) => {
    setCurrentChatId(problemId)
    setCurrentPage("tutor")
    setViewMode("chat")
    
    // Update URL with chat ID
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('chatId', problemId)
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  // Load chat from URL on initial render
  useEffect(() => {
    const chatId = searchParams?.get('chatId')
    if (chatId) {
      setCurrentChatId(chatId)

  // Student Profile Agent (SPA) state
  const [student, setStudent] = useState<Student>(() => ({
    id: userData ? `user_${Date.now()}` : "",
    name: userData?.name || "",
    location: userData?.location || "",
    gradeLevel: userData?.gradeLevel || "",
    stemLevel: userData?.stemLevel || "",
    preferredSubjects: userData?.preferredSubjects || [],
    sessionStartTime: new Date(),
  }))

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

  // Initialize user data and app state
  useEffect(() => {
    const initializeApp = async () => {
      if (!isLoadingUserData) {
        if (userData) {
          // User data exists, update student state
          setStudent(prev => ({
            ...prev,
            name: userData.name,
            location: userData.location,
            gradeLevel: userData.gradeLevel,
            stemLevel: userData.stemLevel,
            preferredSubjects: userData.preferredSubjects,
          }))
          setIsOnboarded(true)
          
          // Initialize chat if needed
          const chatId = searchParams?.get('chatId')
          if (chatId) {
            setCurrentChatId(chatId)
            setViewMode('chat')
            setCurrentPage('tutor')
          }
        } else {
          // No user data, show onboarding
          setIsOnboarded(false)
        }
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [userData, isLoadingUserData, searchParams])

  // Initialize parallel manager when config changes
  useEffect(() => {
    if (isConfigured && agents) {
      const manager = new ParallelAgentManager(agents)
      setParallelManager(manager)
    }
  }, [isConfigured, agents])

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
  const handleOnboardComplete = (userData: UserData) => {
    setStudent((prev) => ({
      ...prev,
      name: userData.name,
      location: userData.location,
      gradeLevel: userData.gradeLevel,
      stemLevel: userData.stemLevel,
      preferredSubjects: userData.preferredSubjects,
      sessionStartTime: new Date(),
    }))
    setIsOnboarded(true)
    setIsNewSession(false)
  }

  const handleStartNewSession = () => {
    setIsNewSession(true)
    setIsOnboarded(false)
  }

  // Chat state management

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

  // Handle chat selection
  const handleChatSelect = useCallback((problemId: string) => {
    setCurrentChatId(problemId);
    setCurrentPage("tutor");
    setViewMode("chat");
    
    // Update URL with chat ID
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('chatId', problemId);
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  // Load chat from URL on initial render
  useEffect(() => {
    const chatId = searchParams?.get('chatId');
    if (chatId) {
      setCurrentChatId(chatId);
      setViewMode('chat');
      setCurrentPage('tutor');
    }
  }, [searchParams]);

// Here you would typically load the chat history for the selected problemId
// For example: loadChatHistory(problemId);

// Show onboarding if not completed
if (!isOnboarded) {
  return <Onboarding onComplete={handleOnboardingComplete} />
}

// Show chat interface when in chat mode
if (viewMode === "chat" && currentProblem) {
  return (
    <ChatInterface
      key={currentChatId || 'default'}
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

// Move the state declaration to the top with other state declarations
// Student profile data
const studentProfile = {
  id: student.id,
  name: student.name,
  gradeLevel: student.gradeLevel,
  stemLevel: student.stemLevel,
  preferredSubjects: student.preferredSubjects,
}
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
