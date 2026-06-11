import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { tripUpdateSchema } from "@/lib/validations/trip"
import type { Trip, User } from "@prisma/client"

type GuardError = 401 | 403 | 404

async function ownedTrip(
  id: string
): Promise<{ error: GuardError } | { error?: never; trip: Trip; user: User }> {
  const current = await getCurrentUser()
  if (!current?.dbUser) return { error: 401 }
  const trip = await prisma.trip.findUnique({ where: { id } })
  if (!trip) return { error: 404 }
  if (trip.travelerId !== current.dbUser.id && current.dbUser.role !== "ADMIN") {
    return { error: 403 }
  }
  return { trip, user: current.dbUser }
}

const ERROR_BODY = {
  401: { error: "Unauthorized" },
  403: { error: "You can only manage your own trips" },
  404: { error: "Trip not found" },
}

// Public: single PUBLISHED trip with traveler info.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const trip = await prisma.trip.findFirst({
    where: { id, status: "PUBLISHED" },
    select: {
      id: true,
      originCity: true,
      originCountry: true,
      destinationCity: true,
      destinationCountry: true,
      departureDate: true,
      arrivalDate: true,
      airline: true,
      tripType: true,
      containerSize: true,
      flatPrice: true,
      availableWeightLbs: true,
      pricePerLb: true,
      pickupInstructions: true,
      dropoffInstructions: true,
      allowedItemTypes: true,
      traveler: {
        select: {
          id: true,
          fullName: true,
          ratingAverage: true,
          completedTrips: true,
          isIdVerified: true,
          profilePhoto: true,
          city: true,
          country: true,
        },
      },
    },
  })

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 })
  }

  return NextResponse.json({ trip })
}

// Owner (or admin) can edit fields or change status (cancel / publish).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await ownedTrip(id)
  if (result.error) {
    return NextResponse.json(ERROR_BODY[result.error], { status: result.error })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = tripUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const d = parsed.data
  const data =
    "status" in d
      ? { status: d.status }
      : {
          tripType: d.tripType,
          containerSize: d.tripType === "CARGO" ? (d.containerSize ?? null) : null,
          flatPrice: d.tripType === "CARGO" ? (d.flatPrice ?? null) : null,
          originCity: d.originCity,
          originCountry: d.originCountry,
          destinationCity: d.destinationCity,
          destinationCountry: d.destinationCountry,
          departureDate: new Date(`${d.departureDate}T00:00:00Z`),
          arrivalDate: new Date(`${d.arrivalDate}T00:00:00Z`),
          airline: d.airline || null,
          availableWeightLbs: d.availableWeightLbs,
          pricePerLb:
            d.tripType === "CARGO"
              ? Math.max(0.01, Math.round((d.flatPrice! / d.availableWeightLbs) * 100) / 100)
              : d.pricePerLb!,
          pickupInstructions: d.pickupInstructions || null,
          dropoffInstructions: d.dropoffInstructions || null,
          allowedItemTypes: d.allowedItemTypes,
        }

  const trip = await prisma.trip.update({ where: { id }, data })
  return NextResponse.json({ trip })
}

// Owner (or admin) can delete a trip that has no bookings.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await ownedTrip(id)
  if (result.error) {
    return NextResponse.json(ERROR_BODY[result.error], { status: result.error })
  }

  const bookings = await prisma.booking.count({ where: { tripId: id } })
  if (bookings > 0) {
    return NextResponse.json(
      { error: "This trip has bookings — cancel it instead of deleting" },
      { status: 409 }
    )
  }

  await prisma.trip.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
