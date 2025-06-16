"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react"
import { useState, useEffect } from "react"
import { useChatPersistence, type ChatSession } from "@/hooks/use-chat-persistence"

interface HistoryPanelProps {
  onLoadProblem?: (details: { problemId: string; title: string }) => void
}

export function HistoryPanel({ onLoadProblem }: HistoryPanelProps) {
  const [expandedSessions, setExpandedSessions] = useState<string[]>([])
  const { getActiveSessions } = useChatPersistence('history_panel_dummy_id');
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const sessions = getActiveSessions();
    setActiveSessions(sessions);
  }, [getActiveSessions]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  return (
    <div className="space-y-4">
      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
          <CardDescription>Your problem-solving history</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
            <div className="space-y-3">
              {activeSessions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent sessions found.</p>
              )}
              {activeSessions.map((session) => (
                <Collapsible key={session.problemId}>
                  <div className="border rounded-lg p-3">
                    <CollapsibleTrigger className="w-full" onClick={() => toggleSession(session.problemId)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedSessions.includes(session.problemId) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <div className="text-left">
                            <div className="font-mono text-sm font-medium">{session.title}</div>
                            <div className="text-xs text-gray-500">
                              Last updated: {formatDate(session.lastUpdated)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {session.messages.length} message{session.messages.length === 1 ? "" : "s"}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {session.preview && (
                           <p className="text-sm text-gray-600 italic">
                             &ldquo;{session.preview}&rdquo;
                           </p>
                        )}
                        {onLoadProblem && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onLoadProblem({ problemId: session.problemId, title: session.title })}
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
