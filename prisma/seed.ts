import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create HQ Admin
  const hqPassword = await bcrypt.hash("admin123", 10)
  const hqAdmin = await prisma.user.upsert({
    where: { email: "admin@cadence.com" },
    update: {},
    create: {
      email: "admin@cadence.com",
      password: hqPassword,
      firstName: "Admin",
      lastName: "User",
      role: Role.HQ_ADMIN,
    },
  })

  // Create Sales Agents
  const salesAgent1 = await prisma.user.upsert({
    where: { email: "alex@current.com" },
    update: {},
    create: {
      email: "alex@current.com",
      password: hqPassword,
      firstName: "Alex",
      lastName: "Turner",
      role: Role.HQ_ADMIN,
    },
  })

  const salesAgent2 = await prisma.user.upsert({
    where: { email: "jamie@current.com" },
    update: {},
    create: {
      email: "jamie@current.com",
      password: hqPassword,
      firstName: "Jamie",
      lastName: "Rivera",
      role: Role.HQ_ADMIN,
    },
  })

  // Create SalesAgent profiles
  await prisma.salesAgent.upsert({
    where: { userId: hqAdmin.id },
    update: {},
    create: {
      userId: hqAdmin.id,
      title: "Sales Director",
      phone: "(555) 100-0001",
    },
  })

  await prisma.salesAgent.upsert({
    where: { userId: salesAgent1.id },
    update: {},
    create: {
      userId: salesAgent1.id,
      title: "Account Executive",
      phone: "(555) 100-0002",
    },
  })

  await prisma.salesAgent.upsert({
    where: { userId: salesAgent2.id },
    update: {},
    create: {
      userId: salesAgent2.id,
      title: "Sales Representative",
      phone: "(555) 100-0003",
    },
  })

  // Studio data
  const studios = [
    { name: "Zenith Pilates", subdomain: "zenith", city: "San Francisco", state: "CA" },
    { name: "Harmony Studio", subdomain: "harmony", city: "Los Angeles", state: "CA" },
    { name: "Balance & Flow", subdomain: "balance", city: "New York", state: "NY" },
    { name: "Core Strength", subdomain: "core", city: "Chicago", state: "IL" },
    { name: "Pure Motion", subdomain: "pure", city: "Austin", state: "TX" },
  ]

  const classTypes = [
    { name: "Mat Pilates", description: "Classic mat-based Pilates class", duration: 60, price: 30, capacity: 12 },
    { name: "Reformer", description: "Pilates using reformer machines", duration: 55, price: 45, capacity: 8 },
    { name: "Tower Class", description: "Pilates using wall tower equipment", duration: 50, price: 40, capacity: 6 },
    { name: "Beginner Pilates", description: "Perfect for newcomers", duration: 45, price: 25, capacity: 15 },
    { name: "Advanced Flow", description: "Challenging advanced-level class", duration: 75, price: 50, capacity: 10 },
  ]

  const teacherNames = [
    { first: "Sarah", last: "Johnson" },
    { first: "Michael", last: "Chen" },
    { first: "Emily", last: "Davis" },
    { first: "James", last: "Wilson" },
    { first: "Lisa", last: "Anderson" },
  ]

  const clientNames = [
    { first: "Alice", last: "Brown" },
    { first: "Bob", last: "Taylor" },
    { first: "Carol", last: "Martinez" },
    { first: "David", last: "Garcia" },
    { first: "Emma", last: "Rodriguez" },
    { first: "Frank", last: "Lee" },
    { first: "Grace", last: "Kim" },
    { first: "Henry", last: "Park" },
  ]

  for (const studioData of studios) {
    console.log(`Creating ${studioData.name}...`)

    // Create owner
    const ownerPassword = await bcrypt.hash("owner123", 10)
    const owner = await prisma.user.create({
      data: {
        email: `owner@${studioData.subdomain}.com`,
        password: ownerPassword,
        firstName: "Studio",
        lastName: "Owner",
        role: Role.OWNER,
      },
    })

    // Create studio
    const studio = await prisma.studio.create({
      data: {
        name: studioData.name,
        subdomain: studioData.subdomain,
        ownerId: owner.id,
      },
    })

    // Create locations
    const locations = await Promise.all([
      prisma.location.create({
        data: {
          name: "Downtown Studio",
          address: "123 Main Street",
          city: studioData.city,
          state: studioData.state,
          zipCode: "10001",
          studioId: studio.id,
        },
      }),
      prisma.location.create({
        data: {
          name: "Westside Location",
          address: "456 West Avenue",
          city: studioData.city,
          state: studioData.state,
          zipCode: "10002",
          studioId: studio.id,
        },
      }),
    ])

    // Create class types
    const createdClassTypes = await Promise.all(
      classTypes.map((ct) =>
        prisma.classType.create({
          data: {
            ...ct,
            studioId: studio.id,
          },
        })
      )
    )

    // Create teachers
    const teachers = await Promise.all(
      teacherNames.slice(0, 3).map(async (name) => {
        const teacherPassword = await bcrypt.hash("teacher123", 10)
        const user = await prisma.user.create({
          data: {
            email: `${name.first.toLowerCase()}@${studioData.subdomain}.com`,
            password: teacherPassword,
            firstName: name.first,
            lastName: name.last,
            role: Role.TEACHER,
          },
        })
        return prisma.teacher.create({
          data: {
            userId: user.id,
            studioId: studio.id,
            specialties: ["Mat Pilates", "Reformer"],
          },
        })
      })
    )

    // Create clients
    const clientPassword = await bcrypt.hash("client123", 10)
    await Promise.all(
      clientNames.map((name) =>
        prisma.client.create({
          data: {
            email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@email.com`,
            password: clientPassword,
            firstName: name.first,
            lastName: name.last,
            studioId: studio.id,
          },
        })
      )
    )

    // Create class sessions for the next 15 days
    const timeSlots = [
      { hour: 6, minute: 0 },
      { hour: 8, minute: 0 },
      { hour: 9, minute: 30 },
      { hour: 11, minute: 0 },
      { hour: 13, minute: 0 },
      { hour: 15, minute: 30 },
      { hour: 17, minute: 0 },
      { hour: 18, minute: 30 },
      { hour: 20, minute: 0 },
    ]

    for (let day = 0; day < 15; day++) {
      const date = new Date()
      date.setDate(date.getDate() + day)

      for (const location of locations) {
        for (const slot of timeSlots) {
          const classType = createdClassTypes[Math.floor(Math.random() * createdClassTypes.length)]
          const teacher = teachers[Math.floor(Math.random() * teachers.length)]

          const startTime = new Date(date)
          startTime.setHours(slot.hour, slot.minute, 0, 0)

          const endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + classType.duration)

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

    console.log(`Created ${studioData.name} with ${locations.length} locations, ${teachers.length} teachers, ${clientNames.length} clients`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
