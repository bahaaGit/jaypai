import { z } from "zod"

export const TRIP_SORTS = ["soonest", "price", "weight"] as const
export type TripSort = (typeof TRIP_SORTS)[number]

export const PACKAGE_TYPES = ["Clothes", "Documents", "Electronics", "Food", "Other"] as const
export const TRIP_TYPES = ["LUGGAGE", "CARGO"] as const
export const CONTAINER_SIZES = ["20ft", "40ft"] as const

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")

const tripFields = z.object({
  tripType: z.enum(TRIP_TYPES).default("LUGGAGE"),
  originCity: z.string().trim().min(2, "Enter the origin city").max(80),
  originCountry: z.string().trim().min(2, "Enter the origin country").max(80),
  destinationCity: z.string().trim().min(2, "Enter the destination city").max(80),
  destinationCountry: z.string().trim().min(2, "Enter the destination country").max(80),
  departureDate: dateString,
  arrivalDate: dateString,
  airline: z.string().trim().max(80).optional().or(z.literal("")),
  availableWeightLbs: z.coerce
    .number({ message: "Enter available capacity" })
    .min(1, "At least 1 lb")
    .max(60000, "Maximum 60,000 lbs"),
  pricePerLb: z.coerce.number().min(0.5, "Minimum $0.50 per lb").max(100, "Maximum $100 per lb").optional(),
  containerSize: z.enum(CONTAINER_SIZES).optional(),
  flatPrice: z.coerce.number().min(50, "Minimum $50").max(50000, "Maximum $50,000").optional(),
  pickupInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  dropoffInstructions: z.string().trim().max(500).optional().or(z.literal("")),
  allowedItemTypes: z
    .array(z.enum(PACKAGE_TYPES))
    .min(1, "Choose at least one package type"),
})

function tripRules(d: z.infer<typeof tripFields>, ctx: z.RefinementCtx) {
  if (d.arrivalDate < d.departureDate) {
    ctx.addIssue({
      code: "custom",
      message: "Arrival can't be before departure",
      path: ["arrivalDate"],
    })
  }
  if (d.departureDate < new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({
      code: "custom",
      message: "Departure must be in the future",
      path: ["departureDate"],
    })
  }
  if (d.tripType === "LUGGAGE") {
    if (d.availableWeightLbs > 200) {
      ctx.addIssue({
        code: "custom",
        message: "Maximum 200 lbs for luggage trips",
        path: ["availableWeightLbs"],
      })
    }
    if (d.pricePerLb == null) {
      ctx.addIssue({ code: "custom", message: "Enter a price per lb", path: ["pricePerLb"] })
    }
  } else {
    if (!d.containerSize) {
      ctx.addIssue({ code: "custom", message: "Choose a container size", path: ["containerSize"] })
    }
    if (d.flatPrice == null) {
      ctx.addIssue({ code: "custom", message: "Enter the container price", path: ["flatPrice"] })
    }
  }
}

export const tripCreateSchema = tripFields.superRefine(tripRules)

export const tripUpdateSchema = z.union([
  // Status-only transition (cancel / re-publish a draft)
  z.object({ status: z.enum(["PUBLISHED", "CANCELLED"]) }),
  // Full edit
  tripFields.superRefine(tripRules),
])

export type TripCreateInput = z.infer<typeof tripCreateSchema>

export function canPostTrips(role: string) {
  return role === "TRAVELER" || role === "SHIPPER" || role === "BOTH" || role === "ADMIN"
}

export const tripSearchSchema = z.object({
  from: z.string().trim().max(100).optional(),
  to: z.string().trim().max(100).optional(),
  // yyyy-mm-dd; trips departing on/after this date
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional(),
  sort: z.enum(TRIP_SORTS).default("soonest"),
  type: z.enum(["all", "luggage", "cargo"]).default("all"),
  maxPrice: z.coerce.number().positive().max(10000).optional(),
  minWeight: z.coerce.number().positive().max(1000).optional(),
})

export type TripSearchInput = z.infer<typeof tripSearchSchema>

/** Parse URLSearchParams into validated search input (ignores empty strings). */
export function parseTripSearchParams(params: URLSearchParams) {
  const raw: Record<string, string> = {}
  for (const key of ["from", "to", "date", "sort", "type", "maxPrice", "minWeight"]) {
    const v = params.get(key)
    if (v) raw[key] = v
  }
  return tripSearchSchema.safeParse(raw)
}
