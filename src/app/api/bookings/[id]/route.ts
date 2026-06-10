import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// Booking participants (sender / traveler) or admin only.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const current = await getCurrentUser()
  if (!current?.dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: {
        select: {
          originCity: true,
          originCountry: true,
          destinationCity: true,
          destinationCountry: true,
          departureDate: true,
          arrivalDate: true,
          airline: true,
        },
      },
      sender: { select: { id: true, fullName: true } },
      traveler: {
        select: { id: true, fullName: true, ratingAverage: true, isIdVerified: true },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  const me = current.dbUser
  const isParticipant =
    booking.senderId === me.id || booking.travelerId === me.id || me.role === "ADMIN"
  if (!isParticipant) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  return NextResponse.json({ booking })
}
