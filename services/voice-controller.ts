export class VoiceController {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private voiceQueue: { message: string; priority: "high" | "normal"; type: string }[] = []
  private isEnabled = true
  private isPaused = false
  private isProcessing = false
  private voices: SpeechSynthesisVoice[] = []
  private isInitialized = false

  constructor() {
    this.initializeVoiceController()
  }

  private async initializeVoiceController() {
    if (typeof window === "undefined") {
      console.warn("Voice controller: Window not available (SSR)")
      return
    }

    if (!window.speechSynthesis) {
      console.warn("Voice controller: Speech synthesis not supported in this browser")
      return
    }

    try {
      this.synthesis = window.speechSynthesis

      // Wait for voices to load
      await this.loadVoices()

      this.isInitialized = true
      console.log("Voice controller initialized successfully with", this.voices.length, "voices")
    } catch (error) {
      console.error("Voice controller initialization failed:", error)
    }
  }

  private loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        resolve()
        return
      }

      const loadVoicesHandler = () => {
        this.voices = this.synthesis!.getVoices()
        if (this.voices.length > 0) {
          console.log("Voices loaded:", this.voices.length)
          resolve()
        }
      }

      // Try to get voices immediately
      this.voices = this.synthesis.getVoices()
      if (this.voices.length > 0) {
        console.log("Voices available immediately:", this.voices.length)
        resolve()
        return
      }

      // Wait for voices to load
      this.synthesis.addEventListener("voiceschanged", loadVoicesHandler, { once: true })

      // Fallback timeout
      setTimeout(() => {
        this.voices = this.synthesis!.getVoices()
        console.log("Voices after timeout:", this.voices.length)
        resolve()
      }, 1000)
    })
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) return null

    // Try to find an English voice
    const englishVoices = this.voices.filter((voice) => voice.lang.startsWith("en") && !voice.name.includes("Google"))

    if (englishVoices.length > 0) {
      // Prefer female voices for educational content
      const femaleVoice = englishVoices.find(
        (voice) =>
          voice.name.toLowerCase().includes("female") ||
          voice.name.toLowerCase().includes("zira") ||
          voice.name.toLowerCase().includes("hazel"),
      )
      return femaleVoice || englishVoices[0]
    }

    return this.voices[0]
  }

  // Enable/disable voice
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    console.log("Voice enabled:", enabled)
    if (!enabled) {
      this.stop()
    }
  }

  // Pause/resume voice
  setPaused(paused: boolean) {
    this.isPaused = paused
    console.log("Voice paused:", paused)

    if (this.synthesis) {
      try {
        if (paused) {
          this.synthesis.pause()
        } else {
          this.synthesis.resume()
          this.processQueue()
        }
      } catch (error) {
        console.error("Error pausing/resuming speech:", error)
      }
    }
  }

  // Add message to voice queue with intelligent filtering
  speak(message: string, priority: "high" | "normal" = "normal", type = "general") {
    console.log("Speak called:", {
      message: message.substring(0, 50),
      priority,
      type,
      enabled: this.isEnabled,
      initialized: this.isInitialized,
    })

    if (!this.isEnabled || !this.synthesis || !this.isInitialized) {
      console.log("Voice disabled, not supported, or not initialized")
      return
    }

    // Filter what should be spoken based on type and content
    if (!this.shouldSpeak(message, type)) {
      console.log("Message filtered out:", type)
      return
    }

    // Create voice-friendly version of the message
    const voiceMessage = this.createVoiceMessage(message, type)
    if (!voiceMessage.trim()) {
      console.log("Empty voice message after processing")
      return
    }

    console.log("Adding to voice queue:", voiceMessage.substring(0, 50))
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
    if (message.length > 300) {
      console.log("Message too long:", message.length)
      return false
    }

    // Don't speak empty or very short messages
    if (message.trim().length < 3) {
      console.log("Message too short")
      return false
    }

    // Don't speak technical/code content
    if (message.includes("```") || message.includes("Step-by-step") || message.includes("Problem analyzed:")) {
      console.log("Technical content filtered")
      return false
    }

    // Always speak certain types
    const alwaysSpeakTypes = ["greeting", "feedback", "hint", "confirmation"]
    if (alwaysSpeakTypes.includes(type)) {
      console.log("Always speak type:", type)
      return true
    }

    // Speak short instructions
    if (type === "instruction" && message.length < 100) {
      return true
    }

    return true // Default to speaking
  }

  // Create voice-friendly version of message
  private createVoiceMessage(message: string, type: string): string {
    console.log("Creating voice message for type:", type)

    // For different types, create appropriate voice messages
    switch (type) {
      case "greeting":
        return this.cleanMessage(message)

      case "feedback":
        // Shorten feedback messages
        if (
          message.toLowerCase().includes("correct") ||
          message.toLowerCase().includes("great") ||
          message.toLowerCase().includes("excellent")
        ) {
          return "Great job! That's correct."
        } else if (message.toLowerCase().includes("incorrect") || message.toLowerCase().includes("try again")) {
          return "Not quite right. Let's try again."
        } else if (message.toLowerCase().includes("good")) {
          return "Good work!"
        }
        return this.cleanMessage(message.substring(0, 80))

      case "hint":
        // Provide short hint announcements
        const hintText = message.replace("💡 Hint:", "").replace("Hint:", "").trim()
        return "Here's a hint: " + this.cleanMessage(hintText.substring(0, 60))

      case "instruction":
        // Summarize instructions
        if (message.includes("Problem analyzed")) {
          return "I've analyzed your problem. Let's start solving it step by step."
        } else if (message.includes("extracted")) {
          return "I found a problem in your image. Let's solve it."
        } else if (message.includes("Moving to step")) {
          return "Moving to the next step."
        } else if (message.includes("Going back")) {
          return "Going back to the previous step."
        }
        return this.cleanMessage(message.substring(0, 80))

      case "question":
        return "I have a question: " + this.cleanMessage(message.substring(0, 60))

      case "confirmation":
        return this.cleanMessage(message.substring(0, 60))

      default:
        return this.cleanMessage(message.substring(0, 80))
    }
  }

  // Stop current speech and clear queue
  stop() {
    console.log("Stopping voice")
    if (this.synthesis) {
      try {
        this.synthesis.cancel()
      } catch (error) {
        console.error("Error stopping speech:", error)
      }
    }
    this.voiceQueue = []
    this.currentUtterance = null
    this.isProcessing = false
  }

  // Process the voice queue
  private async processQueue() {
    if (!this.isEnabled || this.isPaused || this.isProcessing || this.voiceQueue.length === 0 || !this.synthesis) {
      console.log("Queue processing skipped:", {
        enabled: this.isEnabled,
        paused: this.isPaused,
        processing: this.isProcessing,
        queueLength: this.voiceQueue.length,
        synthesis: !!this.synthesis,
      })
      return
    }

    console.log("Processing voice queue, items:", this.voiceQueue.length)
    this.isProcessing = true
    const queueItem = this.voiceQueue.shift()

    if (queueItem && this.synthesis) {
      try {
        console.log("Speaking:", queueItem.message)

        // Create utterance with better error handling
        const utterance = new SpeechSynthesisUtterance(queueItem.message)

        // Set voice properties
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 0.8

        // Try to set a preferred voice
        const preferredVoice = this.getPreferredVoice()
        if (preferredVoice) {
          utterance.voice = preferredVoice
          console.log("Using voice:", preferredVoice.name)
        }

        // Set up event handlers
        utterance.onstart = () => {
          console.log("Speech started successfully")
        }

        utterance.onend = () => {
          console.log("Speech ended successfully")
          this.isProcessing = false
          this.currentUtterance = null
          // Process next message in queue after a short delay
          setTimeout(() => this.processQueue(), 300)
        }

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", {
            error: event.error,
            message: queueItem.message.substring(0, 50),
            voiceCount: this.voices.length,
            synthesis: !!this.synthesis,
          })

          this.isProcessing = false
          this.currentUtterance = null

          // Try to continue with next message after error
          setTimeout(() => this.processQueue(), 500)
        }

        utterance.onpause = () => {
          console.log("Speech paused")
        }

        utterance.onresume = () => {
          console.log("Speech resumed")
        }

        // Store current utterance
        this.currentUtterance = utterance

        // Speak the utterance
        this.synthesis.speak(utterance)
      } catch (error) {
        console.error("Error creating or speaking utterance:", error)
        this.isProcessing = false
        this.currentUtterance = null
        // Continue with next message
        setTimeout(() => this.processQueue(), 500)
      }
    } else {
      console.log("No queue item or synthesis unavailable")
      this.isProcessing = false
    }
  }

  // Clean message for better speech synthesis
  private cleanMessage(message: string): string {
    return message
      .replace(/[🎉💡✅❌⚗️🔬🧮⚙️📚]/gu, "") // Remove emojis
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
      .replace(/H₂/g, "H 2") // Convert chemical formulas
      .replace(/O₂/g, "O 2")
      .replace(/CO₂/g, "C O 2")
      .replace(/\s+/g, " ") // Normalize whitespace again
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
      initialized: this.isInitialized,
      voiceCount: this.voices.length,
      synthesisAvailable: !!this.synthesis,
    }
  }

  // Test voice functionality
  async testVoice(): Promise<boolean> {
    if (!this.synthesis || !this.isInitialized) {
      console.log("Voice test failed: not initialized")
      return false
    }

    return new Promise((resolve) => {
      try {
        const testUtterance = new SpeechSynthesisUtterance("Voice test")
        testUtterance.volume = 0.1 // Very quiet for testing
        testUtterance.rate = 2.0 // Fast for testing

        testUtterance.onend = () => {
          console.log("Voice test successful")
          resolve(true)
        }

        testUtterance.onerror = (event) => {
          console.log("Voice test failed:", event.error)
          resolve(false)
        }

        // Timeout for test
        setTimeout(() => {
          console.log("Voice test timeout")
          resolve(false)
        }, 3000)

        this.synthesis!.speak(testUtterance)
      } catch (error) {
        console.log("Voice test exception:", error)
        resolve(false)
      }
    })
  }
}

export const voiceController = new VoiceController()
