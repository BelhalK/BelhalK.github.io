# Model:Cycles Studio

A node workspace for producing with an Elektron Model:Cycles.

    npm install
    npm run dev

Open http://localhost:5173 in Chrome, connect the Cycles over USB, click **Connect Model:Cycles**, and allow MIDI and microphone access. Chrome is required for Web MIDI and device audio capture.

With no Cycles connected, tracks 1 to 6 play a laptop kit: samples downloaded from the Tone.js audio repository, plus a synth bass and chord. Choose the kit in the Model:Cycles part.

Everything else works without a device too: the Spectrogram, Spectrum and Monitor read whatever is playing, the FM-1 lane plays a simple FM voice from the app, and the Recorder opens this device's microphone by itself, on a laptop or a phone. Connecting a Cycles or FM-1 moves its lanes onto the hardware.

The LLM part writes a pattern from a prompt, using `GEMINI_API_KEY` from the git-ignored `.env` at the repo root. The key stays on the server and the browser only ever calls `/modelcycle/api/generate`. Under `npm run dev` that route is `gemini-plugin.ts`. On belhal.com it is `server/service.ts`, a systemd service on `127.0.0.1:8791` (`server/modelcycle-generate.service`) behind a Caddy route, limited to 50 generations a day because the page is public. Never add `VITE_GEMINI_*` to `.env`: it would publish the key in the build.

Phones get the same canvas, with a compact top bar and a dock that always fits the screen. Pinch and drag move the canvas, even over a part.

Tests: `npm test`. Type-check and production build: `npm run build`.

**Sample to Preset** finds a Cycles sound close to a recorded hit. Record a sound, choose **Match on Cycles**, pick a track and choose **Find preset**. The app plays about 150 trials on that track, listening to each over USB, then leaves the closest one there to save from the Cycles' own preset menu. It replaces the track's sound, and needs the Cycles connected with MIDI and USB audio. **Add as new row** gives the result its own row under FM-1, up to four, which plays the recording from the laptop like Chops.

**Send to Cycles** in the Sequencer records the current pattern's T1 to T6 into the device: it sends the track sounds, plays a silent count-in in whole loops, then plays the pattern once while you hold the Cycles in live record. The app then stays silent while you play the result back, and compares the steps it hears with what it sent. The device's pattern length and tempo, arming record and saving the project all stay manual.

The Model:Cycles has no sample memory, so chopped and recorded audio plays from the laptop in time with it. CC numbers in `src/lib/cycles.ts` come from the community table at github.com/pencilresearch/midi.
