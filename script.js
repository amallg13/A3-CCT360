/* THE INTERNET IS WATCHING YOU
   Everything is tracked locally in the `S` object below. Nothing is stored or sent anywhere. */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(pointer:fine)').matches;
const wait = ms => new Promise(r => setTimeout(r, REDUCED ? Math.min(ms, 60) : ms));

/* ---------- Content for the five room objects ---------- */
const OBJECTS = {
  circle:   { title: 'FRAGMENT 001', text: 'Every pause is a sentence you never wrote.' },
  square:   { title: 'FRAGMENT 002', text: 'A click is a signature. You signed it without reading it.' },
  folder:   { title: 'unknown_file.txt', text: 'SESSION LOG (partial)\n> visitor arrived without a name\n> visitor chose where to look\n> visitor was never asked, only observed\n\nNothing was typed. It was enough.' },
  line:     { title: 'HIDDEN MESSAGE', text: 'Nobody asked you to scroll, hover or hesitate. It all still counts as an answer.' },
  question: { title: '?', text: 'If nobody asked, did you consent?' }
};

/* ---------- Central session state ---------- */
function newState() {
  return {
    scene: 0, t0: performance.now(), beginAfter: null,
    enter: {}, dur: {},                       // scene entry times / durations (seconds)
    hovered: [], clicked: [], order: [],      // room objects
    counts: {}, revisits: 0, objTime: {},
    choice: null, choiceTime: null, choiceHover: [], choiceChanges: 0, reconsiders: 0,
    pClicks: 0, moveSamples: 0, still: 0, edge: false, center: false, hidden: [],
    interactions: 0, cls: null, obs: []
  };
}
let S = newState();

/* One place that counts every interaction */
function recordInteraction() { S.interactions++; $('#hudCount').textContent = 'OBSERVING / ' + S.interactions + ' EVENTS'; }

/* ---------- Scenes ---------- */
const hooks = { 1: startEntry, 2: startRoom, 3: startChoice, 4: startField, 5: buildProfile, 6: startRevelation };

function showScene(n) {
  const now = performance.now();
  if (S.scene) S.dur[S.scene] = (now - S.enter[S.scene]) / 1000;
  S.scene = n; S.enter[n] = now;
  $$('.scene').forEach(el => el.classList.toggle('active', el.id === 's' + n));
  $('#hudScene').textContent = n > 1 ? 'SCENE 0' + n + ' / 06' : '';
  hooks[n]();
}
function transitionToScene(n) {
  const st = $('#stage');
  if (REDUCED || n === 6) return showScene(n);   // scene 6 cuts in abruptly
  st.classList.add('glitch');
  setTimeout(() => { showScene(n); st.classList.remove('glitch'); }, 420);
}
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); transitionToScene(+g.dataset.go); }
});

/* ---------- Scene 1: typewriter ---------- */
async function typeInto(el, text, speed) {
  el.classList.add('typing');
  for (const ch of text) { el.textContent += ch; await wait(speed); }
  el.classList.remove('typing');
}
async function startEntry() {
  await wait(900);
  await typeInto($('#t1'), 'You are free to explore.', 55);
  await wait(800);
  await typeInto($('#t2'), 'Nothing here requires your attention.', 45);
  $('#t2').classList.add('typing');
  await wait(600);
  $('#begin').classList.add('on');
}
$('#begin').addEventListener('mouseenter', () => $('#beginMsg').textContent = 'ENTRY DETECTED');
$('#begin').addEventListener('mouseleave', () => $('#beginMsg').textContent = '');
$('#begin').addEventListener('click', e => {
  e.preventDefault();
  S.beginAfter = (performance.now() - S.t0) / 1000;   // load -> begin
  recordInteraction();
  transitionToScene(2);
});

/* ---------- Scene 2: the room ---------- */
let openKey = null, openedAt = 0;
function startRoom() { /* objects are in the HTML; listeners below */ }

function recordObjectHover(k) {
  if (!S.hovered.includes(k)) { S.hovered.push(k); recordInteraction(); }
}
function showLabel(btn, text) {
  const l = $('#lbl'), r = btn.getBoundingClientRect();
  l.textContent = text;
  l.style.left = Math.min(r.left, innerWidth - 190) + 'px';
  l.style.top = (r.top - 22) + 'px';
  l.classList.add('show');
}
function hideLabel() { $('#lbl').classList.remove('show'); }

