---
name: Model:Cycles Studio
description: A studio workspace for the Model:Cycles, drawn like a turntable service manual.
colors:
  ink: "#0e1116"
  ink-raised: "#2a2f37"
  live: "#e5391b"
  live-dark: "#c22c11"
  track-t2: "#c2185b"
  track-t3: "#1f5fd6"
  track-t4: "#0f8f6b"
  track-t5: "#d99100"
  track-t6: "#7a3fd1"
  track-chops: "#0b8ea6"
  track-fm1: "#a0522d"
  paper: "#ffffff"
  wash: "#f4f5f6"
  grid: "#eef0f2"
  line: "#d4d7dc"
  step-edge: "#8f949c"
  muted: "#565c65"
typography:
  brand:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.35
  control:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.35
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.33
  port:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.35
  value:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  hair: "1px"
  control: "2px"
  part: "3px"
  full: "9999px"
spacing:
  step-gap: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  part: "12px"
  bar: "16px"
  bar-gap: "20px"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-solid-hover:
    backgroundColor: "{colors.ink-raised}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.wash}"
  button-outline-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-small:
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "24px"
  button-icon:
    rounded: "{rounded.control}"
    size: "24px"
  transport-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "0 16px"
    height: "52px"
  transport-play:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    height: "32px"
    width: "84px"
  transport-play-running:
    backgroundColor: "{colors.live-dark}"
    textColor: "{colors.paper}"
  part-frame:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.part}"
    padding: "12px"
  part-header:
    typography: "{typography.title}"
    padding: "0 12px"
    height: "36px"
  dock-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "40px"
  dock-button-present:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  segmented-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "0 10px"
    height: "28px"
  segmented-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  select-trigger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "28px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  step-cell:
    backgroundColor: "{colors.wash}"
    rounded: "{rounded.control}"
    height: "30px"
    width: "34px"
---

# Design System: Model:Cycles Studio

## Overview

**Creative North Star: "The Service Manual"**

The studio is drawn the way a turntable service manual draws a machine: every part on white coated stock, ruled in ink, joined by the real lines between them. The producer reads the whole setup at a glance, then reaches in and changes a step, a swing amount or a sound and hears the effect. This is a dense operating surface for a laptop session, set at small sizes with hard contrast, and it shows exact values rather than impressions.

The canvas refuses the soft-card node editor with bezier wires. Parts are square-cornered frames that sit flat on a dot ground, and connections are right-angle leader lines. The only rounded objects with presence are the floating icon dock and the port and marker dots that have an electrical reason to be round.

Color is rationed by meaning. Ink draws the machine, track inks carry data, and vermilion means something is live right now. Motion is state only: the one signature move is a vermilion pulse running along a leader line for every hit that line carries.

**Key Characteristics:**
- White stock and a dot ground, light mode only.
- Ink rules, 1px borders and square 3px corners.
- Right-angle leader lines for every connection, dashed for MIDI and solid for audio.
- Archivo at UI sizes, Geist Mono for every value.
- Vermilion reserved for what is live.
- A round floating dock as the single way to add parts.

## Colors

A high-contrast ink-on-white drawing with one live signal color and a set of track inks that appear only as data.

