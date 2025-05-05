"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, ArrowLeft, Maximize2, Minimize2, BookOpen, HelpCircle, BrainCircuit, Sparkles } from 'lucide-react'
import { Button } from "./ui/Button"
import { useToast } from "./ui/use-toast"
import { SessionTimer } from "./SessionTimer"
import { DocumentViewer } from "./DocumentViewer"
import { SessionProgress } from "./SessionProgress"
import { Card, CardContent } from "./ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs"
import { Input } from "./ui/Input"

// Sample session data (in a real app, this would come from a database)
const SESSION_DATA = {
  id: "session-123",
  title: "Integration Techniques",
  subject: "Calculus II",
  duration: 60, // minutes
  document: {
    id: "doc-456",
    title: "Integration Techniques",
    type: "pdf",
    totalPages: 24,
    currentPage: 1,
  },
  progress: 0,
  startTime: null,
  endTime: null,
}

export function StudySessionPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [session, setSession] = useState(SESSION_DATA)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTime, setActiveTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentPage, setCurrentPage] = useState(session.document.currentPage)
  const [highlights, setHighlights] = useState([])
  const [notes, setNotes] = useState("")
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your AI study assistant for ${session.subject}. How can I help you with ${session.document.title}?`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [summary, setSummary] = useState("")
  const [quiz, setQuiz] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Start the session when the component mounts
  useEffect(() => {
    startSession()
    // Clean up when component unmounts
    return () => {
      if (isTimerRunning) {
        pauseSession()
      }
    }
  }, [])

  // Update progress based on active time
  useEffect(() => {
    if (session.duration > 0) {
      const newProgress = Math.min(100, Math.round((activeTime / (session.duration * 60)) * 100))
      setSession((prev) => ({ ...prev, progress: newProgress }))

      if (newProgress >= 100 && !isSessionComplete) {
        completeSession()
      }
    }
  }, [activeTime, session.duration])

  const startSession = () => {
    setIsTimerRunning(true)
    setSession((prev) => ({
      ...prev,
      startTime: prev.startTime || new Date().toISOString(),
    }))

    toast({
      title: "Session Started",
      description: `Your ${session.subject} study session has begun.`,
    })
  }

  const pauseSession = () => {
    setIsTimerRunning(false)
    toast({
      title: "Session Paused",
      description: "Your study session has been paused.",
    })
  }

  const resumeSession = () => {
    setIsTimerRunning(true)
    toast({
      title: "Session Resumed",
      description: "Your study session has been resumed.",
    })
  }

  const completeSession = () => {
    setIsTimerRunning(false)
    setIsSessionComplete(true)
    setSession((prev) => ({
      ...prev,
      endTime: new Date().toISOString(),
      progress: 100,
    }))

    toast({
      title: "Session Complete!",
      description: "Congratulations! You've completed your study session.",
    })
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    setSession((prev) => ({
      ...prev,
      document: {
        ...prev.document,
        currentPage: newPage,
      },
    }))
  }

  const handleAddHighlight = (highlight) => {
    setHighlights((prev) => [...prev, highlight])
    toast({
      title: "Highlight Added",
      description: "Your highlight has been saved.",
    })
  }

  const handleNotesChange = (newNotes) => {
    setNotes(newNotes)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
          title: "Fullscreen Error",
          description: `Error attempting to enable fullscreen: ${err.message}`,
        })
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleSendMessage = (e) => {
    if (e) e.preventDefault()

    if (!inputValue.trim()) return

    // Add user message
    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        role: "assistant",
        content: generateAIResponse(inputValue),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  const generateAIResponse = (query) => {
    // This is a simple simulation - in a real app, this would call an AI API
    const responses = [
      `That's a great question about ${session.subject}! The concept you're asking about relates to the fundamental principles covered in this chapter.`,
      `In ${session.document.title}, this is explained through the application of key formulas and techniques. Try looking at the examples on page ${currentPage + 1}.`,
      `This is a common question in ${session.subject}. The answer involves understanding how different concepts connect together.`,
      `Based on what you're studying in ${session.document.title}, I'd recommend focusing on the relationship between the variables and how they interact.`,
      `That's an interesting point! In ${session.subject}, we often approach these problems by breaking them down into smaller steps.`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleGenerateSummary = () => {
    setIsGenerating(true)

    // Simulate API call delay
    setTimeout(() => {
      setSummary(`
        # Summary of ${session.document.title} - Page ${currentPage}

        ## Key Concepts
        
        **Integration by Parts** is a technique derived from the product rule of differentiation. It's expressed as:
        
        ∫u(x)v'(x)dx = u(x)v(x) - ∫u'(x)v(x)dx
        
        This method is particularly useful when:
        
        1. One function becomes simpler when differentiated
        2. The other function doesn't become too complex when integrated
        
        ## Example Application
        
        The example ∫x·e^x dx demonstrates how to apply this technique:
        
        - Let u = x and dv = e^x dx
        - Then du = dx and v = e^x
        - Apply the formula: ∫x·e^x dx = x·e^x - ∫e^x dx
        - Simplify to get: e^x(x - 1) + C
        
        ## Why This Matters
        
        This technique is foundational for solving more complex integration problems and has applications in physics, engineering, and other fields where calculating areas and accumulations is necessary.
      `)

      setIsGenerating(false)
      setActiveTab("summary")

      toast({
        title: "Summary Generated",
        description: "AI has summarized the current page content.",
      })
    }, 2000)
  }

  const handleGenerateQuiz = () => {
    setIsGenerating(true)

    // Simulate API call delay
    setTimeout(() => {
      setQuiz([
        {
          question: "What is the formula for integration by parts?",
          options: [
            "∫u(x)v'(x)dx = u(x)v(x) - ∫u'(x)v(x)dx",
            "∫u(x)v'(x)dx = u(x)v(x) + ∫u'(x)v(x)dx",
            "∫u(x)v'(x)dx = u'(x)v(x) - ∫u(x)v'(x)dx",
            "∫u(x)v'(x)dx = u'(x)v'(x) - ∫u(x)v(x)dx",
          ],
          answer: 0,
        },
        {
          question: "When evaluating ∫x·e^x dx using integration by parts, what should u and dv be?",
          options: ["u = e^x, dv = x dx", "u = x, dv = e^x dx", "u = x·e^x, dv = dx", "u = dx, dv = x·e^x"],
          answer: 1,
        },
        {
          question: "What is the final result of ∫x·e^x dx?",
          options: ["e^x(x + 1) + C", "e^x(x - 1) + C", "x·e^x + C", "x·e^x - e^x + C"],
          answer: 1,
        },
      ])

      setIsGenerating(false)
      setActiveTab("quiz")

      toast({
        title: "Quiz Generated",
        description: "AI has created a quiz based on the current content.",
      })
    }, 2000)
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">StudyVerse</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="flex gap-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button variant="outline" size="sm" className="flex gap-2" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span>Fullscreen</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
        {/* Left Panel - Session Info & Timer */}
        <div className="col-span-12 md:col-span-2 space-y-4">
          <div className="bg-background rounded-lg shadow p-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4">{session.title}</h2>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Subject</p>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{session.subject}</span>
              </div>
            </div>

            <SessionTimer
              duration={session.duration}
              isRunning={isTimerRunning}
              activeTime={activeTime}
              setActiveTime={setActiveTime}
              onStart={startSession}
              onPause={pauseSession}
              onResume={resumeSession}
              onComplete={completeSession}
            />

            <div className="mt-auto">
              <SessionProgress
                progress={session.progress}
                currentPage={currentPage}
                totalPages={session.document.totalPages}
              />
            </div>
          </div>
        </div>

        {/* Center Panel - Document Viewer */}
        <div className="col-span-12 md:col-span-7 bg-background rounded-lg shadow">
          <DocumentViewer
            document={session.document}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            highlights={highlights}
            onAddHighlight={handleAddHighlight}
            notes={notes}
            onNotesChange={handleNotesChange}
          />
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="col-span-12 md:col-span-3 bg-background rounded-lg shadow">
          <div className="h-full flex flex-col">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                AI Study Assistant
              </h2>
            </div>

            <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col p-4">
                <div className="flex-1 overflow-auto mb-4 space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-primary text-white" : "bg-muted text-foreground dark:bg-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Ask a question about the material..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" variant="default">
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="summary" className="flex-1 p-4 overflow-auto">
                {summary ? (
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, "<br />") }} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Generate Summary</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Get an AI-generated summary of the current page content
                    </p>
                    <Button
                      variant="default"
                      onClick={handleGenerateSummary}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        "Generating..."
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Summarize Content
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quiz" className="flex-1 p-4 overflow-auto">
                {quiz.length > 0 ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Quiz: {session.document.title}</h3>
                    <p className="text-sm text-muted-foreground">Test your understanding of the material with these questions:</p>

                    {quiz.map((question, qIndex) => (
                      <Card key={qIndex} className="mt-4">
                        <CardContent className="p-4">
                          <p className="font-medium mb-3">
                            {qIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  id={`q${qIndex}-o${oIndex}`} 
                                  name={`question-${qIndex}`}
                                  className="text-primary focus:ring-primary"
                                />
                                <label htmlFor={`q${qIndex}-o${oIndex}`} className="text-sm text-foreground">
                                  {option}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex justify-end mt-4">
                      <Button variant="default">Check Answers</Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Generate Quiz</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">Test your knowledge with an AI-generated quiz</p>
                    <Button
                      variant="default"
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        "Generating..."
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Quiz
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleGenerateSummary}
                  disabled={isGenerating}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Summarize
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Quiz Me
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 