function recordObjectClick(k) {
  S.counts[k] = (S.counts[k] || 0) + 1;
  if (!S.clicked.includes(k)) { S.clicked.push(k); S.order.push(k); }
  else S.revisits++;                                  // clicked again = revisit
  recordInteraction();
  if (S.clicked.length >= 3) $('#next2').hidden = false;
}
function openObject(btn) {
  const k = btn.dataset.k;
  if (openKey) closeReveal();
  recordObjectClick(k);
  const go = () => {
    const rv = $('#reveal'), r = btn.getBoundingClientRect();
    $('#rt').textContent = OBJECTS[k].title;
    $('#rp').textContent = OBJECTS[k].text;
    rv.dataset.kind = k; rv.hidden = false;
    rv.style.left = Math.max(10, Math.min(r.left, innerWidth - rv.offsetWidth - 10)) + 'px';
    rv.style.top = Math.max(40, Math.min(r.top, innerHeight - rv.offsetHeight - 50)) + 'px';
    openKey = k; openedAt = performance.now();
    btn.classList.add('seen'); rv.dataset.from = btn.id;
    $('#rclose').focus();
  };
  if (k === 'square' && !REDUCED) { btn.classList.add('glitching'); setTimeout(() => { btn.classList.remove('glitching'); go(); }, 420); }
  else go();
}
function closeReveal() {
  if (!openKey) return;
  S.objTime[openKey] = (S.objTime[openKey] || 0) + (performance.now() - openedAt) / 1000;
  const from = $('#' + $('#reveal').dataset.from);
  $('#reveal').hidden = true; openKey = null;
  if (from) from.focus();
}
$$('.obj').forEach(btn => {
  const k = btn.dataset.k;
  btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { recordObjectHover(k); showLabel(btn, btn.dataset.hint); } });
  btn.addEventListener('pointerleave', hideLabel);
  btn.addEventListener('focus', () => { recordObjectHover(k); showLabel(btn, btn.dataset.hint); });
  btn.addEventListener('blur', hideLabel);
  btn.addEventListener('click', () => { recordObjectHover(k); showLabel(btn, btn.dataset.hint); openObject(btn); });  // tap = hover + click
});
$('#rclose').addEventListener('click', closeReveal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeReveal(); $('#explain').hidden = true; }
});

/* ---------- Scene 3: the choice (drag and drop with pointer events) ---------- */
const zone = $('#zone');
function inZone(el) {
  const a = el.getBoundingClientRect(), z = zone.getBoundingClientRect();
  const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
  return Math.hypot(cx - (z.left + z.width / 2), cy - (z.top + z.height / 2)) < z.width * 0.6;
}
function startChoice() { S.choiceStart = performance.now(); }

function recordChoice(c) {
  if (S.choice && S.choice !== c) S.choiceChanges++;       // picked a different one the second time
  if (S.choiceTime === null) S.choiceTime = (performance.now() - S.choiceStart) / 1000;
  S.choice = c; recordInteraction();
  document.body.dataset.mode = c;                           // drives visual differences in CSS and canvas
  $$('.stmt').forEach(b => { b.style.translate = ''; b.classList.toggle('chosen', b.dataset.c === c); b.classList.toggle('gone', b.dataset.c !== c); });
  $('#s3').classList.add('done');
  $('#chMsg').hidden = false; $('#chMsg').style.bottom = '5.4rem';
  $('#chMsg').textContent = c === 'FREEDOM' ? 'STRUCTURE APPLIED' : 'STRUCTURE DEGRADED';
  $('#chNext').hidden = false;
}
$$('.stmt').forEach(b => {
  let dx = 0, dy = 0, sx = 0, sy = 0, drag = false;
  b.addEventListener('pointerenter', () => { if (!S.choiceHover.includes(b.dataset.c)) S.choiceHover.push(b.dataset.c); });
  b.addEventListener('pointerdown', e => { drag = true; sx = e.clientX - dx; sy = e.clientY - dy; b.setPointerCapture(e.pointerId); b.classList.add('drag'); });
  b.addEventListener('pointermove', e => {
    if (!drag) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    b.style.translate = dx + 'px ' + dy + 'px';
    zone.classList.toggle('hot', inZone(b));
  });
  b.addEventListener('pointerup', () => {
    if (!drag) return; drag = false;
    b.classList.remove('drag'); zone.classList.remove('hot');
    if (inZone(b)) recordChoice(b.dataset.c);
    else { dx = dy = 0; b.style.translate = ''; }
  });
  b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); recordChoice(b.dataset.c); } });
});
$('#reconsider').addEventListener('click', e => {
  e.preventDefault(); S.reconsiders++; recordInteraction();
  $$('.stmt').forEach(b => b.classList.remove('chosen', 'gone'));
  $('#s3').classList.remove('done'); $('#chMsg').hidden = true; $('#chNext').hidden = true;
});

