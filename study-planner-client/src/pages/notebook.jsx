import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ArrowLeft, Search, Plus, FolderPlus, SortAsc } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { useToast } from "../components/ui/use-toast";
import UploadModal from "../components/UploadModal";
import CircularProgress from "../components/CircularProgress";
import SubjectSelector from "../components/SubjectSelector";
import { useSubjects } from "../contexts/SubjectContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";

// Sample data for notes
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
  const { subjects } = useSubjects(); // Get subjects from context
  const [activeTab, setActiveTab] = useState("notes");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Calculate overall progress across all subjects
  const overallProgress = subjects && subjects.length > 0 
    ? Math.round(subjects.reduce((sum, subject) => sum + (subject.progress || 0), 0) / subjects.length) 
    : 0;

  // Prepare subjects for the selector
  const subjectsForSelector = [
    { id: "all", name: "All Subjects" },
    ...(Array.isArray(subjects) ? subjects.map(s => ({
      id: s.id,
      name: s.name,
      documentsCount: s.documentsCount || 0
    })) : [])
  ];

  // Open a document
  const handleOpenDocument = (docId) => {
    toast({
      title: "Opening Document",
      description: "Your document is being prepared for viewing."
    });
  };

  // Resume a document
  const handleResumeDocument = (doc) => {
    toast({
      title: "Resuming",
      description: `Resuming from page ${doc.currentPage}`
    });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">StudyVerse</h1>
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
                <CircularProgress value={overallProgress} size={150} strokeWidth={10} progressColor="var(--primary)" />
                <p className="mt-4 text-sm text-muted-foreground">
                  You've completed {overallProgress}% of your study materials
                </p>
                <Button
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Material
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
              />
              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={() => setIsUploadModalOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add New Subject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">My Notebook</h2>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                      <SortAsc className="h-4 w-4" />
                    </Button>
                    <select
                      className="border rounded-md px-3 py-2 bg-background"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="dateAdded">Date Added</option>
                      <option value="title">Title</option>
                      <option value="progress">Progress</option>
                    </select>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="notes" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="notes">Notes & Documents</TabsTrigger>
                  <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                  <TabsTrigger value="summaries">AI Summaries</TabsTrigger>
                </TabsList>

                <TabsContent value="notes">
                  {subjects && subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {INITIAL_NOTES.filter(note => {
                        // Filter by selected subject
                        if (selectedSubject !== "all" && note.subject !== selectedSubject) {
                          return false;
                        }
                        // Filter by search query
                        if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                          return false;
                        }
                        return true;
                      }).sort((a, b) => {
                        // Sort based on current sort settings
                        let comparison = 0;
                        if (sortBy === "title") {
                          comparison = a.title.localeCompare(b.title);
                        } else if (sortBy === "dateAdded") {
                          comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
                        } else if (sortBy === "progress") {
                          comparison = a.progress - b.progress;
                        }
                        return sortOrder === "asc" ? comparison : -comparison;
                      }).map((note) => (
                        <Card key={note.id} className="overflow-hidden hover:shadow-md transition-shadow">
                          <div
                            className="h-32 bg-slate-100 flex items-center justify-center cursor-pointer"
                            onClick={() => handleOpenDocument(note.id)}
                          >
                            <div className="text-4xl text-slate-400 uppercase font-bold">{note.type}</div>
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium line-clamp-1">{note.title}</h3>
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">{note.type.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 mb-3">
                              <span>{new Date(note.dateAdded).toLocaleDateString()}</span>
                              <span>{note.size}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{note.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div
                                  className="bg-primary h-1.5 rounded-full"
                                  style={{ width: `${note.progress}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-500">
                                <span>
                                  Page {note.currentPage} of {note.pages}
                                </span>
                                <span>Last opened: {new Date(note.lastOpened).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-between">
                              <Button variant="outline" size="sm" onClick={() => handleOpenDocument(note.id)}>
                                Open
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResumeDocument(note)}
                              >
                                Resume
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No notes found matching your criteria</p>
                      <Button onClick={() => setIsUploadModalOpen(true)} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Note
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="flashcards">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Flashcards feature coming soon</p>
                    <Button variant="outline">Get Notified</Button>
                  </div>
                </TabsContent>

                <TabsContent value="summaries">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">AI Summaries feature coming soon</p>
                    <Button variant="outline">Get Notified</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <UploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        subjectId={currentSubject}
      />
    </div>
  );
}
