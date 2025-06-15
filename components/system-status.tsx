"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, Loader2, Square } from "lucide-react"

interface SystemStatusProps {
  queueStatus: {
    queued: number
    active: number
    streaming: number
    agentStatuses: Record<string, string>
  }
  onEmergencyStop: () => void
}

export function SystemStatus({ queueStatus, onEmergencyStop }: SystemStatusProps) {
  const totalRequests = queueStatus.queued + queueStatus.active + queueStatus.streaming
  const hasActivity = totalRequests > 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      case "cancelled":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            System Status
          </CardTitle>
          {hasActivity && (
            <Button variant="outline" size="sm" onClick={onEmergencyStop} className="text-red-600 hover:text-red-700">
              <Square className="h-3 w-3 mr-1" />
              Stop All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{queueStatus.queued}</div>
            <div className="text-gray-500">Queued</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">{queueStatus.active}</div>
            <div className="text-gray-500">Active</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">{queueStatus.streaming}</div>
            <div className="text-gray-500">Streaming</div>
          </div>
        </div>

        {hasActivity && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Processing</span>
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
            <Progress value={75} className="h-1" />
          </div>
        )}

        <div className="space-y-1">
          <div className="text-xs font-medium">Agent Status:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(queueStatus.agentStatuses).map(([agent, status]) => (
              <div key={agent} className="flex items-center justify-between">
                <span>{agent}:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                  <span className="capitalize">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!hasActivity && <div className="text-center text-xs text-gray-500 py-2">All systems idle</div>}
      </CardContent>
    </Card>
  )
}
