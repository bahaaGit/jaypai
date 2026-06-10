import { test, expect } from "@playwright/test"

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health")
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body.status).toBe("ok")
})

test("unauthenticated root redirects to login", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login/)
})

test("login page shows Jaypai branding and form", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Jaypai" })).toBeVisible()
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Log In" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible()
})

test("login form validates empty input client-side", async ({ page }) => {
  await page.goto("/login")
  await page.getByRole("button", { name: "Log In" }).click()
  await expect(page.getByText("Enter a valid email")).toBeVisible()
  await expect(page.getByText("Enter your password")).toBeVisible()
})

test("signup page renders the account form", async ({ page }) => {
  await page.goto("/signup")
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
  await expect(page.getByLabel("Full name")).toBeVisible()
  await expect(page.getByLabel("Email")).toBeVisible()
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible()
})

test("phone sign-in page renders", async ({ page }) => {
  await page.goto("/phone")
  await expect(page.getByRole("heading", { name: "Continue with phone" })).toBeVisible()
  await expect(page.getByLabel("Phone number")).toBeVisible()
  await expect(page.getByRole("button", { name: "Send Code" })).toBeVisible()
})

test("protected routes redirect unauthenticated users to login", async ({ page }) => {
  for (const path of ["/home", "/profile", "/onboarding"]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login/)
  }
})

test("trips API is public and returns published trips", async ({ request }) => {
  const res = await request.get("/api/trips")
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body.trips)).toBe(true)
  expect(body.count).toBe(body.trips.length)
})

test("trips API filters by destination", async ({ request }) => {
  const res = await request.get("/api/trips?to=Banjul")
  expect(res.status()).toBe(200)
  const body = await res.json()
  for (const t of body.trips) {
    expect(`${t.destinationCity} ${t.destinationCountry}`).toContain("Banjul")
  }
})

test("trips API rejects invalid params", async ({ request }) => {
  const res = await request.get("/api/trips?date=not-a-date")
  expect(res.status()).toBe(400)
  const res2 = await request.get("/api/trips?maxPrice=-3")
  expect(res2.status()).toBe(400)
})

test("trip detail API 404s for unknown trip", async ({ request }) => {
  const res = await request.get("/api/trips/does-not-exist")
  expect(res.status()).toBe(404)
})

test("trip pages require auth", async ({ page }) => {
  await page.goto("/trips/search")
  await expect(page).toHaveURL(/\/login/)
})

test("posting a trip requires auth", async ({ request }) => {
  const res = await request.post("/api/trips", {
    data: { originCity: "Seattle" },
  })
  expect(res.status()).toBe(401)
})

test("trip mutations require auth", async ({ request }) => {
  const patch = await request.patch("/api/trips/seed-trip-seattle", {
    data: { status: "CANCELLED" },
  })
  expect(patch.status()).toBe(401)
  const del = await request.delete("/api/trips/seed-trip-seattle")
  expect(del.status()).toBe(401)
})

test("bookings API requires auth", async ({ request }) => {
  const list = await request.get("/api/bookings")
  expect(list.status()).toBe(401)
  const create = await request.post("/api/bookings", {
    data: { tripId: "seed-trip-seattle", estimatedWeightLbs: 25 },
  })
  expect(create.status()).toBe(401)
  const detail = await request.get("/api/bookings/nonexistent")
  expect(detail.status()).toBe(401)
})

test("book page requires auth", async ({ page }) => {
  await page.goto("/trips/seed-trip-seattle/book")
  await expect(page).toHaveURL(/\/login/)
})

test("users/me API requires auth", async ({ request }) => {
  const res = await request.get("/api/users/me")
  expect(res.status()).toBe(401)
})

test("onboarding API requires auth", async ({ request }) => {
  const res = await request.post("/api/auth/onboarding", {
    data: { fullName: "Test User", role: "SENDER" },
  })
  expect(res.status()).toBe(401)
})

test("PWA manifest is served with correct branding", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest")
  expect(response.status()).toBe(200)
  const m = await response.json()
  expect(m.short_name).toBe("Jaypai")
  expect(m.display).toBe("standalone")
  expect(m.theme_color).toBe("#00853F")
})

test("service worker and offline page are reachable", async ({ request }) => {
  const sw = await request.get("/sw.js")
  expect(sw.status()).toBe(200)
  expect(sw.headers()["content-type"]).toContain("javascript")

  const offline = await request.get("/offline.html")
  expect(offline.status()).toBe(200)
  expect(await offline.text()).toContain("You're offline")
})
