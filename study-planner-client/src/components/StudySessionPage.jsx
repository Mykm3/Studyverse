"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, ArrowLeft, Maximize2, Minimize2, BookOpen, HelpCircle, BrainCircuit, Sparkles, Clock, Download, Book, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "./ui/Button"
import { useToast } from "./ui/use-toast"
import { SessionTimer } from "./SessionTimer"
import { SessionProgress } from "./SessionProgress"
import { Card, CardContent } from "./ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs"
import { Input } from "./ui/Input"
import axios from "axios"
import PDFViewerReact from "./PDFViewerReact"
import DocumentViewer from "./DocumentViewer"

// API base URL
const API_BASE_URL = "http://localhost:5000";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

export function StudySessionPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [session, setSession] = useState({
    id: "",
    title: "",
    subject: "",
    duration: 60, // default duration in minutes
    document: {
      id: "",
      title: "Loading document...",
      type: "pdf",
      totalPages: 1,
      currentPage: 1,
    },
    progress: 0,
    startTime: null,
    endTime: null
  })
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
  
  // We keep iframe loading/error states for compatibility with existing code
  // but the actual PDF viewing is handled by the PDFViewerReact component

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clean up timer
      if (isTimerRunning) {
        pauseSession();
      }
    };
  }, [isTimerRunning]);

  // Force using the view-pdf endpoint for all PDFs - moved to component top level
  useEffect(() => {
    if (session.document?.type === 'pdf' && session.document?.id && 
        session.document?.fileUrl && !session.document.fileUrl.includes('/view-pdf/')) {
      console.log("Enforcing view-pdf endpoint for PDF document");
      
      // Add token to URL for authentication
      const token = localStorage.getItem('token');
      const viewPdfUrl = `${API_BASE_URL}/api/notes/view-pdf/${session.document.id}?token=${token}`;
      
      setSession(prev => ({
        ...prev,
        document: {
          ...prev.document,
          fileUrl: viewPdfUrl
        }
      }));
    }
  }, [session.document?.id, session.document?.type, session.document?.fileUrl]);

  // Update the browser blocking detection useEffect
  useEffect(() => {
    // Only run this if we have a PDF document
    if (session.document?.type === 'pdf' && session.document?.fileUrl) {
      // Create a timeout to check if the iframe fails to load
      const blockDetectionTimeout = setTimeout(() => {
        // If iframe is still loading after 5 seconds, it might be blocked
        if (iframeLoading) {
          console.warn('PDF iframe may be blocked by the browser');
          setIframeError('Your browser may be blocking this content. Try using the download option instead.');
          setIframeLoading(false);
        }
      }, 5000);
      
      return () => clearTimeout(blockDetectionTimeout);
    }
  }, [session.document?.fileUrl, session.document?.type, iframeLoading]);

  // Fetch the document and start the session when the component mounts
  useEffect(() => {
    // Get the session ID and note ID from URL if available
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    const noteId = params.get('noteId');
    
    if (sessionId) {
      if (noteId) {
        // If both sessionId and noteId are provided, fetch the specific document
        fetchSpecificDocument(sessionId, noteId);
      } else {
        // Otherwise, fetch any document associated with the session
        fetchSessionDocument(sessionId);
      }
    } else {
      // Don't fetch documents unless a session is started from the study plan page
      setIsLoading(false);
    }
  }, []);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Clean up timer
      if (isTimerRunning) {
        pauseSession();
      }
    };
  }, [isTimerRunning]);

  // Fetch document for a specific study session
  const fetchSessionDocument = async (sessionId) => {
    setIsLoading(true);
    setDocumentError(null);
    setIframeLoading(true);
    setIframeError(null);
    
    try {
      const config = getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/api/study-sessions/${sessionId}`, config);
      
      if (response.data) {
        const sessionData = response.data;
        const documents = sessionData.documents || [];
        
        if (documents.length > 0) {
          // Use the first document (typically most recent)
          const document = documents[0];
          
          console.log("Found document for session:", document.title);
          
          // Determine document type and properly formatted URL
          const fileType = document.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
          let viewUrl;
          
          // Always use our dedicated viewing endpoint for PDFs 
          if (fileType === 'pdf') {
            // Add token to URL for authentication
            const token = localStorage.getItem('token');
            viewUrl = `${API_BASE_URL}/api/notes/view-pdf/${document.id}?token=${token}`;
            console.log("Using PDF viewing endpoint with auth:", viewUrl);
          } else {
            viewUrl = document.fileUrl;
            console.log("Using standard document URL:", viewUrl);
          }
          
          // Update session with document data
          setSession(prev => ({
            ...prev,
            title: sessionData.description || document.title,
            subject: sessionData.subject || "Study Session",
            document: {
              id: document.id,
              title: document.title,
              type: fileType,
              totalPages: 1,
              currentPage: 1,
              fileUrl: viewUrl
            }
          }));

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
          // No documents found for this subject
          throw new Error(`No documents found for the subject "${sessionData.subject}". Please upload documents for this subject in the Notebook.`);
        }
      } else {
        // No session found
        throw new Error("Session not found or has no associated documents.");
      }
    } catch (error) {
      console.error('Error fetching session document:', error);
      
      let errorMessage = "Failed to load document for this session.";
      
      // Check for specific error types
      if (error.response) {
        console.log("Server error response:", error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = "No documents found for this session. Please upload documents in the Notebook first.";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication error. Please log in again.";
          // Redirect to login
          navigate('/login');
        } else {
          errorMessage = error.response.data.error || "Server error. Please try again later.";
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your internet connection.";
      } else {
        // Extract error message for specific errors like "no documents found for subject X"
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

  // Fetch a specific document by ID for a study session
  const fetchSpecificDocument = async (sessionId, noteId) => {
    setIsLoading(true);
    setDocumentError(null);
    setIframeLoading(true);
    setIframeError(null);
    
    try {
      // First fetch the session to get basic session data
      const config = getAuthHeaders();
      const sessionResponse = await axios.get(`${API_BASE_URL}/api/study-sessions/${sessionId}`, config);
      
      if (!sessionResponse.data) {
        throw new Error("Session not found");
      }
      
      const sessionData = sessionResponse.data;
      
      // Then fetch the specific document
      const documentResponse = await axios.get(`${API_BASE_URL}/api/notes/view/${noteId}`, config);
      
      if (!documentResponse.data || !documentResponse.data.success) {
        throw new Error("Document not found");
      }
      
      const document = documentResponse.data.data;
      
      // Determine document type
      const fileType = document.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
      
      // Update session with document data (without fileUrl for now)
      setSession(prev => ({
        ...prev,
        title: sessionData.description || document.title,
        subject: sessionData.subject || "Study Session",
        document: {
          id: document._id,
          title: document.title,
          type: fileType,
          totalPages: 1,
          currentPage: 1,
          fileUrl: null // Will be set after blob URL is created
        }
      }));

      // Update messages to include the document title
      setMessages([
        {
          role: "assistant",
          content: `Hello! I'm your AI study assistant. How can I help you with "${document.title}"?`,
          timestamp: new Date().toISOString(),
        }
      ]);

          // Get the direct URL to the document
    const token = localStorage.getItem('token');
    const directUrl = `${API_BASE_URL}/api/notes/serve/${document._id}?token=${token}`;
    
    // Update the session with the direct URL
    setSession(prev => ({
      ...prev,
      document: {
        ...prev.document,
        fileUrl: directUrl
      }
    }));
    
    toast({
      title: "Document Loaded",
      description: `"${document.title}" has been successfully loaded.`,
    });
      
    } catch (error) {
      console.error('Error fetching specific document:', error);
      
      let errorMessage = "Failed to load the selected document.";
      
      // Check for specific error types
      if (error.response) {
        console.log("Server error response:", error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = "The selected document was not found. It may have been deleted.";
        } else if (error.response.status === 401) {
          errorMessage = "Authentication error. Please log in again.";
          // Redirect to login
          navigate('/login');
        } else {
          errorMessage = error.response.data.error || "Server error. Please try again later.";
        }
      } else if (error.request) {
        errorMessage = "No response from server. Please check your internet connection.";
      } else {
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

  // Render the document content based on document type
  const renderDocumentContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      );
    }

    if (documentError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg max-w-md">
            <HelpCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Document Error</h3>
            <p className="text-muted-foreground mb-4">{documentError}</p>
            <Button onClick={() => navigate('/notebook')}>
              Go to Notebook
            </Button>
          </div>
        </div>
      );
    }

    // For PDF documents, use our PDFViewerReact component
    if (session.document.type === 'pdf') {
      // Handle direct download of the document
      const handleDirectDownload = async () => {
        try {
          const token = localStorage.getItem('token');
          
          // Use the serve endpoint with download parameter
          const downloadUrl = `${API_BASE_URL}/api/notes/serve/${session.document.id}?token=${token}&download=true`;
          
          // Notify user
          toast({
            title: "Downloading Document",
            description: "Your document will download shortly"
          });
          
          // Create a temporary link and click it to download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', session.document.title || 'document');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error("Download error:", error);
          toast({
            title: "Download Failed",
            description: "Failed to download the document. Please try again later.",
            variant: "destructive"
          });
        }
      };
      
      return (
        <PDFViewerReact 
          fileUrl={session.document.fileUrl}
          title={session.document.title}
          onDownload={handleDirectDownload}
        />
      );
    }
    
    // For other document types, provide a download link
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="bg-muted/50 p-6 rounded-lg max-w-md">
          <Book className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{session.document.title}</h3>
          <p className="text-muted-foreground mb-4">
            This document type ({session.document.type}) cannot be viewed directly in the browser.
          </p>
          <Button 
            onClick={() => {
              const token = localStorage.getItem('token');
              const downloadUrl = `${API_BASE_URL}/api/notes/serve/${session.document.id}?token=${token}&download=true`;
              
              // Create a temporary link and click it to download
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.setAttribute('download', session.document.title || 'document');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Document
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Study Session</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 font-semibold rounded-md shadow"
            onClick={async () => {
              const confirmed = window.confirm('Are you sure you want to finish this session? This will mark it as complete and return you to the Study Plan.');
              if (!confirmed) return;
              // Mark session as complete (set progress to 100)
              setSession(prev => ({ ...prev, progress: 100 }));
              setIsSessionComplete(true);
              // Optionally, call API to persist completion
              try {
                if (session.id) {
                  await fetch(`${API_BASE_URL}/api/study-sessions/${session.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ ...session, progress: 100 })
                  });
                }
              } catch (err) {
                console.error('Failed to mark session complete:', err);
              }
              // Navigate back to Study Plan
              navigate('/study-plan');
            }}
          >
            Finish Session
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

      <div className="grid grid-cols-12 gap-6 min-h-0 h-[calc(100vh-140px)]">
        {/* Left Panel - Session Info & Timer */}
        <div className="col-span-12 md:col-span-2 space-y-4 min-h-0 h-full overflow-hidden">
          <div className="bg-background rounded-lg shadow-md p-4 h-full flex flex-col min-h-0 overflow-hidden">
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
        <div className="col-span-12 md:col-span-7 bg-background rounded-lg shadow-md h-full flex flex-col min-h-0 overflow-hidden">
          <div className="pdf-scroll-area flex-1 min-h-0 overflow-auto">
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
        </div>

        {/* Right Panel - AI Assistant */}
        <div className="col-span-12 md:col-span-3 bg-background rounded-lg shadow-md h-full flex flex-col min-h-0 overflow-hidden">
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                StudyVerse AI Assistant
              </h2>
            </div>

            <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col p-4 min-h-0">
                <div className="flex-1 overflow-auto mb-4 space-y-4 min-h-0">
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