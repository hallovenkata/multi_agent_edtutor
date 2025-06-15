interface LearningSession {
  id: string
  studentId: string
  startTime: Date
  endTime?: Date
  problem: {
    original: string
    subject: string
    type: string
    difficulty: string
  }
  steps: Array<{
    stepNumber: number
    description: string
    userAnswers: Array<{
      answer: string
      isCorrect: boolean
      timestamp: Date
      hintsUsed: number
    }>
    completed: boolean
    timeSpent: number
  }>
  totalTimeSpent: number
  accuracy: number
  hintsUsed: number
  status: "completed" | "incomplete" | "abandoned"
  finalScore: number
}

interface StudentProgress {
  studentId: string
  totalSessions: number
  completedSessions: number
  totalTimeSpent: number
  averageAccuracy: number
  currentStreak: number
  longestStreak: number
  subjectProgress: Record<
    string,
    {
      sessionsCompleted: number
      averageAccuracy: number
      timeSpent: number
      lastActivity: Date
    }
  >
  weakAreas: string[]
  strongAreas: string[]
  lastUpdated: Date
}

export class LearningHistoryManager {
  private currentSession: LearningSession | null = null
  private studentProgress: StudentProgress | null = null

  // Start a new learning session
  startSession(studentId: string, problem: any): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.currentSession = {
      id: sessionId,
      studentId,
      startTime: new Date(),
      problem: {
        original: problem.original,
        subject: problem.subject,
        type: problem.type,
        difficulty: problem.difficulty,
      },
      steps: problem.steps.map((step: any, index: number) => ({
        stepNumber: index + 1,
        description: step.description,
        userAnswers: [],
        completed: false,
        timeSpent: 0,
      })),
      totalTimeSpent: 0,
      accuracy: 0,
      hintsUsed: 0,
      status: "incomplete",
      finalScore: 0,
    }

    // Load existing progress
    this.loadStudentProgress(studentId)

