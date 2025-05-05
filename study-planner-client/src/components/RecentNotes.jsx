import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Plus, BookOpen, ChevronRight, FileText } from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

export default function RecentNotes({ animate = false }) {
  // Group notes by subject
  const subjects = [
    {
      id: "graph-theory",
      name: "Graph Theory",
      color: "#4361ee",
      notes: [
        {
          id: 1,
          title: "Graph Representation",
          date: "Today, 10:30 AM",
          tags: ["Algorithms", "Data Structures"],
        }
      ]
    },
    {
      id: "software-engineering",
      name: "Intro to software engineering",
      color: "#f72585",
      notes: [
        {
          id: 2,
          title: "SDLC Models",
          date: "Yesterday, 3:15 PM",
          tags: ["Methodologies", "Processes"],
        }
      ]
    },
    {
      id: "javascript",
      name: "JavaScript",
      color: "#4cc9f0",
      notes: [
        {
          id: 3,
          title: "Promises and Async/Await",
          date: "Mar 12, 2:45 PM",
          tags: ["JavaScript", "Async"],
        }
      ]
    }
  ]

  const [expandedSubject, setExpandedSubject] = useState(subjects[0].id);
  const [appeared, setAppeared] = useState({});

  useEffect(() => {
    if (animate) {
      // Sequentially animate subjects
      const timers = subjects.map((subject, index) => {
        return setTimeout(() => {
          setAppeared(prev => ({ ...prev, [subject.id]: true }));
        }, index * 200 + 700);
      });
      
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [animate, subjects]);

  const toggleSubject = (subjectId) => {
    setExpandedSubject(subjectId === expandedSubject ? null : subjectId);
  };

  return (
    <Card className="h-full hover-lift">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-primary" />
          Recent Notes
        </CardTitle>
        <Button size="sm" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {subjects.map((subject, subjectIndex) => (
            <div 
              key={subject.id} 
              className={`border rounded-lg overflow-hidden transition-all duration-500 ${appeared[subject.id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${subjectIndex * 100}ms` }}
            >
              <button
                onClick={() => toggleSubject(subject.id)}
                className="flex items-center justify-between w-full p-2 text-left hover:bg-accent/10 transition-colors"
                style={{ borderLeft: `3px solid ${subject.color}` }}
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" style={{ color: subject.color }} />
                  <span className="font-medium text-sm">{subject.name}</span>
                </div>
                <ChevronRight
                  className={`h-3 w-3 transition-transform duration-300 ${
                    expandedSubject === subject.id ? "transform rotate-90" : ""
                  }`}
                />
              </button>
              
              {expandedSubject === subject.id && (
                <div className="p-2 pt-0">
                  {subject.notes.map((note, noteIndex) => (
                    <Link
                      to={`/notebook/${note.id}`}
                      key={note.id}
                      className="block p-2 my-1 rounded-md border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{note.title}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

