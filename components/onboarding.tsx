"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, GraduationCap, Atom, Calculator, Cpu, Wrench } from "lucide-react"

interface OnboardingProps {
  onComplete: (userData: {
    name: string
    location: string
    gradeLevel: string
    stemLevel: string
    preferredSubjects: string[]
  }) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    gradeLevel: "",
    stemLevel: "",
    preferredSubjects: [] as string[],
  })

  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to STEM Tutor AI!",
      description: "Your AI-powered assistant for Science, Technology, Engineering, and Mathematics.",
      icon: <GraduationCap className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Tell us about yourself",
      description: "This helps us customize your STEM learning experience.",
      icon: <User className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Your STEM Preferences",
      description: "Let us know your interests and comfort level.",
      icon: <Atom className="h-8 w-8 text-purple-500" />,
    },
  ]

  const stemSubjects = [
    { id: "mathematics", label: "Mathematics", icon: <Calculator className="h-4 w-4" /> },
    { id: "physics", label: "Physics", icon: <Atom className="h-4 w-4" /> },
    { id: "chemistry", label: "Chemistry", icon: <Atom className="h-4 w-4" /> },
    { id: "biology", label: "Biology", icon: <Atom className="h-4 w-4" /> },
    { id: "engineering", label: "Engineering", icon: <Wrench className="h-4 w-4" /> },
    { id: "computer-science", label: "Computer Science", icon: <Cpu className="h-4 w-4" /> },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(formData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleSubject = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.includes(subjectId)
        ? prev.preferredSubjects.filter((id) => id !== subjectId)
        : [...prev.preferredSubjects, subjectId],
    }))
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return true
      case 1:
        return formData.name.trim() !== "" && formData.location.trim() !== ""
      case 2:
        return formData.gradeLevel !== "" && formData.stemLevel !== "" && formData.preferredSubjects.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{steps[currentStep].icon}</div>
          <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 0 && (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                I'm your AI-powered STEM tutor, equipped with multiple specialized agents to help you learn step by step
                across all STEM subjects.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What I can help you with:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div className="flex items-center gap-1">
                    <Calculator className="h-3 w-3" />
                    <span>Mathematics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Atom className="h-3 w-3" />
                    <span>Physics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Atom className="h-3 w-3" />
                    <span>Chemistry</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" />
                    <span>Engineering</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    <span>Technology</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Atom className="h-3 w-3" />
                    <span>Biology</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-700">
                  • Step-by-step problem solving • Voice and image input • Personalized hints and feedback
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  placeholder="Enter your first name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Where are you located?</Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade">What grade are you in?</Label>
                <Select
                  value={formData.gradeLevel}
                  onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary (K-5)</SelectItem>
                    <SelectItem value="middle">Middle School (6-8)</SelectItem>
                    <SelectItem value="high">High School (9-12)</SelectItem>
                    <SelectItem value="college">College/University</SelectItem>
                    <SelectItem value="adult">Adult Learner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stem-level">How comfortable are you with STEM subjects?</Label>
                <Select
                  value={formData.stemLevel}
                  onValueChange={(value) => setFormData({ ...formData, stemLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your STEM comfort level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner - Need lots of help</SelectItem>
                    <SelectItem value="intermediate">Intermediate - Some concepts are tricky</SelectItem>
                    <SelectItem value="advanced">Advanced - Just need occasional help</SelectItem>
                    <SelectItem value="expert">Expert - Help with complex problems</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Which STEM subjects interest you most? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {stemSubjects.map((subject) => (
                    <Button
                      key={subject.id}
                      variant={formData.preferredSubjects.includes(subject.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSubject(subject.id)}
                      className="justify-start"
                    >
                      {subject.icon}
                      <span className="ml-1 text-xs">{subject.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={!isStepValid()}>
              {currentStep === steps.length - 1 ? "Get Started!" : "Next"}
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${index <= currentStep ? "bg-blue-500" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
