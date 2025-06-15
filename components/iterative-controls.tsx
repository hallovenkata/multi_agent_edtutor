"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipForward, RotateCcw, HelpCircle, CheckCircle } from "lucide-react"

interface IterativeControlsProps {
  currentStep: number
  totalSteps: number
  isProcessing: boolean
  canProceed: boolean
  onNext: () => void
  onPrevious: () => void
  onPause: () => void
  onExplain: () => void
  onReset: () => void
  stepStatus: "pending" | "active" | "completed" | "error"
}

export function IterativeControls({
  currentStep,
  totalSteps,
  isProcessing,
  canProceed,
  onNext,
  onPrevious,
  onPause,
  onExplain,
  onReset,
  stepStatus,
}: IterativeControlsProps) {
  const getStatusColor = () => {
    switch (stepStatus) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = () => {
    switch (stepStatus) {
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "active":
        return <Play className="h-3 w-3" />
      case "error":
        return <RotateCcw className="h-3 w-3" />
      default:
        return <Pause className="h-3 w-3" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Learning Controls</span>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            Step {currentStep + 1} of {totalSteps}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-gray-600 mb-2">Take control of your learning pace</div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentStep === 0 || isProcessing}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!canProceed || isProcessing || currentStep >= totalSteps - 1}
            className="flex items-center gap-1"
          >
            <SkipForward className="h-3 w-3" />
            Next
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExplain}
            disabled={isProcessing}
            className="flex items-center gap-1"
          >
            <HelpCircle className="h-3 w-3" />
            Explain
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onPause}
            disabled={isProcessing}
            className="flex items-center gap-1"
          >
            <Pause className="h-3 w-3" />
            Pause
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="w-full flex items-center gap-1 text-red-600 hover:text-red-700"
        >
          <RotateCcw className="h-3 w-3" />
          Start Over
        </Button>
      </CardContent>
    </Card>
  )
}
