import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button"
import { Clock, Calendar, Edit, Trash } from "lucide-react"

export default function UpcomingSessions() {
  const sessions = [
    {
      id: 1,
      title: "React Hooks Deep Dive",
      date: "Today",
      time: "3:00 PM - 4:30 PM",
      topic: "React",
    },
    {
      id: 2,
      title: "CSS Grid Layout",
      date: "Tomorrow",
      time: "10:00 AM - 11:30 AM",
      topic: "CSS",
    },
    {
      id: 3,
      title: "JavaScript Promises",
      date: "Mar 18",
      time: "2:00 PM - 3:30 PM",
      topic: "JavaScript",
    },
    {
      id: 4,
      title: "Next.js App Router",
      date: "Mar 20",
      time: "11:00 AM - 12:30 PM",
      topic: "Next.js",
    },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-sm">{session.title}</h3>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive">
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex items-center space-x-3">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="mr-1 h-3 w-3" />
                  {session.date}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="mr-1 h-3 w-3" />
                  {session.time}
                </div>
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{session.topic}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

