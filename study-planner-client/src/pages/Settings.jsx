"use client"

import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Settings, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Switch } from "../components/ui/Switch"
import { Label } from "../components/ui/Label"
import { Slider } from "../components/ui/Slider"
import { useTheme } from "../components/ThemeProvider"
import { useState } from "react"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  // State for other switches
  const [notifications, setNotifications] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState(true)

  return (
    <main
      className="flex-1 overflow-auto"
      style={{ backgroundColor: "var(--background-color)", color: "var(--foreground-color)" }}
    >
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Settings className="mr-2 h-6 w-6 text-primary" />
              Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400">Customize your study experience</p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="John Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" defaultValue="Computer Science student" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-goal">Daily Study Goal</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Target hours of study per day</p>
                </div>
                <div className="w-[120px]">
                  <Slider defaultValue={[3]} max={8} step={0.5} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Study Reminders</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications for scheduled sessions
                  </p>
                </div>
                <Switch id="notifications" checked={notifications} onChange={() => setNotifications(!notifications)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
                </div>
                <Switch id="dark-mode" checked={isDark} onChange={toggleTheme} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-suggestions">AI Suggestions</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow AI to suggest study topics based on your notes
                  </p>
                </div>
                <Switch id="ai-suggestions" checked={aiSuggestions} onChange={() => setAiSuggestions(!aiSuggestions)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

