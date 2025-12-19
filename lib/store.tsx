"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { AppState, Student, Event, Registration, Result } from "./types"

const initialState: AppState = {
  students: [],
  events: [],
  registrations: [],
  results: [],
}

interface StoreContextType {
  state: AppState
  addStudent: (student: Omit<Student, "id">) => void
  updateStudent: (id: string, student: Partial<Student>) => void
  deleteStudent: (id: string) => void
  addEvent: (event: Omit<Event, "id">) => void
  updateEvent: (id: string, event: Partial<Event>) => void
  deleteEvent: (id: string) => void
  addRegistration: (registration: Omit<Registration, "id" | "createdAt">) => void
  deleteRegistration: (id: string) => void
  addResult: (result: Omit<Result, "id" | "createdAt">) => void
  deleteResult: (id: string) => void
  getTeamScore: (team: string) => number
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("optimus-data")
    if (saved) {
      setState(JSON.parse(saved))
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("optimus-data", JSON.stringify(state))
    }
  }, [state, isLoaded])

  const generateId = () => crypto.randomUUID()

  const addStudent = useCallback((student: Omit<Student, "id">) => {
    setState((prev) => ({
      ...prev,
      students: [...prev.students, { ...student, id: generateId() }],
    }))
  }, [])

  const updateStudent = useCallback((id: string, student: Partial<Student>) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...student } : s)),
    }))
  }, [])

  const deleteStudent = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }))
  }, [])

  const addEvent = useCallback((event: Omit<Event, "id">) => {
    setState((prev) => ({
      ...prev,
      events: [...prev.events, { ...event, id: generateId() }],
    }))
  }, [])

  const updateEvent = useCallback((id: string, event: Partial<Event>) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === id ? { ...e, ...event } : e)),
    }))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
      registrations: prev.registrations.filter((r) => r.eventId !== id),
      results: prev.results.filter((r) => {
        const reg = prev.registrations.find((reg) => reg.id === r.registrationId)
        return reg?.eventId !== id
      }),
    }))
  }, [])

  const addRegistration = useCallback((registration: Omit<Registration, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      registrations: [
        ...prev.registrations,
        { ...registration, id: generateId(), createdAt: new Date().toISOString() },
      ],
    }))
  }, [])

  const deleteRegistration = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      registrations: prev.registrations.filter((r) => r.id !== id),
      results: prev.results.filter((r) => r.registrationId !== id),
    }))
  }, [])

  const addResult = useCallback((result: Omit<Result, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      results: [...prev.results, { ...result, id: generateId(), createdAt: new Date().toISOString() }],
    }))
  }, [])

  const deleteResult = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      results: prev.results.filter((r) => r.id !== id),
    }))
  }, [])

  const getTeamScore = useCallback(
    (team: string) => {
      return state.results.reduce((total, result) => {
        const registration = state.registrations.find((r) => r.id === result.registrationId)
        if (!registration) return total
        const student = state.students.find((s) => s.id === registration.studentIds[0])
        if (student?.team === team) {
          return total + result.points
        }
        return total
      }, 0)
    },
    [state.results, state.registrations, state.students],
  )

  if (!isLoaded) {
    return null
  }

  return (
    <StoreContext.Provider
      value={{
        state,
        addStudent,
        updateStudent,
        deleteStudent,
        addEvent,
        updateEvent,
        deleteEvent,
        addRegistration,
        deleteRegistration,
        addResult,
        deleteResult,
        getTeamScore,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
