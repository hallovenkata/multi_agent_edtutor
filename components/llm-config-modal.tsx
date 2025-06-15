"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Plus,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import type { LLMConfig } from "@/types/llm"
import { llmService } from "@/services/llm-service"

interface LLMConfigModalProps {
  configs: LLMConfig[]
  onConfigsChange: (configs: LLMConfig[]) => void
  onDefaultConfigChange: (config: LLMConfig | null) => void
}

export function LLMConfigModal({ configs, onConfigsChange, onDefaultConfigChange }: LLMConfigModalProps) {
  const [open, setOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null)
  const [testingConfig, setTestingConfig] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string; timestamp: Date }>
  >({})
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [saveError, setSaveError] = useState<string>("")
  const [importExportData, setImportExportData] = useState("")

  const [formData, setFormData] = useState<Partial<LLMConfig>>({
    name: "",
    provider: "openai",
    apiKey: "",
    modelId: "",
    temperature: 0.7,
    maxTokens: 1000,
  })

  const providerInfo = {
    openai: {
      name: "OpenAI",
      description: "GPT models from OpenAI",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
      defaultUrl: "https://api.openai.com/v1",
      keyFormat: "sk-...",
      keyHelp: "Get your API key from https://platform.openai.com/api-keys",
    },
    gemini: {
      name: "Google Gemini",
      description: "Gemini models from Google AI",
      models: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
      defaultUrl: "https://generativelanguage.googleapis.com/v1beta",
      keyFormat: "AIza...",
      keyHelp: "Get your API key from https://aistudio.google.com/app/apikey",
    },
    anthropic: {
      name: "Anthropic",
      description: "Claude models from Anthropic",
      models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
      defaultUrl: "https://api.anthropic.com",
      keyFormat: "sk-ant-...",
      keyHelp: "Get your API key from https://console.anthropic.com/",
    },
    groq: {
      name: "Groq",
      description: "Fast inference with Groq",
      models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
      defaultUrl: "https://api.groq.com/openai/v1",
      keyFormat: "gsk_...",
      keyHelp: "Get your API key from https://console.groq.com/keys",
    },
    ollama: {
      name: "Ollama",
      description: "Local models with Ollama",
      models: ["llama3.1", "llama3.1:8b", "llama3.1:70b", "mistral", "codellama"],
      defaultUrl: "http://localhost:11434/v1",
      keyFormat: "Not required",
      keyHelp: "Install Ollama locally and pull models",
    },
    custom: {
      name: "Custom",
      description: "Custom OpenAI-compatible API",
      models: ["deepseek-ai/DeepSeek-R1-Distill-Llama-70B", "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"],
      defaultUrl: "https://api.gmi-serving.com/v1",
      keyFormat: "Custom format",
      keyHelp: "Check your provider's documentation",
    },
  }

  useEffect(() => {
    if (editingConfig) {
      setFormData(editingConfig)
    } else {
      setFormData({
        name: "",
        provider: "openai",
        apiKey: "",
        modelId: "",
        baseUrl: "",
        temperature: 0.7,
        maxTokens: 1000,
      })
    }
    setSaveError("")
  }, [editingConfig])

  const validateForm = (): string => {
    if (!formData.name?.trim()) return "Configuration name is required"
    if (!formData.provider) return "Provider is required"
    if (!formData.apiKey?.trim() && formData.provider !== "ollama") return "API key is required"
    if (!formData.modelId?.trim()) return "Model ID is required"

    // Check for duplicate names
    const existingConfig = configs.find(
      (c) => c.name.toLowerCase() === formData.name?.toLowerCase() && c.id !== editingConfig?.id,
    )
    if (existingConfig) return "Configuration name already exists"

    return ""
  }

  const handleSave = () => {
    const error = validateForm()
    if (error) {
      setSaveError(error)
      return
    }

    try {
      const newConfig: LLMConfig = {
        id: editingConfig?.id || `config_${Date.now()}`,
        name: formData.name!.trim(),
        provider: formData.provider!,
        apiKey: formData.apiKey!.trim(),
        modelId: formData.modelId!.trim(),
        baseUrl: formData.baseUrl?.trim() || providerInfo[formData.provider!].defaultUrl,
        temperature: formData.temperature || 0.7,
        maxTokens: formData.maxTokens || 1000,
        isDefault: editingConfig?.isDefault || false,
      }

      if (editingConfig) {
        const updatedConfigs = configs.map((c) => (c.id === editingConfig.id ? newConfig : c))
        onConfigsChange(updatedConfigs)
      } else {
        onConfigsChange([...configs, newConfig])
      }

      setEditingConfig(null)
      setFormData({})
      setSaveError("")
    } catch (error) {
      setSaveError("Failed to save configuration. Please try again.")
    }
  }

  const handleDelete = (configId: string) => {
    const updatedConfigs = configs.filter((c) => c.id !== configId)
    onConfigsChange(updatedConfigs)

    // If deleted config was default, clear default
    const deletedConfig = configs.find((c) => c.id === configId)
    if (deletedConfig?.isDefault) {
      onDefaultConfigChange(null)
    }
  }

  const handleSetDefault = (config: LLMConfig) => {
    const updatedConfigs = configs.map((c) => ({
      ...c,
      isDefault: c.id === config.id,
    }))
    onConfigsChange(updatedConfigs)
    onDefaultConfigChange(config)
  }

  const handleTestConnection = async (config: LLMConfig) => {
    setTestingConfig(config.id)
    const startTime = Date.now()

    try {
      const success = await llmService.testConnection(config)
      const duration = Date.now() - startTime

      setTestResults((prev) => ({
        ...prev,
        [config.id]: {
          success,
          message: success ? `Connected successfully (${duration}ms)` : "Connection failed",
          timestamp: new Date(),
        },
      }))
    } catch (error) {
      const duration = Date.now() - startTime
      setTestResults((prev) => ({
        ...prev,
        [config.id]: {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"} (${duration}ms)`,
          timestamp: new Date(),
        },
      }))
    } finally {
      setTestingConfig(null)
    }
  }

  const toggleApiKeyVisibility = (configId: string) => {
    setShowApiKey((prev) => ({ ...prev, [configId]: !prev[configId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportConfigs = () => {
    const exportData = {
      configs: configs.map((c) => ({ ...c, apiKey: "***REDACTED***" })),
      exportDate: new Date().toISOString(),
      version: "1.0",
    }
    setImportExportData(JSON.stringify(exportData, null, 2))
  }

  const importConfigs = () => {
    try {
      const data = JSON.parse(importExportData)
      if (data.configs && Array.isArray(data.configs)) {
        const importedConfigs = data.configs.map((c: any) => ({
          ...c,
          id: `imported_${Date.now()}_${Math.random()}`,
          isDefault: false,
          apiKey: "", // User needs to re-enter API keys
        }))
        onConfigsChange([...configs, ...importedConfigs])
        setImportExportData("")
      }
    } catch (error) {
      setSaveError("Invalid import data format")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          LLM Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM Configuration Manager</DialogTitle>
          <DialogDescription>
            Configure and manage your Language Learning Models for the multi-agent STEM tutor system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configs">Configurations ({configs.length})</TabsTrigger>
            <TabsTrigger value="add-edit">{editingConfig ? "Edit Configuration" : "Add Configuration"}</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>

          <TabsContent value="configs" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Saved Configurations</h3>
                <p className="text-sm text-gray-600">Manage your LLM providers and test connections</p>
              </div>
              <Button onClick={() => setEditingConfig(null)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>

            {configs.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No LLM configurations found. Add your first configuration to enable the STEM tutor functionality.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {configs.map((config) => {
                  const testResult = testResults[config.id]
                  const providerData = providerInfo[config.provider]

                  return (
                    <Card key={config.id} className={config.isDefault ? "border-blue-200 bg-blue-50" : ""}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {config.name}
                                {config.isDefault && <Badge variant="default">Default</Badge>}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{providerData.name}</Badge>
                                <span className="text-xs text-gray-500">{config.modelId}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {testResult && (
                              <div className="flex items-center gap-1">
                                {testResult.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-xs text-gray-500">
                                  {testResult.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(config)}
                              disabled={testingConfig === config.id}
                            >
                              {testingConfig === config.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              {testingConfig === config.id ? "Testing..." : "Test"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingConfig(config)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(config.id)}
                              disabled={config.isDefault}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <Label className="text-xs text-gray-500">Base URL</Label>
                            <p className="truncate font-mono text-xs">{config.baseUrl}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">API Key</Label>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs">
                                {showApiKey[config.id] ? config.apiKey : "••••••••••••••••"}
                              </p>
                              <Button variant="ghost" size="sm" onClick={() => toggleApiKeyVisibility(config.id)}>
                                {showApiKey[config.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(config.apiKey)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Settings</Label>
                            <p className="text-xs">
                              Temp: {config.temperature}, Tokens: {config.maxTokens}
                            </p>
                          </div>
                        </div>

                        {testResult && (
                          <Alert
                            className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}
                          >
                            <AlertDescription className="text-sm">{testResult.message}</AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={config.isDefault}
                              onCheckedChange={() => handleSetDefault(config)}
                              disabled={config.isDefault}
                            />
                            <Label className="text-sm">Use as default configuration</Label>
                          </div>
                          <span className="text-xs text-gray-500">{providerData.description}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add-edit" className="space-y-6">
            {saveError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name *</Label>
                  <Input
                    id="name"
                    placeholder="My OpenAI Config"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => {
                      const provider = value as keyof typeof providerInfo
                      setFormData({
                        ...formData,
                        provider: value as LLMConfig["provider"],
                        baseUrl: providerInfo[provider].defaultUrl,
                        modelId: "",
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(providerInfo).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span>{info.name}</span>
                            <span className="text-xs text-gray-500">{info.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.provider && (
                <Alert>
                  <AlertDescription>
                    <strong>{providerInfo[formData.provider].name}:</strong> {providerInfo[formData.provider].keyHelp}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder={formData.provider ? providerInfo[formData.provider].defaultUrl : ""}
                  value={formData.baseUrl || ""}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key {formData.provider !== "ollama" && "*"}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={formData.provider ? providerInfo[formData.provider].keyFormat : ""}
                  value={formData.apiKey || ""}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  disabled={formData.provider === "ollama"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelId">Model ID *</Label>
                {formData.provider && providerInfo[formData.provider].models.length > 0 ? (
                  <Select
                    value={formData.modelId}
                    onValueChange={(value) => setFormData({ ...formData, modelId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerInfo[formData.provider].models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="modelId"
                    placeholder="Enter model ID"
                    value={formData.modelId || ""}
                    onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature || 0.7}
                    onChange={(e) => setFormData({ ...formData, temperature: Number.parseFloat(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500">0 = deterministic, 2 = very creative</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="8000"
                    value={formData.maxTokens || 1000}
                    onChange={(e) => setFormData({ ...formData, maxTokens: Number.parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-gray-500">Maximum response length</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingConfig(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>{editingConfig ? "Update" : "Save"} Configuration</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import-export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Export Configurations</h3>
                <p className="text-sm text-gray-600">
                  Export your configurations for backup or sharing (API keys will be redacted)
                </p>
                <Button onClick={exportConfigs} className="mt-2">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configurations
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Import/Export Data</h3>
                <Textarea
                  placeholder="Paste configuration data here..."
                  value={importExportData}
                  onChange={(e) => setImportExportData(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
                <div className="flex gap-2 mt-2">
                  <Button onClick={importConfigs} disabled={!importExportData.trim()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Configurations
                  </Button>
                  <Button variant="outline" onClick={() => setImportExportData("")}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
