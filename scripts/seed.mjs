// Seeds demo travelers + published trips (idempotent — safe to re-run).
// Run: node scripts/seed.mjs
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000)

const travelers = [
  {
    supabaseId: "seed-musa",
    fullName: "Musa Jallow",
    email: "musa.demo@jaypai.app",
    role: "TRAVELER",
    city: "Seattle",
    country: "USA",
    isIdVerified: true,
    isEmailVerified: true,
    trustScore: 98,
    ratingAverage: 4.9,
    completedTrips: 120,
  },
  {
    supabaseId: "seed-fatou",
    fullName: "Fatou Njie",
    email: "fatou.demo@jaypai.app",
    role: "TRAVELER",
    city: "Washington DC",
    country: "USA",
    isIdVerified: true,
    isEmailVerified: true,
    trustScore: 95,
    ratingAverage: 4.8,
    completedTrips: 85,
  },
  {
    supabaseId: "seed-alieu",
    fullName: "Alieu Darboe",
    email: "alieu.demo@jaypai.app",
    role: "TRAVELER",
    city: "New York",
    country: "USA",
    isIdVerified: true,
    isEmailVerified: true,
    trustScore: 92,
    ratingAverage: 4.7,
    completedTrips: 60,
  },
  {
    supabaseId: "seed-awa",
    fullName: "Awa Ceesay",
    email: "awa.demo@jaypai.app",
    role: "TRAVELER",
    city: "London",
    country: "UK",
    isIdVerified: false,
    isEmailVerified: true,
    trustScore: 80,
    ratingAverage: 4.5,
    completedTrips: 12,
  },
]

const trips = (ids) => [
  {
    id: "seed-trip-seattle",
    travelerId: ids["seed-musa"],
    originCity: "Seattle",
    originCountry: "USA",
    destinationCity: "Banjul",
    destinationCountry: "Gambia",
    departureDate: daysFromNow(14),
    arrivalDate: daysFromNow(16),
    airline: "Delta Airlines",
    availableWeightLbs: 80,
    pricePerLb: 5,
    pickupInstructions: "Seattle, WA — SeaTac Airport or downtown",
    dropoffInstructions: "Serrekunda",
    allowedItemTypes: ["Clothes", "Documents", "Electronics", "Food"],
    status: "PUBLISHED",
  },
  {
    id: "seed-trip-dc",
    travelerId: ids["seed-fatou"],
    originCity: "Washington DC",
    originCountry: "USA",
    destinationCity: "Banjul",
    destinationCountry: "Gambia",
    departureDate: daysFromNow(10),
    arrivalDate: daysFromNow(12),
    airline: "Brussels Airlines",
    availableWeightLbs: 60,
    pricePerLb: 4.5,
    pickupInstructions: "Washington DC area",
    dropoffInstructions: "Banjul city center",
    allowedItemTypes: ["Clothes", "Documents", "Food"],
    status: "PUBLISHED",
  },
  {
    id: "seed-trip-nyc",
    travelerId: ids["seed-alieu"],
    originCity: "New York",
    originCountry: "USA",
    destinationCity: "Banjul",
    destinationCountry: "Gambia",
    departureDate: daysFromNow(20),
    arrivalDate: daysFromNow(23),
    airline: "Royal Air Maroc",
    availableWeightLbs: 100,
    pricePerLb: 5,
    pickupInstructions: "JFK Airport or Bronx",
    dropoffInstructions: "Bakau",
    allowedItemTypes: ["Clothes", "Documents", "Electronics"],
    status: "PUBLISHED",
  },
  {
    id: "seed-trip-london",
    travelerId: ids["seed-awa"],
    originCity: "London",
    originCountry: "UK",
    destinationCity: "Banjul",
    destinationCountry: "Gambia",
    departureDate: daysFromNow(30),
    arrivalDate: daysFromNow(32),
    airline: "Titan Airways",
    availableWeightLbs: 30,
    pricePerLb: 5.2,
    pickupInstructions: "London Gatwick",
    dropoffInstructions: "Brikama",
    allowedItemTypes: ["Clothes", "Documents"],
    status: "PUBLISHED",
  },
]

const ids = {}
for (const t of travelers) {
  const { supabaseId, ...data } = t
  const user = await prisma.user.upsert({
    where: { supabaseId },
    update: data,
    create: { supabaseId, ...data },
  })
  ids[supabaseId] = user.id
  console.log(`✓ traveler ${t.fullName}`)
}

for (const trip of trips(ids)) {
  const { id, ...data } = trip
  await prisma.trip.upsert({ where: { id }, update: data, create: { id, ...data } })
  console.log(`✓ trip ${trip.originCity} → ${trip.destinationCity}`)
}

await prisma.$disconnect()
console.log("Seed complete.")
