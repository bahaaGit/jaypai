import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, ArrowRight } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTripDate } from "@/components/trips/TripCard"
import { TripActions } from "./TripActions"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "bg-primary/10 text-primary",
  DRAFT: "bg-muted text-muted-foreground",
  FULL: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-destructive/10 text-destructive",
  COMPLETED: "bg-blue-100 text-blue-700",
}

export default async function MyTripsPage() {
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")

  const trips = await prisma.trip.findMany({
    where: { travelerId: current.dbUser.id },
    orderBy: { departureDate: "desc" },
    include: { _count: { select: { bookings: true } } },
  })

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="My Trips"
        right={
          <Link href="/trips/post" aria-label="Post a trip">
            <Plus className="h-5 w-5 text-primary" />
          </Link>
        }
      />
      <div className="px-4 py-4 max-w-sm mx-auto">
        {trips.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <h2 className="text-base font-semibold text-foreground">No trips yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Post your first trip and start earning from your extra luggage space.
            </p>
            <Link
              href="/trips/post"
              className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Post a Trip
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((t) => (
              <Card key={t.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>{t.originCity}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{t.destinationCity}</span>
                    </div>
                    <Badge className={cn("border-0 text-xs", STATUS_STYLE[t.status])}>
                      {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTripDate(t.departureDate.toISOString())} —{" "}
                    {formatTripDate(t.arrivalDate.toISOString())} · {t.availableWeightLbs} lbs · $
                    {t.pricePerLb}/lb
                    {t._count.bookings > 0 &&
                      ` · ${t._count.bookings} booking${t._count.bookings === 1 ? "" : "s"}`}
                  </p>
                  <TripActions
                    tripId={t.id}
                    status={t.status}
                    hasBookings={t._count.bookings > 0}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
