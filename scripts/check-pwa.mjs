// Diagnoses PWA installability against the live site using headless Chromium.
// Run: node scripts/check-pwa.mjs [url]
import { chromium } from "@playwright/test"

const url = process.argv[2] ?? "https://jaypai.vercel.app/login"

const browser = await chromium.launch()
const page = await browser.newPage()

const consoleErrors = []
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text())
})
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`))

await page.goto(url, { waitUntil: "networkidle" })
// Give the SW time to register + activate
await page.waitForTimeout(4000)

const swState = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return { supported: false }
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return { supported: true, registered: false }
  return {
    supported: true,
    registered: true,
    scope: reg.scope,
    active: !!reg.active,
    activeState: reg.active?.state ?? null,
    controller: !!navigator.serviceWorker.controller,
  }
})

const manifestLink = await page.evaluate(() => {
  const link = document.querySelector('link[rel="manifest"]')
  return link ? link.href : null
})

console.log("URL:", url)
console.log("Manifest link:", manifestLink)
console.log("Service worker:", JSON.stringify(swState, null, 2))
console.log("Console errors:", consoleErrors.length ? consoleErrors : "none")

await browser.close()
