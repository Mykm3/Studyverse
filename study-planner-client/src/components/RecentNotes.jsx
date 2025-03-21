import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { Plus } from "lucide-react"
import { Link } from "react-router-dom"

export default function RecentNotes() {
  const notes = [
    {
      id: 1,
      title: "React Component Lifecycle",
      excerpt: "Notes on mounting, updating, and unmounting phases of React components...",
      date: "Today, 10:30 AM",
      tags: ["React", "Frontend"],
    },
    {
      id: 2,
      title: "CSS Grid vs Flexbox",
      excerpt: "Comparing the two layout systems: when to use Grid and when to use Flexbox...",
      date: "Yesterday, 3:15 PM",
      tags: ["CSS", "Layout"],
    },
    {
      id: 3,
      title: "JavaScript Promises",
      excerpt: "Understanding async/await, Promise.all, and error handling in promises...",
      date: "Mar 12, 2:45 PM",
      tags: ["JavaScript", "Async"],
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Notes</CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          New Note
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notes.map((note) => (
            <Link
              to={`/notebook/${note.id}`}
              key={note.id}
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{note.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{note.excerpt}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

