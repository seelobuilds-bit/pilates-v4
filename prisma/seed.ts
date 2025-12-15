import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create HQ Admin
  const hashedPassword = await bcrypt.hash("admin123", 10)
  
  const hqAdmin = await prisma.user.upsert({
    where: { email: "admin@pilates.app" },
    update: {},
    create: {
      email: "admin@pilates.app",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "HQ_ADMIN",
    },
  })
  console.log("Created HQ Admin:", hqAdmin.email)

  // Create Studios with owners
  const studios = [
    { name: "Zenith Pilates", subdomain: "zenith", ownerEmail: "owner@zenithpilates.com", ownerFirst: "Sarah", ownerLast: "Johnson" },
    { name: "Core Balance Studio", subdomain: "corebalance", ownerEmail: "owner@corebalance.com", ownerFirst: "Michael", ownerLast: "Chen" },
    { name: "Movement Lab", subdomain: "movementlab", ownerEmail: "owner@movementlab.com", ownerFirst: "Emma", ownerLast: "Williams" },
    { name: "Flow Studio", subdomain: "flow", ownerEmail: "owner@flowstudio.com", ownerFirst: "David", ownerLast: "Martinez" },
    { name: "Pure Pilates", subdomain: "pure", ownerEmail: "owner@purepilates.com", ownerFirst: "Lisa", ownerLast: "Anderson" },
  ]

  const ownerPassword = await bcrypt.hash("password123", 10)

  for (const studioData of studios) {
    // Create owner
    const owner = await prisma.user.upsert({
      where: { email: studioData.ownerEmail },
      update: {},
      create: {
        email: studioData.ownerEmail,
        password: ownerPassword,
        firstName: studioData.ownerFirst,
        lastName: studioData.ownerLast,
        role: "OWNER",
      },
    })

    // Create studio
    const studio = await prisma.studio.upsert({
      where: { subdomain: studioData.subdomain },
      update: {},
      create: {
        name: studioData.name,
        subdomain: studioData.subdomain,
        ownerId: owner.id,
        email: studioData.ownerEmail,
        primaryColor: "#7c3aed",
      },
    })
    console.log("Created studio:", studio.name)

    // Create locations
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          studioId: studio.id,
          name: "Downtown",
          address: "123 Main Street",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90001",
          phone: "(555) 123-4567",
        },
      }),
      prisma.location.create({
        data: {
          studioId: studio.id,
          name: "Westside",
          address: "456 Ocean Blvd",
          city: "Santa Monica",
          state: "CA",
          zipCode: "90401",
          phone: "(555) 234-5678",
        },
      }),
    ])
    console.log(`Created ${locations.length} locations for ${studio.name}`)

    // Create teachers
    const teacherNames = [
      { first: "Jessica", last: "Taylor" },
      { first: "Ryan", last: "Brown" },
      { first: "Amanda", last: "Davis" },
    ]

    const teachers = []
    for (const name of teacherNames) {
      const teacherEmail = `${name.first.toLowerCase()}.${name.last.toLowerCase()}@${studioData.subdomain}.com`
      const teacherUser = await prisma.user.upsert({
        where: { email: teacherEmail },
        update: {},
        create: {
          email: teacherEmail,
          password: ownerPassword,
          firstName: name.first,
          lastName: name.last,
          role: "TEACHER",
        },
      })

      const teacher = await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          studioId: studio.id,
          bio: `Certified Pilates instructor with years of experience`,
          specialties: ["Mat Pilates", "Reformer", "Prenatal"],
        },
      })
      teachers.push(teacher)
    }
    console.log(`Created ${teachers.length} teachers for ${studio.name}`)

    // Create class types
    const classTypes = await Promise.all([
      prisma.classType.create({
        data: {
          studioId: studio.id,
          name: "Mat Pilates",
          description: "Classic mat-based Pilates workout",
          duration: 60,
          capacity: 12,
          price: 30,
        },
      }),
      prisma.classType.create({
        data: {
          studioId: studio.id,
          name: "Reformer",
          description: "Machine-based Pilates for all levels",
          duration: 55,
          capacity: 8,
          price: 45,
        },
      }),
      prisma.classType.create({
        data: {
          studioId: studio.id,
          name: "Tower Class",
          description: "Full body workout using the tower",
          duration: 50,
          capacity: 6,
          price: 40,
        },
      }),
      prisma.classType.create({
        data: {
          studioId: studio.id,
          name: "Stretch & Restore",
          description: "Gentle stretching and recovery",
          duration: 45,
          capacity: 15,
          price: 25,
        },
      }),
    ])
    console.log(`Created ${classTypes.length} class types for ${studio.name}`)

    // Create class sessions for the next 15 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let dayOffset = 0; dayOffset < 15; dayOffset++) {
      const sessionDate = new Date(today)
      sessionDate.setDate(today.getDate() + dayOffset)

      // Create sessions for each location, class type, and time slot
      for (const location of locations) {
        for (const classType of classTypes) {
          const times = ["09:00", "11:00", "14:00", "17:00", "19:00"]
          
          for (const time of times) {
            const [hours, minutes] = time.split(":").map(Number)
            const startTime = new Date(sessionDate)
            startTime.setHours(hours, minutes, 0, 0)

            const endTime = new Date(startTime)
            endTime.setMinutes(endTime.getMinutes() + classType.duration)

            // Rotate through teachers
            const teacher = teachers[Math.floor(Math.random() * teachers.length)]

            await prisma.classSession.create({
              data: {
                studioId: studio.id,
                classTypeId: classType.id,
                teacherId: teacher.id,
                locationId: location.id,
                startTime,
                endTime,
                capacity: classType.capacity,
              },
            })
          }
        }
      }
    }
    console.log(`Created class sessions for ${studio.name}`)

    // Create clients
    const clientPassword = await bcrypt.hash("client123", 10)
    const clientNames = [
      { first: "Alice", last: "Smith" },
      { first: "Bob", last: "Johnson" },
      { first: "Carol", last: "Williams" },
      { first: "Dan", last: "Brown" },
      { first: "Eve", last: "Davis" },
    ]

    for (const name of clientNames) {
      const clientEmail = `${name.first.toLowerCase()}@example.com`
      await prisma.client.upsert({
        where: {
          email_studioId: { email: clientEmail, studioId: studio.id }
        },
        update: {},
        create: {
          email: clientEmail,
          password: clientPassword,
          firstName: name.first,
          lastName: name.last,
          studioId: studio.id,
        },
      })
    }
    console.log(`Created clients for ${studio.name}`)
  }

  console.log("Seeding completed!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

