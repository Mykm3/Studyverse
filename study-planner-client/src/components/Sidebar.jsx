"use client"

import { useState } from "react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Notebook, Calendar, Brain, Home, Settings, Menu, X, Sun, Moon, LogOut } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useMobile } from "../hooks/use-mobile"
import { useTheme } from "./ThemeProvider"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "./ui/Avatar"

export default function Sidebar() {
  const location = useLocation()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const isDark = theme === "dark"

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Notebook", href: "/notebook", icon: Notebook },
    { name: "Study Plan", href: "/study-plan", icon: Calendar },
    { name: "AI Assistant", href: "/ai-assistant", icon: Brain },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      {isMobile && (
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50" onClick={toggleSidebar}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      )}

      <aside
        className={cn(
          "sidebar w-64 flex flex-col transition-all duration-300 ease-in-out",
          isMobile && !isOpen ? "-translate-x-full fixed h-full z-40" : "",
          isMobile && isOpen ? "fixed h-full z-40" : "",
        )}
      >
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
            Studyverse
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                location.pathname === item.href ? "nav-link active font-medium" : "nav-link",
              )}
              onClick={() => isMobile && setIsOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary">
                {getInitials(user?.displayName || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

