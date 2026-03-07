import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const parsedEmail = String(credentials.email).trim().toLowerCase()
          const user = await db.user.findUnique({
            where: { email: parsedEmail },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              role: true,
              ownedStudio: {
                select: {
                  id: true,
                  name: true,
                },
              },
              teacher: {
                select: {
                  id: true,
                  studioId: true,
                  studio: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          let studioId: string | null = null
          let studioName: string | null = null
          let teacherId: string | null = null

          if (user.role === "OWNER") {
            studioId = user.ownedStudio?.id ?? null
            studioName = user.ownedStudio?.name ?? null
          }

          if (user.role === "TEACHER") {
            teacherId = user.teacher?.id ?? null
            studioId = user.teacher?.studioId ?? null
            studioName = user.teacher?.studio?.name ?? null
          }

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            studioId,
            studioName,
            teacherId,
          }
        } catch (error) {
          console.error("Credentials authorize failed:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.studioId = user.studioId
        token.studioName = user.studioName
        token.teacherId = user.teacherId
        token.isDemoSession = Boolean((user as { isDemoSession?: boolean }).isDemoSession)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.studioId = token.studioId as string | null
        session.user.studioName = token.studioName as string | null
        session.user.teacherId = token.teacherId as string | null
        session.user.isDemoSession = Boolean(token.isDemoSession)
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