/* ---------- Scene 4: the particle field ---------- */
const cv = $('#cv'), g = cv.getContext('2d');
const F = { W: 0, H: 0, P: [], rip: [], mx: -999, my: -999, lastMove: 0, lastSample: 0, run: false, said: false, t: 0 };

function initializeParticleField() {
  F.W = cv.width = innerWidth; F.H = cv.height = innerHeight;
  const n = innerWidth < 700 ? 70 : 160;                    // fewer particles on small screens
  const cols = Math.ceil(Math.sqrt(n * F.W / F.H));
  F.P = Array.from({ length: n }, (_, i) => {
    const grid = document.body.dataset.mode === 'FREEDOM';
    // Freedom: particles settle on an orderly grid. Control: random homes plus jitter.
    const hx = grid ? ((i % cols) + .5) * F.W / cols : Math.random() * F.W;
    const hy = grid ? (Math.floor(i / cols) + .5) * F.H / Math.ceil(n / cols) : Math.random() * F.H;
    return { x: Math.random() * F.W, y: Math.random() * F.H, hx, hy, vx: 0, vy: 0, red: i % 4 === 0 };
  });
}
function say(msg, ms) {
  const m = $('#pmsg'); m.textContent = msg; m.classList.add('show');
  clearTimeout(say.t); say.t = setTimeout(() => m.classList.remove('show'), ms || 1800);
}
function startField() {
  $('#s4').classList.toggle('grid', document.body.dataset.mode === 'FREEDOM');
  initializeParticleField();
  F.run = true; F.lastMove = performance.now(); F.said = false; F.last = performance.now();
  requestAnimationFrame(loopField);
  setTimeout(() => { if (S.scene === 4) $('#next4').hidden = false; }, 14000);
}
function loopField(now) {
  if (!F.run || S.scene !== 4) { F.run = false; return; }
  const dt = Math.min(.05, (now - F.last) / 1000); F.last = now;
  const idle = (now - F.lastMove) / 1000;
  if (idle > 1) S.still += dt;                              // approximate time stationary
  if (idle > 4 && !F.said) { F.said = true; say('You stopped moving.', 3000); }
  const settle = idle > 4, control = document.body.dataset.mode === 'CONTROL';
  g.clearRect(0, 0, F.W, F.H);
  for (const p of F.P) {
    p.vx += (p.hx - p.x) * (settle ? .006 : .002);         // spring back to home
    p.vy += (p.hy - p.y) * (settle ? .006 : .002);
    if (control && !settle) { p.vx += (Math.random() - .5) * .35; p.vy += (Math.random() - .5) * .35; }
    const dx = p.x - F.mx, dy = p.y - F.my, d = Math.hypot(dx, dy) || 1;
    if (d < 110) { p.vx += dx / d * (110 - d) * .03; p.vy += dy / d * (110 - d) * .03; }   // repel
    else if (d < 260) { p.vx -= dx / d * .04; p.vy -= dy / d * .04; }                    // weak attraction
    for (const r of F.rip) { const rd = Math.abs(Math.hypot(p.x - r.x, p.y - r.y) - r.r); if (rd < 30) { p.vx += (p.x - r.x) / (r.r + 1) * 2; p.vy += (p.y - r.y) / (r.r + 1) * 2; } }
    p.vx *= settle ? .8 : .93; p.vy *= settle ? .8 : .93;
    p.x += p.vx; p.y += p.vy;
    g.strokeStyle = p.red ? '#FF3939' : 'rgba(237,237,237,.75)';
    g.lineWidth = p.red ? 1.6 : 1;
    g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 2 - 1, p.y - p.vy * 2); g.stroke();
  }
  F.rip = F.rip.filter(r => { r.r += 6; r.a -= .02; g.strokeStyle = 'rgba(255,57,57,' + Math.max(r.a, 0) + ')'; g.beginPath(); g.arc(r.x, r.y, r.r, 0, 6.3); g.stroke(); return r.a > 0; });
  requestAnimationFrame(loopField);
}
function fieldMove(e) {
  const now = performance.now();
  F.mx = e.clientX; F.my = e.clientY; F.lastMove = now; F.said = false;
  if (now - F.lastSample > 120) {                           // sampled activity: a counter, not coordinates
    F.lastSample = now; S.moveSamples++;
    const fx = F.mx / F.W, fy = F.my / F.H;
    if (fx < .12 || fx > .88 || fy < .12 || fy > .88) S.edge = true;
    if (fx > .3 && fx < .7 && fy > .3 && fy < .7) S.center = true;
  }
  $$('.frag').forEach((el, i) => {                          // hidden fragments appear near their spot
    const r = el.getBoundingClientRect();
    if (Math.hypot(F.mx - (r.left + r.width / 2), F.my - (r.top + r.height / 2)) < 150 && !el.classList.contains('on')) {
      el.classList.add('on');
      if (!S.hidden.includes(i)) { S.hidden.push(i); recordInteraction(); }
    }
  });
}
cv.addEventListener('pointermove', fieldMove);
cv.addEventListener('pointerdown', e => {
  fieldMove(e);
  S.pClicks++; recordInteraction();
  F.rip.push({ x: e.clientX, y: e.clientY, r: 10, a: 1 });
  say('CLICK LOGGED / ' + S.pClicks, 1200);
});
addEventListener('resize', () => { if (S.scene === 4) initializeParticleField(); });

