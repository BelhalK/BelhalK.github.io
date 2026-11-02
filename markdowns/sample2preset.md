# Plan: sample to preset for the Model:Cycles

Status: plan only, nothing built. Written 2026-11-02.

## Verdict: doable as a close match, not a clone

The Cycles can't play samples, so it can only approximate your hit using its FM engines. Kicks, hats, claps, rimshots and short tonal hits should get usefully close, but voices and complex textures won't. None of this has been measured yet, which is what the first phase is for.

The app can also get better results than a one-shot estimate, because it can control the Cycles and hear it:

- **Control:** it can change the machine and sound parameters over CC, and trigger notes.
- **Listening:** it already opens the Cycles' USB audio.

The current **Rebuild on the Cycles** button in the Chopper only estimates machine, pitch, decay and color from the sample, and never checks the result. The new node would test real sounds instead.

| What you want | Feasible? | How |
| --- | --- | --- |
| Hear the recreated sound on the Cycles | Yes | Send the best settings to a track over CC |
| Use it in the app's Sequencer | Yes | Save it to Sounds (`mySounds`), which the Sequencer tracks already use |
| Keep it as a preset on the device | Yes, one manual step | Save it from the Cycles' own preset menu once the sound is on the track |
| Have the app write the preset automatically | **Unknown** | See below |

**Automatic writing:** Elektroid can upload Model:Cycles preset files, but no public description of what's inside a `.mcpst` file turned up. Elektroid moves those files around, and nothing found shows it building one from parameter values. We'd have to work out the format by comparing presets from the device, and a mistake could overwrite a preset slot, so it stays out of the first version.

## How the node would work

1. **Input:** take the selected Chopper slice, trim the silence and normalize it.
2. **Choose machines:** run a few quick trials on each likely machine, then keep the best two.
3. **Search:** for each trial, send the settings, trigger the track, record the USB audio, line up the attack and score the match. Search pitch, decay, color, shape, sweep, contour and vol + dist, with delay and reverb off. This kind of search has a track record in published sound-matching work.
4. **Compare:** show the waveforms and a match score, and play the original and the result back to back.
5. **Keep it:** **Apply to track** and **Save to Sounds**, plus clear steps for saving it on the device.

The search uses plain TypeScript with no server, AI service or new dependency, and the audio stays on the laptop.

## Limits to expect

- **Time:** each trial takes about 0.5–1.5 seconds, so a search of around 150 trials takes 2–4 minutes. This is an estimate, and long sounds take longer.
- **It's audible:** you'd hear the trials unless monitoring is muted, so monitoring would be muted by default.
- **It overwrites a track:** the app can't read a track's current sound, so it can't restore it afterwards. You pick the track, and the node warns you first; save anything you want to keep.
- **Hardware only:** nothing can be searched without the Cycles connected, and the transport must be stopped.
- **Mic quality matters:** room echo can make the decay match too long, so close, dry recordings will work best.

## Build order

1. **Feasibility test:** build only the send, trigger, record and score loop, plus a basic search. Record a sound from the Cycles itself, then see whether the search can get back to it by ear and by score. If it can't match its own sound, stop or rethink before building the UI.
2. **Real samples:** tune the scoring on 5–10 of your own mic recordings, such as a kick, clap, hat and a tonal hit.
3. **The node:** add the Sample to Preset part, wire it from the Chopper, and add progress, cancel, comparison and saving.
4. **Optional, automatic writing:** compare presets that differ by one setting to see if the format can be worked out. This only goes ahead if the manual save step is annoying in practice.

The code can be written on the server, but the tests need the Cycles, so phase 1 needs one session with the device plugged into the Mac over USB.

## Open decision

Start phase 1, with automatic preset writing left out for now? That is the recommendation.

## Sources

- [Elektroid](https://github.com/dagargo/elektroid)
- [Community Model:Cycles MIDI table](https://github.com/pencilresearch/midi)
- [Elektronauts: transferring SysEx to the Model:Cycles](https://www.elektronauts.com/t/transfering-sysex-to-model-cycles/149976)
- [Sound On Sound: Model:Cycles review](https://www.soundonsound.com/reviews/elektron-modelcycles)
- [Yee-King et al.: comparing search methods and deep networks for synth sound matching](https://ieeexplore.ieee.org/abstract/document/8323327)
- [INSTRUMENTAL: CMA-ES sound matching preprint](https://arxiv.org/abs/2603.15905)
