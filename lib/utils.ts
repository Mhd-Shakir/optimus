import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { StudentCategory, EventCategory } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEligibleStudentCategories(eventCategory: EventCategory): StudentCategory[] {
  switch (eventCategory) {
    case "Alpha":
      return ["Alpha"]
    case "Beta":
      return ["Beta"]
    case "Omega":
      return ["Omega"]
    case "General-A":
      // General-A is for Beta and Omega students
      return ["Beta", "Omega"]
    case "General-B":
      // General-B is for Alpha students
      return ["Alpha"]
    default:
      return []
  }
}

export function isStudentEligibleForEvent(studentCategory: StudentCategory, eventCategory: EventCategory): boolean {
  return getEligibleStudentCategories(eventCategory).includes(studentCategory)
}
