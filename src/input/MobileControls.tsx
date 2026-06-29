import { useRef, useState, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { moveInput, InputEvents } from './InputState'

// ─── MobileControls ───────────────────────────────────────────────────────────
// Full-screen React overlay providing:
//   • Virtual joystick — appears at first touch on the LEFT half of the screen.
//     Supports 360° analog input. Speed scales with drag distance; max = run.
//   • Action buttons — fixed cluster at bottom-right for Attack / Interact /
//     Inventory / Menu.
//
// Architecture:
//   • Pointer-events are blocked by default on the overlay container.
//     Only the joystick zone and individual buttons have pointer-events: auto.
//   • The joystick zone covers the left 50 % of the screen.
//   • Touches in button gaps pass through to the PIXI canvas for orb/NPC clicks.
//   • Blocked while any UI panel or learning modal is open (no accidental moves).

const JOYSTICK_OUTER_R = 60   // px — outer ring radius
const JOYSTICK_KNOB_R  = 26   // px — knob radius
const TAP_THRESHOLD    =  6   // px — movement below this is treated as a tap (passes through)

interface JoyVisual {
  active: boolean
  ox: number; oy: number   // ring centre, relative to zone element
  kx: number; ky: number   // knob centre, relative to zone element
}

const IDLE: JoyVisual = { active: false, ox: 0, oy: 0, kx: 0, ky: 0 }

// ─── Button config ────────────────────────────────────────────────────────────
// Layout (2 × 2 grid, bottom-right):
//   [Interagir]  [Atacar]
//   [Mochila]    [Menu]
const BUTTON_SIZE  = 58   // px, touch-friendly minimum
const BUTTON_GAP   = 10   // px

// ─── Component ────────────────────────────────────────────────────────────────
export function MobileControls() {
  const setPanel    = useGameStore(s => s.setPanel)
  const activePanel = useGameStore(s => s.activePanel)

  const [joy, setJoy]    = useState<JoyVisual>(IDLE)
  const touchIdRef        = useRef<number | null>(null)
  const originRef         = useRef({ x: 0, y: 0 })

  // ── Joystick touch handlers ────────────────────────────────────────────────
  const isUIOpen = useCallback((): boolean => {
    const { activePanel: ap, activeLearning: al } = useGameStore.getState()
    return ap !== null || al !== null
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return   // already tracking one finger
    if (isUIOpen()) return                    // block while UI is open
    const touch = e.changedTouches[0]
    const rect  = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const ox = touch.clientX - rect.left
    const oy = touch.clientY - rect.top
    touchIdRef.current     = touch.identifier
    originRef.current      = { x: ox, y: oy }
    // Don't activate visual yet — wait for TAP_THRESHOLD to distinguish tap vs drag
    setJoy({ active: false, ox, oy, kx: ox, ky: oy })
  }, [isUIOpen])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current === null) return
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current)
    if (!touch) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cx   = touch.clientX - rect.left
    const cy   = touch.clientY - rect.top
    const dx   = cx - originRef.current.x
    const dy   = cy - originRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < TAP_THRESHOLD) return   // not a drag yet — treat as tap, ignore

    const mag  = Math.min(dist / JOYSTICK_OUTER_R, 1.0)
    const inv  = dist > 0 ? 1 / dist : 0
    const clampedDist = Math.min(dist, JOYSTICK_OUTER_R)
    const kx   = originRef.current.x + dx * inv * clampedDist
    const ky   = originRef.current.y + dy * inv * clampedDist

    setJoy({ active: true, ox: originRef.current.x, oy: originRef.current.y, kx, ky })

    moveInput.dx        = dx * inv
    moveInput.dy        = dy * inv
    moveInput.magnitude = mag
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const ended = Array.from(e.changedTouches).some(t => t.identifier === touchIdRef.current)
    if (!ended) return
    touchIdRef.current  = null
    setJoy(IDLE)
    moveInput.dx        = 0
    moveInput.dy        = 0
    moveInput.magnitude = 0
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 45,
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* ── Left half: virtual joystick zone ─────────────────────────────── */}
      <div
        style={{
          position:     'absolute',
          left:         0,
          top:          0,
          width:        '50%',
          height:       '100%',
          paddingLeft:  'env(safe-area-inset-left)',
          paddingBottom:'env(safe-area-inset-bottom)',
          pointerEvents:'auto',
          touchAction:  'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {joy.active && (
          <>
            {/* Outer ring */}
            <div style={{
              position:        'absolute',
              left:            joy.ox - JOYSTICK_OUTER_R,
              top:             joy.oy - JOYSTICK_OUTER_R,
              width:           JOYSTICK_OUTER_R * 2,
              height:          JOYSTICK_OUTER_R * 2,
              borderRadius:    '50%',
              border:          '2px solid rgba(255,255,255,0.22)',
              backgroundColor: 'rgba(0,0,0,0.20)',
              backdropFilter:  'blur(2px)',
              pointerEvents:   'none',
            }} />
            {/* Inner knob */}
            <div style={{
              position:        'absolute',
              left:            joy.kx - JOYSTICK_KNOB_R,
              top:             joy.ky - JOYSTICK_KNOB_R,
              width:           JOYSTICK_KNOB_R * 2,
              height:          JOYSTICK_KNOB_R * 2,
              borderRadius:    '50%',
              backgroundColor: 'rgba(255,255,255,0.28)',
              border:          '2px solid rgba(255,255,255,0.50)',
              backdropFilter:  'blur(4px)',
              boxShadow:       '0 2px 12px rgba(0,0,0,0.40)',
              pointerEvents:   'none',
            }} />
          </>
        )}
      </div>

      {/* ── Right side: action button cluster ────────────────────────────── */}
      {/* 2×2 grid layout:
            [Interagir] [Atacar]
            [Mochila]   [Menu]                                               */}
      <div
        style={{
          position:     'absolute',
          right:        `max(16px, calc(16px + env(safe-area-inset-right)))`,
          bottom:       `max(108px, calc(108px + env(safe-area-inset-bottom)))`,
          display:      'grid',
          gridTemplateColumns: `${BUTTON_SIZE}px ${BUTTON_SIZE}px`,
          gridTemplateRows:    `${BUTTON_SIZE}px ${BUTTON_SIZE}px`,
          gap:          BUTTON_GAP,
          pointerEvents:'none',
        }}
      >
        {/* Row 1 ── Interagir + Atacar */}
        <ActionBtn
          icon="💬" label="Falar"
          color="rgba(28,90,180,0.82)"
          size={BUTTON_SIZE}
          onPress={() => InputEvents.fire('interact')}
        />
        <ActionBtn
          icon="⚔" label="Atacar"
          color="rgba(180,28,28,0.82)"
          size={BUTTON_SIZE}
          onPress={() => InputEvents.fire('attack')}
        />

        {/* Row 2 ── Mochila + Menu */}
        <ActionBtn
          icon="🎒" label="Mochila"
          color="rgba(26,120,55,0.82)"
          size={BUTTON_SIZE}
          onPress={() => setPanel(activePanel === 'inventory' ? null : 'inventory')}
        />
        <ActionBtn
          icon="☰" label="Menu"
          color="rgba(80,45,130,0.82)"
          size={BUTTON_SIZE}
          onPress={() => setPanel(activePanel === 'character' ? null : 'character')}
        />
      </div>
    </div>
  )
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
interface ActionBtnProps {
  icon:    string
  label:   string
  color:   string
  size:    number
  onPress: () => void
}

function ActionBtn({ icon, label, color, size, onPress }: ActionBtnProps) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      style={{
        width:           size,
        height:          size,
        borderRadius:    '50%',
        backgroundColor: pressed ? 'rgba(255,255,255,0.30)' : color,
        border:          '1.5px solid rgba(255,255,255,0.22)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             2,
        cursor:          'pointer',
        pointerEvents:   'auto',
        touchAction:     'manipulation',
        backdropFilter:  'blur(6px)',
        boxShadow:       pressed
          ? 'inset 0 2px 6px rgba(0,0,0,0.5)'
          : '0 2px 10px rgba(0,0,0,0.45)',
        transform:       pressed ? 'scale(0.92)' : 'scale(1)',
        transition:      'transform 80ms, box-shadow 80ms, background-color 80ms',
        padding:         0,
        WebkitTapHighlightColor: 'transparent',
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        setPressed(true)
        onPress()
      }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      title={label}
    >
      <span style={{ fontSize: Math.round(size * 0.36), lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontSize:      Math.round(size * 0.14),
        color:         'rgba(255,255,255,0.82)',
        letterSpacing: '0.04em',
        lineHeight:    1,
        fontFamily:    'Georgia, serif',
      }}>
        {label}
      </span>
    </button>
  )
}
