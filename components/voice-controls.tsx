"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Volume2, VolumeX, Pause, Play, Square } from "lucide-react"

interface VoiceControlsProps {
  voiceStatus: {
    enabled: boolean
    paused: boolean
    processing: boolean
    queueLength: number
    currentMessage: string | null
  }
  onToggleEnabled: () => void
  onTogglePaused: () => void
  onStop: () => void
}

export function VoiceControls({ voiceStatus, onToggleEnabled, onTogglePaused, onStop }: VoiceControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {voiceStatus.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          Voice Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={voiceStatus.enabled ? "default" : "outline"}
            size="sm"
            onClick={onToggleEnabled}
            className="flex-1"
          >
            {voiceStatus.enabled ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeX className="h-3 w-3 mr-1" />}
            {voiceStatus.enabled ? "On" : "Off"}
          </Button>

          {voiceStatus.enabled && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onTogglePaused}
                disabled={!voiceStatus.processing && voiceStatus.queueLength === 0}
              >
                {voiceStatus.paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                disabled={!voiceStatus.processing && voiceStatus.queueLength === 0}
              >
                <Square className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {voiceStatus.enabled && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={voiceStatus.processing ? "default" : "secondary"}>
                {voiceStatus.paused ? "Paused" : voiceStatus.processing ? "Speaking" : "Ready"}
              </Badge>
            </div>

            {voiceStatus.queueLength > 0 && (
              <div className="flex items-center justify-between">
                <span>Queue:</span>
                <Badge variant="outline">{voiceStatus.queueLength} messages</Badge>
              </div>
            )}

            {voiceStatus.currentMessage && (
              <div className="text-gray-600 text-xs truncate">
                Speaking: {voiceStatus.currentMessage.substring(0, 50)}...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
