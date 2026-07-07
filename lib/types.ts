export type StudentCategory = "Alpha" | "Beta" | "Omega"
export type EventCategory = "Alpha" | "Beta" | "Omega" | "General-A" | "General-B"
export type Team = "Auris" | "Libras"
export type PlacementType = "first" | "second" | "third"

export interface Student {
  id: string
  name: string
  category: StudentCategory
  team: Team
  chestNo: string
}

export interface Event {
  id: string
  name: string
  category: EventCategory
  stageNo: number
  isGroupEvent: boolean
  maxParticipants: number
  firstPrize: number
  secondPrize: number
  thirdPrize: number
}

export interface Registration {
  id: string
  eventId: string
  studentIds: string[]
  createdAt: string
}

export interface Result {
  id: string
  eventId: string
  registrationId: string
  placement: PlacementType
  points: number
  createdAt: string
}

export interface AppState {
  students: Student[]
  events: Event[]
  registrations: Registration[]
  results: Result[]
}
