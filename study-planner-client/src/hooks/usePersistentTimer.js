import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Persistent Timer Hook
 * Maintains timer state across page refreshes and navigation
 */
export function usePersistentTimer(sessionId, duration) {
  const [activeTime, setActiveTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [startTime, setStartTime] = useState(null);
  const [lastPauseTime, setLastPauseTime] = useState(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  const timerRef = useRef(null);
  const activityCheckRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const storageKey = `study-session-${sessionId}`;

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (!sessionId) return;

    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        const now = Date.now();
        
        // Calculate elapsed time if timer was running
        if (state.isRunning && state.lastUpdateTime) {
          const elapsedSinceLastUpdate = Math.floor((now - state.lastUpdateTime) / 1000);
          const newActiveTime = Math.min(state.activeTime + elapsedSinceLastUpdate, duration * 60);
          const newTimeLeft = Math.max(0, (duration * 60) - newActiveTime);
          
          setActiveTime(newActiveTime);
          setTimeLeft(newTimeLeft);
          setIsRunning(state.isRunning);
          setStartTime(state.startTime);
          setTotalPausedTime(state.totalPausedTime || 0);
          
          // If timer was running and time is up, mark as complete
          if (newTimeLeft === 0) {
            setIsRunning(false);
          }
        } else {
          setActiveTime(state.activeTime || 0);
          setTimeLeft(state.timeLeft || duration * 60);
          setIsRunning(false); // Always start paused after refresh
          setStartTime(state.startTime);
          setTotalPausedTime(state.totalPausedTime || 0);
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
        initializeTimer();
      }
    } else {
      initializeTimer();
    }
  }, [sessionId, duration]);

  // Initialize timer with default values
  const initializeTimer = useCallback(() => {
    setActiveTime(0);
    setTimeLeft(duration * 60);
    setIsRunning(false);
    setStartTime(null);
    setLastPauseTime(null);
    setTotalPausedTime(0);
  }, [duration]);

  // Save timer state to localStorage
  const saveTimerState = useCallback((state) => {
    if (!sessionId) return;
    
    const stateToSave = {
      ...state,
      lastUpdateTime: Date.now(),
      sessionId,
      duration
    };
    
    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [sessionId, duration, storageKey]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Main timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setActiveTime(prev => {
          const newActiveTime = Math.min(prev + 1, duration * 60);
          setTimeLeft(Math.max(0, (duration * 60) - newActiveTime));
          return newActiveTime;
        });
      }, 1000);

      // Activity tracking - check every 5 seconds
      activityCheckRef.current = setInterval(() => {
        const now = Date.now();
        const idleTime = now - lastActivityRef.current;
        
        // Only count as active if user was active in last 10 seconds
        if (idleTime < 10000) {
          // Activity is already tracked by the main timer
        }
      }, 5000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (activityCheckRef.current) {
        clearInterval(activityCheckRef.current);
        activityCheckRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activityCheckRef.current) clearInterval(activityCheckRef.current);
    };
  }, [isRunning, timeLeft, duration]);

  // Save state whenever it changes
  useEffect(() => {
    if (sessionId) {
      saveTimerState({
        activeTime,
        timeLeft,
        isRunning,
        startTime,
        totalPausedTime
      });
    }
  }, [activeTime, timeLeft, isRunning, startTime, totalPausedTime, saveTimerState]);

  // Timer control functions
  const start = useCallback(() => {
    const now = new Date().toISOString();
    setIsRunning(true);
    setStartTime(prev => prev || now);
    
    if (lastPauseTime) {
      const pauseDuration = Date.now() - new Date(lastPauseTime).getTime();
      setTotalPausedTime(prev => prev + pauseDuration);
      setLastPauseTime(null);
    }
  }, [lastPauseTime]);

  const pause = useCallback(() => {
    setIsRunning(false);
    setLastPauseTime(new Date().toISOString());
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setActiveTime(0);
    setTimeLeft(duration * 60);
    setStartTime(null);
    setLastPauseTime(null);
    setTotalPausedTime(0);
    
    // Clear saved state
    if (sessionId) {
      localStorage.removeItem(storageKey);
    }
  }, [duration, sessionId, storageKey]);

  // Clear timer data when session ends
  const clearSession = useCallback(() => {
    if (sessionId) {
      localStorage.removeItem(storageKey);
    }
    initializeTimer();
  }, [sessionId, storageKey, initializeTimer]);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progress = Math.min(100, Math.round((activeTime / (duration * 60)) * 100));

  // Check if timer is complete
  const isComplete = timeLeft === 0 || progress >= 100;

  return {
    activeTime,
    timeLeft,
    isRunning,
    startTime,
    progress,
    isComplete,
    formatTime,
    start,
    pause,
    reset,
    clearSession,
    // Additional computed values
    totalSessionTime: duration * 60,
    effectiveStudyTime: activeTime,
    sessionDuration: startTime ? Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) - totalPausedTime / 1000 : 0
  };
}
