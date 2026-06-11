import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseTripSearchParams, tripCreateSchema, canPostTrips } from "@/lib/validations/trip"
import { getCurrentUser } from "@/lib/auth"
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

  const { from, to, date, sort, type, maxPrice, minWeight } = parsed.data

  const where: Prisma.TripWhereInput = {
    status: "PUBLISHED",
    availableWeightLbs: { gt: 0, ...(minWeight && { gte: minWeight }) },
    departureDate: { gte: date ? new Date(`${date}T00:00:00Z`) : new Date() },
    ...(type !== "all" && { tripType: type === "cargo" ? "CARGO" : "LUGGAGE" }),
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
      tripType: true,
      containerSize: true,
      flatPrice: true,
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

// Travelers (or BOTH/ADMIN) can publish a trip.
export async function POST(request: Request) {
  const current = await getCurrentUser()
  if (!current?.dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!canPostTrips(current.dbUser.role)) {
    return NextResponse.json(
      { error: "Only travelers can post trips. Switch your account type in Profile." },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = tripCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const d = parsed.data
  // Cargo trips are priced flat per container; derive an effective $/lb so
  // downstream weight-based logic keeps working.
  const pricePerLb =
    d.tripType === "CARGO"
      ? Math.max(0.01, Math.round((d.flatPrice! / d.availableWeightLbs) * 100) / 100)
      : d.pricePerLb!

  const trip = await prisma.trip.create({
    data: {
      travelerId: current.dbUser.id,
      tripType: d.tripType,
      containerSize: d.tripType === "CARGO" ? d.containerSize : null,
      flatPrice: d.tripType === "CARGO" ? d.flatPrice : null,
      originCity: d.originCity,
      originCountry: d.originCountry,
      destinationCity: d.destinationCity,
      destinationCountry: d.destinationCountry,
      departureDate: new Date(`${d.departureDate}T00:00:00Z`),
      arrivalDate: new Date(`${d.arrivalDate}T00:00:00Z`),
      airline: d.airline || null,
      availableWeightLbs: d.availableWeightLbs,
      pricePerLb,
      pickupInstructions: d.pickupInstructions || null,
      dropoffInstructions: d.dropoffInstructions || null,
      allowedItemTypes: d.allowedItemTypes,
      status: "PUBLISHED",
    },
  })

  return NextResponse.json({ trip }, { status: 201 })
}
