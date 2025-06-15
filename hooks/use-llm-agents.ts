"use client"

import { useState, useCallback, useEffect } from "react"
import type { LLMConfig } from "@/types/llm"
import {
  ConversationalVoiceAgent,
  VisionAgent,
  NaturalLanguageUnderstandingAgent,
  TeachingAgent,
  AssessmentAgent,
  FeedbackAgent,
  NaturalLanguageGenerationAgent,
  ContentAgent,
  StudentProfileAgent,
} from "@/services/agents"

export function useLLMAgents() {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [defaultConfig, setDefaultConfig] = useState<LLMConfig | null>(null)
  const [agents, setAgents] = useState<{
    cva: ConversationalVoiceAgent | null
    va: VisionAgent | null
    nlu: NaturalLanguageUnderstandingAgent | null
    ta: TeachingAgent | null
    aa: AssessmentAgent | null
    fa: FeedbackAgent | null
    nlg: NaturalLanguageGenerationAgent | null
    ca: ContentAgent | null
    spa: StudentProfileAgent | null
  }>({
    cva: null,
    va: null,
    nlu: null,
    ta: null,
    aa: null,
    fa: null,
    nlg: null,
    ca: null,
    spa: null,
  })

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
        cva: new ConversationalVoiceAgent(defaultConfig),
        va: new VisionAgent(defaultConfig),
        nlu: new NaturalLanguageUnderstandingAgent(defaultConfig),
        ta: new TeachingAgent(defaultConfig),
        aa: new AssessmentAgent(defaultConfig),
        fa: new FeedbackAgent(defaultConfig),
        nlg: new NaturalLanguageGenerationAgent(defaultConfig),
        ca: new ContentAgent(defaultConfig),
        spa: new StudentProfileAgent(defaultConfig),
      })
    }
  }, [defaultConfig])

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

  const isConfigured = defaultConfig !== null

  return {
    configs,
    defaultConfig,
    agents,
    isConfigured,
    saveConfigs,
    setDefaultConfig: setDefaultConfigAndSave,
  }
}
