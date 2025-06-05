"use client"

import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Settings, Save, LogOut, Trash2, Bell, Moon, Sun, User, BookOpen, Database, RefreshCw, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/Card"
import { Switch } from "../components/ui/Switch"
import { Label } from "../components/ui/Label"
import { Slider } from "../components/ui/Slider"
import { useTheme } from "../components/ThemeProvider"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../lib/toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/Select"
import { Textarea } from "../components/ui/Textarea"

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const isDark = theme === "dark"

  // Profile settings state
  const [profileForm, setProfileForm] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    bio: user?.bio || ""
  })

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.displayName || "",
        email: user.email || "",
        bio: user.bio || ""
      })
    }
  }, [user])

  // Study preferences state
  const [studyPreferences, setStudyPreferences] = useState({
    dailyGoal: 3,
    notifications: true,
    aiSuggestions: true,
    reminderTime: "18:00",
    pomodoroLength: 25
  })

  // App settings state
  const [appSettings, setAppSettings] = useState({
    autoSave: true,
    compactView: false,
    animationsEnabled: true
  })

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { id, value } = e.target
    setProfileForm(prev => ({
      ...prev,
      [id]: value
    }))
  }

  // Handle save changes
  const handleSaveChanges = () => {
    // Here you would typically make API calls to save the changes
    // For now, we'll just show a success toast
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully",
    })
  }

  // Handle account deletion (with confirmation)
  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
        variant: "destructive"
      })
      // After API call would typically log the user out
      logout()
    }
  }

  // Handle data export
  const handleExportData = () => {
    // In a real app, this would generate a JSON file with user data
    const dummyData = {
      profile: profileForm,
      preferences: studyPreferences,
      sessions: [
        { id: 1, subject: "Mathematics", date: "2023-06-15", duration: 120 },
        { id: 2, subject: "Physics", date: "2023-06-16", duration: 90 }
      ]
    }
    
    // Create a downloadable JSON file
    const dataStr = JSON.stringify(dummyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    // Create download link and trigger click
    const a = document.createElement('a')
    a.href = url
    a.download = 'study-planner-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Data exported",
      description: "Your data has been exported successfully"
    })
  }

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
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Study
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              App
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={profileForm.name}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileForm.email}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about yourself"
                      className="min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Change Password</Label>
                    <div className="flex gap-2">
                      <Input id="password" type="password" placeholder="New password" />
                      <Button variant="outline">Update</Button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-destructive mb-2">Danger Zone</h3>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={handleDeleteAccount}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Study Preferences Tab */}
          <TabsContent value="study">
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
                  <div className="flex items-center gap-2">
                    <div className="w-[120px]">
                      <Slider 
                        defaultValue={[studyPreferences.dailyGoal]} 
                        max={8} 
                        step={0.5}
                        onValueChange={(value) => setStudyPreferences(prev => ({...prev, dailyGoal: value[0]}))}
                      />
                    </div>
                    <span className="w-8 text-center">{studyPreferences.dailyGoal}h</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pomodoro-length">Pomodoro Session Length</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration of focus sessions in minutes</p>
                  </div>
                  <Select 
                    defaultValue={studyPreferences.pomodoroLength.toString()}
                    onValueChange={(value) => setStudyPreferences(prev => ({...prev, pomodoroLength: parseInt(value)}))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="25">25 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">When to send your daily study reminder</p>
                  </div>
                  <Input 
                    type="time" 
                    id="reminder-time" 
                    className="w-[120px]" 
                    value={studyPreferences.reminderTime}
                    onChange={(e) => setStudyPreferences(prev => ({...prev, reminderTime: e.target.value}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Study Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive notifications for scheduled sessions
                    </p>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={studyPreferences.notifications} 
                    onCheckedChange={(checked) => setStudyPreferences(prev => ({...prev, notifications: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ai-suggestions">AI Suggestions</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allow AI to suggest study topics based on your notes
                    </p>
                  </div>
                  <Switch 
                    id="ai-suggestions" 
                    checked={studyPreferences.aiSuggestions} 
                    onCheckedChange={(checked) => setStudyPreferences(prev => ({...prev, aiSuggestions: checked}))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Settings Tab */}
          <TabsContent value="app">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Theme</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch id="dark-mode" checked={isDark} onCheckedChange={toggleTheme} />
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto Save</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically save changes to notes and sessions
                    </p>
                  </div>
                  <Switch 
                    id="auto-save" 
                    checked={appSettings.autoSave} 
                    onCheckedChange={(checked) => setAppSettings(prev => ({...prev, autoSave: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-view">Compact View</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Display more content with reduced padding
                    </p>
                  </div>
                  <Switch 
                    id="compact-view" 
                    checked={appSettings.compactView} 
                    onCheckedChange={(checked) => setAppSettings(prev => ({...prev, compactView: checked}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="animations">UI Animations</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Enable or disable interface animations
                    </p>
                  </div>
                  <Switch 
                    id="animations" 
                    checked={appSettings.animationsEnabled} 
                    onCheckedChange={(checked) => setAppSettings(prev => ({...prev, animationsEnabled: checked}))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Download className="h-4 w-4 mr-2 text-primary" />
                      Export Your Data
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Download all your study data as a JSON file
                    </p>
                    <Button variant="outline" onClick={handleExportData}>
                      Export Data
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 text-primary" />
                      Sync Data
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Force synchronization with the cloud
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Sync complete",
                          description: "Your data has been synchronized"
                        })
                      }}
                    >
                      Sync Now
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium text-destructive mb-2">Data Deletion</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Clear specific data from your account
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear all study sessions? This cannot be undone.")) {
                          toast({
                            title: "Sessions cleared",
                            description: "All study sessions have been deleted",
                            variant: "destructive"
                          })
                        }
                      }}
                    >
                      Clear Sessions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to clear all notes? This cannot be undone.")) {
                          toast({
                            title: "Notes cleared",
                            description: "All notes have been deleted",
                            variant: "destructive"
                          })
                        }
                      }}
                    >
                      Clear Notes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to reset all settings? This cannot be undone.")) {
                          toast({
                            title: "Settings reset",
                            description: "All settings have been reset to defaults",
                            variant: "destructive"
                          })
                        }
                      }}
                    >
                      Reset Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

