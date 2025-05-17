"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, ArrowLeft, Maximize2, Minimize2, BookOpen, HelpCircle, BrainCircuit, Sparkles, Clock } from 'lucide-react'
import { Button } from "./ui/Button"
import { useToast } from "./ui/use-toast"
import { SessionTimer } from "./SessionTimer"
import { DocumentViewer } from "./DocumentViewer"
import { SessionProgress } from "./SessionProgress"
import { Card, CardContent } from "./ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs"
import { Input } from "./ui/Input"
import axios from "axios"

// Sample session data (in a real app, this would come from a database)
const SESSION_DATA = {
  id: "session-123",
  title: "Integration Techniques",
  subject: "Calculus II",
  duration: 60, // minutes
  document: {
    id: "doc-456",
    title: "Loading document...",
    type: "pdf",
    totalPages: 1,
    currentPage: 1,
  },
  progress: 0,
  startTime: null,
  endTime: null,
}

// API base URL
const API_BASE_URL = "http://localhost:5000";

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
      content: `Hello! I'm your AI study assistant. How can I help you with your document?`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [summary, setSummary] = useState("")
  const [quiz, setQuiz] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [documentError, setDocumentError] = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(null)

  // Fetch the document and start the session when the component mounts
  useEffect(() => {
    fetchDocument()
    // Clean up when component unmounts
    return () => {
      if (isTimerRunning) {
        pauseSession()
      }
    }
  }, [])

  // Fetch the most recent document instead of a specific title
  const fetchDocument = async () => {
    setIsLoading(true);
    setDocumentError(null);
    setIframeLoading(true);
    setIframeError(null);
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to access this page.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Set up request headers with auth token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log("Fetching the most recent document");

      // First, fetch all available documents
      const response = await axios.get(`${API_BASE_URL}/api/notes`, config);
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Get the most recent document (should be first in the array if sorted by createdAt)
        const document = response.data.data[0];
        
        console.log("Found document:", document.title);
        
        // Update session with document data
        setSession(prev => ({
          ...prev,
          title: document.title,
          subject: document.subject || "Study Session",
          document: {
            id: document._id,
            title: document.title,
            type: document.fileUrl?.split('.').pop() || "pdf",
            totalPages: 1, // Since we don't have actual page info
            currentPage: 1,
            fileUrl: document.fileUrl,
            originalFileUrl: document.originalFileUrl
          }
        }));

        // Log document info to help with debugging
        console.log("Document data received:", {
          id: document._id,
          title: document.title,
          fileUrl: document.fileUrl ? "Present" : "Missing",
          originalFileUrl: document.originalFileUrl ? "Present" : "Missing"
        });

        // Update messages to include the document title
        setMessages([
          {
            role: "assistant",
            content: `Hello! I'm your AI study assistant. How can I help you with "${document.title}"?`,
            timestamp: new Date().toISOString(),
          }
        ]);

        toast({
          title: "Document Loaded",
          description: `"${document.title}" has been successfully loaded.`,
        });
      } else {
        // No documents found
        throw new Error("No documents found. Please upload a document in the Notebook first.");
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      
      let errorMessage = "Failed to load a document.";
      
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Server error response:", error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = "No documents found. Please upload a document in the Notebook first.";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication error. Please log in again.";
          // Redirect to login
          navigate('/login');
        } else {
          errorMessage = error.response.data.error || "Server error. Please try again later.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "No response from server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
      
      setDocumentError(errorMessage);
      
      toast({
        title: "Error Loading Document",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      startSession();
    }
  };

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
      `That's a great question about ${session.subject}! The concept you're asking about relates to the fundamental principles covered in this document.`,
      `In ${session.document.title}, this is explained through the application of key formulas and techniques. Try looking at the examples.`,
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
        # Summary of ${session.document.title}
        
        ## Key Concepts
        
        This document appears to be about "${session.document.title}" which is part of the ${session.subject} subject.
        
        The content includes important information that has been uploaded to your notebook and is now available for review during your study session.
        
        ## Why This Matters
        
        Having this document available during your study session allows you to reference important materials while taking notes and quizzing yourself on the content.
      `)

      setIsGenerating(false)
      setActiveTab("summary")

      toast({
        title: "Summary Generated",
        description: "AI has summarized the document content.",
      })
    }, 2000)
  }

  const handleGenerateQuiz = () => {
    setIsGenerating(true)

    // Simulate API call delay
    setTimeout(() => {
      setQuiz([
        {
          question: `What is the title of the document you're currently viewing?`,
          options: [
            session.document.title,
            "Integration Techniques",
            "Study Materials",
            "Course Notes",
          ],
          answer: 0,
        },
        {
          question: "Which of the following best describes the purpose of this document?",
          options: [
            "Entertainment",
            "Study reference material", 
            "Fiction",
            "Social media"
          ],
          answer: 1,
        },
        {
          question: "Where was this document originally uploaded?",
          options: [
            "Social media",
            "Email",
            "Notebook page",
            "External website"
          ],
          answer: 2,
        },
      ])

      setIsGenerating(false)
      setActiveTab("quiz")

      toast({
        title: "Quiz Generated",
        description: "AI has created a quiz based on the document content.",
      })
    }, 2000)
  }

  // Custom document content renderer
  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-medium">Loading document...</p>
        </div>
      );
    }

    if (documentError) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-red-500">
          <p className="text-lg font-medium mb-2">Error Loading Document</p>
          <p className="text-sm text-center">{documentError}</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={fetchDocument}
          >
            Try Again
          </Button>
        </div>
      );
    }

    // If the document has a fileUrl, display an iframe with the document
    if (session.document.fileUrl) {
      const handleIframeLoad = () => {
        setIframeLoading(false);
        setIframeError(null);
        console.log("Document loaded successfully");
      };

      const handleIframeError = () => {
        console.log("Error loading document iframe");
        setIframeLoading(false);
        
        // Try to force a download of the document directly
        if (!iframeError) {
          setIframeError("Loading document from server...");
          
          // We need to fetch the document specifically by ID to trigger the server-side download
          const fetchDocumentById = async () => {
            try {
              const token = localStorage.getItem('token');
              const config = { headers: { 'Authorization': `Bearer ${token}` } };
              
              // Fetch the document by ID to ensure the server downloads it
              const response = await axios.get(`${API_BASE_URL}/api/notes/view/${session.document.id}`, config);
              
              if (response.data.success) {
                console.log("Document fetched successfully, using local URL:", response.data.data.fileUrl);
                
                // Update the document URL to use the local server URL
                setSession(prev => ({
                  ...prev,
                  document: {
                    ...prev.document,
                    fileUrl: response.data.data.fileUrl,
                    cloudinaryUrl: response.data.data.cloudinaryUrl,
                    originalFileUrl: response.data.data.originalFileUrl
                  }
                }));
                
                // Reset iframe state to try loading again
                setIframeLoading(true);
                setIframeError(null);
              } else {
                throw new Error("Failed to fetch document from server");
              }
            } catch (error) {
              console.error("Error fetching document by ID:", error);
              setIframeError("Could not load document. Please try opening it in a new tab or download it.");
            }
          };
          
          fetchDocumentById();
        } else if (session.document.originalFileUrl && !iframeError.includes("Opening document")) {
          // Try the original URL as a last resort
          setIframeError("Opening document in browser...");
          setTimeout(() => {
            window.open(session.document.originalFileUrl, '_blank');
            setIframeError("Document opened in a new tab");
          }, 1500);
        }
      };

      return (
        <div className="h-full flex flex-col relative">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium">Loading document content...</p>
            </div>
          )}
          
          {iframeError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <p className="text-lg font-medium mb-2 text-primary">{iframeError}</p>
              
              {iframeError === "Document opened in a new tab" ? (
                <p className="text-sm text-center max-w-md mb-4">The document has been opened in a new browser tab.</p>
              ) : iframeError.includes("Loading") ? (
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
              ) : (
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => window.open(session.document.originalFileUrl || session.document.fileUrl, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIframeError(null);
                      setIframeLoading(true);
                      fetchDocument();
                    }}
                  >
                    Reload Document
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <iframe 
            src={session.document.fileUrl}
            className="w-full h-full rounded-lg border"
            title={session.document.title}
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      );
    }

    // Fallback content if no document is loaded
    return (
      <div className="prose max-w-none">
        <h1>Document Content Placeholder</h1>
        <p>No document content is available to display. Please check that the document URL is correct and accessible.</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Study Session</h1>
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
          {isLoading || documentError ? (
            <div className="h-full p-4">
              {renderDocumentContent()}
            </div>
          ) : (
            <DocumentViewer
              document={{
                ...session.document,
                content: renderDocumentContent
              }}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              highlights={highlights}
              onAddHighlight={handleAddHighlight}
              notes={notes}
              onNotesChange={handleNotesChange}
              customContent={renderDocumentContent()}
            />
          )}
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
                      Get an AI-generated summary of the document content
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