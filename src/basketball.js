import styles from './basketball.css?inline';

// A standalone island shared by the static homepage and all portfolio pages.
const style = document.createElement('style');
style.textContent = styles;
document.head.appendChild(style);
const root = document.createElement('aside');
root.className = 'courtside';
root.setAttribute('aria-label', 'Courtside basketball companion');
root.innerHTML = `
    <div class="courtside-stage" aria-hidden="true" hidden></div>
    <div class="courtside-toolbar">
        <a class="courtside-number" href="/assets/kobe-bryant-license.txt" target="_blank" rel="noreferrer" aria-label="Kobe Bryant 3D model credit and license" title="3D model by uzumakiabi / CC BY 4.0">24</a>
        <button class="courtside-launch" aria-label="Show basketball companion">Courtside <span aria-hidden="true">&#9655;</span></button>
        <div class="courtside-label" hidden><span>Courtside</span><small></small></div>
        <button class="courtside-mode" hidden></button>
        <button class="courtside-shoot" hidden>Shoot <span aria-hidden="true">&#8599;</span></button>
        <button class="courtside-icon courtside-pause" aria-label="Pause basketball animation" title="Timeout" hidden>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
        </button>
        <button class="courtside-icon courtside-hide" aria-label="Hide basketball companion" title="Hide" hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>
        </button>
    </div>`;
document.body.appendChild(root);

const stage = root.querySelector('.courtside-stage');
const launch = root.querySelector('.courtside-launch');
const label = root.querySelector('.courtside-label');
const modeButton = root.querySelector('.courtside-mode');
const shoot = root.querySelector('.courtside-shoot');
const pause = root.querySelector('.courtside-pause');
const hide = root.querySelector('.courtside-hide');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let court;
let generation = 0;
let visible = false;
let paused = false;
const MODES = { classic: 'Classic', fast: 'Fast', orbit: 'Orbit' };
const MODE_HINTS = { classic: 'hoop slides sideways', fast: 'hoop slides sideways, faster', orbit: 'hoop circles the whole page' };
let mode = 'classic';
let best = {};
let match = null;
let status = 'loading';
let dismissed = true;
try {
    const stored = localStorage.getItem('courtside-hidden');
    dismissed = stored === null ? true : stored === 'true';
    paused = sessionStorage.getItem('courtside-paused') === 'true';
    const storedMode = localStorage.getItem('courtside-mode');
    if (MODES[storedMode]) mode = storedMode;
    best = JSON.parse(localStorage.getItem('courtside-best') || '{}') || {};
    if (typeof best !== 'object') best = {};
} catch { /* Storage is optional. */ }

const SHOOT_LABEL = 'Shoot <span aria-hidden="true">&#8599;</span>';
const STOP_LABEL = 'Stop <span aria-hidden="true">&#9632;</span>';
const pad = (value) => String(value).padStart(2, '0');

function scoreline() {
    if (match?.playing) return `${pad(match.score)} PTS · ${match.made}/${match.attempts} · 0:${pad(match.remaining)}`;
    const record = best[mode] || 0;
    if (match?.over && match.mode === mode) return `Final ${pad(match.score)} PTS · Best ${pad(record)}`;
    return record ? `Best ${pad(record)} PTS / Page parkour` : 'Page parkour';
}

function update() {
    stage.hidden = !visible;
    stage.dataset.status = status;
    launch.hidden = visible;
    [label, hide].forEach((element) => { element.hidden = !visible; });
    shoot.hidden = !visible || status === 'error';
    modeButton.hidden = shoot.hidden;
    modeButton.disabled = status !== 'ready';
    modeButton.textContent = MODES[mode];
    modeButton.setAttribute('aria-label', `Game mode: ${MODES[mode]}, ${MODE_HINTS[mode]}. Click to change.`);
    modeButton.title = `Mode: ${MODE_HINTS[mode]}`;
    pause.hidden = !visible || motion.matches || status === 'error';
    const playing = Boolean(match?.playing);
    shoot.disabled = status !== 'ready' || (!playing && (paused || motion.matches));
    shoot.innerHTML = playing ? STOP_LABEL : match?.over ? SHOOT_LABEL.replace('Shoot', 'Again') : SHOOT_LABEL;
    shoot.setAttribute('aria-label', playing ? 'Stop shooting game' : 'Start shooting game: click where the moving hoop will be to shoot');
    label.querySelector('small').textContent = status === 'error' ? 'Court unavailable' : status === 'loading' ? 'Warming up...' : motion.matches ? 'Motion off' : paused ? 'Timeout' : scoreline();
    pause.setAttribute('aria-label', paused ? 'Resume basketball animation' : 'Pause basketball animation');
    pause.title = paused ? 'Resume' : 'Timeout';
    pause.querySelector('path').setAttribute('d', paused ? 'm8 5 11 7-11 7Z' : 'M8 5v14M16 5v14');
}

async function showCourt() {
    visible = true;
    status = 'loading';
    update();
    const current = ++generation;
    try {
        const { createBasketballCourt } = await import('./lib/basketballCourt.js');
        if (current !== generation) return;
        court = createBasketballCourt(stage, {
            paused: paused || motion.matches,
            mode,
            onReady() { status = 'ready'; update(); },
            onGame(state) {
                match = state;
                if (state.over && state.score > (best[state.mode] || 0)) {
                    best = { ...best, [state.mode]: state.score };
                    try { localStorage.setItem('courtside-best', JSON.stringify(best)); } catch { /* Optional score persistence. */ }
                }
                update();
            },
            onError() { status = 'error'; update(); },
        });
    } catch {
        if (current === generation) { status = 'error'; update(); }
    }
}

function hideCourt() {
    generation++;
    court?.dispose();
    court = null;
    match = null;
    visible = false;
    update();
}

launch.addEventListener('click', () => {
    try { localStorage.setItem('courtside-hidden', 'false'); } catch { /* Optional preference persistence. */ }
    showCourt();
    hide.focus({ preventScroll: true });
});
hide.addEventListener('click', () => {
    hideCourt();
    try { localStorage.setItem('courtside-hidden', 'true'); } catch { /* Optional preference persistence. */ }
    launch.focus({ preventScroll: true });
});
modeButton.addEventListener('click', () => {
    const order = Object.keys(MODES);
    mode = order[(order.indexOf(mode) + 1) % order.length];
    // Switching mid-round restarts it so each mode's best score stays fair.
    const restart = court?.playing;
    if (restart) court.stopGame();
    court?.setMode(mode);
    if (restart) court.startGame();
    try { localStorage.setItem('courtside-mode', mode); } catch { /* Optional preference persistence. */ }
    update();
});
shoot.addEventListener('click', () => {
    if (court?.playing) court.stopGame();
    else court?.startGame();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && court?.playing) court.stopGame();
});
pause.addEventListener('click', () => {
    paused = !paused;
    court?.setPaused(paused || motion.matches);
    try { sessionStorage.setItem('courtside-paused', String(paused)); } catch { /* Optional preference persistence. */ }
    update();
});
motion.addEventListener('change', () => {
    court?.setPaused(paused || motion.matches);
    update();
});

let resumeAfterNavigation = false;
window.addEventListener('pagehide', () => {
    resumeAfterNavigation = visible;
    hideCourt();
});
window.addEventListener('pageshow', (event) => {
    if (event.persisted && resumeAfterNavigation) showCourt();
});

if (!dismissed && !motion.matches && !navigator.connection?.saveData) showCourt();
