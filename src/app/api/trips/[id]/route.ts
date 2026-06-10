import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
