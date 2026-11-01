# Plan: save Model:Cycles Studio projects on the VPS

Status: deferred, nothing built. Written 2026-11-01.

## Goal

Save named projects as JSON files on the VPS, so they can be opened from any computer. No Firebase, Postgres or other database.

## Today

- `/modelcycle/` is a static build from `apps/modelcycle`, served by Caddy from `dist/modelcycle/`.
- There is one autosaved project per browser. `zustand` `persist` keeps it in `localStorage` under `modelcycle-studio` (`src/store/project.ts`).
- The chop sample is raw audio in IndexedDB, under the `chop` key (`src/engine/audio.ts`). It is not part of the project state.
- Everything is tied to one browser and one address, so work saved on `localhost` does not appear on the live site.

## Decision

Add one small dependency-free Node script on the VPS, with one JSON file per project.

Caddy only serves files, so the browser needs something on the VPS to receive a save.

The rejected alternative is the `/bath` approach: export a file and commit it to the repo. Every save would need a commit and rebuild, and every project would be publicly readable unless the repo and site are locked down.

## Design

### Server

- About 50 lines of Node, using only built-in modules.
- Listens on localhost only. Caddy is its only public route.
- Lists, reads, writes and deletes projects in a folder such as `/var/lib/modelcycle/projects/`.
- The folder stays outside `dist/`, so a rebuild cannot wipe projects. Backing up means copying the folder.
- Generates or validates project ids so a request cannot write outside the folder, and limits request size.
- Writes to a temporary file and then renames it, so a failed save cannot corrupt an existing project.

Proposed routes, under `/modelcycle/api`:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/projects` | List projects |
| `GET` | `/projects/:id` | Read a project |
| `PUT` | `/projects/:id` | Create or replace a project |
| `DELETE` | `/projects/:id` | Delete a project and its audio |
| `GET` | `/projects/:id/audio` | Read the chop sample |
| `PUT` | `/projects/:id/audio` | Store the chop sample |

### Caddy

Two additions:

- Send `/modelcycle/api/*` to the script with `reverse_proxy`.
- Require a password on that path with `basic_auth`. This is mandatory: the site is public, and without it anyone could read or overwrite projects.

The Caddyfile is not in this repo, so these need matching to the VPS config.

### VPS

A small `systemd` service keeps the script running and restarts it after a crash or reboot.

### App

- Add a Projects panel with save, open and delete. This is new work, because the app has no concept of multiple projects yet.
- Keep the browser autosave, so the app still works if the VPS is down.
- Save only on an explicit click, so saving cannot affect timing. MIDI stays local between the Cycles and Chrome.
- Show a clear error when a save fails, and never discard the local copy.

### What gets saved

JSON: the fields `partialize` already selects in `src/store/project.ts`, including patterns, BPM, swing, sounds, chop slice points and canvas layout. Store the `persist` version number with each file, so older projects can go through the existing `migrate` logic.

Device-specific fields such as `fmMidiPort` and `fmAudioInput` may not match on another computer, so opening a project must cope with a missing port or input.

Audio: the chop sample is stored as a separate file beside the JSON. Without it, opening a project on another computer restores the slice points but not the sound.

## Build order

1. Write the server and test it locally.
2. Add the API client and Projects panel, including chop audio.
3. Add a dev proxy to the root `vite.config.js`, or a dev mode in the script, so the API works under `npm run dev`.
4. Write the `systemd` unit and Caddy config.
5. Apply the config on the VPS, then check the password, save, reopen on a second computer, and rebuild to confirm projects survive.

## Open questions

- Is one shared password enough? It should be, for a single user.
- Should saving keep older versions of a project, or just overwrite? The default is overwrite, with backups by copying the folder.
- What is the audio size limit? Check the size of real samples before setting it, and make sure it fits the Caddy and server limits.
