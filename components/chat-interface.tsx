"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Volume2,
  Lightbulb,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  RotateCcw,
  HelpCircle,
} from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  type: "message" | "feedback" | "hint" | "step" | "question" | "celebration"
  timestamp: Date
  canSpeak?: boolean
  isStreaming?: boolean
  metadata?: {
    stepNumber?: number
    isCorrect?: boolean
    attempts?: number
    showControls?: boolean
  }
}

interface ChatInterfaceProps {
  problem: {
    id: string
    original: string
    subject: string
    type: string
    difficulty: string
    steps: Array<{
      id: number
      description: string
      content: string
      explanation: string
      userInput?: string
      isCorrect?: boolean
      attempts: number
    }>
  }
  currentStep: number
  onBack: () => void
  onSubmitAnswer: (answer: string) => void
  onRequestHint: () => void
  onNextStep: () => void
  onPreviousStep: () => void
  onExplainStep: () => void
  onResetProblem: () => void
  isProcessing: boolean
  processingAgent: string | null
  voiceEnabled: boolean
  onSpeak: (text: string, priority?: "high" | "normal", type?: string) => void
  isListening: boolean
  onStartListening: () => void
  onStopListening: () => void
  studentLevel: string
}

export function ChatInterface({
  problem,
  currentStep,
  onBack,
  onSubmitAnswer,
  onRequestHint,
  onNextStep,
  onPreviousStep,
  onExplainStep,
  onResetProblem,
  isProcessing,
  processingAgent,
  voiceEnabled,
  onSpeak,
  isListening,
  onStartListening,
  onStopListening,
  studentLevel,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [streamingMessage, setStreamingMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `🎓 **Welcome to your ${problem.subject} learning session!**

I'm your Teaching Agent, and I'll guide you through solving this problem step by step:

**${problem.original}**

This is a **${problem.difficulty}** level **${problem.type}** problem. We'll work through it together in **${problem.steps.length} steps**.

I'm here to help you understand each step, provide hints when needed, and celebrate your progress! Ready to begin? 🚀`,
      type: "message",
      timestamp: new Date(),
      canSpeak: true,
    }

    const stepMessage: ChatMessage = {
      id: "step-1",
      role: "assistant",
      content: `📝 **Step ${currentStep + 1} of ${problem.steps.length}**

${problem.steps[currentStep]?.description}

**Here's what we need to do:**
${problem.steps[currentStep]?.explanation}

Take your time to think about this step. You can:
• Type your answer below
• Ask for a hint if you're stuck
• Request a detailed explanation
• Use voice input by clicking the microphone

What's your approach to this step?`,
      type: "step",
      timestamp: new Date(),
      canSpeak: true,
      metadata: {
        stepNumber: currentStep + 1,
        showControls: true,
      },
    }

    setMessages([welcomeMessage, stepMessage])

    // Speak welcome message
    if (voiceEnabled) {
      setTimeout(() => {
        onSpeak(`Let's solve this ${problem.subject} problem step by step!`, "normal", "greeting")
      }, 1000)
    }
  }, [problem, currentStep, voiceEnabled, onSpeak])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingMessage])

  // Handle step changes
  useEffect(() => {
    if (currentStep > 0) {
      const stepMessage: ChatMessage = {
        id: `step-${currentStep + 1}`,
        role: "assistant",
        content: `**Step ${currentStep + 1}:** ${problem.steps[currentStep]?.description}

${problem.steps[currentStep]?.explanation}

What's your approach to this step?`,
        type: "step",
        timestamp: new Date(),
        canSpeak: true,
        metadata: {
          stepNumber: currentStep + 1,
          showControls: true,
        },
      }

      setMessages((prev) => [...prev, stepMessage])
    }
  }, [currentStep, problem.steps])

  const handleSubmit = () => {
    if (!currentInput.trim() || isProcessing) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: currentInput,
      type: "message",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Submit answer
    onSubmitAnswer(currentInput)
    setCurrentInput("")

    // Add processing message
    const processingMessage: ChatMessage = {
      id: `processing-${Date.now()}`,
      role: "assistant",
      content: "Let me evaluate your answer...",
      type: "message",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, processingMessage])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const addFeedbackMessage = useCallback(
    (content: string, isCorrect: boolean, attempts: number) => {
      const feedbackMessage: ChatMessage = {
        id: `feedback-${Date.now()}`,
        role: "assistant",
        content: content,
        type: "feedback",
        timestamp: new Date(),
        canSpeak: true,
        metadata: {
          isCorrect,
          attempts,
        },
      }

      setMessages((prev) => {
        // Remove processing message
        const filtered = prev.filter((msg) => !msg.isStreaming)
        return [...filtered, feedbackMessage]
      })

      // Add celebration or encouragement
      if (isCorrect) {
        setTimeout(() => {
          const celebrationMessage: ChatMessage = {
            id: `celebration-${Date.now()}`,
            role: "assistant",
            content:
              currentStep < problem.steps.length - 1
                ? "🎉 Excellent! You're making great progress. Ready for the next step?"
                : "🎉 Congratulations! You've successfully solved the entire problem! Well done!",
            type: "celebration",
            timestamp: new Date(),
            canSpeak: true,
            metadata: {
              showControls: currentStep < problem.steps.length - 1,
            },
          }
          setMessages((prev) => [...prev, celebrationMessage])
        }, 1000)
      }
    },
    [currentStep, problem.steps.length],
  )

  const addHintMessage = useCallback((content: string) => {
    const hintMessage: ChatMessage = {
      id: `hint-${Date.now()}`,
      role: "assistant",
      content: `💡 **Hint:** ${content}

Try thinking about it this way and give it another shot!`,
      type: "hint",
      timestamp: new Date(),
      canSpeak: true,
    }

    setMessages((prev) => [...prev, hintMessage])
  }, [])

  const handleSpeakMessage = (message: ChatMessage) => {
    if (!voiceEnabled) return

    const textToSpeak = message.content
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
      .replace(/💡|🎉|✅|❌/g, "") // Remove emojis
      .trim()

    const type =
      message.type === "feedback"
        ? "feedback"
        : message.type === "hint"
          ? "hint"
          : message.type === "celebration"
            ? "feedback"
            : "instruction"

    onSpeak(textToSpeak, "normal", type)
  }

  const getMessageIcon = (message: ChatMessage) => {
    if (message.role === "user") {
      return <User className="h-4 w-4" />
    }

    switch (message.type) {
      case "feedback":
        return message.metadata?.isCorrect ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-orange-500" />
        )
      case "hint":
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case "celebration":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "step":
        return <Bot className="h-4 w-4 text-blue-500" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const getMessageBgColor = (message: ChatMessage) => {
    if (message.role === "user") {
      return "bg-blue-500 text-white ml-12"
    }

    switch (message.type) {
      case "feedback":
        return message.metadata?.isCorrect ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
      case "hint":
        return "bg-yellow-50 border-yellow-200"
      case "celebration":
        return "bg-green-50 border-green-200"
      case "step":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  // Expose methods for parent component
  useEffect(() => {
    ;(window as any).chatInterface = {
      addFeedbackMessage,
      addHintMessage,
    }
  }, [addFeedbackMessage, addHintMessage])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="font-semibold">{problem.subject} Problem</h2>
              <p className="text-sm text-gray-600">
                {problem.type} • {problem.difficulty}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Step {currentStep + 1} of {problem.steps.length}
            </Badge>
            <Progress value={(currentStep / (problem.steps.length - 1)) * 100} className="w-24 h-2" />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-blue-100">{getMessageIcon(message)}</AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 border ${getMessageBgColor(message)} ${
                message.role === "user" ? "mr-0" : "mr-12"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {streamingMessage || message.content}
                  </div>
                ) : (
                  message.content
                )}
              </div>

              {/* Message Actions */}
              {message.canSpeak && !message.isStreaming && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSpeakMessage(message)}
                    disabled={!voiceEnabled}
                    className="h-6 px-2 text-xs"
                  >
                    <Volume2 className="h-3 w-3 mr-1" />
                    Read aloud
                  </Button>
                  <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Step Controls */}
              {message.metadata?.showControls && !isProcessing && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                  <Button variant="outline" size="sm" onClick={onRequestHint} className="h-7 px-2 text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Hint
                  </Button>
                  <Button variant="outline" size="sm" onClick={onExplainStep} className="h-7 px-2 text-xs">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Explain
                  </Button>
                  {currentStep > 0 && (
                    <Button variant="outline" size="sm" onClick={onPreviousStep} className="h-7 px-2 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                  )}
                </div>
              )}
            </div>

            {message.role === "user" && (
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-blue-100">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* Processing Indicator */}
        {isProcessing && processingAgent && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-blue-100">
                <Loader2 className="h-4 w-4 animate-spin" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                {processingAgent} is thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer or ask a question..."
              className="resize-none pr-12"
              rows={2}
              disabled={isProcessing}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={isListening ? onStopListening : onStartListening}
              disabled={!voiceEnabled || isProcessing}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={handleSubmit} disabled={!currentInput.trim() || isProcessing} className="shrink-0">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={onRequestHint} disabled={isProcessing}>
            <Lightbulb className="h-4 w-4 mr-1" />
            Need a hint?
          </Button>
          <Button variant="outline" size="sm" onClick={onExplainStep} disabled={isProcessing}>
            <HelpCircle className="h-4 w-4 mr-1" />
            Explain this step
          </Button>
          <Button variant="ghost" size="sm" onClick={onResetProblem} className="text-red-600 hover:text-red-700">
            <RotateCcw className="h-4 w-4 mr-1" />
            Start over
          </Button>
        </div>
      </div>
    </div>
  )
}
