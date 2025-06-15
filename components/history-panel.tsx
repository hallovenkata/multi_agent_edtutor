"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { useState } from "react"

interface HistorySession {
  id: string
  date: Date
  problem: string
  status: "completed" | "incomplete" | "abandoned"
  steps: number
  correctSteps: number
  timeSpent: number
  hints: number
}

interface HistoryPanelProps {
  onLoadProblem?: (problem: string) => void
}

export function HistoryPanel({ onLoadProblem }: HistoryPanelProps) {
  const [expandedSessions, setExpandedSessions] = useState<string[]>([])

  // Mock historical data
  const sessions: HistorySession[] = [
    {
      id: "session_1",
      date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      problem: "2x + 5 = 11",
      status: "completed",
      steps: 5,
      correctSteps: 5,
      timeSpent: 180, // seconds
      hints: 1,
    },
    {
      id: "session_2",
      date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      problem: "3x - 7 = 14",
      status: "completed",
      steps: 5,
      correctSteps: 4,
      timeSpent: 240,
      hints: 2,
    },
    {
      id: "session_3",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      problem: "4x + 8 = 20",
      status: "incomplete",
      steps: 3,
      correctSteps: 2,
      timeSpent: 120,
      hints: 3,
    },
    {
      id: "session_4",
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      problem: "5x - 15 = 10",
      status: "abandoned",
      steps: 2,
      correctSteps: 1,
      timeSpent: 60,
      hints: 0,
    },
  ]

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "incomplete":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "abandoned":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "incomplete":
        return "bg-yellow-100 text-yellow-800"
      case "abandoned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate statistics
  const totalSessions = sessions.length
  const completedSessions = sessions.filter((s) => s.status === "completed").length
  const totalTimeSpent = sessions.reduce((acc, s) => acc + s.timeSpent, 0)
  const averageAccuracy =
    sessions.length > 0
      ? Math.round((sessions.reduce((acc, s) => acc + s.correctSteps / s.steps, 0) / sessions.length) * 100)
      : 0

  return (
    <div className="space-y-4">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalSessions}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedSessions}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatTime(totalTimeSpent)}</div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{averageAccuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
          <CardDescription>Your problem-solving history</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {sessions.map((session) => (
                <Collapsible key={session.id}>
                  <div className="border rounded-lg p-3">
                    <CollapsibleTrigger className="w-full" onClick={() => toggleSession(session.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedSessions.includes(session.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div className="text-left">
                            <div className="font-mono text-sm font-medium">{session.problem}</div>
                            <div className="text-xs text-gray-500">{formatDate(session.date)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          <Badge variant="outline" className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Steps:</span> {session.correctSteps}/{session.steps}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {formatTime(session.timeSpent)}
                          </div>
                          <div>
                            <span className="font-medium">Hints:</span> {session.hints}
                          </div>
                          <div>
                            <span className="font-medium">Accuracy:</span>{" "}
                            {Math.round((session.correctSteps / session.steps) * 100)}%
                          </div>
                        </div>

                        {session.status !== "completed" && onLoadProblem && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onLoadProblem(session.problem)}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Continue Problem
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
