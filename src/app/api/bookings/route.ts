import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import {
  bookingCreateSchema,
  generateBookingCode,
  CAPACITY_HOLDING_STATUSES,
} from "@/lib/validations/booking"
import { calculateTotal } from "@/lib/utils"

// Create a booking request (status: PENDING_TRAVELER_ACCEPTANCE).
export async function POST(request: Request) {
  const current = await getCurrentUser()
  if (!current?.dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bookingCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const d = parsed.data

  const trip = await prisma.trip.findFirst({
    where: { id: d.tripId, status: "PUBLISHED", departureDate: { gte: new Date() } },
  })
  if (!trip) {
    return NextResponse.json(
      { error: "This trip is no longer available" },
      { status: 404 }
    )
  }
  if (trip.travelerId === current.dbUser.id) {
    return NextResponse.json({ error: "You can't book your own trip" }, { status: 403 })
  }
  if (!trip.allowedItemTypes.includes(d.itemCategory)) {
    return NextResponse.json(
      { error: `This traveler doesn't carry ${d.itemCategory.toLowerCase()}` },
      { status: 400 }
    )
  }

  // Capacity: total minus weight already reserved by active bookings.
  const reserved = await prisma.booking.aggregate({
    where: { tripId: trip.id, status: { in: [...CAPACITY_HOLDING_STATUSES] } },
    _sum: { estimatedWeightLbs: true },
  })
  const remaining = trip.availableWeightLbs - (reserved._sum.estimatedWeightLbs ?? 0)
  if (d.estimatedWeightLbs > remaining) {
    return NextResponse.json(
      {
        error:
          remaining <= 0
            ? "This trip is fully booked"
            : `Only ${remaining} lbs left on this trip`,
      },
      { status: 409 }
    )
  }

  // Server-side pricing — never trust client amounts.
  const { subtotal, serviceFee, total } = calculateTotal(
    d.estimatedWeightLbs,
    trip.pricePerLb
  )
  void subtotal

  const description = d.packageDescription
    ? `${d.itemCategory}: ${d.packageDescription}`
    : d.itemCategory

  // Retry on the (unlikely) booking-code collision.
  let booking = null
  for (let attempt = 0; attempt < 3 && !booking; attempt++) {
    try {
      booking = await prisma.booking.create({
        data: {
          bookingCode: generateBookingCode(),
          senderId: current.dbUser.id,
          travelerId: trip.travelerId,
          tripId: trip.id,
          estimatedWeightLbs: d.estimatedWeightLbs,
          pricePerLb: trip.pricePerLb,
          estimatedTotal: total,
          serviceFee,
          packageDescription: description,
          declaredValue: d.declaredValue ?? null,
          pickupPreference: d.pickupPreference,
          pickupInstructions: d.pickupInstructions || null,
          recipientName: d.recipientName,
          recipientPhone: d.recipientPhone || null,
          recipientCity: d.recipientCity || null,
          status: "PENDING_TRAVELER_ACCEPTANCE",
        },
      })
    } catch (e: unknown) {
      const isUniqueViolation =
        typeof e === "object" && e !== null && "code" in e && e.code === "P2002"
      if (!isUniqueViolation || attempt === 2) throw e
    }
  }

  return NextResponse.json({ booking }, { status: 201 })
}

// List my bookings (as sender or traveler).
export async function GET() {
  const current = await getCurrentUser()
  if (!current?.dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ senderId: current.dbUser.id }, { travelerId: current.dbUser.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      trip: {
        select: {
          originCity: true,
          destinationCity: true,
          departureDate: true,
          arrivalDate: true,
        },
      },
      sender: { select: { id: true, fullName: true } },
      traveler: { select: { id: true, fullName: true } },
    },
  })

  return NextResponse.json({ bookings, count: bookings.length })
}
