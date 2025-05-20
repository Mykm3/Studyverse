"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, ArrowLeft, Maximize2, Minimize2, BookOpen, HelpCircle, BrainCircuit, Sparkles, Clock, Download, Book } from 'lucide-react'
import { Button } from "./ui/Button"
import { useToast } from "./ui/use-toast"
import { SessionTimer } from "./SessionTimer"
import { DocumentViewer } from "./DocumentViewer"
import { SessionProgress } from "./SessionProgress"
import { Card, CardContent } from "./ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs"
import { Input } from "./ui/Input"
import PDFViewer from "./PDFViewer"
import axios from "axios"

// API base URL
const API_BASE_URL = "http://localhost:5000";

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

  // Force using the view-pdf endpoint for all PDFs - moved to component top level
  useEffect(() => {
    if (session.document?.type === 'pdf' && session.document?.id && 
        session.document?.fileUrl && !session.document.fileUrl.includes('/view-pdf/')) {
      console.log("Enforcing view-pdf endpoint for PDF document");
      const viewPdfUrl = `${API_BASE_URL}/api/notes/view-pdf/${session.document.id}`;
      setSession(prev => ({
        ...prev,
        document: {
          ...prev.document,
          fileUrl: viewPdfUrl
        }
      }));
    }
  }, [session.document?.id, session.document?.type, session.document?.fileUrl]);

  // Fetch the document and start the session when the component mounts
  useEffect(() => {
    // Get the session ID from URL if available
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId');
    
    if (sessionId) {
      fetchSessionDocument(sessionId);
    } else {
      // Don't fetch documents unless a session is started from the study plan page
      setIsLoading(false);
    }
    
    // Clean up when component unmounts
    return () => {
      if (isTimerRunning) {
        pauseSession();
      }
    }
  }, []);

  // Fetch document for a specific study session
  const fetchSessionDocument = async (sessionId) => {
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

      console.log("Fetching study session document:", sessionId);

      // Fetch the study session with its documents
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
            viewUrl = `${API_BASE_URL}/api/notes/view-pdf/${document.id}`;
            console.log("Using PDF viewing endpoint:", viewUrl);
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

      // If we have a subject in the session, try to get documents for that subject first
      let response;
      if (session.subject && session.subject !== "Study Session") {
        console.log(`Fetching documents for subject: ${session.subject}`);
        
        // Try to get documents for this specific subject
        response = await axios.get(
          `${API_BASE_URL}/api/notes/by-subject/${encodeURIComponent(session.subject)}`, 
          config
        );
        
        // If no documents found for this subject, will fall back to getting all documents
        if (!response.data.success || !response.data.data || response.data.data.length === 0) {
          console.log(`No documents found for subject: ${session.subject}, fetching all documents`);
          response = await axios.get(`${API_BASE_URL}/api/notes`, config);
        }
      } else {
        // No subject specified, just get all documents
        console.log("Fetching the most recent document");
        response = await axios.get(`${API_BASE_URL}/api/notes`, config);
      }
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Get the most recent document (should be first in the array if sorted by createdAt)
        const document = response.data.data[0];
        
        console.log("Found document:", document.title);
        
        // Determine document type
        const fileType = document.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
        
        // Determine the appropriate URL to use
        let viewUrl;
        
        // Always use our dedicated endpoint for PDFs
        if (fileType === 'pdf') {
          viewUrl = `${API_BASE_URL}/api/notes/view-pdf/${document._id}`;
          console.log("Using PDF viewing endpoint:", viewUrl);
        } else {
          // For non-PDFs, prioritize secure Cloudinary URL if available
          viewUrl = document.cloudinaryUrl || document.fileUrl || document.originalFileUrl;
          console.log("Using standard document URL:", viewUrl);
        }
        
        // Update session with document data and subject if not already set
        setSession(prev => ({
          ...prev,
          title: document.title,
          subject: prev.subject !== "Study Session" ? prev.subject : document.subject || "Study Session",
          document: {
            id: document._id,
            title: document.title,
            type: fileType,
            totalPages: 1, // Since we don't have actual page info
            currentPage: 1,
            fileUrl: viewUrl,
            originalFileUrl: document.originalFileUrl,
            cloudinaryUrl: document.cloudinaryUrl
          }
        }));

        // Log document info to help with debugging
        console.log("Document data received:", {
          id: document._id,
          title: document.title,
          subject: document.subject,
          fileUrl: document.fileUrl ? "Present" : "Missing",
          originalFileUrl: document.originalFileUrl ? "Present" : "Missing",
          cloudinaryUrl: document.cloudinaryUrl ? "Present" : "Missing",
          urlToUse: viewUrl,
          fileType: fileType
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
        const subjectMessage = session.subject && session.subject !== "Study Session" 
          ? `No documents found for subject "${session.subject}". Please upload documents for this subject in the Notebook first.`
          : "No documents found. Please upload a document in the Notebook first.";
        throw new Error(subjectMessage);
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
          const subjectMessage = session.subject && session.subject !== "Study Session" 
            ? `No documents found for subject "${session.subject}". Please upload documents for this subject in the Notebook first.`
            : "No documents found. Please upload a document in the Notebook first.";
          errorMessage = subjectMessage;
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
        <div className="h-full flex flex-col items-center justify-center">
          <div className="text-red-500 mb-4">
            <p className="text-lg font-medium mb-2">Error Loading Document</p>
            <p className="text-sm text-center max-w-md">{documentError}</p>
          </div>
          
          {documentError.includes("No documents found for") ? (
            <div className="flex flex-col items-center mt-4">
              <p className="text-sm text-center text-muted-foreground max-w-md mb-4">
                You need to upload documents for this subject in the Notebook before they can be viewed here.
              </p>
              <Button 
                variant="default"
                onClick={() => navigate("/notebook")}
              >
                <Book className="h-4 w-4 mr-2" />
                Go to Notebook
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline"
              className="mt-4"
              onClick={() => {
                if (window.location.search.includes('sessionId')) {
                  const params = new URLSearchParams(window.location.search);
                  const sessionId = params.get('sessionId');
                  if (sessionId) {
                    fetchSessionDocument(sessionId);
                  }
                } else {
                  fetchDocument();
                }
              }}
            >
              Try Again
            </Button>
          )}
        </div>
      );
    }

    // If the document has a fileUrl, display it
    if (session.document.fileUrl) {
      const handleIframeLoad = () => {
        console.log("Document loaded successfully in viewer:", session.document.fileUrl);
        setIframeLoading(false);
        setIframeError(null);
      };

      const handleIframeError = (e) => {
        console.log("Error loading document iframe:", e);
        console.log("Document URL that failed:", session.document.fileUrl);
        setIframeLoading(false);
        
        // Try different URL options
        if (!iframeError) {
          setIframeError("Trying alternative document source...");
          
          // Always use our dedicated view-pdf endpoint which ensures proper headers
          const newUrl = `${API_BASE_URL}/api/notes/view-pdf/${session.document.id}`;
          console.log("Using view-pdf endpoint URL:", newUrl);
            
          // Update the document URL to use the view-pdf endpoint
            setSession(prev => ({
              ...prev,
              document: {
                ...prev.document,
                fileUrl: newUrl
              }
            }));
            
            // Reset iframe state to try loading again
            setIframeLoading(true);
            setIframeError(null);
        } else {
          // If we've already tried alternatives and they failed, offer direct download
          console.log("PDF viewer failed after retry, offering download option");
          setIframeError("Document cannot be displayed in the viewer");
        }
      };

      // Function to generate a direct download link
      const handleDirectDownload = async () => {
        try {
          // Always get a fresh download URL with download parameter
          const downloadUrl = `${API_BASE_URL}/api/notes/download/${session.document.id}?download=true`;
          
          toast({
            title: "Opening Document",
            description: "Document will open in a new tab...",
          });
          
          // Open in new tab
          window.open(downloadUrl, '_blank');
          
          toast({
            title: "Document Opened",
            description: "If the document doesn't open, check your pop-up blocker settings.",
          });
        } catch (error) {
          console.error("Error opening document:", error);
          
          toast({
            title: "Error Opening Document",
            description: "Could not open the document. Please try again later.",
            variant: "destructive"
          });
        }
      };

      return (
        <div className="h-full flex flex-col relative">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg font-medium">Loading document content...</p>
            </div>
          )}
          
          {iframeError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-10 backdrop-blur-sm">
              <p className="text-lg font-medium mb-2 text-primary">{iframeError}</p>
              
              {iframeError === "Document opened in a new tab" ? (
                <p className="text-sm text-center max-w-md mb-4">The document has been opened in a new browser tab.</p>
              ) : iframeError.includes("Trying") ? (
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-4"></div>
              ) : (
                <div className="flex flex-col items-center gap-4 mt-4 w-72">
                  <p className="text-sm text-center text-muted-foreground">
                    The document cannot be displayed in the built-in viewer.
                    Please download it or open it in a new tab instead.
                  </p>
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="default"
                      className="flex-1"
                      onClick={handleDirectDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="w-full bg-muted/50 p-2 flex justify-between items-center">
            <div className="text-sm font-medium flex items-center gap-2">
              <Book className="h-4 w-4 text-muted-foreground" />
              {session.document.title}
              <span className="text-xs text-muted-foreground">({session.subject})</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs" 
                onClick={handleDirectDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
          
          {/* Use our specialized PDFViewer for PDFs */}
          {session.document.type === 'pdf' ? (
            <div className="w-full h-full flex-1 min-h-[600px]">
              <PDFViewer 
                fileUrl={session.document.fileUrl}
                onError={(error) => {
                  console.error("PDFViewer error:", error);
                  setIframeError("Could not load PDF. Try downloading instead.");
                }}
              />
            </div>
          ) : (
            <iframe 
              src={session.document.fileUrl}
              className="w-full h-full rounded-lg border-0 shadow-inner flex-1"
              title={session.document.title}
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ minHeight: "600px" }}
            />
          )}
        </div>
      );
    }

    // Fallback content if no document is loaded
    return (
      <div className="prose max-w-none p-6 h-full flex flex-col items-center justify-center text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Study Session Selected</h1>
        <p className="text-muted-foreground">
          Please start a study session from the Study Plan page or select a document from the Notebook.
        </p>
        <div className="flex gap-4 mt-6">
        <Button 
          variant="outline"
          onClick={() => navigate("/notebook")}
        >
            <Book className="h-4 w-4 mr-2" />
          Browse Documents
        </Button>
          <Button 
            variant="default"
            onClick={() => navigate("/study-plan")}
          >
            <Brain className="h-4 w-4 mr-2" />
            Study Plan
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

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
        {/* Left Panel - Session Info & Timer */}
        <div className="col-span-12 md:col-span-2 space-y-4">
          <div className="bg-background rounded-lg shadow-md p-4 h-full flex flex-col">
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
        <div className="col-span-12 md:col-span-7 bg-background rounded-lg shadow-md">
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
        <div className="col-span-12 md:col-span-3 bg-background rounded-lg shadow-md">
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