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
- On connect the app reads the device's name and OS over SysEx, and lists its projects if the device offers a list command. Model:Cycles OS 1.12 does not, so the app says so. Elektron does not document the format, so this follows the open source Elektroid project, and only read requests are sent.
- The app does not read or write pattern data stored on the device; it only learns which pattern is active, from Program Change. To save a pattern on the device, Send to Cycles plays it once over MIDI while the device is in live record, and the producer saves the project on the device. Sound parameters sync both ways over CC.
- Sample to Preset plays about 150 trials on a chosen track over CC and notes, records each from the Cycles' USB audio, and scores it against a recorded hit. It leaves the closest result on that track. The Cycles cannot load samples, so this is a close match, not a copy, and saving a preset stays manual on the device. A result can also take one of four Match rows in the Sequencer, which play its recording from the laptop and use no device track.
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
