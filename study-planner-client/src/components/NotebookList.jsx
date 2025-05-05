import { Card, CardContent } from "../components/ui/Card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/DropdownMenu"
import { Button } from "../components/ui/Button"
import { MoreVertical, Edit, Trash, Star } from "lucide-react"

export default function NotebookList() {
  const notes = [
    {
      id: 1,
      title: "React Component Lifecycle",
      date: "Today, 10:30 AM",
      tags: ["React", "Frontend"],
      starred: true,
    },
    {
      id: 2,
      title: "CSS Grid vs Flexbox",
      date: "Yesterday, 3:15 PM",
      tags: ["CSS", "Layout"],
      starred: false,
    },
    {
      id: 3,
      title: "JavaScript Promises",
      date: "Mar 12, 2:45 PM",
      tags: ["JavaScript", "Async"],
      starred: false,
    },
    {
      id: 4,
      title: "Vite Development Setup",
      date: "Mar 10, 11:20 AM",
      tags: ["Vite", "React"],
      starred: true,
    },
    {
      id: 5,
      title: "Tailwind CSS Best Practices",
      date: "Mar 8, 9:45 AM",
      tags: ["CSS", "Tailwind"],
      starred: false,
    },
  ]

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <Card key={note.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium text-sm">{note.title}</h3>
                  {note.starred && <Star className="ml-2 h-3 w-3 fill-yellow-400 text-yellow-400" />}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2 h-7 w-7">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="mr-2 h-4 w-4" />
                    {note.starred ? "Unstar" : "Star"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

