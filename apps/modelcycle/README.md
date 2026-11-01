# Model:Cycles Studio

A node workspace for producing with an Elektron Model:Cycles.

    npm install
    npm run dev

Open http://localhost:5173 in Chrome, connect the Cycles over USB, click **Connect Model:Cycles**, and allow MIDI and microphone access. Chrome is required for Web MIDI and device audio capture.

Tests: `npm test`. Type-check and production build: `npm run build`.

The Model:Cycles has no sample memory, so chopped and recorded audio plays from the laptop in time with it. CC numbers in `src/lib/cycles.ts` come from the community table at github.com/pencilresearch/midi.
