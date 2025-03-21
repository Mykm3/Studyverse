import { Card } from "../components/ui/Card"

export default function StudyCalendar() {
  // Generate days of the week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  // Generate calendar days (simplified for demo)
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2 // Start from -2 to represent previous month days
    const hasSession = [3, 8, 12, 15, 19, 22, 27, 30].includes(day)
    const isToday = day === 14 // Assuming day 14 is today
    
    return {
      day,
      isCurrentMonth: day > 0 && day <= 31,
      hasSession,
      isToday,
    }
  })

  return (
    <Card className="p-4">
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
        
        {days.map((day, i) => (
          <div
            key={i}
            className={`
              h-24 p-1 border border-gray-200 dark:border-gray-700 rounded-md
              ${!day.isCurrentMonth ? "opacity-40" : ""}
              ${day.isToday ? "border-primary" : ""}
            `}
          >
            <div className="flex justify-between">
              <span
                className={`
                  text-sm font-medium
                  ${day.isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : ""}
                `}
              >
                {day.day > 0 ? day.day : 31 + day.day}
              </span>
              {day.hasSession && (
                <span className="h-2 w-2 rounded-full bg-primary"></span>
              )}
            </div>
            
            {day.hasSession && day.isCurrentMonth && (
              <div className="mt-2">
                <div className="text-xs bg-primary/10 text-primary p-1 rounded mb-1 truncate">
                  {day.day === 3 ? "10:00 AM - React Basics" : ""}
                  {day.day === 8 ? "2:30 PM - CSS Layout" : ""}
                  {day.day === 12 ? "9:00 AM - JavaScript" : ""}
                  {day.day === 15 ? "11:00 AM - Vite Setup" : ""}
                  {day.day === 19 ? "3:00 PM - Tailwind CSS" : ""}
                  {day.day === 22 ? "1:00 PM - React Hooks" : ""}
                  {day.day === 27 ? "10:30 AM - API Integration" : ""}
                  {day.day === 30 ? "4:00 PM - Project Work" : ""}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}