import type { LLMConfig } from "@/types/llm"
import {
  EnhancedConversationalVoiceAgent,
  EnhancedVisionAgent,
  EnhancedTeachingAgent,
  EnhancedAssessmentAgent,
  EnhancedFeedbackAgent,
  EnhancedNaturalLanguageGenerationAgent,
  EnhancedContentAgent,
} from "./enhanced-agents"

interface ParallelTask {
  id: string
  agent: string
  task: string
  promise: Promise<any>
  startTime: number
  dependsOn?: string
}

interface ProblemAnalysisResult {
  analysis: {
    type: string
    difficulty: string
    concepts: string[]
    estimatedSteps: number
    solutionStrategy: string
    subject: string
  }
  steps: Array<{
    id: number
    description: string
    equation: string
    explanation: string
  }>
  initialGuidance: string
}

export class ParallelAgentManager {
  private activeTasks: Map<string, ParallelTask> = new Map()
  private agents: {
    cva: EnhancedConversationalVoiceAgent | null
    va: EnhancedVisionAgent | null
    ta: EnhancedTeachingAgent | null
    aa: EnhancedAssessmentAgent | null
    fa: EnhancedFeedbackAgent | null
    nlg: EnhancedNaturalLanguageGenerationAgent | null
    ca: EnhancedContentAgent | null
  }

  constructor(config: LLMConfig) {
    this.agents = {
      cva: new EnhancedConversationalVoiceAgent(config),
      va: new EnhancedVisionAgent(config),
      ta: new EnhancedTeachingAgent(config),
      aa: new EnhancedAssessmentAgent(config),
      fa: new EnhancedFeedbackAgent(config),
      nlg: new EnhancedNaturalLanguageGenerationAgent(config),
      ca: new EnhancedContentAgent(config),
    }
  }

  // Parallel problem analysis with real-time updates
  async analyzeProblemParallel(
    problemText: string,
    studentLevel: string,
    onProgress: (agent: string, status: string, progress: number) => void,
  ): Promise<ProblemAnalysisResult> {
    const taskId = `analysis_${Date.now()}`

    try {
      // Create tasks with proper concurrency control
      const tasks: Array<ParallelTask> = [
        {
          id: "analysis",
          agent: "CA",
          task: "Analyzing problem structure",
          promise: (async () => {
            // Make this request non-cancellable to prevent accidental cancellation
            const result = await this.agents.ca!.analyzeProblem(problemText, { cancellable: false });
            onProgress("CA", "Problem analysis complete", 50);
            return result;
          })(),
          startTime: Date.now(),
        },
        {
          id: "steps",
          agent: "CA",
          task: "Generating solution steps",
          dependsOn: "analysis",
          promise: (async () => {
            try {
              // Wait for analysis to complete if it's still running
              const analysisTask = this.activeTasks.get("analysis");
              if (analysisTask) {
                await analysisTask.promise;
              }
              // Make this request non-cancellable as well
              const result = await this.agents.ca!.generateSolutionSteps(
                problemText,
                studentLevel,
                { cancellable: false }
              );
              onProgress("CA", "Solution steps generated", 80);
              return result;
            } catch (error) {
              console.error("Error in solution steps generation:", error);
              throw error;
            }
          })(),
          startTime: Date.now(),
        },
        {
          id: "guidance",
          agent: "TA",
          task: "Preparing initial guidance",
          // Let this run in parallel with CA tasks
          promise: (async () => {
            try {
              // Make this request non-cancellable
              const result = await this.agents.ta!.generateInitialGuidance(
                problemText, 
                "Mathematics", 
                studentLevel,
                { cancellable: false }
              );
              onProgress("TA", "Guidance prepared", 100);
              return result;
            } catch (error) {
              console.error("Error in guidance generation:", error);
              throw error;
            }
          })(),
          startTime: Date.now(),
        },
      ]

      // Track progress for each task
      const results: any = {}
      const progressTracker = new Map<string, number>()

      // Process tasks with dependencies
      const taskPromises = tasks.map(async (task) => {
        // Skip if this task depends on another that hasn't completed
        if (task.dependsOn) {
          const dependency = this.activeTasks.get(task.dependsOn);
          if (dependency) {
            await dependency.promise.catch(() => {
              // If dependency fails, skip this task
              throw new Error(`Dependency ${task.dependsOn} failed`);
            });
          }
        }

        this.activeTasks.set(task.id, {
          ...task,
          startTime: Date.now(),
        });

        onProgress(task.agent, task.task, 0);
        progressTracker.set(task.id, 0);

        // Update progress less frequently to reduce UI updates
        const progressInterval = setInterval(() => {
          const currentProgress = progressTracker.get(task.id) || 0;
          if (currentProgress < 90) {
            // Slower progress updates for better UX
            const newProgress = Math.min(90, currentProgress + Math.random() * 10);
            progressTracker.set(task.id, newProgress);
            onProgress(task.agent, task.task, newProgress);
          }
        }, 500); // Reduced frequency of updates

        try {
          const result = await task.promise
          clearInterval(progressInterval)
          onProgress(task.agent, `${task.task} completed`, 100)
          results[task.id] = result
          this.activeTasks.delete(task.id)
          return result
        } catch (error) {
          clearInterval(progressInterval)
          onProgress(task.agent, `${task.task} failed`, 0)
          this.activeTasks.delete(task.id)
          throw error
        }
      })

      // Wait for all tasks to complete
      await Promise.all(taskPromises)

      return {
        analysis: results.analysis,
        steps: results.steps,
        initialGuidance: results.guidance,
      }
    } catch (error) {
      // Clean up any remaining tasks
      this.activeTasks.forEach((task, id) => {
        if (id.startsWith(taskId)) {
          this.activeTasks.delete(id)
        }
      })
      throw error
    }
  }

