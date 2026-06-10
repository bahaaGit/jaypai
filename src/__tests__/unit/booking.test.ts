import { describe, it, expect } from "vitest"
import {
  bookingCreateSchema,
  generateBookingCode,
  CAPACITY_HOLDING_STATUSES,
} from "@/lib/validations/booking"

const valid = {
  tripId: "trip1",
  estimatedWeightLbs: "25",
  itemCategory: "Clothes",
  packageDescription: "Men's clothes, shoes, and gifts.",
  declaredValue: "150",
  pickupPreference: "MEET_IN_PERSON",
  pickupInstructions: "Available after 5PM",
  recipientName: "Fatou Njie",
  recipientPhone: "+2201234567",
  recipientCity: "Serrekunda",
}

describe("bookingCreateSchema", () => {
  it("accepts a valid booking and coerces numbers", () => {
    const r = bookingCreateSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.estimatedWeightLbs).toBe(25)
      expect(r.data.declaredValue).toBe(150)
    }
  })

  it("requires recipient name", () => {
    expect(bookingCreateSchema.safeParse({ ...valid, recipientName: "" }).success).toBe(false)
    expect(bookingCreateSchema.safeParse({ ...valid, recipientName: "F" }).success).toBe(false)
  })

  it("rejects zero, negative and absurd weights", () => {
    expect(bookingCreateSchema.safeParse({ ...valid, estimatedWeightLbs: "0" }).success).toBe(false)
    expect(bookingCreateSchema.safeParse({ ...valid, estimatedWeightLbs: "-5" }).success).toBe(false)
    expect(bookingCreateSchema.safeParse({ ...valid, estimatedWeightLbs: "500" }).success).toBe(false)
  })

  it("rejects unknown categories and pickup preferences", () => {
    expect(bookingCreateSchema.safeParse({ ...valid, itemCategory: "Weapons" }).success).toBe(false)
    expect(bookingCreateSchema.safeParse({ ...valid, pickupPreference: "TELEPORT" }).success).toBe(false)
  })

  it("allows optional fields to be empty", () => {
    const r = bookingCreateSchema.safeParse({
      tripId: "t",
      estimatedWeightLbs: "10",
      itemCategory: "Documents",
      pickupPreference: "HOME_PICKUP",
      recipientName: "Awa Ceesay",
      packageDescription: "",
      recipientPhone: "",
      recipientCity: "",
      pickupInstructions: "",
    })
    expect(r.success).toBe(true)
  })
})

describe("generateBookingCode", () => {
  it("produces JP-YYYY-###### format", () => {
    const code = generateBookingCode(new Date("2026-06-10T00:00:00Z"))
    expect(code).toMatch(/^JP-2026-\d{6}$/)
  })

  it("varies between calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateBookingCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe("CAPACITY_HOLDING_STATUSES", () => {
  it("excludes terminal states", () => {
    expect(CAPACITY_HOLDING_STATUSES).not.toContain("CANCELLED")
    expect(CAPACITY_HOLDING_STATUSES).not.toContain("DELIVERED")
    expect(CAPACITY_HOLDING_STATUSES).not.toContain("DISPUTED")
    expect(CAPACITY_HOLDING_STATUSES).toContain("PENDING_TRAVELER_ACCEPTANCE")
  })
})
