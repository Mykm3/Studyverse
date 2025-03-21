"use client"

import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => null,
  toggleTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "vite-ui-theme" }) {
  const [theme, setTheme] = useState(() => {
    // Check if localStorage is available and get stored theme
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(storageKey)
      // If there's a stored theme, use it; otherwise check system preference
      if (storedTheme) {
        return storedTheme
      }

      // Check for system preference if no stored theme
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark"
      }
    }
    return defaultTheme
  })

  // Apply theme whenever it changes
  useEffect(() => {
    const root = window.document.documentElement

    // Remove both theme classes
    root.classList.remove("light", "dark")

    // Add the current theme class
    root.classList.add(theme)

    // Save to localStorage
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  // Context value
  const value = {
    theme,
    setTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

