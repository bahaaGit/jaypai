import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseTripSearchParams } from "@/lib/validations/trip"
import type { Prisma } from "@prisma/client"

// Public: anyone can browse PUBLISHED upcoming trips.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = parseTripSearchParams(url.searchParams)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { from, to, date, sort, maxPrice, minWeight } = parsed.data

  const where: Prisma.TripWhereInput = {
    status: "PUBLISHED",
    availableWeightLbs: { gt: 0, ...(minWeight && { gte: minWeight }) },
    departureDate: { gte: date ? new Date(`${date}T00:00:00Z`) : new Date() },
    ...(maxPrice && { pricePerLb: { lte: maxPrice } }),
    ...(from && {
      OR: [
        { originCity: { contains: from, mode: "insensitive" } },
        { originCountry: { contains: from, mode: "insensitive" } },
      ],
    }),
    ...(to && {
      AND: [
        {
          OR: [
            { destinationCity: { contains: to, mode: "insensitive" } },
            { destinationCountry: { contains: to, mode: "insensitive" } },
          ],
        },
      ],
    }),
  }

  const orderBy: Prisma.TripOrderByWithRelationInput =
    sort === "price"
      ? { pricePerLb: "asc" }
      : sort === "weight"
        ? { availableWeightLbs: "desc" }
        : { departureDate: "asc" }

  const trips = await prisma.trip.findMany({
    where,
    orderBy,
    take: 50,
    select: {
      id: true,
      originCity: true,
      originCountry: true,
      destinationCity: true,
      destinationCountry: true,
      departureDate: true,
      arrivalDate: true,
      availableWeightLbs: true,
      pricePerLb: true,
      airline: true,
      traveler: {
        select: {
          id: true,
          fullName: true,
          ratingAverage: true,
          completedTrips: true,
          isIdVerified: true,
          profilePhoto: true,
        },
      },
    },
  })

  return NextResponse.json({ trips, count: trips.length })
}
