import { describe, it, expect } from "vitest"
import manifest from "@/app/manifest"

describe("PWA manifest", () => {
  const m = manifest()

  it("has Jaypai branding", () => {
    expect(m.name).toContain("Jaypai")
    expect(m.short_name).toBe("Jaypai")
  })

  it("is configured as a standalone installable app", () => {
    expect(m.display).toBe("standalone")
    expect(m.start_url).toBe("/home")
    expect(m.scope).toBe("/")
  })

  it("uses the green brand theme", () => {
    expect(m.theme_color).toBe("#00853F")
    expect(m.background_color).toBe("#F8F8F6")
  })

  it("includes 192, 512 and a maskable icon", () => {
    const sizes = m.icons?.map((i) => i.sizes)
    expect(sizes).toContain("192x192")
    expect(sizes).toContain("512x512")
    const purposes = m.icons?.map((i) => i.purpose)
    expect(purposes).toContain("maskable")
  })
})
