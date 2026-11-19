/* ==========================================================
   main.js — ลอจิกของเว็บ (เนื้อหาทั้งหมดอยู่ใน config.js)
   ส่วนต่าง ๆ:  1) ตัวช่วย  2) เอฟเฟกต์หัวใจ  3) เพลง  4) ฉาก/ทรานซิชัน
               5) การ์ด  6) ตัวนับเวลา  7) ฉากสุดท้าย  8) เริ่มทำงาน
   ========================================================== */
(() => {
  'use strict';

  const C = window.CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (a, b) => a + Math.random() * (b - a);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canAnimate = typeof Element.prototype.animate === 'function';

  const app = $('#app');
  const fx = $('#fx');

  /* ---------------------------------------------------------
     1) ตัวช่วย: SVG หัวใจ / ดอกไม้ / กลีบ / รูปภาพ
     --------------------------------------------------------- */
  const HEART_PATH =
    'M50 88C20 62 2 44 2 26 2 12 13 3 26 3 36 3 45 8 50 17 55 8 64 3 74 3 87 3 98 12 98 26 98 44 80 62 50 88Z';
  const HEART_COLORS = ['#ff94b0', '#ffb3c6', '#ff6f95', '#ffd0dc', '#f78fb3', '#a3e0c2'];
  const FLOWER_COLORS = {
    pink:  { petal: '#ffb3c6', center: '#ffe27a' },
    mint:  { petal: '#a3e0c2', center: '#fff3c4' },
    cream: { petal: '#fff1d6', center: '#ff94b0' }
  };

  const heartSVG = (size, color) =>
    `<svg viewBox="0 0 100 90" width="${size}" height="${size * 0.9}" aria-hidden="true">
       <path d="${HEART_PATH}" fill="${color}"/>
       <path d="M22 22c4-7 13-9 19-4" stroke="#fff" stroke-opacity=".6" stroke-width="6" fill="none" stroke-linecap="round"/>
     </svg>`;

  const flowerSVG = (kind = 'pink') => {
    const { petal, center } = FLOWER_COLORS[kind] || FLOWER_COLORS.pink;
    let petals = '';
    for (let i = 0; i < 6; i++) {
      petals += `<ellipse cx="50" cy="27" rx="14" ry="22" fill="${petal}" transform="rotate(${i * 60} 50 50)"/>`;
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${petals}
      <circle cx="50" cy="50" r="13" fill="${center}"/>
      <circle cx="46" cy="46" r="4" fill="#fff" opacity=".65"/></svg>`;
  };

  const petalSVG = (size, color) =>
    `<svg viewBox="0 0 40 60" width="${size * 0.7}" height="${size}" aria-hidden="true">
       <ellipse cx="20" cy="30" rx="14" ry="26" fill="${color}"/></svg>`;

  function makeItem(html) {
    const el = document.createElement('span');
    el.className = 'fx-item';
    el.innerHTML = html;
    return el;
  }

  /** สร้างภาพใน figure — ถ้าไม่มีไฟล์/โหลดไม่ได้ จะแสดงช่องว่างรอใส่รูปแทน */
  function setPhoto(figure, src) {
    figure.querySelectorAll('img, .ph').forEach((n) => n.remove());
    const placeholder = () => {
      const d = document.createElement('div');
      d.className = 'ph';
      d.innerHTML = heartSVG(44, '#a3e0c2');
      return d;
    };
    if (!src) { figure.prepend(placeholder()); return; }
    const img = new Image();
    img.alt = '';                       // รูปตกแต่ง ไม่ต้องอ่านออกเสียง
    img.decoding = 'async';
    img.draggable = false;
    img.onerror = () => img.replaceWith(placeholder());
    img.src = src;
    figure.prepend(img);
  }

  /* ---------------------------------------------------------
     2) เอฟเฟกต์หัวใจ (ลอย / ระเบิด / ฝน)
     --------------------------------------------------------- */
  const MAX_FX = 170;

  function fly(el, frames, options) {
    if (!canAnimate || fx.childElementCount > MAX_FX) return;
    fx.appendChild(el);
    const anim = el.animate(frames, { fill: 'forwards', ...options });
    anim.onfinish = () => el.remove();
  }

  /** หัวใจ/กลีบกระจายออกจากจุด (x, y) */
  function burst(x, y, n = 14, power = 170, kind = 'heart') {
    if (reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const size = rand(12, 30);
      const color = HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0];
      const el = makeItem(kind === 'petal'
        ? petalSVG(size, Math.random() > .5 ? '#ffb3c6' : '#a3e0c2')
        : heartSVG(size, color));
      const ang = rand(-Math.PI * 1.05, Math.PI * 0.05);    // เน้นพุ่งขึ้นด้านบน
      const dist = rand(power * 0.35, power);
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const rot = rand(-60, 60);
      const h = size / 2;
      fly(el, [
        { transform: `translate(${x - h}px, ${y - h}px) scale(.2) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + dx - h}px, ${y + dy - h}px) scale(1) rotate(${rot}deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${x + dx * 1.1 - h}px, ${y + dy + 90 - h}px) scale(.8) rotate(${rot * 1.4}deg)`, opacity: 0 }
      ], { duration: rand(1000, 1700), easing: 'cubic-bezier(.2,.7,.3,1)' });
    }
  }

  /** หัวใจลอยขึ้นช้า ๆ เป็นบรรยากาศพื้นหลัง */
  function floatHeart() {
    const size = rand(10, 26);
    const x = rand(0, window.innerWidth);
    const sway = rand(-50, 50);
    const el = makeItem(heartSVG(size, HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0]));
    fly(el, [
      { transform: `translate(${x}px, ${window.innerHeight + 30}px) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${x + sway / 2}px, ${window.innerHeight * 0.6}px) rotate(${sway / 3}deg)`, opacity: .55, offset: .2 },
      { transform: `translate(${x + sway}px, -40px) rotate(${sway}deg)`, opacity: 0 }
    ], { duration: rand(7000, 12000), easing: 'linear' });
  }

  /** ฝนหัวใจ ตกจากด้านบน (ฉากสุดท้าย) */
  function rainHeart() {
    const size = rand(14, 34);
    const x = rand(0, window.innerWidth);
    const sway = rand(-60, 60);
    const el = makeItem(heartSVG(size, HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0]));
    fly(el, [
      { transform: `translate(${x}px, -40px) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${x + sway * .2}px, ${window.innerHeight * .08}px) rotate(${sway / 6}deg)`, opacity: .95, offset: .08 },
      { transform: `translate(${x + sway}px, ${window.innerHeight + 40}px) rotate(${sway}deg)`, opacity: .9 }
    ], { duration: rand(3500, 6500), easing: 'cubic-bezier(.4,0,.8,.6)' });
  }

  let ambientTimer = null;
  let rainTimer = null;
  const startAmbient = () => {
    stopAmbient();
    ambientTimer = setInterval(floatHeart, reduceMotion ? 1800 : 750);
  };
  const stopAmbient = () => { clearInterval(ambientTimer); ambientTimer = null; };
  const startRain = () => {
    stopRain();
    rainTimer = setInterval(rainHeart, reduceMotion ? 450 : 150);
  };
  const stopRain = () => { clearInterval(rainTimer); rainTimer = null; };

  /* ---------------------------------------------------------
     3) เพลงพื้นหลัง — ไม่มีปุ่ม เริ่มเล่นเมื่อผู้ใช้แตะเปิดการ์ดใบแรก
        (การแตะคือ user gesture จึงผ่านข้อจำกัด Autoplay ของเบราว์เซอร์)
     --------------------------------------------------------- */
  const bgm = $('#bgm');
  let wantMusic = false;
  let fadeTimer = null;

  function setupMusic() {
    if (!C.music || !C.music.src) return;      // ยังไม่ใส่เพลง → เงียบไว้ ไม่ error
    bgm.src = C.music.src;
    bgm.loop = C.music.loop !== false;
    bgm.volume = 0;
    bgm.addEventListener('error', () => { /* ไฟล์เพลงหาย/เล่นไม่ได้ → ข้ามไปเงียบ ๆ */ });
  }

  function fadeTo(target, ms = 1800) {
    clearInterval(fadeTimer);
    const from = bgm.volume;
    const t0 = performance.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      bgm.volume = Math.max(0, Math.min(1, from + (target - from) * k));
      if (k >= 1) clearInterval(fadeTimer);
    }, 50);
  }

  function tryPlay() {
    if (!bgm.src) return;
    const p = bgm.play();
    if (p && typeof p.then === 'function') {
      p.then(() => fadeTo(C.music.volume ?? 0.85)).catch(() => { /* รอแตะครั้งถัดไปแล้วลองใหม่ */ });
    }
  }

  function startMusic() {
    wantMusic = true;
    tryPlay();
  }

  // ถ้าเบราว์เซอร์บล็อกครั้งแรก ให้ลองใหม่ทุกครั้งที่แตะ
  document.addEventListener('pointerdown', () => { if (wantMusic && bgm.paused) tryPlay(); }, { passive: true });
  document.addEventListener('keydown',     () => { if (wantMusic && bgm.paused) tryPlay(); });

  // พักเพลงตอนสลับแท็บ/ล็อกจอ แล้วเล่นต่อเมื่อกลับมา
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgm.pause();
    else if (wantMusic) tryPlay();
  });

  /* ---------------------------------------------------------
     4) ฉาก + ทรานซิชันหัวใจกวาดหน้าจอ
     --------------------------------------------------------- */
  const scenes = {
    intro:   $('#scene-intro'),
    cards:   $('#scene-cards'),
    counter: $('#scene-counter'),
    final:   $('#scene-final')
  };
  let currentScene = 'intro';
  let busy = false;

  const wipe = $('#wipe');
  wipe.innerHTML =
    `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="${HEART_PATH}" fill="#ffd0dc"/></svg>`;
  const wipeSvg = $('svg', wipe);

  function activate(name) {
    Object.entries(scenes).forEach(([k, el]) => el.classList.toggle('active', k === name));
    app.dataset.scene = name;
    currentScene = name;
    scenes[name].scrollTop = 0;

    if (name === 'final') { stopAmbient(); } else { startAmbient(); }
    if (name !== 'final') stopRain();
    if (name !== 'counter') stopCounter();
  }

  async function go(name, onEnter) {
    if (busy || name === currentScene) return;
    busy = true;

    if (!canAnimate || reduceMotion) {
      activate(name);
      if (onEnter) onEnter();
      busy = false;
      return;
    }

    wipe.classList.add('on');
    wipeSvg.style.opacity = '1';
    const cover = wipeSvg.animate(
      [{ transform: 'translate(-50%,-50%) scale(0) rotate(-20deg)' },
       { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)' }],
      { duration: 650, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    await cover.finished;

    activate(name);
    await sleep(120);

    const reveal = wipeSvg.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 550, easing: 'ease-out', fill: 'forwards' });
    if (onEnter) onEnter();
    await reveal.finished;

    wipeSvg.getAnimations().forEach((a) => a.cancel());
    wipe.classList.remove('on');
    busy = false;
  }

  /* ---------------------------------------------------------
     5) การ์ดข้อความ 6 ใบ
     --------------------------------------------------------- */
  const cardEl = $('#card');
  const cardArea = $('#cardArea');
  const cardText = $('#cardText');
  const cardPhoto = $('#cardPhoto');
  const coverNo = $('#coverNo');
  const nextBtn = $('#nextBtn');
  const dotsEl = $('#dots');

  let cardIdx = 0;
  let cardOpened = false;
  let cardTimers = [];

  function buildDots() {
    dotsEl.innerHTML = '';
    C.cards.forEach(() => {
      const d = document.createElement('span');
      d.className = 'dot';
      dotsEl.appendChild(d);
    });
  }

  function paintDots() {
    $$('.dot', dotsEl).forEach((d, i) => {
      d.classList.toggle('done', i < cardIdx || (i === cardIdx && cardOpened));
      d.classList.toggle('current', i === cardIdx);
    });
  }

  /** เตรียมการ์ดใบที่ i ให้อยู่ในสถานะ "ยังไม่เปิด" */
  function showCard(i) {
    cardTimers.forEach(clearTimeout);
    cardTimers = [];
    cardIdx = i;
    cardOpened = false;
    const data = C.cards[i];

    // ปิดแอนิเมชันชั่วคราว เพื่อไม่ให้ฝาการ์ดพลิกกลับให้เห็น
    cardEl.style.transition = 'none';
    $('.card-cover', cardEl).style.transition = 'none';
    cardEl.classList.remove('open');
    cardPhoto.classList.remove('show');
    cardPhoto.style.transition = 'none';

    cardText.innerHTML = '';
    data.lines.forEach((line, n) => {
      const span = document.createElement('span');
      span.className = 'line';
      span.style.setProperty('--i', n);
      span.textContent = line;              // ใส่เป็นข้อความล้วน ไม่แก้ถ้อยคำ
      cardText.appendChild(span);
    });

    cardPhoto.style.setProperty('--tilt', (data.tilt ?? 0) + 'deg');
    setPhoto(cardPhoto, data.photo);

    coverNo.textContent = `ใบที่ ${i + 1} / ${C.cards.length}`;
    cardEl.setAttribute('aria-label', `แตะเพื่อเปิดการ์ดใบที่ ${i + 1}`);
    nextBtn.hidden = true;
    nextBtn.textContent = i === C.cards.length - 1 ? 'ต่อไป 💗' : 'ใบต่อไป 💌';
    paintDots();

    // คืนค่า transition หลังเฟรมถัดไป
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cardEl.style.transition = '';
      $('.card-cover', cardEl).style.transition = '';
      cardPhoto.style.transition = '';
    }));
  }

  function openCard() {
    if (cardOpened || busy) return;
    cardOpened = true;
    cardEl.classList.add('open');
    cardEl.removeAttribute('aria-label');
    startMusic();                               // เพลงเริ่มพร้อมแตะเปิดการ์ดใบแรก

    const r = cardEl.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 22, 190);

    cardTimers.push(setTimeout(() => cardPhoto.classList.add('show'), 650));
    cardTimers.push(setTimeout(() => {
      burst(r.left + r.width / 2, r.top + r.height, 12, 140);
    }, 900));
    const textMs = 750 + C.cards[cardIdx].lines.length * 550 + 700;
    cardTimers.push(setTimeout(() => { nextBtn.hidden = false; }, textMs));
    paintDots();
  }

  async function nextCard() {
    if (busy || !cardOpened) return;
    if (cardIdx >= C.cards.length - 1) {
      go('counter', startCounter);
      return;
    }
    busy = true;
    const next = cardIdx + 1;
    if (canAnimate && !reduceMotion) {
      await cardArea.animate(
        [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-40px) scale(.96)' }],
        { duration: 300, easing: 'ease-in', fill: 'forwards' }).finished;
      nextBtn.hidden = true;
      showCard(next);
      await cardArea.animate(
        [{ opacity: 0, transform: 'translateX(40px) scale(.96)' }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: 380, easing: 'ease-out', fill: 'forwards' }).finished;
      cardArea.getAnimations().forEach((a) => a.cancel());
    } else {
      showCard(next);
    }
    busy = false;
    cardEl.focus({ preventScroll: true });
  }

  /* ---------------------------------------------------------
     6) ตัวนับเวลา (ปี / เดือน / วัน / ชั่วโมง / นาที / วินาที + จำนวนวันรวม)
        คำนวณเป็นเวลาไทย (UTC+7) เสมอ ไม่ว่าเปิดจากเขตเวลาไหน
     --------------------------------------------------------- */
  const UNITS = [
    ['y',  'ปี'], ['mo', 'เดือน'], ['d', 'วัน'],
    ['h',  'ชั่วโมง'], ['mi', 'นาที'], ['s', 'วินาที']
  ];
  const counterNums = {};
  let counterTimer = null;

  function buildCounter() {
    const grid = $('#counterGrid');
    grid.innerHTML = '';
    UNITS.forEach(([key, label]) => {
      const box = document.createElement('div');
      box.className = 'unit';
      box.innerHTML = `<span class="num">0</span><span class="lbl">${label}</span>`;
      grid.appendChild(box);
      counterNums[key] = $('.num', box);
    });
  }

  function calendarDiff(fromMs, toMs) {
    const OFFSET = 7 * 3600 * 1000;                 // เวลาไทย
    if (toMs <= fromMs) return { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0 };
    const a = new Date(fromMs + OFFSET);
    const b = new Date(toMs + OFFSET);
    let y  = b.getUTCFullYear() - a.getUTCFullYear();
    let mo = b.getUTCMonth()    - a.getUTCMonth();
    let d  = b.getUTCDate()     - a.getUTCDate();
    let h  = b.getUTCHours()    - a.getUTCHours();
    let mi = b.getUTCMinutes()  - a.getUTCMinutes();
    let s  = b.getUTCSeconds()  - a.getUTCSeconds();
    if (s  < 0) { s  += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h  < 0) { h  += 24; d--; }
    if (d  < 0) {                                   // ยืมวันจากเดือนก่อนหน้า
      d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate();
      mo--;
    }
    if (mo < 0) { mo += 12; y--; }
    return { y, mo, d, h, mi, s };
  }

  function tickCounter() {
    const start = new Date(C.startDate).getTime();
    const now = Date.now();
    const v = calendarDiff(start, now);
    const pad = (n) => String(n).padStart(2, '0');
    counterNums.y.textContent  = v.y;
    counterNums.mo.textContent = v.mo;
    counterNums.d.textContent  = v.d;
    counterNums.h.textContent  = pad(v.h);
    counterNums.mi.textContent = pad(v.mi);
    counterNums.s.textContent  = pad(v.s);
    const totalDays = Math.max(0, Math.floor((now - start) / 86400000));
    $('#totalDays').textContent = totalDays.toLocaleString('en-US');
  }

  function startCounter() {
    tickCounter();
    clearInterval(counterTimer);
    counterTimer = setInterval(tickCounter, 1000);
  }
  function stopCounter() { clearInterval(counterTimer); counterTimer = null; }

  /* ---------------------------------------------------------
     7) ฉากสุดท้าย — "รักหนูนะ ❤️❤️❤️" + หัวใจระเบิด + ฝนหัวใจ
     --------------------------------------------------------- */
  function enterFinal() {
    const photo = $('#finalPhoto');
    const text = $('#finalText');
    const replay = $('#replayBtn');
    [photo, text, replay].forEach((el) => el.classList.remove('show'));

    setTimeout(() => photo.classList.add('show'), 150);
    setTimeout(() => {
      text.classList.add('show');
      const r = text.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      burst(cx, cy, 36, 260);
      setTimeout(() => burst(cx, cy, 30, 340), 350);
      setTimeout(() => burst(window.innerWidth * .2, window.innerHeight * .6, 22, 220), 700);
      setTimeout(() => burst(window.innerWidth * .8, window.innerHeight * .6, 22, 220), 900);
      startRain();
    }, 550);
    setTimeout(() => replay.classList.add('show'), 2600);
  }

  function replayAll() {
    if (busy) return;
    stopRain();
    go('cards', () => showCard(0));
  }

  /* ---------------------------------------------------------
     8) เริ่มทำงาน
     --------------------------------------------------------- */
  function buildStatic() {
    document.title = C.title || document.title;

    // หน้าเปิด
    $('#introKicker').textContent = C.opening.kicker;
    $('#introDuration').textContent = C.opening.duration;
    $('#introForWho').textContent = C.opening.forWho;
    $('#openBtn').textContent = C.opening.buttonText;
    setPhoto($('#coverPhoto'), C.cover);

    // นับเวลา
    $('#counterTitle').textContent = C.counter.title;
    $('#sinceLabel').textContent = C.startDateLabel;
    $('#toFinalBtn').textContent = C.counter.buttonText;
    const cp = $('#counterPhoto');
    cp.style.setProperty('--tilt', (C.counter.tilt ?? 0) + 'deg');
    setPhoto(cp, C.counter.photo);

    // ฉากสุดท้าย
    $('#finalText').textContent = C.final.text;
    $('#replayBtn').textContent = C.final.replayText;
    const fp = $('#finalPhoto');
    fp.style.setProperty('--tilt', (C.final.tilt ?? 0) + 'deg');
    setPhoto(fp, C.final.photo);

    // หัวใจ / ดอกไม้ตกแต่ง
    $$('[data-heart]').forEach((el) => { el.innerHTML = heartSVG(100, '#ff6f95').replace('width="100" height="90"', 'width="100%"'); });
    $$('[data-flower]').forEach((el) => { el.innerHTML = flowerSVG(el.dataset.flower); });

    buildDots();
    buildCounter();
  }

  function preloadImages() {
    [C.cover, C.counter.photo, C.final.photo, ...C.cards.map((c) => c.photo)]
      .filter(Boolean)
      .forEach((src) => { const i = new Image(); i.src = src; });
  }

  function bindEvents() {
    // เปิดเว็บ
    $('#openBtn').addEventListener('click', (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top, 18, 150);
      startMusic();
      go('cards', () => showCard(0));
    });

    // แตะรูปปก = เซอร์ไพรส์ (แตะรัว ๆ 5 ครั้ง = ฝนหัวใจ)
    let coverTaps = 0;
    const coverBtn = $('#coverBtn');
    coverBtn.addEventListener('click', (e) => {
      coverBtn.classList.remove('wiggle');
      void coverBtn.offsetWidth;
      coverBtn.classList.add('wiggle');
      burst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2, 18, 170);
      coverTaps++;
      if (coverTaps % 5 === 0) {
        startRain();
        setTimeout(() => { if (currentScene !== 'final') stopRain(); }, 3500);
      }
    });

    // ดอกไม้ตกแต่ง: แตะแล้วหมุน + กลีบกระจาย
    $$('.deco').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        el.classList.remove('spin');
        void el.offsetWidth;
        el.classList.add('spin');
        const r = el.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 16, 150, 'petal');
        burst(r.left + r.width / 2, r.top + r.height / 2, 6, 120);
        setTimeout(() => el.classList.remove('spin'), 950);
      });
    });

    // การ์ด
    cardEl.addEventListener('click', openCard);
    cardEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(); }
    });
    nextBtn.addEventListener('click', nextCard);

    // นับเวลา → ฉากสุดท้าย
    $('#toFinalBtn').addEventListener('click', () => go('final', enterFinal));

    // ดูอีกรอบ
    $('#replayBtn').addEventListener('click', replayAll);

    // แตะตรงไหนก็มีหัวใจเล็ก ๆ เด้งออกมา
    document.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.deco, .card, .btn, #coverBtn')) return;
      burst(e.clientX, e.clientY, currentScene === 'final' ? 10 : 6, currentScene === 'final' ? 160 : 100);
    }, { passive: true });
  }

  buildStatic();
  setupMusic();
  preloadImages();
  bindEvents();
  startAmbient();
  showCard(0);
})();