    return sessionId
  }

  // Record a step attempt
  recordStepAttempt(stepNumber: number, answer: string, isCorrect: boolean, hintsUsed = 0) {
    if (!this.currentSession) return

    const step = this.currentSession.steps[stepNumber - 1]
    if (!step) return

    step.userAnswers.push({
      answer,
      isCorrect,
      timestamp: new Date(),
      hintsUsed,
    })

    if (isCorrect) {
      step.completed = true
    }

    this.currentSession.hintsUsed += hintsUsed
    this.updateSessionStats()
    this.saveSession()
  }

  // Complete current session
  completeSession(status: "completed" | "abandoned" = "completed") {
    if (!this.currentSession) return

    this.currentSession.endTime = new Date()
    this.currentSession.status = status
    this.currentSession.totalTimeSpent = this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()

    // Calculate final score
    this.calculateFinalScore()

    // Update student progress
    this.updateStudentProgress()

    // Save everything
    this.saveSession()
    this.saveStudentProgress()

    const completedSession = this.currentSession
    this.currentSession = null

    return completedSession
  }

  // Update session statistics
  private updateSessionStats() {
    if (!this.currentSession) return

    const completedSteps = this.currentSession.steps.filter((s) => s.completed).length
    const totalSteps = this.currentSession.steps.length

    // Calculate accuracy
    let totalAttempts = 0
    let correctAttempts = 0

    this.currentSession.steps.forEach((step) => {
      step.userAnswers.forEach((answer) => {
        totalAttempts++
        if (answer.isCorrect) correctAttempts++
      })
    })

    this.currentSession.accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0
  }

  // Calculate final score
  private calculateFinalScore() {
    if (!this.currentSession) return

    const completedSteps = this.currentSession.steps.filter((s) => s.completed).length
    const totalSteps = this.currentSession.steps.length
    const completionRate = (completedSteps / totalSteps) * 100

    // Score based on completion, accuracy, and efficiency
    let score = completionRate * 0.4 + this.currentSession.accuracy * 0.4

    // Bonus for efficiency (fewer attempts)
    const avgAttemptsPerStep =
      this.currentSession.steps.reduce((acc, step) => acc + step.userAnswers.length, 0) / totalSteps

    if (avgAttemptsPerStep <= 1.5) score += 20
    else if (avgAttemptsPerStep <= 2) score += 10

    // Penalty for excessive hints
    if (this.currentSession.hintsUsed > totalSteps) {
      score -= Math.min(20, (this.currentSession.hintsUsed - totalSteps) * 5)
    }

    this.currentSession.finalScore = Math.max(0, Math.min(100, score))
  }

  // Update student progress
  private updateStudentProgress() {
    if (!this.currentSession || !this.studentProgress) return

    const session = this.currentSession
    const progress = this.studentProgress

    // Update overall stats
    progress.totalSessions++
    if (session.status === "completed") {
      progress.completedSessions++
    }

    progress.totalTimeSpent += session.totalTimeSpent

    // Update average accuracy
    const totalAccuracy = progress.averageAccuracy * (progress.totalSessions - 1) + session.accuracy
    progress.averageAccuracy = totalAccuracy / progress.totalSessions

    // Update streak
    if (session.status === "completed" && session.finalScore >= 70) {
      progress.currentStreak++
      progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak)
    } else {
      progress.currentStreak = 0
    }

    // Update subject progress
    const subject = session.problem.subject
    if (!progress.subjectProgress[subject]) {
      progress.subjectProgress[subject] = {
        sessionsCompleted: 0,
        averageAccuracy: 0,
        timeSpent: 0,
        lastActivity: new Date(),
      }
    }

    const subjectProgress = progress.subjectProgress[subject]
    if (session.status === "completed") {
      subjectProgress.sessionsCompleted++
    }

    const subjectTotalAccuracy =
      subjectProgress.averageAccuracy * (subjectProgress.sessionsCompleted - 1) + session.accuracy
    subjectProgress.averageAccuracy =
      subjectProgress.sessionsCompleted > 0
        ? subjectTotalAccuracy / subjectProgress.sessionsCompleted
        : session.accuracy

    subjectProgress.timeSpent += session.totalTimeSpent
    subjectProgress.lastActivity = new Date()

    // Analyze weak and strong areas
    this.analyzePerformanceAreas()

    progress.lastUpdated = new Date()
  }

  // Analyze performance to identify weak and strong areas
  private analyzePerformanceAreas() {
    if (!this.studentProgress) return

    const subjects = Object.entries(this.studentProgress.subjectProgress)

    // Sort by accuracy
    subjects.sort((a, b) => b[1].averageAccuracy - a[1].averageAccuracy)

    // Strong areas (top performers with sufficient data)
    this.studentProgress.strongAreas = subjects
      .filter(([_, data]) => data.sessionsCompleted >= 2 && data.averageAccuracy >= 80)
      .slice(0, 3)
      .map(([subject]) => subject)

    // Weak areas (low performers with sufficient data)
    this.studentProgress.weakAreas = subjects
      .filter(([_, data]) => data.sessionsCompleted >= 2 && data.averageAccuracy < 60)
      .slice(-3)
      .map(([subject]) => subject)
  }

  // Load student progress from localStorage
  private loadStudentProgress(studentId: string) {
    try {
      const saved = localStorage.getItem(`student_progress_${studentId}`)
      if (saved) {
        this.studentProgress = JSON.parse(saved)
        // Convert date strings back to Date objects
        if (this.studentProgress) {
          this.studentProgress.lastUpdated = new Date(this.studentProgress.lastUpdated)
          Object.values(this.studentProgress.subjectProgress).forEach((subject) => {
            subject.lastActivity = new Date(subject.lastActivity)
          })
        }
      } else {
        // Initialize new progress
        this.studentProgress = {
          studentId,
          totalSessions: 0,
          completedSessions: 0,
          totalTimeSpent: 0,
          averageAccuracy: 0,
          currentStreak: 0,
          longestStreak: 0,
          subjectProgress: {},
          weakAreas: [],
          strongAreas: [],
          lastUpdated: new Date(),
        }
      }
    } catch (error) {
      console.error("Error loading student progress:", error)
      // Initialize new progress on error
      this.studentProgress = {
        studentId,
        totalSessions: 0,
        completedSessions: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        currentStreak: 0,
        longestStreak: 0,
        subjectProgress: {},
        weakAreas: [],
        strongAreas: [],
        lastUpdated: new Date(),
      }
    }
  }

  // Save current session
  private saveSession() {
    if (!this.currentSession) return

    try {
      const sessions = this.getAllSessions()
      const existingIndex = sessions.findIndex((s) => s.id === this.currentSession!.id)

      if (existingIndex >= 0) {
        sessions[existingIndex] = this.currentSession
      } else {
        sessions.push(this.currentSession)
      }

      localStorage.setItem("learning_sessions", JSON.stringify(sessions))
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  // Save student progress
  private saveStudentProgress() {
    if (!this.studentProgress) return

    try {
      localStorage.setItem(`student_progress_${this.studentProgress.studentId}`, JSON.stringify(this.studentProgress))
    } catch (error) {
      console.error("Error saving student progress:", error)
    }
  }

  // Get all sessions
  getAllSessions(): LearningSession[] {
    try {
      const saved = localStorage.getItem("learning_sessions")
      if (saved) {
        const sessions = JSON.parse(saved)
        // Convert date strings back to Date objects
        return sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          steps: session.steps.map((step: any) => ({
            ...step,
            userAnswers: step.userAnswers.map((answer: any) => ({
              ...answer,
              timestamp: new Date(answer.timestamp),
            })),
          })),
        }))
      }
      return []
    } catch (error) {
      console.error("Error loading sessions:", error)
      return []
    }
  }

  // Get student progress
  getStudentProgress(): StudentProgress | null {
    return this.studentProgress
  }

  // Get current session
  getCurrentSession(): LearningSession | null {
    return this.currentSession
  }

  // Get recent sessions for a student
  getRecentSessions(studentId: string, limit = 10): LearningSession[] {
    return this.getAllSessions()
      .filter((session) => session.studentId === studentId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit)
  }
}

export const learningHistoryManager = new LearningHistoryManager()
