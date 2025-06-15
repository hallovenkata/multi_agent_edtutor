"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, HelpCircle } from "lucide-react"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  type: "success" | "warning" | "question"
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  type,
  onConfirm,
  onCancel,
  confirmText = "Continue",
  cancelText = "Cancel",
}: ConfirmationDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      case "question":
        return <HelpCircle className="h-6 w-6 text-blue-500" />
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2">{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          {onCancel && (
            <Button variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
          )}
          <Button onClick={handleConfirm}>{confirmText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