  // Parallel feedback generation
  async generateFeedbackParallel(
    studentAnswer: string,
    expectedStep: string,
    correctAnswer: string,
    studentLevel: string,
    attempts: number,
    onProgress: (agent: string, status: string) => void,
  ): Promise<{
    assessment: any
    feedback: string
    hint?: string
  }> {
    const tasks = []

    // Assessment task
    if (this.agents.aa) {
      tasks.push({
        id: "assessment",
        agent: "AA",
        promise: this.agents.aa.evaluateAnswer(studentAnswer, expectedStep, correctAnswer),
      })
    }

    // Feedback task
    if (this.agents.fa) {
      tasks.push({
        id: "feedback",
        agent: "FA",
        promise: this.agents.fa.generateFeedback(false, studentAnswer, attempts), // We'll update this based on assessment
      })
    }

    // Hint task (if needed)
    if (attempts > 1 && this.agents.nlg) {
      tasks.push({
        id: "hint",
        agent: "NLG",
        promise: this.agents.nlg.generateHint(expectedStep, studentLevel, attempts),
      })
    }

    const results: any = {}

    // Execute tasks in parallel
    await Promise.all(
      tasks.map(async (task) => {
        onProgress(task.agent, `Processing with ${task.agent}...`)
        try {
          results[task.id] = await task.promise
          onProgress(task.agent, `${task.agent} completed`)
        } catch (error) {
          onProgress(task.agent, `${task.agent} failed`)
          console.error(`${task.agent} error:`, error)
        }
      }),
    )

    // Generate correct feedback based on assessment
    if (results.assessment && this.agents.fa) {
      onProgress("FA", "Generating final feedback...")
      results.feedback = await this.agents.fa.generateFeedback(results.assessment.isCorrect, studentAnswer, attempts)
    }

    return {
      assessment: results.assessment,
      feedback: results.feedback,
      hint: results.hint,
    }
  }

  // Cancel all active tasks
  cancelAllTasks() {
    this.activeTasks.forEach((task) => {
      // Cancel the agent requests
      Object.values(this.agents).forEach((agent) => {
        if (agent) {
          agent.cancel()
        }
      })
    })
    this.activeTasks.clear()
  }

  // Get active task status
  getActiveTasksStatus() {
    return Array.from(this.activeTasks.values()).map((task) => ({
      id: task.id,
      agent: task.agent,
      task: task.task,
      duration: Date.now() - task.startTime,
    }))
  }
}
