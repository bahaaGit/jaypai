import { z } from "zod"

export const TRIP_SORTS = ["soonest", "price", "weight"] as const
export type TripSort = (typeof TRIP_SORTS)[number]

export const tripSearchSchema = z.object({
  from: z.string().trim().max(100).optional(),
  to: z.string().trim().max(100).optional(),
  // yyyy-mm-dd; trips departing on/after this date
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
    .optional(),
  sort: z.enum(TRIP_SORTS).default("soonest"),
  maxPrice: z.coerce.number().positive().max(10000).optional(),
  minWeight: z.coerce.number().positive().max(1000).optional(),
})

export type TripSearchInput = z.infer<typeof tripSearchSchema>

/** Parse URLSearchParams into validated search input (ignores empty strings). */
export function parseTripSearchParams(params: URLSearchParams) {
  const raw: Record<string, string> = {}
  for (const key of ["from", "to", "date", "sort", "maxPrice", "minWeight"]) {
    const v = params.get(key)
    if (v) raw[key] = v
  }
  return tripSearchSchema.safeParse(raw)
}
