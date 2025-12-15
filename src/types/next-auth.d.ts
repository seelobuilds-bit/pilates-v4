import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      firstName: string
      lastName: string
      studioId: string | null
      studioName: string | null
      teacherId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    firstName: string
    lastName: string
    studioId: string | null
    studioName: string | null
    teacherId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    firstName: string
    lastName: string
    studioId: string | null
    studioName: string | null
    teacherId: string | null
  }
}



