import { describe, it, expect } from "vitest"
import { tripCreateSchema, tripUpdateSchema, canPostTrips } from "@/lib/validations/trip"

const future = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)

const valid = {
  originCity: "Seattle",
  originCountry: "USA",
  destinationCity: "Banjul",
  destinationCountry: "Gambia",
  departureDate: future(14),
  arrivalDate: future(16),
  airline: "Delta Airlines",
  availableWeightLbs: "80",
  pricePerLb: "5",
  pickupInstructions: "SeaTac Airport",
  dropoffInstructions: "Serrekunda",
  allowedItemTypes: ["Clothes", "Documents"],
}

describe("tripCreateSchema", () => {
  it("accepts a valid trip and coerces numbers", () => {
    const r = tripCreateSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.availableWeightLbs).toBe(80)
      expect(r.data.pricePerLb).toBe(5)
    }
  })

  it("rejects arrival before departure", () => {
    const r = tripCreateSchema.safeParse({
      ...valid,
      departureDate: future(16),
      arrivalDate: future(14),
    })
    expect(r.success).toBe(false)
  })

  it("rejects past departure dates", () => {
    const r = tripCreateSchema.safeParse({
      ...valid,
      departureDate: "2020-01-01",
      arrivalDate: "2020-01-02",
    })
    expect(r.success).toBe(false)
  })

  it("rejects negative price and absurd weight", () => {
    expect(tripCreateSchema.safeParse({ ...valid, pricePerLb: "-5" }).success).toBe(false)
    expect(tripCreateSchema.safeParse({ ...valid, availableWeightLbs: "500" }).success).toBe(false)
    expect(tripCreateSchema.safeParse({ ...valid, availableWeightLbs: "0" }).success).toBe(false)
  })

  it("requires at least one package type and rejects unknown types", () => {
    expect(tripCreateSchema.safeParse({ ...valid, allowedItemTypes: [] }).success).toBe(false)
    expect(
      tripCreateSchema.safeParse({ ...valid, allowedItemTypes: ["Weapons"] }).success
    ).toBe(false)
  })
})

describe("tripUpdateSchema", () => {
  it("accepts a status-only cancel", () => {
    expect(tripUpdateSchema.safeParse({ status: "CANCELLED" }).success).toBe(true)
  })

  it("rejects invalid status transitions", () => {
    expect(tripUpdateSchema.safeParse({ status: "COMPLETED" }).success).toBe(false)
  })

  it("accepts a full edit", () => {
    expect(tripUpdateSchema.safeParse(valid).success).toBe(true)
  })
})

describe("canPostTrips", () => {
  it("allows TRAVELER, BOTH, ADMIN; blocks SENDER", () => {
    expect(canPostTrips("TRAVELER")).toBe(true)
    expect(canPostTrips("BOTH")).toBe(true)
    expect(canPostTrips("ADMIN")).toBe(true)
    expect(canPostTrips("SENDER")).toBe(false)
  })
})
