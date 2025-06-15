"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Bot, 
  History, 
  Volume2, 
  VolumeX, 
  Atom, 
  MessageSquare, 
  ChevronDown, 
  Clock 
} from "lucide-react"
import { useChatPersistence, type ChatSession } from "@/hooks/use-chat-persistence"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  student: {
    name: string
    location: string
  }
  voiceEnabled: boolean
  onVoiceToggle: () => void
}

export function Navigation({ currentPage, onPageChange, student, voiceEnabled, onVoiceToggle }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const { getActiveSessions } = useChatPersistence('')

  useEffect(() => {
    setSessions(getActiveSessions())
    const interval = setInterval(() => {
      setSessions(getActiveSessions())
    }, 30000)
    return () => clearInterval(interval)
  }, [getActiveSessions])

  const navItems = [
    { id: "tutor", label: "Tutor", icon: Home },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "history", label: "History", icon: History },
  ]

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit)
      if (interval >= 1) {
        return `${interval}${unit[0]} ago`
      }
    }
    return 'Just now'
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <Atom className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-indigo-900">STEM Tutor AI</h1>
              <p className="text-sm text-gray-600">Multi-Agent Virtual Assistant</p>
            </div>
          </div>

          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(item.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Active Chats
                  <ChevronDown className="h-3 w-3" />
                  {sessions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {sessions.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                {sessions.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No active chats</div>
                ) : (
                  sessions.map((session) => (
                    <DropdownMenuItem 
                      key={session.problemId}
                      onClick={() => router.push(`/problem/${session.problemId}`)}
                      className="flex flex-col items-start gap-1 p-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex justify-between w-full">
                        <span className="font-medium truncate">{session.title}</span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(session.lastUpdated)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate w-full">
                        {session.preview}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <Badge variant="secondary">{student.name}</Badge>
            <p className="text-xs text-gray-500">{student.location}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onVoiceToggle}>
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
