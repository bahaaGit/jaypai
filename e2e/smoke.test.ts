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
