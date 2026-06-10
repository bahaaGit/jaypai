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
