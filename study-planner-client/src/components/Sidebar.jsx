"use client"

import { useState, useEffect } from "react"
import { cn } from "../lib/utils"
import { Button } from "../components/ui/Button"
import { Notebook, Calendar, Brain, Home, Settings, Menu, X, Sun, Moon, LogOut, BarChart2, ChevronLeft, ChevronRight } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useMobile } from "../hooks/use-mobile"
import { useTheme } from "./ThemeProvider"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "./ui/Avatar"
import StudyverseLogo from "../assets/Studyverse_Logo3.png"

export default function Sidebar() {
  const location = useLocation()
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const isDark = theme === "dark"
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Add initial animation
    setAnimate(true)
    
    // Reset animation when route changes
    const timeoutId = setTimeout(() => setAnimate(false), 500)
    return () => clearTimeout(timeoutId)
  }, [location.pathname])

  useEffect(() => {
    // Load collapsed state from localStorage
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState !== null) {
      setIsCollapsed(JSON.parse(savedCollapsedState))
    }
  }, [])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    // Save to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState))
  }

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, color: "text-primary" },
    { name: "Notebook", href: "/notebook", icon: Notebook, color: "text-success" },
    { name: "Study Plan", href: "/study-plan", icon: Calendar, color: "text-accent-foreground" },
    { name: "Analytics", href: "/analytics", icon: BarChart2, color: "text-warning" },
    { name: "Settings", href: "/settings", icon: Settings, color: "text-muted-foreground" },
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-50 transition-transform hover:rotate-180 duration-300" 
          onClick={toggleSidebar}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      )}

      <aside
        className={cn(
          "sidebar flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed && !isMobile ? "w-16" : "w-64",
          isMobile && !isOpen ? "-translate-x-full fixed h-full z-40 shadow-lg" : "",
          isMobile && isOpen ? "fixed h-full z-40 shadow-lg" : "",
        )}
      >
        <div className={cn(
          "p-6 flex items-center",
          isCollapsed && !isMobile ? "justify-center" : "justify-between"
        )}>
          {(!isCollapsed || isMobile) && (
            <h1 className="text-2xl font-bold transition-all duration-500 hover:scale-105 text-gradient">
              Studyverse
            </h1>
          )}
          <div className="flex items-center space-x-2">
            {/* Only show theme toggle when sidebar is not collapsed or on mobile */}
            {(!isCollapsed || isMobile) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="transition-transform duration-500 hover:rotate-90"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun size={18} className="text-warning" /> : <Moon size={18} className="text-accent-foreground" />}
              </Button>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="transition-all duration-300 hover:bg-accent/50"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>
            )}
          </div>
        </div>

        <nav className={cn(
          "flex-1",
          isCollapsed && !isMobile ? "px-2" : "px-4",
          "space-y-1"
        )}>
          {navigation.map((item, index) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center py-3 text-sm rounded-md transition-all duration-300",
                isCollapsed && !isMobile ? "justify-center px-2" : "px-4",
                location.pathname === item.href 
                  ? "nav-link active font-medium" 
                  : "nav-link hover-lift",
                animate && location.pathname === item.href 
                  ? "animate-pulse" 
                  : ""
              )}
              style={{ 
                animationDelay: `${index * 100}ms`,
                transitionDelay: `${index * 50}ms` 
              }}
              onClick={() => isMobile && setIsOpen(false)}
              title={isCollapsed && !isMobile ? item.name : ""}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-300",
                location.pathname === item.href ? "scale-110" : "",
                isCollapsed && !isMobile ? "" : "mr-3",
                item.color
              )} />
              {(!isCollapsed || isMobile) && (
                <span className={location.pathname === item.href ? item.color : ""}>
                  {item.name}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className={cn(
          "mx-4 mb-4 rounded-lg bg-gradient bg-opacity-10 shadow-md transition-all duration-300 hover:shadow-lg",
          isCollapsed && !isMobile ? "p-2" : "p-4"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed && !isMobile ? "flex-col" : "space-x-3"
          )}>
            <Avatar className={cn(
              "transition-transform duration-300 hover:scale-110 ring-2 ring-white",
              isCollapsed && !isMobile ? "h-8 w-8 mb-2" : "h-10 w-10"
            )}>
              <AvatarFallback className="bg-gradient text-white">
                {getInitials(user?.displayName || "User")}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.displayName || "User"}</p>
                <p className="text-xs text-gray-200 truncate">{user?.email || ""}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className={cn(
                "transition-colors duration-300 hover:bg-red-100 hover:text-red-500 bg-white/20 text-white",
                isCollapsed && !isMobile ? "h-6 w-6 mt-1" : "h-8 w-8"
              )}
              title="Logout"
            >
              <LogOut className={isCollapsed && !isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