### Primary
- **Drafting Ink** (#0e1116): All text, part borders, leader lines, ports, filled controls, tooltips and the 52px transport bar. It is also the T1 track color.
- **Raised Ink** (#2a2f37): Hover on any ink-filled button. Only ever a hover state.

### Secondary
- **Vermilion** (#e5391b): Marks that are live: the playhead, the leader-line pulse, the lane flash, the record dot and port hover while connecting.
- **Deep Vermilion** (#c22c11): The same signal where it holds text or a fill: the Stop button while running and the clip label. Error text and severe mix notes currently borrow it too; that is recorded drift, not a precedent.

### Tertiary
- **Track Inks**: Magenta (#c2185b) T2, Blue (#1f5fd6) T3, Green (#0f8f6b) T4, Amber (#d99100) T5, Violet (#7a3fd1) T6, Teal (#0b8ea6) Chops, Sienna (#a0522d) FM-1. Six Cycles tracks (T1 in Drafting Ink) plus the two lanes the laptop and synth add. Step opacity scales with velocity, from 0.4 to 1.

### Neutral
- **Coated Stock** (#ffffff): Part frames, the canvas and light control fills.
- **Wash** (#f4f5f6): Control hover and alternating four-step beat groups in the grid.
- **Grid Grey** (#eef0f2): Hairline plot grids in canvas drawings and hover on paper controls in the transport bar.
- **Line Grey** (#d4d7dc): The dot ground, row dividers, secondary rules and the pressed state of outline buttons.
- **Step Edge** (#8f949c): The border of empty step cells, strong enough to read the grid at 34px.
- **Muted Ink** (#565c65): Part status, port labels, row labels and helper copy.

### Named Rules
**The One Live Thing Rule.** Vermilion means sounding, running, capturing or a connection being made at this moment. At rest, the only vermilion on screen is the small record dot on a record button.

**The Ink Carries Data Rule.** Track inks encode something: which track, which pattern slot holds steps, which way a band sits from the reference. They never color chrome, frames, headers or controls.

**The Light Only Rule.** The system is light mode only, with `color-scheme: light`. The ink transport bar is a drawn title strip, not a dark theme. Do not add a dark mode or dark parts.

## Typography

**Body Font:** Archivo Variable (with ui-sans-serif, system-ui)
**Label/Mono Font:** Geist Mono 500 (with ui-monospace), tabular figures

**Character:** Archivo reads as technical-manual captioning at very small sizes, and Geist Mono makes every number align like a spec table. There is no display size: the largest type on the screen is the 15px product name.

### Hierarchy
- **Brand** (600, 15px, 1.35): The product name in the transport bar, nowhere else.
- **Title** (600, 13px, 1.35): Part names in the part header and the Play and Connect actions in the bar.
- **Control** (500, 13px, 1.35): Default button labels.
- **Body** (400, 13px, 1.35): The base size of the document.
- **Label** (400, 12px, 1.33): The working size of the app: slider labels, rows, status, helper copy, select and segmented options. Section headings inside a part use it at 600.
- **Port** (400, 10px, 1.35): Port labels beside a handle and small plot captions.
- **Value** (Geist Mono 500, inherits size): Every number and device readout: tempo, position, slider values, row values, step ruler, frequency scale.

### Named Rules
**The Mono Value Rule.** Anything the producer reads as a measured value is set in Geist Mono with tabular figures. Words naming a thing stay in Archivo.

**The Plain Label Rule.** Labels are sentence case at normal tracking. The build has no uppercase styling, no tracked-out captions and no kicker lines above headings.

## Layout

The screen is one fixed-height column: a 52px transport bar, then a full-bleed pannable canvas with no page scroll. Parts flow left to right as the signal does: Sounds and the Sequencer, then the sound sources, then analysers and output. The Sequencer is the widest part (806px), other parts are fixed widths such as 340px, and the dock floats over the canvas at the vertical center of its left edge.

Density is high. The rhythm runs 2px between step cells, 4, 6 and 8px between controls, 12px inside a part, and 16px at the bar's edges with 20px between its groups. Camera framing leaves 80px on the left for the dock, 32px on the right and 24px top and bottom. The Produce, Sources, Mix and All views frame groups of parts; they do not hide or rearrange them.

This is a laptop tool. At 1100px and below the bar drops the product name, swing and pattern readouts. Below 1000px a one-line note asks for a wider window.

### Named Rules
**The Dot Ground Rule.** The canvas is white with a field of dots (22px gap, 1.8px dot, Line Grey). No grid lines, tint or pattern replaces it, and parts sit directly on it.

## Elevation & Depth

Depth comes from ink borders and flatness. Parts sit on the ground with a 1px border and no shadow; selection thickens that border with a 1px ink ring. Soft, ink-tinted shadows appear only on the few things that actually float above the canvas.

### Shadow Vocabulary
- **Dock** (`box-shadow: 0 2px 8px rgb(14 17 22 / 0.18)`): The round dock buttons, which hover over parts and lines.
- **Popover** (`box-shadow: 0 6px 18px rgb(14 17 22 / 0.16)`): The select menu and the part search panel.

### Named Rules
**The Float Only Rule.** A shadow means the object floats above the canvas. Parts, inputs and buttons inside a part never carry one.

## Shapes

Corners are nearly square and graded by scale: 1px on thumbs and small slots, 2px on controls, step cells and tooltips, 3px on part frames and the search panel. Audio ports are 11px squares, MIDI ports 11px white circles. Lines end in right angles, never curves.

### Named Rules
**The Square Drafting Rule.** Corners stop at 3px. Full circles are reserved for the dock buttons, MIDI ports and the small dot marks that sit on steps and record buttons.

## Components

### Buttons
Printed, firm and rectangular.
- **Shape:** Slight 2px corner, always with a 1px border. Medium 32px, small 24px, icon 24px square.
- **Solid:** Ink fill with white text for the primary action in a part. Hovers to Raised Ink.
- **Outline:** The default. Paper fill with ink border, Wash on hover, Line Grey on press. A pressed toggle inverts to ink.
- **Ghost:** No border at rest, Wash on hover, for lane tools.
- **Focus:** 2px ink outline at 1px offset, white on the transport bar.
- **Disabled:** Line Grey border with muted text and no fill.

### Inputs / Fields
- **Select:** 28px trigger with ink border and chevron. The menu shows ink-inverted highlight rows and the Popover shadow.
- **Slider:** A 1px ink track with a 3px range and an 8 by 14px rectangular thumb, laid out as label, track and 48px mono value. When the device value is unknown, the value reads `--`, the range disappears and the thumb goes hollow.
- **Switch:** A 28 by 16px rectangle that fills ink when on.
- **Segmented:** Bordered 28px options in 12px medium Archivo, joined by ink dividers. The selected one fills ink.

### Rows
Key and value lines with a Muted Ink label, a mono value and a Line Grey divider between them.

### Part Frame
The frame every node shares: paper fill, ink border, 3px corners, a 36px draggable header with the part name, a status line in Muted Ink and a remove button. Ports sit on the left and right edges with their name in Port type next to them. Parts carry a name, never a number.

### Navigation: Floating Dock
A column of 40px round icon buttons floating at the left edge, with Search on top, one button per part type, and Reset layout at the bottom. Names appear only in an ink tooltip on hover or focus, opening to the right after 80ms. Ink fill means the part is on the canvas, paper means it is not; clicking always adds one. Search opens a 240px panel beside the dock and also answers to Command-K.

**The Round Dock Rule.** Adding parts happens through round floating icons with names on hover. There is no sidebar, no text list at rest and no permanent labels.

### Transport Bar
The 52px ink strip holding the product name, Play, tempo, swing, position, pattern and connection status. Play is a white 84px button that becomes Deep Vermilion Stop while running. Status uses small square marks, filled for on and hollow for off. While the Cycles supplies the clock, the tempo field becomes a read-only mono value.

**The One Transport Rule.** There is one transport and no transport modes. Play on the app or the Cycles runs both, so the interface offers no mode, source or sync selector.

### Leader Line
The system's signature. A right-angle line with square corners at 1px ink, dashed `5 3` for MIDI and solid for audio. Each audio source runs its own vertical bus in the gap before its targets so its cables stay together and clear of parts. Selected lines thicken to 2.5px. The line itself can be selected and deleted.

**The Real Edge Rule.** Every connection is a real drawn right-angle edge between two ports. A relationship that exists but is not drawn is a defect, and a drawn line must match what the engine actually routes.

**The Pulse Rule.** On every hit a line carries, a 2.5px vermilion segment runs along it in up to 520ms. This is the only decorative-looking motion in the system, and it is signal. Reduced motion removes it.

### Step Grid
34 by 30px cells with 2px gaps under a mono step ruler, with beat groups alternating Wash and paper. A filled step takes its track ink at velocity opacity. Small marks carry the rest of its state: a white tick for where the hit truly lands, a white dot for chance under 100%, a diagonal hatch for a muted lane and a 2px inset outline for a note played on the Cycles itself. A 2px vermilion playhead runs over the grid while playing.

**The No Badge Rule.** There are no part numbers and no number badges anywhere. Rulers and scales that measure position, and mono values that read out state, are measurements and stay; a number attached to an object as its tag is not allowed.

### Motion
State only. Colors and small transforms change in 150ms, the camera moves in 250ms and a lane flash lasts 160ms. Nothing animates on entrance, and `prefers-reduced-motion` turns all of it off.

## Do's and Don'ts

### Do:
- **Do** draw every connection as a right-angle leader line between two real ports, dashed for MIDI and solid for audio.
- **Do** show the exact value of every control in Geist Mono, and show `--` when the device value cannot be known.
- **Do** keep part frames flat, with a 1px ink border and 3px corners, directly on the dot ground.
- **Do** keep vermilion for what is live now, using Vermilion for marks and Deep Vermilion for text and fills.
- **Do** add new part types to the round dock with a name that appears on hover.
- **Do** tie every motion to a change of state, and honor reduced motion.

### Don't:
- **Don't** add a dark mode or dark parts; the system is light mode only.
- **Don't** replace the dot ground with grid lines, tint or a plain field.
- **Don't** add part numbers or number badges anywhere.
- **Don't** use bezier curves or rounded elbows on connections, or imply a connection without drawing it.
- **Don't** add transport modes or a sync selector; there is one transport.
- **Don't** make the dock square, dock it to a sidebar or give it permanent text labels.
- **Don't** put shadows on parts or on controls inside them.
- **Don't** color chrome with track inks.
