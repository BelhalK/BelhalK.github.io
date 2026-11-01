# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Web app run locally in Chrome (user's choice), for Web MIDI and audio capture. Delegated within that: React, Vite, TypeScript, React Flow for the node canvas, shadcn/ui for controls.

## Users

One house music producer who writes tracks on an Elektron Model:Cycles and sits at a MacBook Air with the device connected by USB. They want to see, shape and study what they make, and become a better house producer while doing it.

## Product Purpose

A node-based workspace on the laptop for producing with the Model:Cycles: see tracks and the sequencer, shift steps, view sounds and banks, hear the device through the Mac, and visualize the audio. Success means the producer reaches for it during real sessions and their grooves and mixes improve.

## Positioning

A patchable canvas where the hardware, its sequencer, the audio it makes, and study material such as reference tracks and chopped samples sit side by side, instead of a generic DAW or a plain MIDI editor.

## Operating Context

- Model:Cycles over USB, showing as a class-compliant MIDI port and a 2-in/2-out audio device at 48 kHz.
- One transport: Play on either the app or the Cycles runs both. Notes the Cycles sends over MIDI are mirrored on the grid while playing, once clock out and each track's MOut are on.
- Pattern data stored on the device cannot be read or written, because the SysEx format is undocumented; the app only learns which pattern is active, from Program Change. Sound parameters sync both ways over CC.
- An M-VAVE FM-1 synth joins over USB as another sound source (not yet in hand).
- Audio monitored through the Mac's output.
- Recording from a Mac microphone, and uploading a song to chop into samples.

## Capabilities and Constraints

- Requested learning features: groove and swing, mix and spectrum, reference track comparison, upload-and-chop sampling.
- Chrome is required for Web MIDI and device audio capture.

## Brand Commitments

- Light mode only for now.
- Clean, neat, high contrast.
- User-named references for UI quality: magicui.design and ui.shadcn.com. `node.PNG` is the structural reference: a node canvas with spectrogram, MIDI and audio nodes.

## Evidence on Hand

`node.PNG` (reference screenshot). No demo songs or user patterns exist yet; anything illustrative must be labeled as such.

## Product Principles

1. The hardware stays the instrument; the laptop adds sight and study.
2. Never show a device state the app cannot actually know.
3. What the producer sees and what they hear stay in sync.
4. Every learning feature ends in something they can try on the next pattern.
