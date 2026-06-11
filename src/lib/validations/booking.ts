import { z } from "zod"
import { PACKAGE_TYPES } from "@/lib/validations/trip"

export const PICKUP_PREFERENCES = [
  { value: "MEET_IN_PERSON", title: "Meet in person", desc: "Meet traveler at a public place" },
  { value: "HOME_PICKUP", title: "Home pickup", desc: "Pickup from my address" },
  { value: "STORE_PICKUP", title: "Store pickup", desc: "Pickup from a nearby store" },
] as const

const pickupValues = ["MEET_IN_PERSON", "HOME_PICKUP", "STORE_PICKUP"] as const

export const bookingCreateSchema = z.object({
  tripId: z.string().min(1),
  estimatedWeightLbs: z.coerce
    .number({ message: "Enter the package weight" })
    .min(1, "Minimum 1 lb")
    .max(60000, "Maximum 60,000 lbs"), // luggage capped server-side by trip capacity; cargo books full container
  itemCategory: z.enum(PACKAGE_TYPES, { message: "Choose an item category" }),
  packageDescription: z.string().trim().max(500).optional().or(z.literal("")),
  declaredValue: z.coerce.number().min(0).max(50000).optional(),
  pickupPreference: z.enum(pickupValues, { message: "Choose a pickup preference" }),
  pickupInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  recipientName: z.string().trim().min(2, "Enter the recipient's name").max(100),
  recipientPhone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d][\d\s-]{6,}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  recipientCity: z.string().trim().max(100).optional().or(z.literal("")),
})

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>

/** Friendly booking code, e.g. JP-2026-482913 */
export function generateBookingCode(now = new Date()) {
  const digits = Math.floor(100000 + Math.random() * 900000)
  return `JP-${now.getUTCFullYear()}-${digits}`
}

/** Statuses that still occupy trip capacity. */
export const CAPACITY_HOLDING_STATUSES = [
  "PENDING_TRAVELER_ACCEPTANCE",
  "PACKAGE_ACCEPTED",
  "WEIGHT_VERIFIED",
  "PAYMENT_AUTHORIZED",
  "DELIVERY_PASS_GENERATED",
  "IN_TRANSIT",
  "ARRIVED",
  "RECIPIENT_VERIFIED",
] as const