/* ---------- Scene 5: the profile ---------- */
/* Simple, readable rules; first match wins; OBSERVER is the fallback. */
function classifyBehaviour() {
  if (S.revisits > 0 || S.reconsiders > 0) return 'THE REVISITOR';
  if (S.clicked.length >= 4) return 'THE EXPLORER';
  return 'THE OBSERVER';
}
function generateObservations() {
  const o = [], n = S.clicked.length, hov = S.hovered.filter(k => !S.clicked.includes(k)).length;
  const ignored = 5 - new Set([...S.hovered, ...S.clicked]).size, f = x => x.toFixed(1);
  o.push('You explored ' + n + ' of 5 objects.');
  if (hov) o.push('You hovered over ' + hov + ' object' + (hov > 1 ? 's' : '') + ' without opening ' + (hov > 1 ? 'them' : 'it') + '.');
  if (ignored) o.push('You ignored ' + ignored + ' object' + (ignored > 1 ? 's' : '') + '.');
  if (S.revisits) o.push('You returned to an object ' + S.revisits + ' time' + (S.revisits > 1 ? 's' : '') + '.');
  if (S.dur[1] > 8) o.push('You paused ' + Math.round(S.dur[1]) + ' seconds before entering.');
  if (S.choice) o.push('You selected INFORMATION IS ' + S.choice + ', in ' + f(S.choiceTime) + ' seconds.');
  if (S.choiceChanges) o.push('You changed your selection.');
  else if (S.reconsiders) o.push('You reopened your choice.');
  if (S.choiceHover.length === 2) o.push('You considered both statements before choosing.');
  if (S.dur[4] > S.dur[2]) o.push('You spent more time in the particle environment than in the room.');
  if (S.pClicks) o.push('You clicked ' + S.pClicks + ' time' + (S.pClicks > 1 ? 's' : '') + ' in the particle field.');
  if (S.edge) o.push('You explored the edges of the screen.');
  if (S.still >= 3) o.push('You stayed still for about ' + Math.round(S.still) + ' seconds.');
  if (S.hidden.length) o.push('You found ' + S.hidden.length + ' of 3 hidden fragments.');
  o.push('You interacted with ' + S.interactions + ' elements.');
  return o;
}
function animateCounter(el, to, dec) {
  const t0 = performance.now(), d = REDUCED ? 1 : 1400;
  (function tick(now) {
    const p = Math.min(1, (now - t0) / d);
    el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
async function buildProfile() {
  S.cls = classifyBehaviour();
  S.obs = generateObservations();
  const rep = $('#report'); rep.innerHTML = '';
  $('#repLabel').textContent = ''; $('#next5').hidden = true;
  const el = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; rep.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('in'))); return d; };
  await wait(900);
  $('#repLabel').textContent = 'OBSERVATION REPORT / 001';
  await wait(900);
  const c = el('class big2 rise', S.cls);
  await wait(1200);
  const stats = el('row rise', [['Elements touched', S.interactions, 0], ['Objects opened', S.clicked.length, 0], ['Seconds observed', (performance.now() - S.t0) / 1000, 0]]
    .map(s => '<div class="stat"><b data-v="' + s[1] + '">0</b><span class="mono">' + s[0] + '</span></div>').join(''));
  stats.querySelectorAll('b').forEach(b => animateCounter(b, +b.dataset.v, 0));
  await wait(1500);
  const names = ['Entry', 'Room', 'Choice', 'Pattern'], total = [1, 2, 3, 4].reduce((a, i) => a + (S.dur[i] || 0), 0) || 1;
  const bars = el('bars rise', [1, 2, 3, 4].map((i, k) => '<div class="brow mono"><span>' + names[k] + '</span><i data-w="' + Math.round((S.dur[i] || 0) / total * 100) + '"></i><span>' + Math.round(S.dur[i] || 0) + 's</span></div>').join(''));
  await wait(100);
  bars.querySelectorAll('i').forEach(i => i.style.width = i.dataset.w + '%');
  await wait(1200);
  for (const t of S.obs) { el('line', t); await wait(650); rep.scrollTop = rep.scrollHeight; }
  el('line mono', 'A playful label from simple rules, not a personality test.');
  await wait(600);
  $('#next5').hidden = false;
}

