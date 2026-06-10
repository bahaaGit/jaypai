import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { onboardingSchema } from "@/lib/validations/auth"

export async function POST(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { fullName, role, city, country } = parsed.data

  const user = await prisma.user.upsert({
    where: { supabaseId: authUser.id },
    update: {
      fullName,
      role,
      city: city || null,
      country: country || null,
    },
    create: {
      supabaseId: authUser.id,
      fullName,
      role,
      email: authUser.email ?? null,
      phone: authUser.phone || null,
      isEmailVerified: !!authUser.email_confirmed_at,
      isPhoneVerified: !!authUser.phone_confirmed_at,
      city: city || null,
      country: country || null,
    },
  })

  return NextResponse.json({ user }, { status: 201 })
}
