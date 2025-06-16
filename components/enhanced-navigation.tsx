"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Home,
  Bot,
  History,
  Settings,
  User,
  BookOpen,
  Target,
  Award,
  Atom,
  Calculator,
  Beaker,
  Cpu,
  Wrench,
  Brain,
  Activity,
  Zap,
  MessageSquare,
  ChevronDown,
} from "lucide-react"
import { useChatPersistence, type ChatSession } from "@/hooks/use-chat-persistence"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useSearchParams as useSearchParamsHook } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EnhancedNavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  onChatSelect?: (problemId: string) => void
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
  processingAgent: string | null
  queueStatus: {
    queued: number
    active: number
    streaming: number
    agentStatuses: Record<string, string>
  }
}

export function EnhancedNavigation({
  currentPage,
  onPageChange,
  onChatSelect = () => {},
  student,
  currentProblem,
  currentStep,
  sessionStats,
  processingAgent,
  queueStatus,
}: EnhancedNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  // const [sessions, setSessions] = useState<ChatSession[]>([])
  // const { getActiveSessions } = useChatPersistence('') // Assuming this specific instance is only for the dropdown
  // const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const searchParams = useSearchParamsHook()
  // const chatId = searchParams.get('chatId')

  // useEffect(() => {
  //   const activeSessions = getActiveSessions()
  //   setSessions(activeSessions)
    
  //   // Set the selected chat from URL if it exists in active sessions
  //   if (chatId && !selectedChat) {
  //     const chatExists = activeSessions.some(session => session.problemId === chatId)
  //     if (chatExists) {
  //       setSelectedChat(chatId)
  //     }
  //   }
    
  //   const interval = setInterval(() => {
  //     setSessions(getActiveSessions())
  //   }, 30000)
    
  //   return () => clearInterval(interval)
  // }, [getActiveSessions, chatId, selectedChat])

  // const formatTimeAgo = (date: Date) => {
  //   const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  //   const intervals = {
  //     year: 31536000,
  //     month: 2592000,
  //     week: 604800,
  //     day: 86400,
  //     hour: 3600,
  //     minute: 60
  //   }

  //   for (const [unit, secondsInUnit] of Object.entries(intervals)) {
  //     const interval = Math.floor(seconds / secondsInUnit)
  //     if (interval >= 1) {
  //       return `${interval}${unit[0]} ago`
  //     }
  //   }
  //   return 'Just now'
  // }

  const navItems = [
    {
      id: "tutor",
      label: "STEM Tutor",
      icon: Home,
      description: "Solve problems step-by-step",
      color: "blue",
    },
    {
      id: "agents",
      label: "System Agents",
      icon: Bot,
      description: "View system status",
      color: "purple",
    },
    {
      id: "history",
      label: "Learning History",
      icon: History,
      description: "Review past sessions",
      color: "green",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "Configure preferences",
      color: "gray",
    },
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

  const hasActivity = queueStatus.queued > 0 || queueStatus.active > 0 || queueStatus.streaming > 0

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* User Profile */}
        <Card className="relative overflow-hidden">
          {processingAgent && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500">
              <div className="h-full bg-white/30 animate-pulse" />
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                {hasActivity && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Activity className="h-2 w-2 text-white animate-pulse" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold">{student.name}</h3>
                <p className="text-sm text-gray-600">{student.location}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Level:</span>
                <Badge variant="outline" className="capitalize">
                  {student.stemLevel}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-1">
                  {student.preferredSubjects.slice(0, 3).map((subject) => (
                    <Badge key={subject} variant="secondary" className="text-xs">
                      {getSubjectIcon(subject)}
                      <span className="ml-1 capitalize">{subject.replace("-", " ")}</span>
                    </Badge>
                  ))}
                  {student.preferredSubjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{student.preferredSubjects.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Navigation</h3>
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs flex items-center gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chats</span>
                    {sessions.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center">
                        {sessions.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end" sideOffset={8}>
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Active Chats</div>
                  {sessions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No active chats</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {sessions.map((session) => (
                        <DropdownMenuItem 
                          key={session.problemId}
                          onClick={() => {
                            setSelectedChat(session.problemId);
                            onChatSelect(session.problemId);
                            // Update URL to reflect the selected chat
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('chatId', session.problemId);
                            router.push(`${pathname}?${params.toString()}`);
                          }}
                          className={`flex flex-col items-start gap-1 p-2 cursor-pointer ${
                            selectedChat === session.problemId ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between w-full">
                            <span className="font-medium text-sm truncate">{session.title}</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatTimeAgo(session.lastUpdated)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate w-full text-left">
                            {session.preview}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => onPageChange(item.id)}
                    className={`w-full justify-start h-auto p-3 transition-all duration-200 ${
                      isActive ? "shadow-md scale-105" : "hover:scale-102"
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="relative">
                        <Icon className="h-4 w-4 mt-0.5" />
                        {item.id === "agents" && hasActivity && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Problem Status */}
        {currentProblem && (
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-blue-500" />
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4" />
                <h3 className="font-semibold">Active Problem</h3>
                {processingAgent && (
                  <Badge variant="outline" className="animate-pulse text-xs">
                    Processing
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getSubjectIcon(currentProblem.subject)}
                  <span className="font-medium text-sm">{currentProblem.subject}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <Badge variant="outline" className="ml-1 text-xs">
                      {currentProblem.type}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Level:</span>
                    <Badge variant="outline" className="ml-1 text-xs">
                      {currentProblem.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress:</span>
                    <span className="font-medium">
                      {currentStep + 1}/{currentProblem.steps.length}
                    </span>
                  </div>
                  <Progress value={(currentStep / (currentProblem.steps.length - 1)) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              <h3 className="font-semibold">Session Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{sessionStats.problemsSolved}</div>
                <div className="text-xs text-gray-600">Solved</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{sessionStats.accuracy}%</div>
                <div className="text-xs text-gray-600">Accuracy</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">{formatTime(sessionStats.timeSpent)}</div>
                <div className="text-xs text-gray-600">Time</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <div className="text-lg font-bold text-orange-600">{sessionStats.streak}</div>
                <div className="text-xs text-gray-600">Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Activity */}
        {hasActivity && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-orange-800">System Activity</h3>
              </div>

              <div className="space-y-2 text-sm">
                {queueStatus.active > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Active Requests:</span>
                    <Badge variant="default" className="animate-pulse">
                      {queueStatus.active}
                    </Badge>
                  </div>
                )}
                {queueStatus.queued > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Queued:</span>
                    <Badge variant="outline">{queueStatus.queued}</Badge>
                  </div>
                )}
                {processingAgent && (
                  <div className="text-xs text-orange-700 animate-pulse">{processingAgent} agent is working...</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start hover:scale-105 transition-transform"
                onClick={() => onPageChange("tutor")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                New Problem
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start hover:scale-105 transition-transform">
                <Target className="h-4 w-4 mr-2" />
                Practice Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