/* ---------- Scene 6: the revelation ---------- */
const LINES = ["We didn't need your name.", "We didn't need your photos.", "We didn't need your personal information.", "We just watched what you did.", "The internet is watching you."];
async function startRevelation() {
  document.body.dataset.frozen = '1';
  const rev = $('#rev'); rev.innerHTML = '';
  $('#tail').hidden = true;
  await wait(1100);                                         // abrupt black freeze
  for (const t of LINES) {
    const p = document.createElement('p'); p.textContent = t; rev.appendChild(p);
    await wait(60); p.classList.add('in');
    await wait(t === LINES[3] ? 2600 : 1900);
  }
  $('#tail').hidden = false; $('#what').classList.add('on');
}
$('#what').addEventListener('click', e => {
  e.preventDefault();
  const ex = $('#explain'); ex.hidden = !ex.hidden;
  $('#what').setAttribute('aria-expanded', String(!ex.hidden));
  if (!ex.hidden) ex.scrollIntoView({ block: 'nearest' });
});

/* ---------- Reset: both buttons start a clean session ---------- */
function resetExperience(msg) {
  S = newState();                                           // wipe every tracked value
  document.body.innerHTML = '<p style="position:fixed;left:1rem;top:1rem;font:12px monospace;color:#FF3939">' + msg + '</p>';
  setTimeout(() => location.reload(), REDUCED ? 100 : 1400);  // reload gives a fresh page and fresh state
}
$('#erase').addEventListener('click', () => resetExperience('SESSION ERASED. NO DATA REMAINS.'));
$('#again').addEventListener('click', () => resetExperience('NEW SESSION / PROFILE EMPTY'));

/* ---------- Custom cursor ring (mouse only) ---------- */
if (FINE) {
  const cur = $('#cur');
  addEventListener('pointermove', e => {
    cur.style.opacity = 1; cur.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    cur.classList.toggle('hot', !!e.target.closest('.obj,.stmt,.prompt,button'));
  });
}

/* ---------- Start ---------- */
function initializeExperience() { recordInteraction(); S.interactions = 0; $('#hudCount').textContent = 'OBSERVING / 0 EVENTS'; showScene(1); }
initializeExperience();

// Red dotted cursor trail
document.addEventListener("mousemove", function(event) {

    let dot = document.createElement("div");

    dot.className = "cursor-dot";

    dot.style.left = event.clientX + "px";
    dot.style.top = event.clientY + "px";

    document.body.appendChild(dot);

    // Remove the dot after its animation finishes
    setTimeout(function() {
        dot.remove();
    }, 600);

});