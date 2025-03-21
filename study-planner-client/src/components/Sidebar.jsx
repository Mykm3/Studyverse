"use client"

import { useState } from "react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Notebook, Calendar, Brain, Home, Settings, Menu, X, Sun, Moon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useMobile } from "../hooks/use-mobile"
import { useTheme } from "./ThemeProvider"

export default function Sidebar() {
  const location = useLocation()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
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
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-medium">JS</span>
            </div>
            <div>
              <p className="text-sm font-medium">John Smith</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Student</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

