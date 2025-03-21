import { Card, CardContent } from "../components/ui/Card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/DropdownMenu"
import { Button } from "../components/ui/Button"
import { MoreVertical, Edit, Trash, Star } from "lucide-react"

export default function NotebookList() {
  const notes = [
    {
      id: 1,
      title: "React Component Lifecycle",
      excerpt:
        "Notes on mounting, updating, and unmounting phases of React components. Understanding how useEffect replaces lifecycle methods in functional components.",
      date: "Today, 10:30 AM",
      tags: ["React", "Frontend"],
      starred: true,
    },
    {
      id: 2,
      title: "CSS Grid vs Flexbox",
      excerpt:
        "Comparing the two layout systems: when to use Grid and when to use Flexbox. Grid is two-dimensional while Flexbox is one-dimensional. Grid works from the layout in, while Flexbox works from the content out.",
      date: "Yesterday, 3:15 PM",
      tags: ["CSS", "Layout"],
      starred: false,
    },
    {
      id: 3,
      title: "JavaScript Promises",
      excerpt:
        "Understanding async/await, Promise.all, and error handling in promises. Async/await is syntactic sugar over promises that makes asynchronous code look and behave more like synchronous code.",
      date: "Mar 12, 2:45 PM",
      tags: ["JavaScript", "Async"],
      starred: false,
    },
    {
      id: 4,
      title: "Vite Development Setup",
      excerpt:
        "Vite is a build tool that aims to provide a faster and leaner development experience for modern web projects. It consists of two major parts: a dev server and a build command.",
      date: "Mar 10, 11:20 AM",
      tags: ["Vite", "React"],
      starred: true,
    },
    {
      id: 5,
      title: "Tailwind CSS Best Practices",
      excerpt:
        "Tips for organizing Tailwind classes, using the @apply directive, and creating a consistent design system with Tailwind.",
      date: "Mar 8, 9:45 AM",
      tags: ["CSS", "Tailwind"],
      starred: false,
    },
  ]

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium text-lg">{note.title}</h3>
                  {note.starred && <Star className="ml-2 h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{note.excerpt}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{note.date}</span>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2">
                    <MoreVertical className="h-4 w-4" />
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

