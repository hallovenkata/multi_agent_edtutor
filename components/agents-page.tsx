"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Mic,
  Camera,
  Brain,
  Database,
  GraduationCap,
  CheckCircle,
  MessageSquare,
  Lightbulb,
  FileText,
  User,
} from "lucide-react"

interface Agent {
  id: string
  name: string
  fullName: string
  description: string
  capabilities: string[]
  status: "active" | "standby" | "processing"
  icon: React.ReactNode
  color: string
}

export function AgentsPage() {
  const agents: Agent[] = [
    {
      id: "cva",
      name: "CVA",
      fullName: "Conversational Voice Agent",
      description: "Handles speech-to-text and text-to-speech interactions for natural conversation flow.",
      capabilities: [
        "Speech Recognition (STT)",
        "Text-to-Speech (TTS)",
        "Voice Command Processing",
        "Audio Quality Management",
      ],
      status: "active",
      icon: <Mic className="h-6 w-6" />,
      color: "blue",
    },
    {
      id: "va",
      name: "VA",
      fullName: "Vision Agent",
      description: "Processes images and extracts mathematical problems using OCR technology.",
      capabilities: [
        "Image Processing",
        "Optical Character Recognition",
        "Math Problem Detection",
        "Image Quality Enhancement",
      ],
      status: "standby",
      icon: <Camera className="h-6 w-6" />,
      color: "green",
    },
    {
      id: "nlu",
      name: "NLU",
      fullName: "Natural Language Understanding",
      description: "Interprets user intent and extracts meaning from natural language input.",
      capabilities: ["Intent Recognition", "Entity Extraction", "Context Understanding", "Language Pattern Analysis"],
      status: "active",
      icon: <Brain className="h-6 w-6" />,
      color: "purple",
    },
    {
      id: "cma",
      name: "CMA",
      fullName: "Context Management Agent",
      description: "Maintains conversation context and manages session state across interactions.",
      capabilities: ["Session Management", "Context Preservation", "State Tracking", "Memory Management"],
      status: "active",
      icon: <Database className="h-6 w-6" />,
      color: "orange",
    },
    {
      id: "ta",
      name: "TA",
      fullName: "Teaching Agent",
      description: "Orchestrates the learning experience and guides students through problem-solving steps.",
      capabilities: [
        "Lesson Orchestration",
        "Step-by-Step Guidance",
        "Learning Path Management",
        "Educational Strategy",
      ],
      status: "processing",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "indigo",
    },
    {
      id: "aa",
      name: "AA",
      fullName: "Assessment Agent",
      description: "Evaluates student responses and determines correctness of mathematical solutions.",
      capabilities: ["Answer Evaluation", "Solution Verification", "Error Detection", "Performance Analysis"],
      status: "standby",
      icon: <CheckCircle className="h-6 w-6" />,
      color: "emerald",
    },
    {
      id: "fa",
      name: "FA",
      fullName: "Feedback Agent",
      description: "Provides constructive feedback and encouragement to support student learning.",
      capabilities: ["Positive Reinforcement", "Error Correction", "Motivational Messaging", "Progress Recognition"],
      status: "active",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "pink",
    },
    {
      id: "nlg",
      name: "NLG",
      fullName: "Natural Language Generation",
      description: "Generates human-like responses, explanations, and hints for student interactions.",
      capabilities: ["Response Generation", "Explanation Creation", "Hint Formulation", "Language Adaptation"],
      status: "active",
      icon: <Lightbulb className="h-6 w-6" />,
      color: "yellow",
    },
    {
      id: "ca",
      name: "CA",
      fullName: "Content Agent",
      description: "Manages mathematical content, solution steps, and educational resources.",
      capabilities: ["Content Storage", "Solution Step Management", "Resource Organization", "Knowledge Base Access"],
      status: "active",
      icon: <FileText className="h-6 w-6" />,
      color: "gray",
    },
    {
      id: "spa",
      name: "SPA",
      fullName: "Student Profile Agent",
      description: "Tracks student progress, preferences, and learning patterns for personalization.",
      capabilities: ["Profile Management", "Progress Tracking", "Learning Analytics", "Personalization"],
      status: "active",
      icon: <User className="h-6 w-6" />,
      color: "teal",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "processing":
        return "bg-blue-500"
      case "standby":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "processing":
        return "Processing"
      case "standby":
        return "Standby"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Multi-Agent System</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our Math Tutor AI is powered by 10 specialized agents working together to provide personalized, interactive
          learning experiences. Each agent has specific capabilities and responsibilities in the tutoring process.
        </p>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Real-time overview of all agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agents.filter((a) => a.status === "active").length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agents.filter((a) => a.status === "processing").length}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {agents.filter((a) => a.status === "standby").length}
              </div>
              <div className="text-sm text-gray-600">Standby</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{agents.length}</div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">98%</div>
              <div className="text-sm text-gray-600">System Health</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall System Performance</span>
              <span className="text-sm text-gray-600">98%</span>
            </div>
            <Progress value={98} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-2 h-full ${getStatusColor(agent.status)}`} />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${agent.color}-100 text-${agent.color}-600`}>{agent.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(agent.status)}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="font-medium">{agent.fullName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{agent.description}</p>

              <div>
                <h4 className="text-sm font-semibold mb-2">Key Capabilities:</h4>
                <ul className="space-y-1">
                  {agent.capabilities.map((capability, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full" />
                      {capability}
                    </li>
                  ))}
                </ul>
              </div>

              {agent.status === "processing" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Processing...</span>
                    <span className="text-xs text-gray-600">75%</span>
                  </div>
                  <Progress value={75} className="h-1" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Communication Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Communication Flow</CardTitle>
          <CardDescription>How agents work together during a typical tutoring session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <Badge variant="outline">CVA + VA</Badge>
              </div>
              <p className="text-sm">Student uploads image or speaks problem → Voice/Vision processing</p>
            </div>

            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <Badge variant="outline">NLU + CA</Badge>
              </div>
              <p className="text-sm">Problem interpretation → Content analysis and solution planning</p>
            </div>

            <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <Badge variant="outline">TA + CMA</Badge>
              </div>
              <p className="text-sm">Teaching orchestration → Context management and step guidance</p>
            </div>

            <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">4</span>
                </div>
                <Badge variant="outline">AA + FA</Badge>
              </div>
              <p className="text-sm">Answer assessment → Feedback generation and delivery</p>
            </div>

            <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">5</span>
                </div>
                <Badge variant="outline">NLG + SPA</Badge>
              </div>
              <p className="text-sm">Response generation → Profile updates and personalization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
