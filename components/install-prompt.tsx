'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'install-prompt-dismissed-at'
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14 // 14 days

function recentlyDismissed() {
  if (typeof window === 'undefined') return false
  const raw = window.localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = Number(raw)
  return Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function isIOS() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const iPad = /iPad/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
  return /iPhone|iPod/.test(ua) || iPad
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosVisible, setIosVisible] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    const onInstalled = () => {
      setOpen(false)
      setDeferred(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    if (isIOS()) {
      const t = window.setTimeout(() => {
        setIosVisible(true)
        setOpen(true)
      }, 1500)
      return () => {
        window.clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', onBeforeInstall)
        window.removeEventListener('appinstalled', onInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  function dismiss() {
    setOpen(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') {
      setOpen(false)
    } else {
      dismiss()
    }
    setDeferred(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:right-6 md:bottom-6 md:max-w-sm">
      <div className="bg-surface-card border border-border-default rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={48} height={48} className="rounded-xl w-12 h-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] md:text-[14px] uppercase tracking-[0.15em] font-black leading-tight">
              Install Overwatch
            </p>
            <p className="text-text-secondary text-[11px] md:text-[12px] mt-1 leading-relaxed">
              {iosVisible
                ? 'Tap Share, then "Add to Home Screen" for a full-screen app feel.'
                : 'Add to your home screen for a full-screen, app-like experience.'}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-text-tertiary hover:text-text-primary text-[18px] leading-none px-1 -mt-1"
          >
            ×
          </button>
        </div>
        {!iosVisible && deferred && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="flex-1 bg-text-primary text-surface-canvas font-bold uppercase tracking-[0.15em] text-[12px] rounded-full px-4 py-2.5 hover:opacity-90 transition-opacity"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-text-secondary hover:text-text-primary font-bold uppercase tracking-[0.15em] text-[12px] px-4 py-2.5"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
