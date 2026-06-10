"use client"

import { useEffect, useState } from "react"
import { X, Share, Plus } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "jaypai-install-dismissed"

type PromptState = {
  visible: boolean
  isIOS: boolean
  deferred: BeforeInstallPromptEvent | null
}

const HIDDEN: PromptState = { visible: false, isIOS: false, deferred: null }

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function recentlyDismissed() {
  const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
  return at > 0 && Date.now() - at < 14 * 24 * 60 * 60 * 1000
}

export function InstallPrompt() {
  const [state, setState] = useState<PromptState>(HIDDEN)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isStandalone() || recentlyDismissed()) return

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (ios) {
      // iOS has no beforeinstallprompt event — show manual instructions.
      // Deferred to a microtask so it doesn't run synchronously in the effect.
      queueMicrotask(() =>
        setState({ visible: true, isIOS: true, deferred: null })
      )
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setState({
        visible: true,
        isIOS: false,
        deferred: e as BeforeInstallPromptEvent,
      })
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setState(HIDDEN)
  }

  const install = async () => {
    if (!state.deferred) return
    await state.deferred.prompt()
    await state.deferred.userChoice
    setState(HIDDEN)
  }

  if (!state.visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] mx-auto max-w-sm rounded-xl border border-border bg-white p-4 shadow-lg">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Jaypai"
            className="h-10 w-10 rounded-xl"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Install Jaypai</p>
          {state.isIOS ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Tap <Share className="inline h-3 w-3" /> then{" "}
              <span className="font-medium">Add to Home Screen</span>{" "}
              <Plus className="inline h-3 w-3" /> for faster, offline access.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Add to your home screen for faster, offline access.
            </p>
          )}

          {!state.isIOS && (
            <button
              onClick={install}
              className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
