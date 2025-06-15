"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, Bot, History, Volume2, VolumeX, Atom } from "lucide-react"

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
  const navItems = [
    { id: "tutor", label: "Tutor", icon: Home },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "history", label: "History", icon: History },
  ]

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
