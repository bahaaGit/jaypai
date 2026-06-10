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

test("login page shows Jaypai branding", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByText("Jaypai")).toBeVisible()
  await expect(page.getByText("Get Started")).toBeVisible()
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
