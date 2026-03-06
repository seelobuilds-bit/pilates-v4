import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const DEMO_SUBDOMAIN = process.env.DEMO_STUDIO_SUBDOMAIN || "current-demo-admin"
const DEMO_CATEGORY_NAMES = ["Reformer", "Mat", "Tower", "Programming"] as const
const DEMO_CATEGORY_ICON_MAP: Record<(typeof DEMO_CATEGORY_NAMES)[number], string> = {
  Reformer: "✨",
  Mat: "📖",
  Tower: "🎯",
  Programming: "📈",
}

async function main() {
  const demoStudio = await prisma.studio.findUnique({
    where: { subdomain: DEMO_SUBDOMAIN },
    select: { id: true, name: true, subdomain: true },
  })

  if (!demoStudio) {
    throw new Error(`Demo studio not found for subdomain ${DEMO_SUBDOMAIN}`)
  }

  const categories = await prisma.classFlowCategory.findMany({
    where: {
      name: {
        in: [...DEMO_CATEGORY_NAMES],
      },
    },
    select: {
      id: true,
      name: true,
      studioId: true,
      icon: true,
    },
  })

  for (const category of categories) {
    const nextIcon = DEMO_CATEGORY_ICON_MAP[category.name as keyof typeof DEMO_CATEGORY_ICON_MAP] ?? category.icon ?? "📚"

    await prisma.classFlowCategory.update({
      where: { id: category.id },
      data: {
        studioId: demoStudio.id,
        icon: nextIcon,
      },
    })
  }

  const studioScopedCategories = await prisma.classFlowCategory.findMany({
    where: { studioId: demoStudio.id },
    select: {
      id: true,
      name: true,
      icon: true,
      _count: {
        select: { contents: true },
      },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })

  console.log(
    JSON.stringify(
      {
        demoStudio,
        studioScopedCategories,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
