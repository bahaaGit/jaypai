import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TripCard, formatTripDate, initialsOf } from "@/components/trips/TripCard"
import { tripSearchSchema, parseTripSearchParams } from "@/lib/validations/trip"

const trip = {
  id: "t1",
  originCity: "Seattle",
  originCountry: "USA",
  destinationCity: "Banjul",
  destinationCountry: "Gambia",
  departureDate: "2026-06-20T00:00:00.000Z",
  arrivalDate: "2026-06-22T00:00:00.000Z",
  availableWeightLbs: 80,
  pricePerLb: 5,
  traveler: {
    fullName: "Musa Jallow",
    ratingAverage: 4.9,
    completedTrips: 120,
    isIdVerified: true,
    profilePhoto: null,
  },
}

describe("TripCard", () => {
  it("renders traveler, route, weight, price and View link", () => {
    render(<TripCard trip={trip} />)
    expect(screen.getByText("Musa Jallow")).toBeInTheDocument()
    expect(screen.getByText("Seattle")).toBeInTheDocument()
    expect(screen.getByText("Banjul")).toBeInTheDocument()
    expect(screen.getByText("80 lbs available")).toBeInTheDocument()
    expect(screen.getByText("$5 / lb")).toBeInTheDocument()
    expect(screen.getByText("4.9")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/trips/t1")
  })

  it("shows 'New' for unrated travelers", () => {
    render(
      <TripCard
        trip={{ ...trip, id: "t2", traveler: { ...trip.traveler, ratingAverage: 0, completedTrips: 0 } }}
      />
    )
    expect(screen.getByText("New")).toBeInTheDocument()
  })
})

describe("trip helpers", () => {
  it("formats dates in UTC", () => {
    expect(formatTripDate("2026-06-20T00:00:00.000Z")).toBe("Jun 20")
  })
  it("derives initials", () => {
    expect(initialsOf("Musa Jallow")).toBe("MJ")
    expect(initialsOf("Awa")).toBe("A")
  })
})

describe("tripSearchSchema", () => {
  it("defaults sort to soonest", () => {
    const r = tripSearchSchema.safeParse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.sort).toBe("soonest")
  })

  it("rejects bad date and bad sort", () => {
    expect(tripSearchSchema.safeParse({ date: "June 20" }).success).toBe(false)
    expect(tripSearchSchema.safeParse({ sort: "cheapest" }).success).toBe(false)
  })

  it("rejects negative or absurd maxPrice", () => {
    expect(tripSearchSchema.safeParse({ maxPrice: "-5" }).success).toBe(false)
    expect(tripSearchSchema.safeParse({ maxPrice: "99999" }).success).toBe(false)
  })

  it("parses URLSearchParams ignoring empty values", () => {
    const r = parseTripSearchParams(new URLSearchParams("from=Seattle&to=&date=2026-06-20"))
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.from).toBe("Seattle")
      expect(r.data.to).toBeUndefined()
      expect(r.data.date).toBe("2026-06-20")
    }
  })
})
