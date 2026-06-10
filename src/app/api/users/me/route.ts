import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { profileUpdateSchema } from "@/lib/validations/auth"

export async function GET() {
  const current = await getCurrentUser()
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!current.dbUser) {
    return NextResponse.json({ error: "Not onboarded" }, { status: 404 })
  }
  return NextResponse.json({ user: current.dbUser })
}

export async function PATCH(request: Request) {
  const current = await getCurrentUser()
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!current.dbUser) {
    return NextResponse.json({ error: "Not onboarded" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { fullName, role, city, country, profilePhoto } = parsed.data

  const user = await prisma.user.update({
    where: { id: current.dbUser.id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(role !== undefined && { role }),
      ...(city !== undefined && { city: city || null }),
      ...(country !== undefined && { country: country || null }),
      ...(profilePhoto !== undefined && { profilePhoto: profilePhoto || null }),
    },
  })

  return NextResponse.json({ user })
}
