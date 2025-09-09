"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Brain, ArrowLeft, Maximize2, Minimize2, BookOpen, HelpCircle, BrainCircuit, Sparkles, Clock, Download, Book, ChevronLeft, ChevronRight, CheckCircle, FileText, MessageSquare, BarChart3, Zap, Target, Timer } from 'lucide-react'
import { Button } from "./ui/Button"
import { useToast } from "./ui/use-toast"
import { SessionTimer } from "./SessionTimer"
import { SessionProgress } from "./SessionProgress"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/Tabs"
import { Input } from "./ui/Input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/Dialog"
import { Badge } from "./ui/Badge"
import axios from "axios"
import PDFViewerReact from "./PDFViewerReact"
import DocumentViewer from "./DocumentViewer"
import { usePersistentTimer } from "../hooks/usePersistentTimer"

import { jsonrepair } from "jsonrepair";
import { marked } from "marked";
import api from "@/utils/api";
import sessionDataApi from "../utils/sessionDataApi";
import { extractTextFromPDF } from "@/utils/pdfTextExtractor";

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
  const [currentPage, setCurrentPage] = useState(session.document.currentPage)
  const [highlights, setHighlights] = useState([])
  const [notes, setNotes] = useState("")
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  // Initialize persistent timer
  const timer = usePersistentTimer(session.id, session.duration)
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
  const [userAnswers, setUserAnswers] = useState([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [documents, setDocuments] = useState([]); // All docs for session
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [showEarlyFinishModal, setShowEarlyFinishModal] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);

  // We keep iframe loading/error states for compatibility with existing code
  // but the actual PDF viewing is handled by the PDFViewerReact component

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Timer cleanup is handled by the persistent timer hook
      // No need to manually clean up here
    };
  }, []);

  // ==================== PERSISTENT CONVERSATION FUNCTIONS ====================

  // Load conversation history for the current session
  const loadConversationHistory = async (sessionId, subject, documentId) => {
    if (!sessionId || sessionId === "") {
      console.log('No session ID provided, skipping conversation load');
      return;
    }

    // Allow reloading if conversation was already loaded (for document switching)
    if (conversationLoaded) {
      console.log('Conversation already loaded, skipping...');
      return;
    }

    try {
      console.log('🔄 Loading conversation history for session:', sessionId);
      console.log('   Subject:', subject);
      console.log('   Document ID:', documentId);

      const conversationData = await sessionDataApi.conversation.getConversation(sessionId);
      console.log('📥 Conversation API response:', conversationData);

      if (conversationData.messages && conversationData.messages.length > 0) {
        console.log('✅ Loaded', conversationData.messages.length, 'messages from database');
        // Only load messages if we don't already have messages (to avoid overriding AI functionality)
        if (messages.length <= 1) { // Only default message exists
          setMessages(conversationData.messages);
        } else {
          console.log('📝 Messages already exist, not overriding current conversation');
        }
      } else {
        console.log('📝 No existing conversation found in database');
        // Don't create default message here - let the existing AI functionality handle it
      }

      setConversationLoaded(true);
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      console.error('Error details:', error.response?.data || error.message);

      // Fall back to default message on error
      setMessages([{
        role: "assistant",
        content: `Hello! I'm your AI study assistant. How can I help you with your document?`,
        timestamp: new Date().toISOString(),
      }]);
      setConversationLoaded(true);
    }
  };

  // Save conversation to database (debounced)
  const saveConversationToDatabase = sessionDataApi.utils.createDebouncedSave(
    async (sessionId, messages, subject, documentId) => {
      try {
        if (!sessionId || !messages || messages.length === 0) return;

        console.log('Saving conversation with', messages.length, 'messages');
        await sessionDataApi.conversation.saveConversation(sessionId, messages, subject, documentId);
      } catch (error) {
        console.error('Error saving conversation:', error);
      }
    },
    3000 // Save after 3 seconds of inactivity
  );

  // Load summary for the current session
  const loadSummary = async (sessionId) => {
    if (!sessionId || sessionId === "") {
      console.log('No session ID provided, skipping summary load');
      return;
    }

    try {
      console.log('🔄 Loading summary for session:', sessionId);
      const summaryData = await sessionDataApi.summary.getSummary(sessionId);
      console.log('📥 Summary API response:', summaryData);

      if (summaryData.summary) {
        console.log('✅ Loaded existing summary from database');
        // Only load summary if we don't already have one (to avoid overriding user's current work)
        if (!summary || summary.trim() === '') {
          setSummary(summaryData.summary);
        } else {
          console.log('📝 Summary already exists, not overriding current summary');
        }
      } else {
        console.log('📝 No existing summary found');
      }
    } catch (error) {
      console.error('❌ Error loading summary:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  // Load quiz for the current session
  const loadQuiz = async (sessionId) => {
    if (!sessionId || sessionId === "") {
      console.log('No session ID provided, skipping quiz load');
      return;
    }

    try {
      console.log('🔄 Loading quiz for session:', sessionId);
      const quizData = await sessionDataApi.quiz.getQuiz(sessionId);
      console.log('📥 Quiz API response:', quizData);

      if (quizData.questions && quizData.questions.length > 0) {
        console.log('✅ Loaded existing quiz from database');
        // Only load quiz if we don't already have one (to avoid overriding user's current work)
        if (!quiz || quiz.length === 0) {
          setQuiz(quizData.questions);
          setUserAnswers(quizData.userAnswers || []);
          setQuizScore(quizData.score || null);
          setShowQuizResults(quizData.completed || false);
        } else {
          console.log('📝 Quiz already exists, not overriding current quiz');
        }
      } else {
        console.log('📝 No existing quiz found');
      }
    } catch (error) {
      console.error('❌ Error loading quiz:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

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
      // Timer cleanup is handled by the persistent timer hook
      // No need to manually clean up here
    };
  }, []);

  // Auto-extract PDF text when fileUrl is set
  useEffect(() => {
    async function extractIfPDF() {
      if (
        session.document?.type === "pdf" &&
        session.document?.fileUrl &&
        !extracting &&
        !extractedText
      ) {
        setExtracting(true);
        try {
          // Fetch the PDF as a Blob
          const response = await fetch(session.document.fileUrl);
          const blob = await response.blob();
          // Extract text
          const text = await extractTextFromPDF(new File([blob], "document.pdf", { type: blob.type }));
          setExtractedText(text);
        } catch (err) {
          console.error("PDF text extraction failed:", err);
          setExtractedText("");
          toast({
            title: "PDF Extraction Failed",
            description: "Could not extract text from the PDF.",
            variant: "destructive"
          });
        } finally {
          setExtracting(false);
        }
      }
    }
    extractIfPDF();
    // Only run when fileUrl changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.document?.fileUrl]);

  // Update fetchSessionDocument to store all documents and set current index
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
        console.log('Fetched session data:', sessionData);
        const docs = sessionData.documents || [];
        setDocuments(docs);
        let docIdx = 0;
        if (docs.length > 0) {
          // Use the first document (typically most recent)
          const document = docs[0];
          const fileType = document.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
          let viewUrl;
          if (fileType === 'pdf') {
            const token = localStorage.getItem('token');
            viewUrl = `${API_BASE_URL}/api/notes/view-pdf/${document.id}?token=${token}`;
          } else {
            viewUrl = document.fileUrl;
          }
          setSession(prev => ({
            ...prev,
            id: sessionData._id || sessionData.id,
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
          setCurrentDocumentIndex(0);

          // Load conversation history instead of resetting messages
          const sessionId = sessionData._id || sessionData.id;
          console.log('🔄 Loading session data after document fetch, sessionId:', sessionId);

          await loadConversationHistory(sessionId, sessionData.subject, document.id);
          await loadSummary(sessionId);
          await loadQuiz(sessionId);
          toast({
            title: "Document Loaded",
            description: `"${document.title}" has been successfully loaded.`,
          });
        } else {
          throw new Error(`No documents found for the subject "${sessionData.subject}". Please upload documents for this subject in the Notebook.`);
        }
      } else {
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
      // Timer will be started manually by user
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

      // Load conversation history for this session and document
      const sessionId = sessionData._id || sessionData.id;
      console.log('🔄 Loading session data after specific document fetch, sessionId:', sessionId);

      await loadConversationHistory(sessionId, sessionData.subject, document._id);
      await loadSummary(sessionId);
      await loadQuiz(sessionId);

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
      // Timer will be started manually by user
    }
  };

  // Add document switching logic
  const handleSwitchDocument = async (direction) => {
    if (!documents.length) return;
    let newIndex = currentDocumentIndex + direction;
    if (newIndex < 0) newIndex = documents.length - 1;
    if (newIndex >= documents.length) newIndex = 0;
    const document = documents[newIndex];
    const fileType = document.fileUrl?.split('.').pop().toLowerCase() || 'pdf';
    let viewUrl;
    if (fileType === 'pdf') {
      const token = localStorage.getItem('token');
      viewUrl = `${API_BASE_URL}/api/notes/view-pdf/${document.id}?token=${token}`;
    } else {
      viewUrl = document.fileUrl;
    }
    setSession(prev => ({
      ...prev,
      title: document.title,
      document: {
        id: document.id,
        title: document.title,
        type: fileType,
        totalPages: 1,
        currentPage: 1,
        fileUrl: viewUrl
      }
    }));
    setCurrentDocumentIndex(newIndex);
    setExtractedText(""); // Reset extracted text so it will re-extract

    // Reset conversation loaded state and load history for new document
    setConversationLoaded(false);
    await loadConversationHistory(session.id, session.subject, document.id);
    toast({
      title: "Document Loaded",
      description: `"${document.title}" has been successfully loaded.`,
    });
  };

  // Update progress based on timer state
  useEffect(() => {
    setSession((prev) => ({
      ...prev,
      progress: timer.progress,
      startTime: timer.startTime || prev.startTime
    }))

    if (timer.isComplete && !isSessionComplete) {
      completeSession()
    }
  }, [timer.progress, timer.isComplete, timer.startTime, isSessionComplete])

  // Load session data when session ID becomes available
  useEffect(() => {
    console.log('🔍 Session data loading effect triggered');
    console.log('   Session ID:', session.id);
    console.log('   Session ID type:', typeof session.id);
    console.log('   Session ID empty?', session.id === "");
    console.log('   Conversation loaded?', conversationLoaded);
    console.log('   Session subject:', session.subject);
    console.log('   Document ID:', session.document?.id);

    if (session.id && session.id !== "" && !conversationLoaded) {
      console.log('✅ Conditions met, loading session data for:', session.id);

      // Load all persistent data
      loadConversationHistory(session.id, session.subject, session.document?.id);
      loadSummary(session.id);
      loadQuiz(session.id);
    } else {
      console.log('❌ Conditions not met for loading session data');
      if (!session.id || session.id === "") {
        console.log('   - No session ID or empty session ID');
      }
      if (conversationLoaded) {
        console.log('   - Conversation already loaded');
      }
    }
  }, [session.id, session.subject, session.document?.id, conversationLoaded]);

  const handleTimerStart = () => {
    timer.start()
    setSession((prev) => ({
      ...prev,
      startTime: prev.startTime || new Date().toISOString(),
    }))
  }

  const handleTimerComplete = () => {
    completeSession()
  }

  const completeSession = () => {
    timer.pause() // Stop the timer
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

  // Enhanced finish session logic with early completion options
  const handleFinishSession = () => {
    // Check if timer has been started (either has startTime or progress > 0)
    if (!timer.startTime && timer.progress === 0) {
      toast({
        title: "Timer Not Started",
        description: "Please start the timer before marking the session as complete.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const sessionEndTime = new Date(session.startTime);
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + session.duration);

    const isEarly = now < sessionEndTime;
    const timeLeft = Math.max(0, sessionEndTime.getTime() - now.getTime());
    const minutesLeft = Math.ceil(timeLeft / (1000 * 60));

    if (isEarly && minutesLeft > 5) {
      // Show early finish modal if more than 5 minutes left
      setShowEarlyFinishModal(true);
    } else {
      // Complete session immediately
      markSessionAsComplete();
    }
  }

  const markSessionAsComplete = async () => {
    // Check if timer has been started (either has startTime or progress > 0)
    if (!timer.startTime && timer.progress === 0) {
      toast({
        title: "Timer Not Started",
        description: "Please start the timer before marking the session as complete.",
        variant: "destructive"
      });
      return;
    }

    try {
      const sessionId = session.id || session._id;
      if (sessionId) {
        console.log('Marking session as complete:', sessionId);
        console.log('Current session data:', session);

        const requestBody = { progress: 100, status: 'completed' };
        console.log('Sending request body:', requestBody);

        const response = await fetch(`${API_BASE_URL}/api/study-sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        const updatedSession = await response.json();
        console.log('Session updated successfully:', updatedSession);
      }

      toast({
        title: "Session Completed!",
        description: "Your study session has been marked as complete.",
      });

      // Navigate back to Study Plan
      navigate('/study-plan');
    } catch (err) {
      console.error('Failed to mark session complete:', err);
      toast({
        title: "Error",
        description: "Failed to complete session. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleTryQuiz = () => {
    setShowEarlyFinishModal(false);
    setActiveTab("quiz");
    // Auto-generate quiz if no quiz exists
    if (quiz.length === 0 && extractedText) {
      handleGenerateQuiz();
    }
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

  // Chat using backend proxy
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    try {
      const chatHistory = [
        extractedText
          ? { role: "system", content: `The following is the extracted text from the current study document:\n${extractedText}` }
          : null,
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: "user", content: inputValue },
      ].filter(Boolean);
              const res = await api.post("/api/groq/chat", { messages: chatHistory });
      const aiContent = res.choices?.[0]?.message?.content || "[No response from AI]";
      const aiResponse = {
        role: "assistant",
        content: aiContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const updatedMessages = [...prev, aiResponse];

        // Save conversation to database (debounced)
        saveConversationToDatabase(
          session.id,
          updatedMessages,
          session.subject,
          session.document?.id
        );

        return updatedMessages;
      });
    } catch (err) {
      const errorMessage = {
        role: "assistant",
        content: `AI error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, errorMessage];

        // Save conversation to database even with error
        saveConversationToDatabase(
          session.id,
          updatedMessages,
          session.subject,
          session.document?.id
        );

        return updatedMessages;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Summary generation using backend proxy
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      if (!extractedText) throw new Error("No extracted text available for summary.");
              const res = await api.post("/api/groq/summary", { text: extractedText });
      const summaryText = res.choices?.[0]?.message?.content || "[No summary generated]";
      setSummary(summaryText);
      setActiveTab("summary");

      // Save summary to database
      try {
        await sessionDataApi.summary.saveSummary(
          session.id,
          summaryText,
          session.subject,
          session.document?.id,
          extractedText
        );
        console.log('Summary saved to database');
      } catch (saveError) {
        console.error('Error saving summary to database:', saveError);
      }

      toast({
        title: "Summary Generated",
        description: "AI has summarized the document content.",
      });
    } catch (err) {
      setSummary(`AI error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Quiz generation using backend proxy
  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      if (!extractedText) throw new Error("No extracted text available for quiz.");
              const res = await api.post("/api/groq/quiz", { text: extractedText });
      let quizArr = [];
      let content = res.choices?.[0]?.message?.content || "";
      console.log('Raw quiz content:', content); // Debug log
      let jsonString = content.trim();
      let parsed = false;
      if (jsonString.startsWith('[') && jsonString.endsWith(']')) {
        try {
          const repaired = jsonrepair(jsonString);
          quizArr = JSON.parse(repaired);
          parsed = true;
          console.log('Parsed quiz array (jsonrepair):', quizArr);
        } catch (err) {
          console.error('Quiz JSON parse error after jsonrepair:', err, jsonString);
          quizArr = [];
        }
      } else {
        // fallback: try to extract first array with regex
        const match = content.match(/\[([\s\S]*?)\]/m);
        jsonString = match ? match[0] : null;
        if (jsonString) {
          try {
            const repaired = jsonrepair(jsonString);
            quizArr = JSON.parse(repaired);
            parsed = true;
            console.log('Parsed quiz array (jsonrepair, fallback):', quizArr);
          } catch (err) {
            console.error('Quiz JSON parse error after jsonrepair (fallback):', err, jsonString);
            quizArr = [];
          }
        } else {
          console.error('No JSON array found in AI response:', content);
          quizArr = [];
        }
      }
      const finalQuiz = Array.isArray(quizArr) ? quizArr : [];
      setQuiz(finalQuiz);
      resetQuizState();
      setActiveTab("quiz");

      // Save quiz to database if successfully parsed
      if (parsed && finalQuiz.length > 0) {
        try {
          await sessionDataApi.quiz.saveQuiz(
            session.id,
            finalQuiz,
            session.subject,
            session.document?.id,
            extractedText
          );
          console.log('Quiz saved to database');
        } catch (saveError) {
          console.error('Error saving quiz to database:', saveError);
        }
      }

      toast({
        title: parsed ? "Quiz Generated" : "Quiz Error",
        description: parsed ? "AI has generated a quiz for you." : "Failed to parse quiz. Try again or rephrase your document.",
        variant: parsed ? undefined : "destructive"
      });
    } catch (err) {
      setQuiz([]);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Quiz error: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset quiz state when a new quiz is generated
  function resetQuizState() {
    setUserAnswers([]);
    setShowQuizResults(false);
    setQuizScore(null);
  }

  // Handle answer selection
  const handleSelectAnswer = (qIndex, oIndex) => {
    if (showQuizResults) return;
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[qIndex] = oIndex;

      // Auto-save quiz answers (debounced)
      setTimeout(async () => {
        try {
          await sessionDataApi.quiz.updateQuizAnswers(
            session.id,
            updated,
            quizScore,
            false // not completed yet
          );
        } catch (error) {
          console.error('Error auto-saving quiz answers:', error);
        }
      }, 1000);

      return updated;
    });
  };

  // Handle checking answers
  const handleCheckAnswers = async () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      const userIdx = userAnswers[i];
      if (userIdx !== undefined && q.options[userIdx] === q.answer) {
        correct++;
      }
    });

    const score = { correct, total: quiz.length };
    setQuizScore(score);
    setShowQuizResults(true);

    // Save quiz results to database
    try {
      await sessionDataApi.quiz.updateQuizAnswers(
        session.id,
        userAnswers,
        score,
        true // completed
      );
      console.log('Quiz results saved to database');
    } catch (saveError) {
      console.error('Error saving quiz results to database:', saveError);
    }
  };

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
    <div className="h-screen max-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col study-session-layout">
      {/* Compact Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex-shrink-0">
        <div className="px-4 py-1">
          <div className="flex justify-between items-center">
            {/* Left Section - Document Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <Timer className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                    {documents.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => handleSwitchDocument(-1)}>
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                    )}
                    <span className="truncate max-w-xs">{session.document.title}</span>
                    {documents.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => handleSwitchDocument(1)}>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs py-0">
                      <BookOpen className="h-2 w-2" />
                      {session.subject}
                    </Badge>
                    {documents.length > 1 && (
                      <span className="text-xs">
                        Doc {currentDocumentIndex + 1}/{documents.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 text-xs"
                onClick={() => navigate('/study-plan')}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="hidden md:flex text-xs"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3 w-3 mr-1" />
                    Exit
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Full
                  </>
                )}
              </Button>

              <Button
                onClick={handleFinishSession}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Finish
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Fixed Height */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full grid grid-cols-12 gap-2 p-2 max-h-full">
          {/* Left Panel - Session Info & Timer */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
            {/* Compact Session Overview */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg flex-shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Session</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium">{session.duration}m</div>
                    <div className="text-gray-500">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{timer.progress}%</div>
                    <div className="text-gray-500">Progress</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-medium ${timer.isRunning ? 'text-green-600' : 'text-gray-600'}`}>
                      {timer.isRunning ? "Active" : timer.progress > 0 ? "Paused" : "Ready"}
                    </div>
                    <div className="text-gray-500">Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compact Timer */}
            <div className="flex-1">
              <SessionTimer
                duration={session.duration}
                isRunning={timer.isRunning}
                activeTime={timer.activeTime}
                timeLeft={timer.timeLeft}
                progress={timer.progress}
                onStart={handleTimerStart}
                onPause={timer.pause}
                onReset={timer.reset}
                onComplete={handleTimerComplete}
                formatTime={timer.formatTime}
              />
            </div>

            {/* Compact Progress */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg flex-shrink-0">
              <CardContent className="p-2">
                <SessionProgress
                  progress={session.progress}
                  currentPage={currentPage}
                  totalPages={session.document.totalPages}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Document Viewer */}
          <div className="col-span-12 lg:col-span-6 h-full max-h-full overflow-hidden">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg h-full max-h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Document Viewer
                  {extracting && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Processing...
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
                <div className="pdf-scroll-area h-full max-h-full overflow-auto">
                  {isLoading || documentError ? (
                    <div className="h-full p-4 flex items-center justify-center">
                      {renderDocumentContent()}
                    </div>
                  ) : (
                    <div className="h-full max-h-full overflow-hidden">
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - AI Assistant */}
          <div className="col-span-12 lg:col-span-3 h-full max-h-full overflow-hidden">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg h-full max-h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  AI Assistant
                  {isGenerating && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="mx-3 mb-2 grid grid-cols-3 text-xs h-8 flex-shrink-0">
                    <TabsTrigger value="chat" className="flex items-center gap-1 text-xs">
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center gap-1 text-xs">
                      <FileText className="h-3 w-3" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="flex items-center gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      Quiz
                    </TabsTrigger>
                  </TabsList>

              <TabsContent value="chat" className="flex-1 flex flex-col px-3 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 ai-assistant-scroll" style={{maxHeight: 'calc(100vh - 400px)'}}>
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-lg p-2 text-xs ${
                          message.role === "user"
                            ? "bg-primary text-white"
                            : "bg-white text-black border border-gray-200"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div
                            className="prose prose-xs max-w-none text-xs"
                            dangerouslySetInnerHTML={{ __html: marked.parse(message.content || "") }}
                          />
                        ) : (
                        <p className="text-xs">{message.content}</p>
                        )}
                        <p className="text-xs mt-1 opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0 mt-2">
                  <Input
                    placeholder="Ask about the document..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="flex-1 text-xs h-8"
                  />
                  <Button type="submit" variant="default" size="sm" className="h-8 w-8 p-0">
                    <ArrowLeft className="h-3 w-3 rotate-180" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="summary" className="flex-1 px-3 overflow-y-auto min-h-0 ai-assistant-scroll" style={{maxHeight: 'calc(100vh - 400px)'}}>
                {summary ? (
                  <div className="prose prose-xs max-w-none text-xs">
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(summary.replace(/\n/g, "\n")) }} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-medium mb-2">Generate Summary</h3>
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      Get an AI summary of the document
                    </p>
                    <Button
                      variant="default"
                      onClick={handleGenerateSummary}
                      disabled={isGenerating}
                      size="sm"
                      className="text-xs"
                    >
                      {isGenerating ? (
                        "Generating..."
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Summarize
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quiz" className="flex-1 px-3 overflow-y-auto min-h-0 ai-assistant-scroll" style={{maxHeight: 'calc(100vh - 400px)'}}>
                {quiz.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-medium">Quiz</h3>
                      <p className="text-xs text-muted-foreground">Test your understanding</p>
                    </div>

                    {quiz.map((question, qIndex) => (
                      <Card key={qIndex} className="border border-gray-200">
                        <CardContent className="p-3">
                          <p className="font-medium mb-2 text-xs">
                            {qIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-1">
                            {question.options.map((option, oIndex) => {
                              const isSelected = userAnswers[qIndex] === oIndex;
                              const isCorrect = showQuizResults && option === question.answer;
                              const isIncorrect =
                                showQuizResults && isSelected && option !== question.answer;
                              return (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  id={`q${qIndex}-o${oIndex}`}
                                  name={`question-${qIndex}`}
                                  className="text-primary focus:ring-primary w-3 h-3"
                                    checked={isSelected}
                                    disabled={showQuizResults}
                                    onChange={() => handleSelectAnswer(qIndex, oIndex)}
                                  />
                                  <label
                                    htmlFor={`q${qIndex}-o${oIndex}`}
                                    className={`text-xs text-foreground ${
                                      isCorrect
                                        ? "font-bold text-green-600"
                                        : isIncorrect
                                        ? "font-bold text-red-600"
                                        : ""
                                    }`}
                                  >
                                  {option}
                                    {isCorrect && (
                                      <span className="ml-1">✔️</span>
                                    )}
                                    {isIncorrect && (
                                      <span className="ml-1">❌</span>
                                    )}
                                </label>
                              </div>
                              );
                            })}
                          </div>
                          {showQuizResults && (
                            <div className="mt-1">
                              <span className="text-xs font-semibold">
                                Correct: <span className="text-green-600">{question.answer}</span>
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {/* Show score summary after checking answers */}
                    {showQuizResults && quizScore && (
                      <div className="text-center mt-2">
                        <span className="text-sm font-semibold">
                          Score: {quizScore.correct} / {quizScore.total}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-center mt-2">
                      <Button variant="default" onClick={handleCheckAnswers} disabled={showQuizResults} size="sm" className="text-xs">
                        Check Answers
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <HelpCircle className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-sm font-medium mb-2">Generate Quiz</h3>
                    <p className="text-xs text-muted-foreground text-center mb-3">Test your knowledge</p>
                    <Button
                      variant="default"
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating}
                      size="sm"
                      className="text-xs"
                    >
                      {isGenerating ? (
                        "Generating..."
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Generate Quiz
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
                </Tabs>

                {/* Quick Actions - Properly positioned at bottom */}
                <div className="border-t bg-gray-50/50 flex-shrink-0 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSummary}
                      disabled={isGenerating}
                      className="text-xs h-7"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Summary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating}
                      className="text-xs h-7"
                    >
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Quiz
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Early Finish Modal */}
      <Dialog open={showEarlyFinishModal} onOpenChange={setShowEarlyFinishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              End Session Early?
            </DialogTitle>
            <DialogDescription className="text-left">
              You still have time left in this session. Would you like to end it now or try a quick quiz to test your knowledge?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleTryQuiz}
              className="justify-start"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Try a Quick Quiz
            </Button>
            <Button
              onClick={() => {
                markSessionAsComplete();
                setShowEarlyFinishModal(false);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, End Session
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowEarlyFinishModal(false)}
            >
              Continue Studying
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 