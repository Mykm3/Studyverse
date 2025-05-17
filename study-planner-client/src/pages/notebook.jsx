import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowLeft, Search, Plus, FolderPlus, SortAsc, Notebook } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { useToast } from "../components/ui/use-toast";
import UploadModal from "../components/UploadModal";
import CircularProgress from "../components/CircularProgress";
import SubjectSelector from "../components/SubjectSelector";
import { useSubjects } from "../contexts/SubjectContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import api from "@/utils/api";
import { formatRelativeTime } from "../utils/dateUtils";

// Sample data for notes (will be replaced with API data)
const INITIAL_NOTES = [
  {
    id: 1,
    title: "Integration Techniques",
    subject: "calculus",
    type: "pdf",
    dateAdded: "2023-05-02T10:30:00",
    lastOpened: "2023-05-04T14:20:00",
    progress: 75,
    size: "2.4 MB",
    pages: 24,
    currentPage: 18,
  },
  {
    id: 2,
    title: "Binary Trees & Traversal",
    subject: "data-structures",
    type: "pdf",
    dateAdded: "2023-04-28T09:15:00",
    lastOpened: "2023-05-03T11:45:00",
    progress: 60,
    size: "3.1 MB",
    pages: 32,
    currentPage: 19,
  },
  {
    id: 3,
    title: "Kinematics Formulas",
    subject: "physics",
    type: "docx",
    dateAdded: "2023-04-25T15:20:00",
    lastOpened: "2023-05-01T10:10:00",
    progress: 100,
    size: "1.2 MB",
    pages: 8,
    currentPage: 8,
  },
  {
    id: 4,
    title: "Sorting Algorithms",
    subject: "algorithms",
    type: "pdf",
    dateAdded: "2023-04-20T14:30:00",
    lastOpened: "2023-04-30T16:45:00",
    progress: 40,
    size: "4.5 MB",
    pages: 45,
    currentPage: 18,
  },
  {
    id: 5,
    title: "CPU Architecture",
    subject: "computer-architecture",
    type: "pptx",
    dateAdded: "2023-04-15T11:20:00",
    lastOpened: "2023-04-29T09:30:00",
    progress: 85,
    size: "5.8 MB",
    pages: 42,
    currentPage: 36,
  },
  {
    id: 6,
    title: "Differential Equations",
    subject: "calculus",
    type: "pdf",
    dateAdded: "2023-04-10T10:00:00",
    lastOpened: "2023-04-28T14:15:00",
    progress: 30,
    size: "3.7 MB",
    pages: 36,
    currentPage: 11,
  },
];

