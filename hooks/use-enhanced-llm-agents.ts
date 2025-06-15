"use client"

import { useState, useCallback, useEffect } from "react"
import type { LLMConfig } from "@/types/llm"
import {
  EnhancedConversationalVoiceAgent,
  EnhancedVisionAgent,
  EnhancedTeachingAgent,
  EnhancedAssessmentAgent,
  EnhancedFeedbackAgent,
  EnhancedNaturalLanguageGenerationAgent,
  EnhancedContentAgent,
} from "@/services/enhanced-agents"
import { requestManager } from "@/services/request-manager"
import { voiceController } from "@/services/voice-controller"

export function useEnhancedLLMAgents() {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [defaultConfig, setDefaultConfig] = useState<LLMConfig | null>(null)
  const [agents, setAgents] = useState<{
    cva: EnhancedConversationalVoiceAgent | null
    va: EnhancedVisionAgent | null
    ta: EnhancedTeachingAgent | null
    aa: EnhancedAssessmentAgent | null
    fa: EnhancedFeedbackAgent | null
    nlg: EnhancedNaturalLanguageGenerationAgent | null
    ca: EnhancedContentAgent | null
  }>({
    cva: null,
    va: null,
    ta: null,
    aa: null,
    fa: null,
    nlg: null,
    ca: null,
  })

  const [queueStatus, setQueueStatus] = useState(requestManager.getQueueStatus())
  const [voiceStatus, setVoiceStatus] = useState(voiceController.getStatus())

  // Load configs from localStorage
  useEffect(() => {
    const savedConfigs = localStorage.getItem("llm-configs")
    if (savedConfigs) {
      const parsedConfigs = JSON.parse(savedConfigs)
      setConfigs(parsedConfigs)

      const defaultConf = parsedConfigs.find((c: LLMConfig) => c.isDefault)
      if (defaultConf) {
        setDefaultConfig(defaultConf)
      }
    }
  }, [])

  // Initialize agents when default config changes
  useEffect(() => {
    if (defaultConfig) {
      setAgents({
        cva: new EnhancedConversationalVoiceAgent(defaultConfig),
        va: new EnhancedVisionAgent(defaultConfig),
        ta: new EnhancedTeachingAgent(defaultConfig),
        aa: new EnhancedAssessmentAgent(defaultConfig),
        fa: new EnhancedFeedbackAgent(defaultConfig),
        nlg: new EnhancedNaturalLanguageGenerationAgent(defaultConfig),
        ca: new EnhancedContentAgent(defaultConfig),
      })
    }
  }, [defaultConfig])

  // Update queue status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueStatus(requestManager.getQueueStatus())
      setVoiceStatus(voiceController.getStatus())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const saveConfigs = useCallback((newConfigs: LLMConfig[]) => {
    setConfigs(newConfigs)
    localStorage.setItem("llm-configs", JSON.stringify(newConfigs))
  }, [])

  const setDefaultConfigAndSave = useCallback(
    (config: LLMConfig | null) => {
      setDefaultConfig(config)
      if (config) {
        const updatedConfigs = configs.map((c) => ({
          ...c,
          isDefault: c.id === config.id,
        }))
        saveConfigs(updatedConfigs)
      }
    },
    [configs, saveConfigs],
  )

  // Voice control functions
  const setVoiceEnabled = useCallback((enabled: boolean) => {
    voiceController.setEnabled(enabled)
  }, [])

  const setVoicePaused = useCallback((paused: boolean) => {
    voiceController.setPaused(paused)
  }, [])

  const speak = useCallback((message: string, priority: "high" | "normal" = "normal") => {
    voiceController.speak(message, priority)
  }, [])

  const stopVoice = useCallback(() => {
    voiceController.stop()
  }, [])

  // Agent control functions
  const cancelAgent = useCallback((agentName: string) => {
    requestManager.cancelAgentRequests(agentName)
  }, [])

  const emergencyStop = useCallback(() => {
    requestManager.emergencyStop()
    voiceController.stop()
  }, [])

  const isConfigured = defaultConfig !== null

  return {
    configs,
    defaultConfig,
    agents,
    isConfigured,
    queueStatus,
    voiceStatus,
    saveConfigs,
    setDefaultConfig: setDefaultConfigAndSave,
    setVoiceEnabled,
    setVoicePaused,
    speak,
    stopVoice,
    cancelAgent,
    emergencyStop,
  }
}
