import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Package } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTripDate } from "@/components/trips/TripCard"
import { formatCurrency, cn } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  PENDING_TRAVELER_ACCEPTANCE: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-destructive/10 text-destructive",
  DISPUTED: "bg-destructive/10 text-destructive",
  DELIVERED: "bg-primary/10 text-primary",
}

function statusLabel(s: string) {
  if (s === "PENDING_TRAVELER_ACCEPTANCE") return "Pending"
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ")
}

export default async function BookingsPage() {
  const current = await getCurrentUser()
  if (!current?.dbUser) redirect("/login")
  const me = current.dbUser

  const bookings = await prisma.booking.findMany({
    where: { OR: [{ senderId: me.id }, { travelerId: me.id }] },
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
      sender: { select: { fullName: true } },
      traveler: { select: { fullName: true } },
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 max-w-sm mx-auto">
        <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
      </div>
      <div className="px-4 max-w-sm mx-auto">
        {bookings.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">No bookings yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Find a trip and book space for your first package.
            </p>
            <Link
              href="/trips/search"
              className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Find a Trip
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const iAmSender = b.senderId === me.id
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                  <Card className="rounded-xl transition-colors active:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <span>{b.trip.originCity}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span>{b.trip.destinationCity}</span>
                        </div>
                        <Badge
                          className={cn(
                            "border-0 text-xs",
                            STATUS_STYLE[b.status] ?? "bg-primary/10 text-primary"
                          )}
                        >
                          {statusLabel(b.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {iAmSender
                          ? `Traveler: ${b.traveler.fullName}`
                          : `Sender: ${b.sender.fullName}`}{" "}
                        · {formatTripDate(b.trip.departureDate.toISOString())} —{" "}
                        {formatTripDate(b.trip.arrivalDate.toISOString())}
                      </p>
                      <p className="mt-1 text-xs font-medium text-foreground">
                        {b.bookingCode} · {b.estimatedWeightLbs} lbs ·{" "}
                        {formatCurrency(b.finalTotal ?? b.estimatedTotal)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
