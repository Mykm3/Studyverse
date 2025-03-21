import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Brain, ArrowRight } from "lucide-react"

export default function StudySuggestions() {
  const suggestions = [
    {
      id: 1,
      title: "Review React Hooks",
      description: "Based on your notes, you should review useEffect and useContext hooks.",
      timeEstimate: "30 min",
    },
    {
      id: 2,
      title: "Practice Tailwind CSS",
      description: "Try building a responsive navbar using Tailwind's flex utilities.",
      timeEstimate: "45 min",
    },
    {
      id: 3,
      title: "Learn about Next.js App Router",
      description: "The new App Router has different conventions than the Pages Router.",
      timeEstimate: "60 min",
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">AI Study Suggestions</CardTitle>
        <Brain className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{suggestion.title}</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {suggestion.timeEstimate}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{suggestion.description}</p>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" className="text-primary">
                  Start now
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

