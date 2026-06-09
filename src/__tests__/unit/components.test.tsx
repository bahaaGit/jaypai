import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Find a Trip</Button>)
    expect(screen.getByText("Find a Trip")).toBeInTheDocument()
  })

  it("renders primary variant by default", () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole("button")
    expect(btn).toBeInTheDocument()
  })

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})

describe("Card", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Trip Card</CardTitle>
        </CardHeader>
        <CardContent>Seattle → Banjul</CardContent>
      </Card>
    )
    expect(screen.getByText("Trip Card")).toBeInTheDocument()
    expect(screen.getByText("Seattle → Banjul")).toBeInTheDocument()
  })
})

describe("Badge", () => {
  it("renders status text", () => {
    render(<Badge>Published</Badge>)
    expect(screen.getByText("Published")).toBeInTheDocument()
  })
})
