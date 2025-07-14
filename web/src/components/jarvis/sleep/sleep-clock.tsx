"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { minutesToAngle, angleToMinutes, createArcPath } from "~/lib/jarvis/sleep-utils"

interface SleepClockProps {
  bedTimeInMinutes: number
  wakeTimeInMinutes: number
  onBedTimeChange: (minutes: number) => void
  onWakeTimeChange: (minutes: number) => void
}

const CLOCK_SIZE = 280
const CENTER = CLOCK_SIZE / 2
const ARC_RADIUS = 120
const HANDLE_RADIUS = 14
const TRACK_WIDTH = 20

export default function SleepClock({
  bedTimeInMinutes,
  wakeTimeInMinutes,
  onBedTimeChange,
  onWakeTimeChange,
}: SleepClockProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [draggingHandle, setDraggingHandle] = useState<"bed" | "wake" | null>(null)

  const bedAngle = minutesToAngle(bedTimeInMinutes)
  const wakeAngle = minutesToAngle(wakeTimeInMinutes)

  const bedHandlePos = {
    cx: CENTER + ARC_RADIUS * Math.cos((bedAngle * Math.PI) / 180),
    cy: CENTER + ARC_RADIUS * Math.sin((bedAngle * Math.PI) / 180),
  }

  const wakeHandlePos = {
    cx: CENTER + ARC_RADIUS * Math.cos((wakeAngle * Math.PI) / 180),
    cy: CENTER + ARC_RADIUS * Math.sin((wakeAngle * Math.PI) / 180),
  }

  const angleAdjustmentForArcVisual = (TRACK_WIDTH / (2 * ARC_RADIUS)) * (180 / Math.PI)
  let currentDurationAngle = wakeAngle - bedAngle
  if (currentDurationAngle < 0) currentDurationAngle += 360
  const actualPathShortening =
    currentDurationAngle > 1e-6 ? Math.min(angleAdjustmentForArcVisual, currentDurationAngle / 2.0) : 0
  const arcPathStartAngle = bedAngle + actualPathShortening
  const arcPathEndAngle = wakeAngle - actualPathShortening
  const sleepArcPath = createArcPath(CENTER, CENTER, ARC_RADIUS, arcPathStartAngle, arcPathEndAngle)

  const handleMouseDown = (handleType: "bed" | "wake") => setDraggingHandle(handleType)

  const handleMouseMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!draggingHandle || !svgRef.current) return
      const svgRect = svgRef.current.getBoundingClientRect()
      let clientX, clientY
      if (event instanceof MouseEvent) {
        clientX = event.clientX
        clientY = event.clientY
      } else {
        clientX = event.touches[0]?.clientX ?? 0
        clientY = event.touches[0]?.clientY ?? 0
      }
      const x = clientX - svgRect.left - CENTER
      const y = clientY - svgRect.top - CENTER
      const angle = (Math.atan2(y, x) * 180) / Math.PI
      const minutes = angleToMinutes(angle)
      if (draggingHandle === "bed") onBedTimeChange(minutes)
      else onWakeTimeChange(minutes)
    },
    [draggingHandle, onBedTimeChange, onWakeTimeChange],
  )

  const handleMouseUp = useCallback(() => setDraggingHandle(null), [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleMouseMove)
    document.addEventListener("touchend", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleMouseMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const hourMarkers = []
  for (let i = 0; i < 12; i++) {
    const angle = i * 30
    const rad = (angle * Math.PI) / 180
    const innerR = ARC_RADIUS - TRACK_WIDTH / 2 - 25
    const outerR = ARC_RADIUS - TRACK_WIDTH / 2 - 15
    const x1 = CENTER + innerR * Math.cos(rad)
    const y1 = CENTER + innerR * Math.sin(rad)
    const x2 = CENTER + outerR * Math.cos(rad)
    const y2 = CENTER + outerR * Math.sin(rad)
    hourMarkers.push(<line key={`marker-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3A3A3C" strokeWidth="2" />)
    if (i % 3 === 0) {
      const labelRadius = ARC_RADIUS - TRACK_WIDTH / 2 - 40
      const labelX = CENTER + labelRadius * Math.cos(rad)
      const labelY = CENTER + labelRadius * Math.sin(rad)
      const hour = i === 0 ? 3 : i === 3 ? 6 : i === 6 ? 9 : 12
      hourMarkers.push(
        <text
          key={`label-${i}`}
          x={labelX}
          y={labelY + 4}
          textAnchor="middle"
          fill="#8E8E93"
          fontSize="12"
          fontWeight="500"
        >
          {hour}
        </text>,
      )
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}>
      <svg ref={svgRef} width={CLOCK_SIZE} height={CLOCK_SIZE} viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}>
        <defs>
          <linearGradient id="sleepGradientClock" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0A84FF" />
            <stop offset="100%" stopColor="#5E5CE6" />
          </linearGradient>
          <radialGradient id="bedGradientClock">
            <stop offset="0%" stopColor="#3395FF" />
            <stop offset="100%" stopColor="#0A84FF" />
          </radialGradient>
          <radialGradient id="wakeGradientClock">
            <stop offset="0%" stopColor="#FFD60A" />
            <stop offset="100%" stopColor="#FFC700" />
          </radialGradient>
        </defs>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ARC_RADIUS + TRACK_WIDTH / 2 + 5}
          fill="none"
          stroke="#3A3A3C"
          strokeWidth="1"
        />
        <circle cx={CENTER} cy={CENTER} r={ARC_RADIUS} fill="none" stroke="#2C2C2E" strokeWidth={TRACK_WIDTH} />
        <path
          d={sleepArcPath}
          fill="none"
          stroke="url(#sleepGradientClock)"
          strokeWidth={TRACK_WIDTH}
          strokeLinecap="round"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={ARC_RADIUS - TRACK_WIDTH / 2 - 5}
          fill="#1C1C1E"
          stroke="#3A3A3C"
          strokeWidth="1"
        />
        <g>{hourMarkers}</g>
        <circle cx={CENTER} cy={CENTER} r="3" fill="#3A3A3C" />
        <circle
          id="bedHandle"
          cx={bedHandlePos.cx}
          cy={bedHandlePos.cy}
          r={HANDLE_RADIUS}
          fill="url(#bedGradientClock)"
          stroke="#E5E5E7"
          strokeWidth="2"
          cursor={draggingHandle === "bed" ? "grabbing" : "grab"}
          onMouseDown={() => handleMouseDown("bed")}
          onTouchStart={() => handleMouseDown("bed")}
        />
        <circle
          id="wakeHandle"
          cx={wakeHandlePos.cx}
          cy={wakeHandlePos.cy}
          r={HANDLE_RADIUS}
          fill="url(#wakeGradientClock)"
          stroke="#E5E5E7"
          strokeWidth="2"
          cursor={draggingHandle === "wake" ? "grabbing" : "grab"}
          onMouseDown={() => handleMouseDown("wake")}
          onTouchStart={() => handleMouseDown("wake")}
        />
      </svg>
    </div>
  )
} 