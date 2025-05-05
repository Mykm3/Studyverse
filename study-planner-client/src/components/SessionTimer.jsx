"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from "./ui/Button"
import { Card, CardContent } from "./ui/Card"
import { useToast } from "./ui/use-toast"

/**
 * @typedef {Object} SessionTimerProps
 * @property {number} duration - Duration in minutes
 * @property {boolean} isRunning - Whether the timer is currently running
 * @property {number} activeTime - Active time in seconds
 * @property {Function} setActiveTime - Function to update active time
 * @property {Function} onStart - Function called when timer starts
 * @property {Function} onPause - Function called when timer pauses
 * @property {Function} onResume - Function called when timer resumes
 * @property {Function} onComplete - Function called when timer completes
 */

/**
 * Session Timer Component
 * @param {SessionTimerProps} props
 */
export function SessionTimer({
  duration,
  isRunning,
  activeTime,
  setActiveTime,
  onStart,
  onPause,
  onResume,
  onComplete,
}) {
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(duration * 60) // convert to seconds
  const [showTimeLeft, setShowTimeLeft] = useState(true) // toggle between time left and time elapsed
  const timerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())
  const activityCheckRef = useRef(null)

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Check for user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Track user activity
    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("keydown", handleActivity)
    window.addEventListener("click", handleActivity)
    window.addEventListener("scroll", handleActivity)

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("scroll", handleActivity)
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1))
      }, 1000)

      // Check for activity every 5 seconds
      activityCheckRef.current = setInterval(() => {
        const now = Date.now()
        const idleTime = now - lastActivityRef.current

        // If user has been active in the last 10 seconds, count it as active time
        if (idleTime < 10000) {
          setActiveTime((prev) => prev + 5)
        }
      }, 5000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (activityCheckRef.current) clearInterval(activityCheckRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (activityCheckRef.current) clearInterval(activityCheckRef.current)
    }
  }, [isRunning, setActiveTime])

  // Check if timer has reached zero
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      onComplete()
      toast({
        title: "Time's Up!",
        description: "Your scheduled study time has ended.",
      })
    }
  }, [timeLeft, isRunning, onComplete, toast])

  const handleToggleView = () => {
    setShowTimeLeft(!showTimeLeft)
  }

  const handleReset = () => {
    setTimeLeft(duration * 60)
    setActiveTime(0)
    toast({
      title: "Timer Reset",
      description: "Your study timer has been reset.",
    })
  }

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex flex-col items-center">
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {showTimeLeft ? "Time Remaining" : "Time Elapsed"}
          </h3>
          <div className="text-3xl font-bold cursor-pointer" onClick={handleToggleView}>
            {showTimeLeft ? formatTime(timeLeft) : formatTime(activeTime)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {showTimeLeft ? `${Math.floor(activeTime / 60)} mins active` : `${Math.floor(timeLeft / 60)} mins left`}
          </p>
        </div>

        <div className="flex gap-2 w-full">
          {isRunning ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={onPause}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              className="flex-1"
              variant="default"
              size="sm"
              onClick={activeTime > 0 ? onResume : onStart}
            >
              <Play className="h-4 w-4 mr-1" />
              {activeTime > 0 ? "Resume" : "Start"}
            </Button>
          )}
          <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 