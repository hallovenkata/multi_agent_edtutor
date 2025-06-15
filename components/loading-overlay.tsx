"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Brain, Zap, Eye, MessageSquare } from "lucide-react"

interface LoadingOverlayProps {
  isVisible: boolean
  processingAgent: string | null
  message?: string
  progress?: number
}

export function LoadingOverlay({ isVisible, processingAgent, message, progress }: LoadingOverlayProps) {
  if (!isVisible) return null

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "CVA":
        return <MessageSquare className="h-6 w-6" />
      case "VA":
        return <Eye className="h-6 w-6" />
      case "TA":
      case "NLG":
        return <Brain className="h-6 w-6" />
      default:
        return <Zap className="h-6 w-6" />
    }
  }

  const getAgentName = (agent: string) => {
    switch (agent) {
      case "CVA":
        return "Voice Agent"
      case "VA":
        return "Vision Agent"
      case "TA":
        return "Teaching Agent"
      case "AA":
        return "Assessment Agent"
      case "FA":
        return "Feedback Agent"
      case "NLG":
        return "Language Agent"
      case "CA":
        return "Content Agent"
      default:
        return "System"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-96 shadow-2xl border-2">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                {processingAgent && getAgentIcon(processingAgent)}
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin absolute" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 rounded-full animate-ping" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Processing...</h3>
              {processingAgent && (
                <Badge variant="outline" className="animate-pulse">
                  {getAgentName(processingAgent)} Active
                </Badge>
              )}
              {message && <p className="text-sm text-gray-600">{message}</p>}
            </div>

            {progress !== undefined && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">{progress}% Complete</p>
              </div>
            )}

            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
