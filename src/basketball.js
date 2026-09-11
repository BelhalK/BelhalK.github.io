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
const shoot = root.querySelector('.courtside-shoot');
const pause = root.querySelector('.courtside-pause');
const hide = root.querySelector('.courtside-hide');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let court;
let generation = 0;
let visible = false;
let paused = false;
let points = 0;
let status = 'loading';
let dismissed = true;
try {
    const stored = localStorage.getItem('courtside-hidden');
    dismissed = stored === null ? true : stored === 'true';
    paused = sessionStorage.getItem('courtside-paused') === 'true';
    points = Number(sessionStorage.getItem('courtside-points')) || 0;
} catch { /* Storage is optional. */ }

function update() {
    stage.hidden = !visible;
    stage.dataset.status = status;
    launch.hidden = visible;
    [label, hide].forEach((element) => { element.hidden = !visible; });
    shoot.hidden = !visible || status === 'error';
    pause.hidden = !visible || motion.matches || status === 'error';
    shoot.disabled = status !== 'ready' || paused || motion.matches;
    label.querySelector('small').textContent = status === 'error' ? 'Court unavailable' : status === 'loading' ? 'Warming up...' : motion.matches ? 'Motion off' : paused ? 'Timeout' : `${String(points).padStart(2, '0')} PTS / Page parkour`;
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
            onReady() { status = 'ready'; update(); },
            onScore() {
                points += 2;
                try { sessionStorage.setItem('courtside-points', String(points)); } catch { /* Optional score persistence. */ }
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
shoot.addEventListener('click', () => court?.shoot());
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