export default function NotebookPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subjects, loading: subjectsLoading, fetchSubjects } = useSubjects();
  const [activeTab, setActiveTab] = useState("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs to track fetch status
  const fetchInProgress = useRef(false);
  const hasFetchedNotes = useRef(false);

  // Memoize the fetchNotes function to avoid recreation on each render
  const fetchNotes = useCallback(async (forceRefresh = false) => {
    console.count('fetchNotes called');
    
    // Skip if fetch already in progress to prevent duplicate calls
    if (fetchInProgress.current && !forceRefresh) {
      console.log('[NotebookPage] Fetch already in progress, skipping duplicate call');
      return;
    }
    
    // Skip if already fetched and not forced to refresh
    if (hasFetchedNotes.current && !forceRefresh && notes.length > 0) {
      console.log('[NotebookPage] Notes already fetched, skipping fetch');
      return;
    }
    
    try {
      fetchInProgress.current = true;
      setIsLoading(true);
      console.log('[NotebookPage] Fetching notes from API...');
      
      let notesData = [];
      try {
        const response = await api.get('/api/notes');
        console.log('[NotebookPage] Raw API response:', response);
        
        // Handle different response formats
        if (response && response.success === true && Array.isArray(response.data)) {
          // New API format with success field
          notesData = response.data;
        } else if (Array.isArray(response)) {
          // Old API format (direct array)
          notesData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // Alternative format
          notesData = response.data;
        } else {
          console.warn('[NotebookPage] Unexpected API response format:', response);
          notesData = [];
        }
      } catch (apiError) {
        console.error('[NotebookPage] API request failed:', apiError);
        
        // For server errors, try to continue with empty data
        if (apiError.message && (
            apiError.message.includes('Internal Server Error') || 
            apiError.message.includes('500')
          )) {
          console.warn('[NotebookPage] Server error, proceeding with empty notes list');
          notesData = [];
          // Don't rethrow - we'll handle gracefully with empty data
        } else {
          // For other errors, rethrow to be caught by the outer catch
          throw apiError;
        }
      }

      console.log('[NotebookPage] Notes data to process:', notesData);
      
      // Transform API data to match our UI structure
      const transformedNotes = (notesData || []).map(note => {
        return {
          id: note._id,
          title: note.title || 'Untitled Note',
          subject: note.subject || 'Uncategorized',
          type: note.fileUrl?.split('.').pop() || 'unknown',
          dateAdded: note.createdAt,
          lastOpened: note.updatedAt,
          progress: 0,
          fileUrl: note.fileUrl,
          publicId: note.publicId
        };
      });
      
      console.log('[NotebookPage] Transformed notes:', transformedNotes);
      setNotes(transformedNotes);
      hasFetchedNotes.current = true;
      
      // After notes are loaded, refresh the subjects - but only if needed
      if (forceRefresh) {
        fetchSubjects(true); // Force refresh of subjects
      } else if (subjects.length === 0) {
        fetchSubjects(); // Regular refresh if no subjects yet
      }
    } catch (error) {
      console.error("[NotebookPage] Error fetching notes:", error);
      toast({
        title: "Failed to load notes",
        description: error.message || "There was a problem loading your notes. Please try again later.",
        variant: "destructive"
      });
      setNotes([]);
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
    }
  }, [toast, subjects.length, notes.length]);

  // Load actual notes from the server - only once at component mount
  useEffect(() => {
    if (!hasFetchedNotes.current) {
      fetchNotes();
    }
    // Include fetchNotes in the dependency array to satisfy React hooks rules
    // The fetchNotes function is memoized, so it won't cause infinite loops
  }, [fetchNotes]);

  // Refresh notes after upload - reuse the memoized function
  const handleModalClose = async (refreshData = false) => {
    setIsUploadModalOpen(false);
    
    if (refreshData) {
      // Force refresh to get the latest notes
      fetchNotes(true);
    }
  };

  // Calculate overall progress across all subjects
  const overallProgress = subjects && subjects.length > 0 
    ? Math.round(subjects.reduce((sum, subject) => sum + (subject.progress || 0), 0) / subjects.length) 
    : 0;

  // Prepare subjects for the selector - memoize to prevent unnecessary recalculations
  const subjectsForSelector = [
    { id: "all", name: "All Subjects" },
    ...(Array.isArray(subjects) ? subjects.map(s => ({
      id: s.id,
      name: s.name,
      documentsCount: s.documentsCount || 0
    })) : [])
  ];

  // Filter notes based on selected subject and search query
  const filteredNotes = notes.filter(note => {
    // For subject filtering: either show all or compare the subject
    // Convert note's subject to an ID format for comparison
    const noteSubjectId = note.subject.toLowerCase().replace(/\s+/g, '-');
    const matchesSubject = selectedSubject === "all" || noteSubjectId === selectedSubject;
    
    // For search filtering
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSubject && matchesSearch;
  });

  // Generate the empty state message based on selected subject and search query
  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return "No notes match your search query";
    }
    
    if (selectedSubject !== "all") {
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || selectedSubject;
      return `No notes found for "${subjectName}"`;
    }
    
    return "You haven't added any notes yet";
  };

  // Test a file URL - memoize to prevent recreation on each render
  const testFileUrl = useCallback(async (url) => {
    console.log('[NotebookPage] Testing file URL:', url);
    
    try {
      // Special handling for Cloudinary URLs to avoid repeated testing
      if (url.includes('cloudinary.com')) {
        console.log('[NotebookPage] Cloudinary URL detected, assuming accessible');
        return true;
      }
      
      // First try a direct HEAD request
      const directResponse = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors'
      }).catch(err => {
        console.warn('[NotebookPage] Direct HEAD request failed:', err);
        return null;
      });
      
      if (directResponse && directResponse.ok) {
        console.log('[NotebookPage] Direct URL test successful:', {
          status: directResponse.status,
          headers: Object.fromEntries([...directResponse.headers.entries()])
        });
        return true;
      }
      
      // If direct request fails, try through the server
      console.log('[NotebookPage] Direct test failed, trying through server...');
      const serverResponse = await api.post('/api/notes/test-url', { url });
      
      console.log('[NotebookPage] Server URL test response:', serverResponse);
      
      if (serverResponse.accessible) {
        console.log('[NotebookPage] URL is accessible through server');
        return true;
      } else {
        console.error('[NotebookPage] URL is not accessible:', url);
        return false;
      }
    } catch (error) {
      console.error('[NotebookPage] Error testing URL:', error);
      return false;
    }
  }, []);

  // Open a document - use the memoized testFileUrl
  const handleOpenDocument = useCallback(async (note) => {
    // Add detailed logging
    console.log('[NotebookPage] Opening document:', {
      id: note.id,
      title: note.title,
      fileUrl: note.fileUrl,
      type: note.type
    });
    
    // Check if URL is accessible
    if (note.fileUrl) {
      // Log the exact URL being opened
      console.log('[NotebookPage] Opening URL:', note.fileUrl);
      
      // Test if URL is accessible
      const isAccessible = await testFileUrl(note.fileUrl);
      
      if (isAccessible) {
        window.open(note.fileUrl, '_blank');
        toast({
          title: "Opening Document",
          description: "Your document is being prepared for viewing."
        });
      } else {
        toast({
          title: "Error Opening Document",
          description: "The file could not be accessed. It may have been deleted or moved.",
          variant: "destructive"
        });
      }
    } else {
      console.error('[NotebookPage] Missing fileUrl for note:', note.id);
      toast({
        title: "Error Opening Document",
        description: "The file URL is missing or invalid.",
        variant: "destructive"
      });
    }
  }, [testFileUrl, toast]);

  // Delete a note - use the memoized fetchNotes for refresh
  const handleDeleteNote = useCallback(async (noteId) => {
    try {
      await api.delete(`/api/notes/${noteId}`);
      
      // Remove note from state directly without refetching
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      toast({
        title: "Note Deleted",
        description: "The note has been deleted successfully."
      });
      
      // Refresh subjects to update counts
      fetchSubjects(true);
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Delete Failed",
        description: "There was a problem deleting the note. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, fetchSubjects]);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  }, [sortOrder]);

  // Check Cloudinary configuration
  const checkCloudinaryConfig = useCallback(async () => {
    try {
      console.log('[NotebookPage] Checking Cloudinary configuration...');
      const response = await api.get('/api/notes/check-cloudinary');
      
      console.log('[NotebookPage] Cloudinary configuration:', response);
      
      toast({
        title: "Cloudinary Configuration",
        description: `Cloud Name: ${response.config.cloudName}, API Key: ${response.config.apiKey}, API Secret: ${response.config.apiSecret}, Secure: ${response.config.secure}`,
        duration: 10000
      });
      
      return response;
    } catch (error) {
      console.error('[NotebookPage] Error checking Cloudinary configuration:', error);
      toast({
        title: "Error Checking Cloudinary",
        description: error.message || "Failed to check Cloudinary configuration",
        variant: "destructive",
        duration: 10000
      });
    }
  }, [toast]);

  // Clear all notes and subjects
  const clearAllData = useCallback(async () => {
    if (!confirm("Are you sure you want to delete ALL notes and subjects? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('[NotebookPage] Clearing all notes and subjects...');
      
      // Clear notes first
      const response = await api.delete('/api/notes/clear-all');
      console.log('[NotebookPage] Clear all notes response:', response);
      
      if (response.success) {
        // Reset local state
        setNotes([]);
        hasFetchedNotes.current = false;
        
        // Refresh subjects (force refresh to ensure emptiness)
        fetchSubjects(true);
        
        // Reset selected subject
        setSelectedSubject("all");
        
        toast({
          title: "Data Cleared",
          description: "All notes and subjects have been deleted successfully.",
        });
      } else {
        throw new Error(response.error || "Failed to clear notes");
      }
    } catch (error) {
      console.error('[NotebookPage] Error clearing data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fetchSubjects]);

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Notebook className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Notebook</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="flex gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button variant="outline" size="sm" className="flex gap-2" onClick={() => navigate("/calendar")}>
            <ArrowLeft className="h-4 w-4" />
            <span>Calendar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-primary/5 hover:bg-primary/10 text-primary flex items-center gap-1 border-primary/30"
            onClick={() => navigate('/test-upload')}
          >
            <span>Test Upload</span>
          </Button>
          <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
            <span>AI Assist</span>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-4">Overall Progress</h2>
                {subjectsLoading ? (
                  <div className="h-[150px] w-[150px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <CircularProgress 
                    value={overallProgress} 
                    size={150} 
                    strokeWidth={10} 
                    progressColor="var(--primary-color)" 
                  />
                )}
                <p className="mt-4 text-sm text-muted-foreground">
                  {subjects && subjects.length > 0 
                    ? `You've completed ${overallProgress}% of your study materials`
                    : "No study materials added yet"}
                </p>
                <Button
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {subjects && subjects.length > 0 
                    ? "Add New Material" 
                    : "Add Your First Notes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Subjects</h2>
              <SubjectSelector
                subjects={subjectsForSelector}
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
                loading={subjectsLoading}
              />
              {subjects && subjects.length > 0 && (
                <div className="mt-6">
                  <Button variant="outline" className="w-full" onClick={() => setIsUploadModalOpen(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Add New Subject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                className="pl-10 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
                className="flex items-center gap-1"
              >
                <SortAsc className="h-4 w-4" />
                <span>Sort {sortOrder === "asc" ? "↑" : "↓"}</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90 flex items-center"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>Add</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
              <TabsTrigger value="books">Books</TabsTrigger>
            </TabsList>
            <TabsContent value="notes" className="space-y-4 mt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => (
                    <Card key={note.id} className="file-card interactive-element overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleOpenDocument(note)}>
                      <div className="h-40 bg-muted flex items-center justify-center">
                        {note.type === 'pdf' && (
                          <span className="text-4xl">📄</span>
                        )}
                        {note.type === 'doc' || note.type === 'docx' && (
                          <span className="text-4xl">📝</span>
                        )}
                        {note.type === 'ppt' || note.type === 'pptx' && (
                          <span className="text-4xl">📊</span>
                        )}
                        {note.type === 'jpg' || note.type === 'jpeg' || note.type === 'png' && (
                          <span className="text-4xl">🖼️</span>
                        )}
                        {!['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'].includes(note.type) && (
                          <span className="text-4xl">📄</span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-1">{note.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.type.toUpperCase()} • {new Date(note.dateAdded).toLocaleDateString()}
                        </p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="subject-tag">
                            {note.subject}
                          </span>
                          <button 
                            className="text-muted-foreground hover:text-destructive text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-muted/30">
                  <div className="text-4xl mb-3">📄</div>
                  <h3 className="text-lg font-medium text-foreground">No notes found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {getEmptyStateMessage()}
                  </p>
                  <Button
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Note
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="flashcards" className="space-y-4 mt-6">
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <div className="text-4xl mb-3">🗂️</div>
                <h3 className="text-lg font-medium text-foreground">Flashcards Coming Soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This feature is currently under development
                </p>
              </div>
            </TabsContent>
            <TabsContent value="books" className="space-y-4 mt-6">
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-lg font-medium text-foreground">Books Integration Coming Soon</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This feature is currently under development
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={isUploadModalOpen}
        onClose={() => handleModalClose(true)}
        onFilesSelected={(files) => console.log("Files selected:", files)}
        subjectId={currentSubject}
      />
    </div>
  );
}
