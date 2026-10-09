import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const GAME_SECONDS = 30;
const HOOP_SCALE = 1.35;
const RIM_RADIUS = 0.3 * HOOP_SCALE;
const RELEASE = 0.22;
const FLIGHT = 0.55;
// Hoop speed in world units per second; each make in a row adds 14%.
const MODES = {
    classic: { speed: 2.1, max: 6 },
    fast: { speed: 3.6, max: 8 },
    orbit: { speed: 3, max: 7 },
};

export function createBasketballCourt(container, { paused, mode = 'classic', onReady, onGame, onError }) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-8, 8, 3.9, -0.1, 0.1, 100);
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x746181, 2.8));
    const light = new THREE.DirectionalLight(0xffe4b5, 3.5);
    light.position.set(-3, 5, 6);
    scene.add(light);
    const rimLight = new THREE.DirectionalLight(0xd6c1ff, 2);
    rimLight.position.set(4, 2, -3);
    scene.add(rimLight);

    const player = new THREE.Group();
    const ball = new THREE.Group();
    const hoop = new THREE.Group();
    scene.add(player, ball, hoop);

    const orange = new THREE.MeshStandardMaterial({ color: 0xda7024, roughness: 0.85 });
    const seam = new THREE.MeshBasicMaterial({ color: 0x35231b });
    ball.add(new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 16), orange));
    for (let i = 0; i < 3; i++) {
        const line = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.004, 4, 40), seam);
        if (i === 1) line.rotation.x = Math.PI / 2;
        if (i === 2) line.rotation.y = Math.PI / 2;
        ball.add(line);
    }

    const purple = new THREE.MeshStandardMaterial({ color: 0x624778, roughness: 0.55 });
    const white = new THREE.LineBasicMaterial({ color: 0xc4bccd });
    const backboard = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.7, 0.06), new THREE.MeshStandardMaterial({ color: 0xf3eef7, transparent: true, opacity: 0.8, roughness: 0.4 }));
    backboard.position.set(0, 2.65, -0.38);
    hoop.add(backboard);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(backboard.geometry), new THREE.LineBasicMaterial({ color: 0x8c769e }));
    outline.position.copy(backboard.position);
    hoop.add(outline);
    const target = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.4, 0.3)), new THREE.LineBasicMaterial({ color: 0x9673b3 }));
    target.position.set(0, 2.55, -0.34);
    hoop.add(target);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 2.6, 8), purple);
    pole.position.set(0, 1.3, -0.5);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.06, 24), purple);
    base.position.set(0, 0.03, -0.5);
    // The hoop clips onto a page edge instead of standing on a separate court.
    pole.geometry.dispose();
    base.geometry.dispose();
    purple.dispose();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 8, 40), orange);
    rim.rotation.x = Math.PI * 0.38;
    rim.position.y = 2.3;
    hoop.add(rim);
    const net = new THREE.Group();
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        const points = [new THREE.Vector3(Math.cos(angle) * 0.3, 2.3, Math.sin(angle) * 0.3), new THREE.Vector3(Math.cos(angle + 0.4) * 0.18, 1.92, Math.sin(angle + 0.4) * 0.18)];
        net.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), white));
    }
    hoop.add(net);

    // Layered transparent discs give a soft contact shadow without a shadow-map pass.
    const shadow = new THREE.Group();
    for (let i = 0; i < 7; i++) {
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.22 + i * 0.045, 32), new THREE.MeshBasicMaterial({ color: 0x49365a, transparent: true, opacity: 0.025, depthWrite: false }));
        disc.scale.y = 0.15;
        disc.position.z = -0.5;
        shadow.add(disc);
    }
    scene.add(shadow);
    const sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xf0bc43, transparent: true });
    const sparks = new THREE.Group();
    const sparkGeometry = new THREE.SphereGeometry(0.045, 6, 4);
    for (let i = 0; i < 12; i++) sparks.add(new THREE.Mesh(sparkGeometry, sparkMaterial));
    sparks.visible = false;
    scene.add(sparks);

    const landing = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.3, 40), new THREE.MeshBasicMaterial({ color: 0xff7a35, transparent: true, opacity: 0.6, depthWrite: false }));
    landing.scale.y = 0.2;
    landing.visible = false;
    scene.add(landing);

    // An invisible lane catches shots: the hoop's row in sideways modes, the whole viewport in orbit.
    const lane = document.createElement('div');
    lane.className = 'courtside-lane';
    lane.hidden = true;
    container.appendChild(lane);

    const rigs = [];
    let disposed = false;
    let ready = false;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixels = width < 600 ? 42 : 54;
    let time = 0;
    let previous = null;
    let action = null;
    let anchor = null;
    let nextMove = 2.4;
    let landTime = -10;
    let hops = 0;
    let pendingShot = false;
    let hovered = null;
    let lastHover = -10;
    let facing = 0;
    let lastScrollAt = -10;
    let game = null;
    const visited = new WeakMap();
    const hand = new THREE.Vector3();
    const ballRest = new THREE.Vector3();
    const surfaceSelector = 'button, .nav-link, .stack-tag, .social-btn, .list-action, .list-row, .player-card, .focus-panel, .deal-card, .trophy-card, .card, h1, h2';
    const abort = new AbortController();
    const smooth = (value) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

    function surfaceRect(element) {
        if (element.matches('h1, h2')) {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            let text;
            while ((text = walker.nextNode())) {
                if (!text.textContent.trim()) continue;
                const range = document.createRange();
                range.selectNodeContents(text);
                return range.getBoundingClientRect();
            }
        }
        return element.getBoundingClientRect();
    }

    function point(surface) {
        if (!surface?.element) {
            const dock = document.querySelector('.courtside-toolbar').getBoundingClientRect();
            return new THREE.Vector3((dock.left + 24 - width / 2) / pixels, (height - dock.top) / pixels, 0);
        }
        const rect = surfaceRect(surface.element);
        const x = rect.left + rect.width * surface.fraction;
        return new THREE.Vector3((x - width / 2) / pixels, (height - rect.top) / pixels, 0);
    }

    function surfaces() {
        // Look through the shooting lane so it doesn't hide every landing spot during a game.
        lane.style.pointerEvents = 'none';
        const found = [...document.querySelectorAll(surfaceSelector)].flatMap((element) => {
            if (element.closest('.courtside, [hidden]') || element.disabled || element.closest('.reveal:not(.in-view)')) return [];
            const rect = surfaceRect(element);
            if (rect.width < 28 || rect.height < 12 || rect.top < pixels * 2.8 || rect.top > height - 85 || rect.right < 35 || rect.left > width - 35) return [];
            const fraction = rect.width > 240 ? 0.82 : 0.5;
            const x = rect.left + rect.width * fraction;
            if (x < 28 || x > width - 28) return [];
            // Don't land on clipped carousel items or controls hidden behind another surface.
            const hit = document.elementFromPoint(x, rect.top + Math.min(rect.height / 2, 10));
            if (hit && !element.contains(hit) && !hit.contains(element)) return [];
            return [{ element, fraction }];
        });
        lane.style.pointerEvents = '';
        return found;
    }

    function chooseSurface(preferred) {
        const options = surfaces();
        if (preferred) {
            const match = options.find((candidate) => candidate.element === preferred);
            if (match) return match;
        }
        const origin = player.position;
        const ranked = options.filter((candidate) => candidate.element !== anchor?.element).map((candidate) => {
            const position = point(candidate);
            const distance = position.distanceTo(origin);
            const recent = time - (visited.get(candidate.element) ?? -100);
            const vertical = Math.abs(position.y - origin.y);
            const desiredDistance = width < 600 ? 3.4 : hops % 3 === 2 ? width * 0.45 / pixels : 5.2;
            const sameDock = candidate.element.closest('.nav') && anchor?.element?.closest('.nav');
            const score = Math.abs(distance - desiredDistance) + (recent < 15 ? 8 : 0) + (sameDock ? 3 : 0) - Math.min(vertical, 3) * 0.4;
            return { candidate, score };
        }).sort((a, b) => a.score - b.score);
        return ranked[0]?.candidate ?? options[0] ?? { element: null, fraction: 0.5 };
    }

    function resize() {
        const bounds = container.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        width = bounds.width;
        height = bounds.height;
        pixels = width < 600 ? 42 : 54;
        camera.left = -width / pixels / 2;
        camera.right = width / pixels / 2;
        camera.top = height / pixels;
        camera.bottom = 0;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        layoutLane();
        if (ready) {
            action = null;
            anchor = chooseSurface(anchor?.element);
            player.position.copy(point(anchor));
            nextMove = time + 1.5;
        }
        draw(0);
    }

    function layoutLane() {
        if (!game) return;
        const top = height / pixels;
        // Keep the whole hoop (backboard above the rim, net below it) inside the viewport.
        game.low = 0.3 + 0.6 * HOOP_SCALE;
        game.high = top - 0.3 - 0.85 * HOOP_SCALE;
        game.laneY = THREE.MathUtils.clamp(top * 0.6, game.low, game.high);
        if (mode === 'orbit') {
            lane.style.top = '0px';
            lane.style.height = '100%';
        } else {
            const laneTop = game.laneY + 0.85 * HOOP_SCALE;
            const laneBottom = game.laneY - 0.55 * HOOP_SCALE;
            lane.style.top = `${height - laneTop * pixels}px`;
            lane.style.height = `${(laneTop - laneBottom) * pixels}px`;
        }
    }

    function report(over = false) {
        const { score, made, attempts, streak, remaining } = game;
        onGame({ score, made, attempts, streak, remaining: Math.max(0, Math.ceil(remaining)), playing: !over, over, mode });
    }

    function startGame() {
        if (!ready || game) return;
        game = { x: 0, dir: 1, angle: Math.PI, rim: new THREE.Vector3(), laneY: 0, low: 0, high: 0, score: 0, made: 0, attempts: 0, streak: 0, remaining: GAME_SECONDS, shownSecond: GAME_SECONDS, start: time };
        game.x = -Math.max(1, width / pixels / 2 - 1.2);
        layoutLane();
        lane.hidden = false;
        pendingShot = false;
        hovered = null;
        // The player stays where they are; only a decorative shot in progress makes way for the game hoop.
        if (action?.kind === 'shot') action = null;
        report();
    }

    function setMode(value) {
        if (!MODES[value]) return;
        mode = value;
        layoutLane();
        if (game) report();
    }

    function stopGame() {
        if (!game) return;
        report(true);
        game = null;
        lane.hidden = true;
        hoop.visible = false;
        if (action?.kind === 'gameShot') action = null;
        nextMove = time + 1;
        if (paused) draw(0);
    }

    function callout(text, made, at) {
        const element = document.createElement('div');
        element.className = `courtside-callout${made ? ' made' : ''}`;
        element.textContent = text;
        element.style.left = `${width / 2 + at.x * pixels}px`;
        element.style.top = `${height - (at.y + 0.9 * HOOP_SCALE) * pixels}px`;
        container.appendChild(element);
        element.addEventListener('animationend', () => element.remove());
        setTimeout(() => element.remove(), 1500);
    }

    // Shots are judged when the ball arrives, against where the hoop is then, so players must lead it.
    function resolveShot(shot) {
        const dx = shot.target.x - game.rim.x;
        const dy = shot.target.y - game.rim.y;
        shot.hit = Math.abs(dx) <= RIM_RADIUS + shot.tolerance && Math.abs(dy) <= 0.45 + shot.tolerance;
        shot.swish = shot.hit && Math.abs(dx) <= RIM_RADIUS * 0.35 && Math.abs(dy) <= 0.25;
        shot.side = Math.sign(dx) || 1;
        game.attempts++;
        if (shot.hit) {
            const value = shot.swish ? 3 : 2;
            game.score += value;
            game.made++;
            game.streak++;
            callout(shot.swish ? `Swish +${value}` : `+${value}`, true, game.rim);
        } else {
            game.streak = 0;
            callout('Miss', false, shot.target);
        }
        report();
    }

    function onLanePointer(event) {
        if (!game || paused || game.remaining <= 0) return;
        if (action && !(action.kind === 'gameShot' && action.resolved)) return;
        event.preventDefault();
        const bounds = container.getBoundingClientRect();
        const x = (event.clientX - bounds.left - width / 2) / pixels;
        const y = mode === 'orbit' ? (height - (event.clientY - bounds.top)) / pixels : game.laneY;
        const tolerance = event.pointerType === 'touch' ? 0.15 : 0.06;
        action = { kind: 'gameShot', start: time, target: new THREE.Vector3(x, y, 0), tolerance, release: null, resolved: false, hit: false, drop: null };
        container.dataset.action = 'shooting';
    }

    function updateGame(delta) {
        const { speed: base, max } = MODES[mode];
        const speed = Math.min(base * (1 + game.streak * 0.14), max);
        const rangeX = Math.max(1, width / pixels / 2 - 1.2);
        if (mode === 'orbit') {
            // An ellipse spanning the viewport, at a constant speed along its edge.
            const rangeY = Math.max(0.5, (game.high - game.low) / 2);
            game.angle += speed / ((rangeX + rangeY) / 2) * delta;
            game.x = Math.cos(game.angle) * rangeX;
            game.rim.set(game.x, (game.low + game.high) / 2 + Math.sin(game.angle) * rangeY, 0);
        } else {
            game.x += game.dir * speed * delta;
            if (game.x > rangeX) { game.x = rangeX; game.dir = -1; }
            if (game.x < -rangeX) { game.x = -rangeX; game.dir = 1; }
            game.rim.set(game.x, game.laneY, 0);
        }
        hoop.visible = true;
        hoop.position.copy(game.rim).add(new THREE.Vector3(0, -2.3 * HOOP_SCALE, 0));
        hoop.scale.setScalar(HOOP_SCALE * smooth((time - game.start) / 0.3));
        game.remaining -= delta;
        const second = Math.max(0, Math.ceil(game.remaining));
        if (second !== game.shownSecond) { game.shownSecond = second; report(); }
        if (game.remaining <= 0 && action?.kind !== 'gameShot') stopGame();
    }

    function startHop(destination) {
        const from = player.position.clone();
        from.y = THREE.MathUtils.clamp(from.y, -2, height / pixels + 1);
        const to = point(destination);
        const distance = from.distanceTo(to);
        if (distance < 0.2) { nextMove = time + 2; return; }
        const apex = Math.max(from.y, to.y) + Math.max(0.15, Math.min(1.8, 0.65 + distance * 0.12, height / pixels - 2.15 - Math.max(from.y, to.y)));
        const gravity = 18;
        const velocity = Math.sqrt(2 * gravity * (apex - from.y));
        const duration = (velocity + Math.sqrt(2 * gravity * (apex - to.y))) / gravity;
        action = { kind: 'hop', start: time, from, to: destination, duration, velocity, gravity, scroll: window.scrollY };
        container.dataset.action = 'takeoff';
        container.dataset.target = destination.element?.getAttribute('aria-label') || destination.element?.textContent.trim().slice(0, 45) || 'page edge';
        hovered = null;
    }

    function draw(delta) {
        if (!ready) return;
        time += delta;
        const base = point(anchor);
        let jump = 0;
        let crouch = 0.08 + Math.sin(time * 2) * 0.025;
        let tuck = 0;
        let shotPose = 0;
        let lean = 0;
        let carrying = false;
        const bouncePhase = (time % 0.72) / 0.72;
        const bounce = 4 * bouncePhase * (1 - bouncePhase);
        const landingAge = time - landTime;
        const impact = landingAge < 0.45 ? Math.sin(landingAge / 0.45 * Math.PI) * 0.6 * Math.exp(-landingAge * 3) : 0;
        crouch += impact;
        hoop.visible = action?.kind === 'shot' || Boolean(game);
        sparks.visible = false;
        landing.visible = false;
        shadow.visible = true;

        if (!action) {
            player.position.copy(base);
            if (paused) {
                // Hold still during a timeout.
            } else if (game) {
                // Game mode holds position unless scrolling carries the player out of view.
                if (base.y < 0 || base.y > height / pixels - 1.9) startHop(chooseSurface());
            } else if (pendingShot) {
                const destination = chooseSurface(hovered);
                action = { kind: 'shot', start: time, to: destination, release: null };
                pendingShot = false;
                container.dataset.action = 'shooting';
            } else if (time > nextMove || base.y < 1 || base.y > height / pixels - 1.9) {
                startHop(chooseSurface(hovered));
            }
        }

        if (action?.kind === 'hop') {
            const t = time - action.start;
            const target = point(action.to);
            const from = action.from.clone();
            if (anchor?.element && !anchor.element.closest('.nav')) from.y += (window.scrollY - action.scroll) / pixels;
            const flightTime = Math.max(0, t - 0.24);
            const progress = THREE.MathUtils.clamp(flightTime / action.duration, 0, 1);
            const direction = Math.sign(target.x - from.x) || 1;
            facing = direction * 0.65;
            carrying = true;
            if (t < 0.24) {
                crouch = Math.sin(t / 0.24 * Math.PI) * 0.72;
                player.position.copy(from);
            } else {
                container.dataset.action = 'airborne';
                // Ballistic vertical motion, with a smooth horizontal launch and landing.
                player.position.lerpVectors(from, target, smooth(progress));
                const ballisticY = action.from.y + action.velocity * flightTime - 0.5 * action.gravity * flightTime * flightTime;
                const plannedEnd = action.from.y + action.velocity * action.duration - 0.5 * action.gravity * action.duration ** 2;
                player.position.y = ballisticY + (from.y - action.from.y) * (1 - progress) + (target.y - plannedEnd) * progress;
                jump = Math.max(0, player.position.y - THREE.MathUtils.lerp(from.y, target.y, progress));
                tuck = Math.sin(progress * Math.PI) * 0.95;
                crouch = 0;
                lean = -direction * Math.sin(progress * Math.PI * 2) * 0.12;
            }
            shadow.position.copy(target);
            shadow.scale.setScalar(0.55 + progress * 0.45);
            landing.visible = true;
            landing.position.copy(target);
            landing.material.opacity = 0.12 + progress * 0.38;
            landing.scale.set(1 + (1 - progress) * 0.8, 0.2, 1);
            if (progress >= 1) {
                anchor = action.to;
                visited.set(anchor.element || container, time);
                player.position.copy(target);
                landTime = time;
                hops++;
                nextMove = time + 2.2 + (hops % 3) * 0.45;
                pendingShot = !game && hops % 4 === 0;
                action = null;
                container.dataset.action = 'landing';
            }
        } else if (action?.kind === 'shot') {
            const t = time - action.start;
            const target = point(action.to);
            hoop.visible = true;
            hoop.position.copy(target).add(new THREE.Vector3(0, -1.95, 0));
            hoop.scale.setScalar(smooth(t / 0.3) * (1 - smooth((t - 2.8) / 0.4)));
            facing = Math.sign(target.x - base.x) * 0.45;
            crouch = t < 0.35 ? Math.sin(t / 0.35 * Math.PI) * 0.65 : impact;
            jump = t > 0.3 && t < 1.15 ? Math.sin((t - 0.3) / 0.85 * Math.PI) * 0.48 : 0;
            player.position.copy(base);
            player.position.y += jump;
            shotPose = smooth((t - 0.2) / 0.45) * (1 - smooth((t - 1.2) / 0.45));
            carrying = true;
        } else if (action?.kind === 'gameShot') {
            const t = time - action.start;
            facing = Math.sign(action.target.x - base.x) * 0.45;
            crouch = t < 0.18 ? Math.sin(t / 0.18 * Math.PI) * 0.55 : impact;
            jump = t > 0.12 && t < 0.62 ? Math.sin((t - 0.12) / 0.5 * Math.PI) * 0.4 : 0;
            player.position.copy(base);
            player.position.y += jump;
            shotPose = smooth((t - 0.04) / 0.18) * (1 - smooth((t - 0.6) / 0.3));
            carrying = true;
        } else {
            facing *= Math.exp(-delta * 2);
            if (landingAge > 0.5) container.dataset.action = 'dribbling';
            shadow.position.copy(base);
            shadow.scale.setScalar(1);
            if (landingAge < 0.55) {
                landing.visible = true;
                landing.position.copy(base);
                landing.scale.set(1 + landingAge * 3, 0.2 + landingAge * 0.4, 1);
                landing.material.opacity = Math.max(0, 0.4 - landingAge);
            }
        }

        if (game) updateGame(delta);
        player.rotation.y = THREE.MathUtils.damp(player.rotation.y, facing, 9, delta);
        player.rotation.z = lean;
        rigs.forEach(({ root, arms, elbows, legs, knees }) => {
            const bend = crouch * 0.85;
            root.position.y = -0.88 * (1 - Math.cos(bend));
            arms[0].rotation.x = -0.22 - shotPose * 2.05 - (carrying ? 0.25 : bounce * 0.1);
            arms[1].rotation.x = -0.12 - shotPose * 2.15 + tuck * 0.35;
            arms[0].rotation.z = -shotPose * 0.15;
            arms[1].rotation.z = shotPose * 0.15;
            elbows[0].rotation.x = carrying ? -1.15 + shotPose * 0.8 : -0.28 - bounce * 0.75;
            elbows[1].rotation.x = -0.2 - tuck * 0.7 - shotPose * 0.3;
            legs[0].rotation.x = -bend - tuck * 0.9;
            legs[1].rotation.x = -bend - tuck * 0.55;
            knees[0].rotation.x = bend * 2 + tuck * 1.45;
            knees[1].rotation.x = bend * 2 + tuck * 1.2;
        });
        player.updateMatrixWorld(true);
        // Negative X is the player's anatomical right side in the supplied rest pose.
        hand.set(-0.025, -0.3, 0.025).applyMatrix4(rigs[0].elbows[0].matrixWorld);
        hand.y -= 0.08;
        ballRest.copy(hand);
        if (!carrying) {
            ballRest.y = base.y + 0.145 + bounce * Math.max(0.1, hand.y - base.y - 0.145);
        }
        ball.position.copy(ballRest);

        if (action?.kind === 'shot') {
            const t = time - action.start;
            const target = point(action.to).add(new THREE.Vector3(0, 0.35, 0));
            if (t >= 0.65 && !action.release) action.release = hand.clone();
            if (t >= 0.65 && t < 1.75) {
                const p = (t - 0.65) / 1.1;
                ball.position.lerpVectors(action.release, target, p);
                ball.position.y += Math.sin(p * Math.PI) * Math.max(0.7, action.release.distanceTo(target) * 0.22);
            } else if (t >= 1.75) {
                const fall = t - 1.75;
                if (fall < 0.28) {
                    ball.position.copy(target);
                    ball.position.y -= fall * 2;
                } else {
                    const p = smooth((fall - 0.28) / 0.8);
                    ball.position.lerpVectors(target.clone().add(new THREE.Vector3(0, -0.56, 0)), hand, p);
                    ball.position.y += Math.sin(p * Math.PI) * 0.8;
                }
                net.rotation.z = Math.sin(fall * 22) * Math.exp(-fall * 7) * 0.04;
                sparks.visible = fall < 0.6;
                sparkMaterial.opacity = Math.max(0, 1 - fall / 0.6);
                sparks.children.forEach((spark, index) => {
                    const angle = index / 12 * Math.PI * 2;
                    spark.position.copy(target).add(new THREE.Vector3(Math.cos(angle) * fall, Math.sin(angle) * fall - fall * fall, 0));
                });
            }
            if (t > 3.2) {
                action = null;
                nextMove = time + 0.8;
                hoop.visible = false;
            }
        }
        if (action?.kind === 'gameShot' && game) {
            const t = time - action.start;
            if (t >= RELEASE && !action.release) action.release = hand.clone();
            if (t >= RELEASE && t < RELEASE + FLIGHT) {
                const p = (t - RELEASE) / FLIGHT;
                ball.position.lerpVectors(action.release, action.target, p);
                ball.position.y += Math.sin(p * Math.PI) * Math.max(0.9, action.release.distanceTo(action.target) * 0.18);
            } else if (t >= RELEASE + FLIGHT) {
                const fall = t - RELEASE - FLIGHT;
                if (!action.resolved) { action.resolved = true; resolveShot(action); }
                if (fall < 0.25) {
                    const k = fall / 0.25;
                    if (action.hit) {
                        // Settle into the (still moving) rim and drop through the net.
                        ball.position.lerpVectors(action.target, game.rim, smooth(k * 2));
                        ball.position.y -= k * 0.56 * HOOP_SCALE;
                    } else {
                        // Clank off and fall away from the hoop.
                        ball.position.copy(action.target);
                        ball.position.x += action.side * k * 0.6;
                        ball.position.y += Math.sin(k * Math.PI) * 0.3 - k * 0.8;
                    }
                } else {
                    if (!action.drop) action.drop = ball.position.clone();
                    const p = smooth((fall - 0.25) / 0.45);
                    ball.position.lerpVectors(action.drop, hand, p);
                    ball.position.y += Math.sin(p * Math.PI) * 0.8;
                }
                if (action.hit) {
                    net.rotation.z = Math.sin(fall * 22) * Math.exp(-fall * 7) * 0.05;
                    sparks.visible = fall < 0.6;
                    sparkMaterial.opacity = Math.max(0, 1 - fall / 0.6);
                    sparks.children.forEach((spark, index) => {
                        const angle = index / 12 * Math.PI * 2;
                        spark.position.copy(game.rim).add(new THREE.Vector3(Math.cos(angle) * fall * 1.4, Math.sin(angle) * fall * 1.4 - fall * fall, 0));
                    });
                }
                if (fall > 0.7) action = null;
            }
        }
        if (action?.kind !== 'hop') {
            shadow.position.copy(base);
            shadow.scale.setScalar(1 - jump * 0.3);
        }
        ball.rotation.x = time * 2;
        ball.rotation.z = time * 3;
        renderer.render(scene, camera);
    }

    function frame(timestamp) {
        if (previous === null) previous = timestamp;
        const delta = Math.min((timestamp - previous) / 1000, 0.04);
        previous = timestamp;
        draw(delta);
    }

    function syncPlayback() {
        previous = null;
        renderer.setAnimationLoop(ready && !paused && !document.hidden ? frame : null);
    }

    function onScroll() {
        lastScrollAt = time;
        if (!action) nextMove = Math.min(nextMove, time + 0.5);
        if (paused) draw(0);
    }

    function onPointerOver(event) {
        if (game || paused || time - lastHover < 1.5 || time - lastScrollAt < 0.5) return;
        const element = event.target.closest(surfaceSelector);
        if (!element || element.closest('.courtside') || element === anchor?.element) return;
        if (!surfaces().some((surface) => surface.element === element)) return;
        hovered = element;
        lastHover = time;
        nextMove = Math.min(nextMove, time + 0.35);
    }

    function disposeObjects(root) {
        const geometries = new Set();
        const materials = new Set();
        root.traverse((object) => {
            object.skeleton?.dispose();
            if (object.geometry) geometries.add(object.geometry);
            if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => materials.add(material));
        });
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    document.addEventListener('visibilitychange', syncPlayback);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    lane.addEventListener('pointerdown', onLanePointer);
    const onContextLost = (event) => {
        event.preventDefault();
        ready = false;
        renderer.setAnimationLoop(null);
        onError();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    resize();

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    fetch(`${import.meta.env.BASE_URL}assets/kobe-bryant.glb`, { signal: abort.signal })
        .then((response) => {
            if (!response.ok) throw new Error('Basketball model unavailable');
            return response.arrayBuffer();
        })
        .then((buffer) => disposed ? null : loader.parseAsync(buffer, ''))
        .then((gltf) => {
            if (!gltf) return;
            if (disposed) { disposeObjects(gltf.scene); return; }
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const scale = 1.95 / (box.max.y - box.min.y);
            model.scale.multiplyScalar(scale);
            model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
            model.updateMatrixWorld(true);
            const bronze = new THREE.MeshStandardMaterial({ color: 0xbb8a43, metalness: 0.48, roughness: 0.48 });
            const oldMaterials = new Set();
            model.traverse((object) => {
                if (!object.isMesh) return;
                oldMaterials.add(object.material);
                const geometry = object.geometry;
                // Bake the glTF's quantized coordinates into a meter-sized rest pose.
                for (const name of ['position', 'normal']) {
                    const source = geometry.getAttribute(name);
                    const values = new Float32Array(source.count * 3);
                    for (let i = 0; i < source.count; i++) {
                        values.set([source.getX(i), source.getY(i), source.getZ(i)], i * 3);
                    }
                    geometry.setAttribute(name, new THREE.BufferAttribute(values, 3));
                }
                geometry.applyMatrix4(object.matrixWorld);

                // The supplied sculpture has no rig. Soft anatomical weights give this
                // small arcade character articulated handles, strides, and a shot pose.
                const rootBone = new THREE.Bone();
                const bones = [rootBone];
                const rig = { root: rootBone, arms: [], elbows: [], legs: [], knees: [] };
                for (const side of [-1, 1]) {
                    const arm = new THREE.Bone();
                    arm.position.set(side * 0.29, 1.49, 0);
                    const elbow = new THREE.Bone();
                    elbow.position.set(side * 0.04, -0.31, 0);
                    arm.add(elbow);
                    rootBone.add(arm);
                    const leg = new THREE.Bone();
                    leg.position.set(side * 0.13, 0.92, 0);
                    const knee = new THREE.Bone();
                    knee.position.y = -0.44;
                    leg.add(knee);
                    rootBone.add(leg);
                    bones.push(arm, elbow, leg, knee);
                    rig.arms.push(arm);
                    rig.elbows.push(elbow);
                    rig.legs.push(leg);
                    rig.knees.push(knee);
                }
                const positions = geometry.getAttribute('position');
                const indices = new Uint16Array(positions.count * 4);
                const weights = new Float32Array(positions.count * 4);
                for (let i = 0; i < positions.count; i++) {
                    const x = positions.getX(i);
                    const y = positions.getY(i);
                    const side = x < 0 ? 0 : 4;
                    let influence = 0;
                    let lower = 0;
                    let upperIndex = 0;
                    if (y > 0.85 || (Math.abs(x) > 0.26 && y > 0.62)) {
                        influence = THREE.MathUtils.smoothstep(Math.abs(x), 0.21, 0.3) * (1 - THREE.MathUtils.smoothstep(y, 1.47, 1.62));
                        lower = 1 - THREE.MathUtils.smoothstep(y, 1.08, 1.25);
                        upperIndex = side + 1;
                    } else {
                        influence = 1 - THREE.MathUtils.smoothstep(y, 0.75, 0.92);
                        lower = 1 - THREE.MathUtils.smoothstep(y, 0.42, 0.56);
                        upperIndex = side + 3;
                    }
                    indices.set([0, upperIndex, upperIndex + 1, 0], i * 4);
                    weights.set([1 - influence, influence * (1 - lower), influence * lower, 0], i * 4);
                }
                geometry.setAttribute('skinIndex', new THREE.BufferAttribute(indices, 4));
                geometry.setAttribute('skinWeight', new THREE.BufferAttribute(weights, 4));
                const mesh = new THREE.SkinnedMesh(geometry, bronze);
                mesh.add(rootBone);
                mesh.bind(new THREE.Skeleton(bones));
                mesh.frustumCulled = false;
                player.add(mesh);
                rigs.push(rig);
            });
            oldMaterials.forEach((material) => material.dispose());
            anchor = chooseSurface(document.getElementById('scoutBtn'));
            visited.set(anchor.element || container, time);
            player.position.copy(point(anchor));
            ready = true;
            container.dataset.action = 'dribbling';
            draw(0);
            onReady();
            syncPlayback();
        })
        .catch(() => {
            if (!disposed) { renderer.setAnimationLoop(null); onError(); }
        });

    return {
        startGame,
        stopGame,
        setMode,
        get playing() { return Boolean(game); },
        setPaused(value) { paused = value; syncPlayback(); },
        dispose() {
            disposed = true;
            abort.abort();
            observer.disconnect();
            document.removeEventListener('visibilitychange', syncPlayback);
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('pointerover', onPointerOver);
            renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
            renderer.setAnimationLoop(null);
            disposeObjects(scene);
            renderer.dispose();
            renderer.domElement.remove();
        },
    };
}
