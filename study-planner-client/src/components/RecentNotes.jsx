import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Plus, FileText, ChevronRight } from "lucide-react"
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

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary" />
          Recent Notes
        </CardTitle>
        <Link to="/notebook">
          <Button size="sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {subjects.map((subject) => (
          <div key={subject.id} className="mb-6">
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer"
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
            >
              <h3 className="font-medium flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: subject.color }}
                ></div>
                {subject.name}
              </h3>
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${expandedSubject === subject.id ? "transform rotate-90" : ""}`}
              />
            </div>
            
            {expandedSubject === subject.id && (
              <div className="space-y-2">
                {subject.notes.map((note) => (
                  <Link 
                    key={note.id}
                    to={`/notebook/${note.id}`}
                    className="block border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium">{note.title}</h4>
                      <span className="text-xs text-muted-foreground">{note.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground"
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
      </CardContent>
    </Card>
  )
}

