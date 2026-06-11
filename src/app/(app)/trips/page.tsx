import Link from "next/link"
import { SearchX, Search, Luggage } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { parseTripSearchParams, canPostTrips } from "@/lib/validations/trip"
import { TripCard, type TripCardData } from "@/components/trips/TripCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { SortSelect } from "./SortSelect"
import type { Prisma } from "@prisma/client"

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v) usp.set(k, v)
  }
  const parsed = parseTripSearchParams(usp)
  const { from, to, date, sort, type, maxPrice, minWeight } = parsed.success
    ? parsed.data
    : { sort: "soonest" as const, type: "all" as const, from: undefined, to: undefined, date: undefined, maxPrice: undefined, minWeight: undefined }

  const where: Prisma.TripWhereInput = {
    status: "PUBLISHED",
    availableWeightLbs: { gt: 0, ...(minWeight && { gte: minWeight }) },
    departureDate: { gte: date ? new Date(`${date}T00:00:00Z`) : new Date() },
    ...(type !== "all" && { tripType: type === "cargo" ? ("CARGO" as const) : ("LUGGAGE" as const) }),
    ...(maxPrice && { pricePerLb: { lte: maxPrice } }),
    ...(from && {
      OR: [
        { originCity: { contains: from, mode: "insensitive" as const } },
        { originCountry: { contains: from, mode: "insensitive" as const } },
      ],
    }),
    ...(to && {
      AND: [
        {
          OR: [
            { destinationCity: { contains: to, mode: "insensitive" as const } },
            { destinationCountry: { contains: to, mode: "insensitive" as const } },
          ],
        },
      ],
    }),
  }

  const trips = await prisma.trip.findMany({
    where,
    orderBy:
      sort === "price"
        ? { pricePerLb: "asc" }
        : sort === "weight"
          ? { availableWeightLbs: "desc" }
          : { departureDate: "asc" },
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
      traveler: {
        select: {
          fullName: true,
          ratingAverage: true,
          completedTrips: true,
          isIdVerified: true,
          profilePhoto: true,
        },
      },
    },
  })

  const title = to ? `Trips to ${to}` : from ? `Trips from ${from}` : "Available Trips"
  const current = await getCurrentUser()
  const isTraveler = current?.dbUser ? canPostTrips(current.dbUser.role) : false

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={title}
        right={
          <div className="flex items-center gap-4">
            {isTraveler && (
              <Link
                href="/trips/mine"
                aria-label="My trips"
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Luggage className="h-4 w-4" /> My Trips
              </Link>
            )}
            <Link href="/trips/search" aria-label="New search">
              <Search className="h-5 w-5 text-foreground" />
            </Link>
          </div>
        }
      />
      <div className="px-4 py-4 max-w-sm mx-auto">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {trips.length} trip{trips.length === 1 ? "" : "s"} found
          </p>
          <SortSelect current={sort} />
        </div>

        {trips.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">No trips found</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Try a different route or date — new trips are posted all the time.
            </p>
            <Link
              href="/trips/search"
              className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Change search
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((t) => (
              <TripCard
                key={t.id}
                trip={
                  {
                    ...t,
                    departureDate: t.departureDate.toISOString(),
                    arrivalDate: t.arrivalDate.toISOString(),
                  } as TripCardData
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
