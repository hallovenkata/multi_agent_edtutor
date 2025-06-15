"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Volume2, VolumeX, Pause, Play, Square, AlertTriangle, CheckCircle } from "lucide-react"

interface VoiceControlsProps {
  voiceStatus: {
    enabled: boolean
    paused: boolean
    processing: boolean
    queueLength: number
    currentMessage: string | null
    initialized: boolean
    voiceCount: number
    synthesisAvailable: boolean
  }
  onToggleEnabled: () => void
  onTogglePaused: () => void
  onStop: () => void
}

export function VoiceControls({ voiceStatus, onToggleEnabled, onTogglePaused, onStop }: VoiceControlsProps) {
  const getVoiceStatusColor = () => {
    if (!voiceStatus.synthesisAvailable) return "text-red-600"
    if (!voiceStatus.initialized) return "text-yellow-600"
    if (voiceStatus.enabled) return "text-green-600"
    return "text-gray-600"
  }

  const getVoiceStatusIcon = () => {
    if (!voiceStatus.synthesisAvailable) return <AlertTriangle className="h-4 w-4" />
    if (!voiceStatus.initialized) return <AlertTriangle className="h-4 w-4" />
    if (voiceStatus.enabled) return <CheckCircle className="h-4 w-4" />
    return <VolumeX className="h-4 w-4" />
  }

  const getVoiceStatusText = () => {
    if (!voiceStatus.synthesisAvailable) return "Not Supported"
    if (!voiceStatus.initialized) return "Initializing..."
    if (voiceStatus.enabled) return "Ready"
    return "Disabled"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {voiceStatus.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          Voice Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Status Alert */}
        {!voiceStatus.synthesisAvailable && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Speech synthesis is not supported in this browser. Voice features will be disabled.
            </AlertDescription>
          </Alert>
        )}

        {voiceStatus.synthesisAvailable && !voiceStatus.initialized && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Voice system is initializing. Please wait a moment before using voice features.
            </AlertDescription>
          </Alert>
        )}

        {/* Voice Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <div className={getVoiceStatusColor()}>{getVoiceStatusIcon()}</div>
            <Badge variant="outline" className={getVoiceStatusColor()}>
              {getVoiceStatusText()}
            </Badge>
          </div>
        </div>

        {/* Voice Info */}
        {voiceStatus.synthesisAvailable && (
          <div className="text-xs text-gray-600 space-y-1">
            <div>Available voices: {voiceStatus.voiceCount}</div>
            {voiceStatus.initialized && voiceStatus.voiceCount === 0 && (
              <div className="text-yellow-600">⚠️ No voices loaded - speech may not work</div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant={voiceStatus.enabled ? "default" : "outline"}
            size="sm"
            onClick={onToggleEnabled}
            className="flex-1"
            disabled={!voiceStatus.synthesisAvailable}
          >
            {voiceStatus.enabled ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeX className="h-3 w-3 mr-1" />}
            {voiceStatus.enabled ? "On" : "Off"}
          </Button>

          {voiceStatus.enabled && voiceStatus.synthesisAvailable && (
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

        {/* Queue Status */}
        {voiceStatus.enabled && voiceStatus.synthesisAvailable && (
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
