export class VoiceController {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private voiceQueue: { message: string; priority: "high" | "normal"; type: string }[] = []
  private isEnabled = true
  private isPaused = false
  private isProcessing = false

  constructor() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.synthesis = window.speechSynthesis
    }
  }

  // Enable/disable voice
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  // Pause/resume voice
  setPaused(paused: boolean) {
    this.isPaused = paused

    if (this.synthesis) {
      if (paused) {
        this.synthesis.pause()
      } else {
        this.synthesis.resume()
        this.processQueue()
      }
    }
  }

  // Add message to voice queue with intelligent filtering
  speak(message: string, priority: "high" | "normal" = "normal", type = "general") {
    if (!this.isEnabled || !this.synthesis) return

    // Filter what should be spoken based on type and content
    if (!this.shouldSpeak(message, type)) return

    // Create voice-friendly version of the message
    const voiceMessage = this.createVoiceMessage(message, type)
    if (!voiceMessage.trim()) return

    const queueItem = { message: voiceMessage, priority, type }

    if (priority === "high") {
      // High priority messages interrupt current speech
      this.stop()
      this.voiceQueue.unshift(queueItem)
    } else {
      this.voiceQueue.push(queueItem)
    }

    this.processQueue()
  }

  // Determine if message should be spoken
  private shouldSpeak(message: string, type: string): boolean {
    // Don't speak very long messages
    if (message.length > 200) return false

    // Don't speak technical/code content
    if (message.includes("```") || message.includes("equation:") || message.includes("formula:")) return false

    // Only speak certain types
    const speakableTypes = ["greeting", "feedback", "hint", "question", "instruction", "confirmation"]
    return speakableTypes.includes(type)
  }

  // Create voice-friendly version of message
  private createVoiceMessage(message: string, type: string): string {
    const voiceMessage = message

    // For different types, create appropriate voice messages
    switch (type) {
      case "greeting":
        return this.cleanMessage(message)

      case "feedback":
        // Shorten feedback messages
        if (message.includes("correct") || message.includes("great") || message.includes("excellent")) {
          return "Great job! That's correct."
        } else if (message.includes("incorrect") || message.includes("try again")) {
          return "Not quite right. Let's try again."
        }
        return this.cleanMessage(message.substring(0, 100))

      case "hint":
        // Provide short hint announcements
        return "Here's a hint: " + this.cleanMessage(message.replace("💡 Hint:", "").substring(0, 80))

      case "instruction":
        // Summarize instructions
        if (message.includes("Problem analyzed")) {
          return "I've analyzed your problem. Let's start solving it step by step."
        } else if (message.includes("extracted")) {
          return "I've found a problem in your image. Let's solve it."
        }
        return this.cleanMessage(message.substring(0, 100))

      case "question":
        return "I have a question for you: " + this.cleanMessage(message)

      case "confirmation":
        return this.cleanMessage(message)

      default:
        return this.cleanMessage(message.substring(0, 100))
    }
  }

  // Stop current speech and clear queue
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    this.voiceQueue = []
    this.currentUtterance = null
    this.isProcessing = false
  }

  // Process the voice queue
  private async processQueue() {
    if (!this.isEnabled || this.isPaused || this.isProcessing || this.voiceQueue.length === 0) {
      return
    }

    this.isProcessing = true
    const queueItem = this.voiceQueue.shift()

    if (queueItem && this.synthesis) {
      const utterance = new SpeechSynthesisUtterance(queueItem.message)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onend = () => {
        this.isProcessing = false
        this.currentUtterance = null
        // Process next message in queue
        setTimeout(() => this.processQueue(), 300)
      }

      utterance.onerror = () => {
        this.isProcessing = false
        this.currentUtterance = null
        // Continue with next message
        setTimeout(() => this.processQueue(), 300)
      }

      this.currentUtterance = utterance
      this.synthesis.speak(utterance)
    } else {
      this.isProcessing = false
    }
  }

  // Clean message for better speech synthesis
  private cleanMessage(message: string): string {
    return message
      .replace(/[🎉💡✅❌⚗️🔬🧮⚙️]/gu, "") // Remove emojis
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markdown
      .replace(/\*(.*?)\*/g, "$1") // Remove italic markdown
      .replace(/`(.*?)`/g, "$1") // Remove code markdown
      .replace(/\n+/g, ". ") // Replace newlines with periods
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/([A-Z]{2,})/g, (match) => match.toLowerCase()) // Convert acronyms to lowercase
      .replace(/(\d+)x/g, "$1 times") // Convert math notation
      .replace(/=/g, " equals ") // Convert equals sign
      .replace(/\+/g, " plus ") // Convert plus sign
      .replace(/-/g, " minus ") // Convert minus sign
      .trim()
  }

  // Get current status
  getStatus() {
    return {
      enabled: this.isEnabled,
      paused: this.isPaused,
      processing: this.isProcessing,
      queueLength: this.voiceQueue.length,
      currentMessage: this.currentUtterance?.text || null,
    }
  }
}

export const voiceController = new VoiceController()
