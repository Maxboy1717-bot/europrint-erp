"use client"

/**
 * @module chart-utils
 * @description ChartConfig type, ChartContext/useChart hook, CSS sanitizers,
 * and getPayloadConfigFromPayload helper for the chart component library.
 * Extracted from chart.tsx (Rule 16).
 */

import * as React from "react"
import DOMPurify from 'dompurify'

// Format: { THEME_NAME: CSS_SELECTOR }
export const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

export type ChartContextProps = {
  config: ChartConfig
}

export const ChartContext = React.createContext<ChartContextProps | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

// DOMPurify: rang qiymatlarini HTML injection'dan himoya qiladi
export function sanitizeColorValue(value: string | undefined): string | null {
  if (!value) return null;
  const safe = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/javascript\s*:/gi, '');
  return safe || null;
}

// CSS satrini expression() va script tag'lardan tozalaydi
export function sanitizeCss(css: string): string {
  return css
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<\s*script[^>]*>/gi, '');
}

// Helper to extract item config from a payload.
export function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}
