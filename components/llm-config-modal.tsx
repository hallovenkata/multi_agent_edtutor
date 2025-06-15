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
import { Settings, Plus, Trash2, TestTube, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react"
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
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})

  const [formData, setFormData] = useState<Partial<LLMConfig>>({
    name: "",
    provider: "openai",
    apiKey: "",
    modelId: "",
    temperature: 0.7,
    maxTokens: 1000,
  })

  const providerModels = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    groq: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    ollama: ["llama3.1", "llama3.1:8b", "llama3.1:70b", "mistral", "codellama"],
    custom: ["deepseek-ai/DeepSeek-R1-Distill-Llama-70B", "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"],
  }

  const defaultBaseUrls = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    groq: "https://api.groq.com/openai/v1",
    ollama: "http://localhost:11434/v1",
    custom: "https://api.gmi-serving.com/v1",
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
  }, [editingConfig])

  const handleSave = () => {
    if (!formData.name || !formData.apiKey || !formData.modelId) return

    const newConfig: LLMConfig = {
      id: editingConfig?.id || `config_${Date.now()}`,
      name: formData.name,
      provider: formData.provider!,
      apiKey: formData.apiKey,
      modelId: formData.modelId,
      baseUrl: formData.baseUrl || defaultBaseUrls[formData.provider!],
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
    try {
      const success = await llmService.testConnection(config)
      setTestResults((prev) => ({ ...prev, [config.id]: success }))
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [config.id]: false }))
    } finally {
      setTestingConfig(null)
    }
  }

  const toggleApiKeyVisibility = (configId: string) => {
    setShowApiKey((prev) => ({ ...prev, [configId]: !prev[configId] }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          LLM Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLM Configuration</DialogTitle>
          <DialogDescription>Configure your Language Learning Models for the multi-agent system</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configs">Configurations</TabsTrigger>
            <TabsTrigger value="add-edit">{editingConfig ? "Edit Configuration" : "Add Configuration"}</TabsTrigger>
          </TabsList>

          <TabsContent value="configs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Saved Configurations</h3>
              <Button onClick={() => setEditingConfig(null)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>

            {configs.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No LLM configurations found. Add your first configuration to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {configs.map((config) => (
                  <Card key={config.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{config.name}</CardTitle>
                          {config.isDefault && <Badge variant="default">Default</Badge>}
                          <Badge variant="outline">{config.provider}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {testResults[config.id] !== undefined &&
                            (testResults[config.id] ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(config)}
                            disabled={testingConfig === config.id}
                          >
                            <TestTube className="h-4 w-4" />
                            {testingConfig === config.id ? "Testing..." : "Test"}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingConfig(config)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(config.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-500">Model</Label>
                          <p>{config.modelId}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Base URL</Label>
                          <p className="truncate">{config.baseUrl}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">API Key</Label>
                          <div className="flex items-center gap-2">
                            <p className="font-mono">{showApiKey[config.id] ? config.apiKey : "••••••••••••••••"}</p>
                            <Button variant="ghost" size="sm" onClick={() => toggleApiKeyVisibility(config.id)}>
                              {showApiKey[config.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Temperature</Label>
                          <p>{config.temperature}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Switch checked={config.isDefault} onCheckedChange={() => handleSetDefault(config)} />
                        <Label className="text-sm">Use as default configuration</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add-edit" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    placeholder="My OpenAI Config"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        provider: value as LLMConfig["provider"],
                        baseUrl: defaultBaseUrls[value as keyof typeof defaultBaseUrls],
                        modelId: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="ollama">Ollama (Local)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.openai.com/v1"
                  value={formData.baseUrl || ""}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={formData.apiKey || ""}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelId">Model ID</Label>
                {formData.provider && providerModels[formData.provider].length > 0 ? (
                  <Select
                    value={formData.modelId}
                    onValueChange={(value) => setFormData({ ...formData, modelId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerModels[formData.provider].map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="modelId"
                    placeholder="gpt-4o"
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={formData.maxTokens || 1000}
                    onChange={(e) => setFormData({ ...formData, maxTokens: Number.parseInt(e.target.value) })}
                  />
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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
