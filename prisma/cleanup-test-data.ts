import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function cleanupTestData() {
  console.log("🧹 Starting cleanup of test data...")
  console.log("⚠️  Keeping: HQ Admin, Demo Studio (Zenith), and demo-related data\n")

  try {
    // Find the demo studio (Zenith) to preserve
    const demoStudio = await prisma.studio.findFirst({
      where: { subdomain: "zenith" }
    })
    
    const demoStudioId = demoStudio?.id
    console.log(`📌 Demo studio ID to preserve: ${demoStudioId || "NOT FOUND"}`)

    // Find HQ admin to preserve
    const hqAdmin = await prisma.user.findFirst({
      where: { role: "HQ_ADMIN" }
    })
    console.log(`📌 HQ Admin to preserve: ${hqAdmin?.email || "NOT FOUND"}`)

    // Get all studios except demo
    const studiosToDelete = await prisma.studio.findMany({
      where: demoStudioId ? { id: { not: demoStudioId } } : {},
      select: { id: true, name: true, ownerId: true }
    })
    console.log(`\n🗑️  Studios to delete: ${studiosToDelete.length}`)
    studiosToDelete.forEach(s => console.log(`   - ${s.name}`))

    const studioIds = studiosToDelete.map(s => s.id)
    const ownerIds = studiosToDelete.map(s => s.ownerId)

    // Get teachers from these studios
    const teachersToDelete = await prisma.teacher.findMany({
      where: { studioId: { in: studioIds } },
      select: { id: true }
    })
    const teacherIds = teachersToDelete.map(t => t.id)

    // 1. HQ Messages
    if (demoStudioId) {
      const r1 = await prisma.hQMessage.deleteMany({
        where: { 
          OR: [
            { studioId: { not: demoStudioId } },
            { studioId: null }
          ]
        }
      })
      console.log(`✅ Deleted ${r1.count} HQ messages`)
    }

    // 2. Lead data
    const r2 = await prisma.leadActivity.deleteMany({})
    console.log(`✅ Deleted ${r2.count} lead activities`)
    
    const r3 = await prisma.leadTask.deleteMany({})
    console.log(`✅ Deleted ${r3.count} lead tasks`)
    
    const r4 = await prisma.lead.deleteMany({})
    console.log(`✅ Deleted ${r4.count} leads`)

    // 3. Sales agents
    const r5 = await prisma.salesAgent.deleteMany({})
    console.log(`✅ Deleted ${r5.count} sales agents`)

    if (studioIds.length > 0) {
      // 4. Studio messages
      const r6 = await prisma.message.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r6.count} studio messages`)

      // 5. Bookings
      const r7 = await prisma.booking.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r7.count} bookings`)

      // 6. Class Sessions
      const r8 = await prisma.classSession.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r8.count} class sessions`)

      // 7. Class Types
      const r9 = await prisma.classType.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r9.count} class types`)

      // 8. Teacher-related data (by teacher IDs)
      if (teacherIds.length > 0) {
        const r10 = await prisma.teacherInvoice.deleteMany({
          where: { teacherId: { in: teacherIds } }
        })
        console.log(`✅ Deleted ${r10.count} teacher invoices`)

        const r11 = await prisma.teacherPayRate.deleteMany({
          where: { teacherId: { in: teacherIds } }
        })
        console.log(`✅ Deleted ${r11.count} teacher pay rates`)

        const r12 = await prisma.teacherBlockedTime.deleteMany({
          where: { teacherId: { in: teacherIds } }
        })
        console.log(`✅ Deleted ${r12.count} teacher blocked times`)
      }

      // 9. Teachers
      const r13 = await prisma.teacher.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r13.count} teachers`)

      // 10. Clients
      const r14 = await prisma.client.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r14.count} clients`)

      // 11. Locations
      const r15 = await prisma.location.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r15.count} locations`)

      // 12. Email configs
      const r16 = await prisma.studioEmailConfig.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r16.count} email configs`)

      // 13. SMS configs
      const r17 = await prisma.studioSmsConfig.deleteMany({
        where: { studioId: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r17.count} SMS configs`)

      // 14. Studios
      const r18 = await prisma.studio.deleteMany({
        where: { id: { in: studioIds } }
      })
      console.log(`✅ Deleted ${r18.count} studios`)

      // 15. Studio owner Users
      const r19 = await prisma.user.deleteMany({
        where: {
          id: { in: ownerIds },
          role: "OWNER"
        }
      })
      console.log(`✅ Deleted ${r19.count} studio owner users`)
    }

    // 16. Delete orphaned OWNER users (those without a studio)
    const r20 = await prisma.user.deleteMany({
      where: {
        role: "OWNER",
        ownedStudio: null
      }
    })
    console.log(`✅ Deleted ${r20.count} orphaned owner users`)

    // 17. Delete SALES_AGENT users
    const r21 = await prisma.user.deleteMany({
      where: { role: "SALES_AGENT" }
    })
    console.log(`✅ Deleted ${r21.count} sales agent users`)

    console.log("\n✨ Cleanup complete!")
    
    // Show what's left
    const remainingStudios = await prisma.studio.count()
    const remainingUsers = await prisma.user.count()
    const remainingLeads = await prisma.lead.count()
    const remainingClients = await prisma.client.count()
    const remainingTeachers = await prisma.teacher.count()
    
    console.log("\n📊 Remaining data:")
    console.log(`   - Studios: ${remainingStudios}`)
    console.log(`   - Users: ${remainingUsers}`)
    console.log(`   - Leads: ${remainingLeads}`)
    console.log(`   - Clients: ${remainingClients}`)
    console.log(`   - Teachers: ${remainingTeachers}`)

  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupTestData()
