"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Home,
  Bot,
  History,
  Settings,
  User,
  BookOpen,
  Target,
  Clock,
  Award,
  Atom,
  Calculator,
  Beaker,
  Cpu,
  Wrench,
  Brain,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LeftSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  student: {
    name: string
    location: string
    stemLevel: string
    preferredSubjects: string[]
  }
  currentProblem?: {
    subject: string
    type: string
    difficulty: string
    steps: any[]
  }
  currentStep: number
  sessionStats: {
    problemsSolved: number
    timeSpent: number
    accuracy: number
    streak: number
  }
  isProcessing: boolean
}

export function LeftSidebar({
  currentPage,
  onPageChange,
  student,
  currentProblem,
  currentStep,
  sessionStats,
  isProcessing,
}: LeftSidebarProps) {
  const navItems = [
    { id: "tutor", label: "STEM Tutor", icon: Home, description: "Solve problems step-by-step" },
    { id: "agents", label: "Agents", icon: Bot, description: "View system status" },
    { id: "history", label: "History", icon: History, description: "Review past sessions" },
    { id: "settings", label: "Settings", icon: Settings, description: "Configure preferences" },
  ]

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case "mathematics":
        return <Calculator className="h-4 w-4" />
      case "physics":
        return <Atom className="h-4 w-4" />
      case "chemistry":
        return <Beaker className="h-4 w-4" />
      case "biology":
        return <Brain className="h-4 w-4" />
      case "engineering":
        return <Wrench className="h-4 w-4" />
      case "computer-science":
        return <Cpu className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* User Profile */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{student.name}</CardTitle>
                <p className="text-sm text-gray-600">{student.location}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Level:</span>
              <Badge variant="outline" className="capitalize">
                {student.stemLevel}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Preferred Subjects:</p>
              <div className="flex flex-wrap gap-1">
                {student.preferredSubjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="text-xs">
                    {getSubjectIcon(subject)}
                    <span className="ml-1 capitalize">{subject.replace("-", " ")}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full justify-start h-auto p-3 transition-colors duration-200",
                    isProcessing && currentPage === item.id ? "text-blue-500" : "",
                  )}
                  disabled={isProcessing && currentPage !== item.id}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-4 w-4 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                    {isProcessing && currentPage === item.id && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>

        {/* Current Problem Status */}
        {currentProblem && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Current Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {getSubjectIcon(currentProblem.subject)}
                <span className="font-medium">{currentProblem.subject}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Type:</span>
                  <Badge variant="outline">{currentProblem.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Difficulty:</span>
                  <Badge variant="outline">{currentProblem.difficulty}</Badge>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress:</span>
                  <span>
                    {currentStep + 1}/{currentProblem.steps.length}
                  </span>
                </div>
                <Progress value={(currentStep / (currentProblem.steps.length - 1)) * 100} className="h-2" />
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Processing...</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4" />
              Session Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{sessionStats.problemsSolved}</div>
                <div className="text-xs text-gray-600">Problems Solved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{sessionStats.accuracy}%</div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{formatTime(sessionStats.timeSpent)}</div>
                <div className="text-xs text-gray-600">Time Spent</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{sessionStats.streak}</div>
                <div className="text-xs text-gray-600">Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              New Problem
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Clock className="h-4 w-4 mr-2" />
              Practice Mode
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Target className="h-4 w-4 mr-2" />
              Challenge
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
