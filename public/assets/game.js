/* ARCHIVE — mini jeu du header. Bi-couleur, rétro, seamless.
   Des squelettes sortent de derrière le logo et avancent vers la caméra.
   Clic : tir de fusil à pompe (6 cartouches, rechargement auto ou R). Jauge de vie. */
(function () {
  'use strict';
  var root = document.getElementById('hero');
  if (!root) return;
  if (window.matchMedia('(pointer:coarse)').matches) return;
  /* fenêtre trop étroite au chargement : on attend qu'elle s'élargisse */
  if (window.innerWidth < 720) {
    var armed = false;
    window.addEventListener('resize', function onr() {
      if (window.innerWidth >= 720 && !armed) { armed = true; window.removeEventListener('resize', onr); boot(); }
    });
    return;
  }
  boot();
  function boot() {

  var INK = '#EDE7DC', RED = '#FF3B2F', BG = '#0B0A09';
  var back = document.getElementById('c-back'), front = document.getElementById('c-front');
  var bctx = back.getContext('2d'), fctx = front.getContext('2d');
  var flash = root.querySelector('.flash');
  var over = root.querySelector('.gameover');
  var overScore = over.querySelector('[data-score]');
  var W = 0, H = 0, DPR = 1;
  var PX = 4;

  /* ---------- squelette : corps 16 x 20, placé dans une case 28 x 30 (décalage 6, 8) ---------- */
  var BODY = {
    walk1: [
      '.....######.....',
      '....########....',
      '....##.##.##....',
      '....########....',
      '.....#.##.#.....',
      '......####......',
      '.....#.##.#.....',
      '..############..',
      '..#..######..#..',
      '..#.#.#..#.#.#..',
      '..#..######..#..',
      '..#.#.#..#.#.#..',
      '..#..######..#..',
      '.....#.##.#.....',
      '....###..###....',
      '....#.#..#.#....',
      '....#.#..#.#....',
      '....#.#..#.#....',
      '....##....##....',
      '...###....###...'
    ],
    walk2: [
      '.....######.....',
      '....########....',
      '....##.##.##....',
      '....########....',
      '.....#.##.#.....',
      '......####......',
      '.....#.##.#.....',
      '..############..',
      '..#..######..#..',
      '..#.#.#..#.#.#..',
      '..#..######..#..',
      '..#.#.#..#.#.#..',
      '..#..######..#..',
      '.....#.##.#.....',
      '....###..###....',
      '.....#.#.#.#....',
      '.....#.#.#.#....',
      '....#.#..#.#....',
      '...##.....##....',
      '..###.....###...'
    ],
    attack: [
      '.....######...#.',
      '....########..#.',
      '....##.##.##..#.',
      '....########..#.',
      '.....#.##.#..#..',
      '......####...#..',
      '.....#.##.#..#..',
      '..###########...',
      '..#..######.....',
      '..#.#.#..#.#....',
      '..#..######.....',
      '..#.#.#..#.#....',
      '..#..######.....',
      '.....#.##.#.....',
      '....###..###....',
      '....#.#..#.#....',
      '....#.#..#.#....',
      '....#.#..#.#....',
      '....##....##....',
      '...###....###...'
    ]
  };
  /* main droite (col, row) dans le repère du corps, par frame */
  var HAND = { walk1: [14, 12], walk2: [14, 12], attack: [14, 0] };
  /* armes, dessinées autour de la main : liste de [dx, dy, char] relatifs à la main */
  function line(x0, y0, x1, y1, c) {
    var out = [], dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (var i = 0; i <= n; i++) out.push([x0 + dx * i, y0 + dy * i, c || '#']);
    return out;
  }
  function block(x0, y0, x1, y1) { var o = []; for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) o.push([x, y, '#']); return o; }
  var WEAPONS = {
    sword: {
      walk: line(0, 0, 0, 1).concat([[-1, -1, '#'], [0, -1, '#'], [1, -1, '#']]).concat(line(0, -2, 0, -10)),
      attack: [[0, 0, '#'], [0, -1, '#'], [0, 1, '#']].concat(line(1, 0, 9, 0))
    },
    axe: {
      walk: line(0, 1, 0, -9).concat(block(1, -9, 3, -6)).concat([[3, -5, '#'], [3, -10, '#']]),
      attack: line(0, 0, 6, 0).concat(block(7, -2, 9, 1)).concat([[10, -2, '#'], [10, 1, '#']])
    },
    mace: {
      walk: line(0, 1, 0, -6).concat(block(-1, -9, 1, -7)).concat([[0, -10, '#'], [-2, -8, '#'], [2, -8, '#']]),
      attack: line(0, 0, 5, 0).concat(block(6, -1, 8, 1)).concat([[9, 0, '#'], [7, -2, '#'], [7, 2, '#']])
    }
  };
  WEAPONS.shield = WEAPONS.sword; /* épée + bouclier : même épée, bouclier au bras gauche */
  var SHIELD = ['.#####.', '##.#.##', '#..#..#', '#######', '#..#..#', '##...##', '.##.##.', '..###..']; /* posé cols -2..4, rows 6..13 */
  /* dégradation : pixels effacés par stade (col, row) dans le repère du corps */
  var DAMAGE = [
    [],
    [[6, 9], [9, 11], [5, 0], [6, 0], [3, 9], [12, 11]],
    [[6, 9], [9, 11], [5, 0], [6, 0], [3, 9], [12, 11], [2, 8], [2, 9], [2, 10], [2, 11], [2, 12], [7, 0], [8, 0], [4, 1], [5, 1], [8, 11], [10, 9], [5, 3]]
  ];

  function blank(w, h) { var g = []; for (var j = 0; j < h; j++) g.push(new Array(w).fill('.')); return g; }
  function put(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
  function compose(variant, frame, stage) {
    var g = blank(28, 30), OX = 6, OY = 8;
    var body = BODY[frame];
    for (var j = 0; j < body.length; j++) for (var i = 0; i < body[j].length; i++) if (body[j][i] === '#') put(g, i + OX, j + OY, '#');
    DAMAGE[stage].forEach(function (p) { put(g, p[0] + OX, p[1] + OY, '.'); });
    if (stage === 2 && frame !== 'attack') { /* bras gauche perdu */
      for (var r = 7; r <= 12; r++) put(g, 2 + OX, r + OY, '.');
    }
    var hand = HAND[frame];
    var w = WEAPONS[variant][frame === 'attack' ? 'attack' : 'walk'];
    w.forEach(function (p) { put(g, hand[0] + p[0] + OX, hand[1] + p[1] + OY, p[2]); });
    if (variant === 'shield' && stage === 0) {
      for (var sj = 0; sj < SHIELD.length; sj++) for (var si = 0; si < SHIELD[sj].length; si++) {
        if (SHIELD[sj][si] === '#') put(g, si - 2 + OX, sj + 6 + OY, '#');
      }
    }
    return g.map(function (r) { return r.join(''); });
  }
  function bake(rows, px) {
    px = px || PX;
    var w = rows[0].length, h = rows.length;
    var c = document.createElement('canvas');
    c.width = w * px; c.height = h * px;
    var x = c.getContext('2d');
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var ch = rows[j][i];
      if (ch === '.') continue;
      x.fillStyle = ch === '*' ? RED : INK;
      x.fillRect(i * px, j * px, px, px);
    }
    return c;
  }
  var VARIANTS = ['sword', 'shield', 'axe', 'mace'];
  var SPR = {};
  VARIANTS.forEach(function (v) {
    SPR[v] = [];
    for (var s = 0; s < 3; s++) {
      SPR[v][s] = { walk1: bake(compose(v, 'walk1', s)), walk2: bake(compose(v, 'walk2', s)), attack: bake(compose(v, 'attack', s)) };
    }
  });
  window.__ARCHIVE_SPR = SPR;
  var BONE = bake(['#....#', '######', '#....#'], PX);
  var SKULL = bake(['.####.', '######', '#.##.#', '######', '.#.#..'], PX);

  /* ---------- fusil à pompe vu du dessus, 20 x 48 ---------- */
  var GUN = [
    '.........##.........',
    '.........##.........',
    '.........##.........',
    '.........##.........',
    '.........##.........',
    '.........##.........',
    '.........##.........',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '.....**********.....',
    '.....**********.....',
    '.....*........*.....',
    '.....**********.....',
    '.....**********.....',
    '.....*........*.....',
    '.....**********.....',
    '.....**********.....',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '......########......',
    '......########......',
    '......#####..#......',
    '......#####..#......',
    '......#####..#......',
    '......#####..#......',
    '......#####..#......',
    '......########......',
    '......########......',
    '......########......',
    '......########......',
    '......########......',
    '.......######.......',
    '.......######.......',
    '.......#....#.......',
    '.......######.......',
    '......########......',
    '......########......',
    '......#......#......',
    '......########......',
    '.....##########.....',
    '.....##########.....',
    '.....#........#.....',
    '.....##########.....'
  ];
  var GUN_W = 20, GUN_H = 48;
  var SHELL_SLOTS = [24, 26, 28, 30, 32, 34]; /* rangée de chaque cartouche, colonnes 1 à 4 */
  var FLASH = [
    '...*....*...',
    '.*..*..*..*.',
    '..*.****.*..',
    '...******...',
    '*.********.*',
    '.**********.',
    '.**********.',
    '*.********.*',
    '...******...',
    '..*.****.*..',
    '.*..*..*..*.',
    '...*....*...'
  ];
  var S = { gun: bake(GUN), flash: bake(FLASH) };

  /* ---------- état ---------- */
  var MAXLIFE = 100, HIT = 20, RELOAD = 1500;
  var st;
  function reset() {
    st = {
      mons: [], parts: [], life: MAXLIFE, ammo: 6, score: 0, kills: 0,
      reloading: 0, spawnT: 900, t: 0, mx: -1, my: -1, inside: false,
      recoil: 0, muzzle: 0, over: false, engaged: false, hurt: 0, shake: 0
    };
    over.classList.remove('on');
    root.classList.add('playing');
  }
  reset();

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = root.clientWidth; H = root.clientHeight;
    [back, front].forEach(function (c) {
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.style.width = W + 'px'; c.style.height = H + 'px';
    });
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- squelettes ---------- */
  var HP = { sword: 3, shield: 4, axe: 3, mace: 4 };
  function spawn() {
    var side = Math.random() < .5 ? -1 : 1;
    var v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    st.mons.push({
      v: v, hp: HP[v], maxhp: HP[v],
      z: 1, dx: side * (0.3 + Math.random() * 0.7), vy: Math.random() * 0.2 - 0.1,
      speed: 0.05 + Math.random() * 0.03 + Math.min(st.kills, 40) * 0.001,
      state: 'walk', anim: Math.random() * 1000, atkT: 0, hitT: 0, struck: false
    });
  }
  var ZSTOP = 0.28;
  function geom(m) {
    var p = 1 - m.z;
    var scale = 0.09 + Math.pow(p, 2.2) * 0.38;      /* fraction de H */
    var size = scale * H;
    var cx = W / 2 + m.dx * p * W * 0.5;
    var cy = H * 0.42 + m.vy * H * 0.1 + Math.pow(p, 1.6) * H * 0.42;
    return { x: cx - size / 2, y: cy - size * 0.6, s: size, h: size * 30 / 28 };
  }
  function stage(m) { return m.hp <= 1 ? 2 : (m.hp < m.maxhp ? 1 : 0); }

  /* ---------- tir ---------- */
  function shoot() {
    if (st.over) { reset(); return; }
    if (st.reloading > 0 || st.ammo <= 0) return;
    st.ammo--;
    st.recoil = 1; st.muzzle = 90; st.shake = 6;
    if (st.ammo === 0) st.reloading = RELOAD;
    var order = st.mons.slice().sort(function (a, b) { return a.z - b.z; });
    for (var i = 0; i < order.length; i++) {
      var m = order[i];
      var g = geom(m);
      /* zone de touche : le corps (16/24 de la case) avec une marge */
      var bx = g.x + g.s * 0.18, bw = g.s * 0.64, by = g.y + g.h * 0.24, bh = g.h * 0.72;
      if (st.mx >= bx && st.mx <= bx + bw && st.my >= by && st.my <= by + bh) {
        var dmg = 1 + Math.floor(Math.random() * 3);   /* 1 à 3 */
        m.hp -= dmg; m.hitT = 160;
        sparks(st.mx, st.my, g.s, 6 + dmg * 3);
        if (m.hp <= 0) {
          st.kills++;
          st.score += 10 + Math.round((1 - m.z) * 20) + (m.maxhp - 3) * 5;
          bones(g.x + g.s / 2, g.y + g.h * 0.6, g.s);
          st.mons.splice(st.mons.indexOf(m), 1);
        }
        return;
      }
    }
  }
  function sparks(x, y, s, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (0.5 + Math.random()) * s * 1.4;
      st.parts.push({ kind: 'spark', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s * 0.4, life: 220 + Math.random() * 180, max: 400, sz: Math.max(2, s * 0.03) });
    }
  }
  function bones(x, y, s) {
    for (var i = 0; i < 7; i++) {
      var a = -Math.PI * (0.15 + Math.random() * 0.7), v = (0.6 + Math.random() * 0.8) * s * 1.8;
      st.parts.push({ kind: i === 0 ? 'skull' : 'bone', x: x + (Math.random() - .5) * s * 0.4, y: y + (Math.random() - .5) * s * 0.4,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 14, life: 700 + Math.random() * 400, max: 1100, sz: s * (i === 0 ? 0.22 : 0.2) });
    }
    sparks(x, y, s, 10);
  }
  function hurt() {
    st.life = Math.max(0, st.life - HIT); st.hurt = 220; st.shake = 14;
    flash.style.opacity = .3;
    setTimeout(function () { flash.style.opacity = 0; }, 90);
    if (st.life <= 0) {
      st.over = true; st.mons = [];
      overScore.textContent = String(st.score).padStart(3, '0');
      over.classList.add('on');
      root.classList.remove('playing');
    }
  }

  /* ---------- entrées ---------- */
  root.addEventListener('mousemove', function (e) {
    var r = root.getBoundingClientRect();
    st.mx = e.clientX - r.left; st.my = e.clientY - r.top;
    st.inside = true; st.engaged = true;
  });
  root.addEventListener('mouseleave', function () { st.inside = false; });
  root.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('.lang, a, button')) return;
    e.preventDefault(); shoot();
  });
  function reload() { if (st.ammo < 6 && st.reloading <= 0) { st.reloading = RELOAD; st.ammo = 0; } }
  root.addEventListener('contextmenu', function (e) { e.preventDefault(); reload(); });
  window.addEventListener('keydown', function (e) { if (e.key === 'r' || e.key === 'R') reload(); });
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.25 }).observe(root);
  }

  /* ---------- boucle ---------- */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(48, now - last); last = now;
    var active = st.inside && visible && !st.over && st.engaged;
    if (active) update(dt);
    else if (!st.over) { if (st.recoil > 0) st.recoil = Math.max(0, st.recoil - dt / 140); st.muzzle = Math.max(0, st.muzzle - dt); }
    draw(now);
    requestAnimationFrame(frame);
  }
  function update(dt) {
    st.t += dt;
    st.spawnT -= dt;
    var maxMons = 2 + Math.min(4, Math.floor(st.kills / 5));
    if (st.spawnT <= 0 && st.mons.length < maxMons) {
      spawn();
      st.spawnT = Math.max(900, 3000 - st.kills * 50) * (0.7 + Math.random() * 0.6);
    }
    if (st.reloading > 0) { st.reloading -= dt; if (st.reloading <= 0) { st.reloading = 0; st.ammo = 6; } }
    if (st.recoil > 0) st.recoil = Math.max(0, st.recoil - dt / 140);
    if (st.muzzle > 0) st.muzzle -= dt;
    if (st.hurt > 0) st.hurt -= dt;
    if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 0.06);

    for (var i = st.mons.length - 1; i >= 0; i--) {
      var m = st.mons[i];
      m.anim += dt;
      if (m.hitT > 0) m.hitT -= dt;
      if (m.state === 'walk') {
        m.z -= m.speed * dt / 1000;
        if (m.z <= ZSTOP) { m.z = ZSTOP; m.state = 'attack'; m.atkT = 0; m.struck = false; }
      } else {
        m.atkT += dt;
        if (m.atkT >= 420 && !m.struck) { m.struck = true; hurt(); if (st.over) return; }
        if (m.atkT >= 2200) { m.atkT = 0; m.struck = false; }
      }
    }
    for (var j = st.parts.length - 1; j >= 0; j--) {
      var p = st.parts[j];
      p.life -= dt; if (p.life <= 0) { st.parts.splice(j, 1); continue; }
      p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += 1100 * dt / 1000;
      if (p.rot !== undefined) p.rot += p.vr * dt / 1000;
    }
  }

  function draw(now) {
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bctx.clearRect(0, 0, W, H); fctx.clearRect(0, 0, W, H);
    bctx.imageSmoothingEnabled = false; fctx.imageSmoothingEnabled = false;
    var sx = 0, sy = 0;
    if (st.shake > 0) { sx = (Math.random() - .5) * st.shake; sy = (Math.random() - .5) * st.shake; }

    /* squelettes, du plus loin au plus proche */
    var order = st.mons.slice().sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < order.length; i++) {
      var m = order[i], g = geom(m);
      var ctx = m.z > 0.55 ? bctx : fctx;
      var set = SPR[m.v][stage(m)];
      var img;
      if (m.state === 'attack') img = (m.atkT > 300 && m.atkT < 620) ? set.attack : set.walk1;
      else img = (Math.floor(m.anim / 240) % 2) ? set.walk2 : set.walk1;
      var bob = m.state === 'walk' ? Math.sin(m.anim / 120) * g.s * 0.025 : 0;
      var kick = m.hitT > 0 ? (m.hitT / 160) * g.s * 0.05 : 0;
      ctx.globalAlpha = m.hitT > 0 && (Math.floor(m.hitT / 40) % 2) ? 0.55 : 1;
      ctx.drawImage(img, Math.round(g.x + sx), Math.round(g.y + bob + kick + sy), Math.round(g.s), Math.round(g.h));
      ctx.globalAlpha = 1;
      /* jauge de vie du squelette, une fois touché */
      if (m.hp < m.maxhp) {
        var bw = g.s * 0.5, bh = Math.max(3, g.s * 0.025), bx = g.x + g.s / 2 - bw / 2, by = g.y + g.h * 0.2;
        ctx.fillStyle = BG; ctx.fillRect(Math.round(bx - 1), Math.round(by - 1), Math.round(bw + 2), Math.round(bh + 2));
        ctx.fillStyle = INK; ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw * m.hp / m.maxhp), Math.round(bh));
      }
    }
    /* particules : éclats et os */
    for (var j = 0; j < st.parts.length; j++) {
      var p = st.parts[j];
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.6)));
      if (p.kind === 'spark') {
        fctx.fillStyle = INK; fctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.sz), Math.round(p.sz));
      } else {
        var im = p.kind === 'skull' ? SKULL : BONE;
        var pw = p.sz, ph = pw * im.height / im.width;
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.drawImage(im, Math.round(-pw / 2), Math.round(-ph / 2), Math.round(pw), Math.round(ph));
        fctx.restore();
      }
    }
    fctx.globalAlpha = 1;

    if (st.over) { drawHud(); return; }
    if (!st.engaged) return;

    /* fusil au premier plan */
    var gw = Math.max(96, Math.min(W * 0.1, 150)), gh = gw * (GUN_H / GUN_W), cell = gw / GUN_W;
    var ax = st.mx < 0 ? W / 2 : st.mx, ay = st.my < 0 ? H / 2 : st.my;
    var baseX = W / 2 + (ax - W / 2) * 0.16, baseY = H + gh * 0.04;
    var ang = Math.atan2(ax - baseX, baseY - ay);
    ang = Math.max(-0.35, Math.min(0.35, ang));
    var rec = Math.sin(st.recoil * Math.PI);
    fctx.save();
    fctx.translate(baseX + sx, baseY + rec * gh * 0.1 + sy);
    fctx.rotate(ang - rec * 0.06);
    fctx.drawImage(S.gun, Math.round(-gw / 2), Math.round(-gh), Math.round(gw), Math.round(gh));
    /* cartouches sur le côté du boîtier : le chargeur visible */
    var shown = st.ammo;
    if (st.reloading > 0) shown = Math.floor((1 - st.reloading / RELOAD) * 6.999);
    for (var k = 0; k < shown; k++) {
      var row = SHELL_SLOTS[k];
      var yy = -gh + row * cell, xx = -gw / 2 + 1 * cell;
      fctx.fillStyle = RED; fctx.fillRect(Math.round(xx), Math.round(yy), Math.round(cell * 3), Math.round(cell * 1.6));
      fctx.fillStyle = INK; fctx.fillRect(Math.round(xx + cell * 3), Math.round(yy), Math.round(cell * 1.2), Math.round(cell * 1.6));
    }
    if (st.muzzle > 0) {
      var fs = gw * 1.1 * (0.7 + 0.3 * Math.random());
      fctx.drawImage(S.flash, Math.round(-fs / 2), Math.round(-gh - fs * 0.6), Math.round(fs), Math.round(fs));
    }
    fctx.restore();

    /* viseur */
    if (st.inside && st.mx >= 0) {
      var cx = st.mx, cy = st.my, r = 11, gap = 4, t = 2;
      fctx.fillStyle = RED;
      fctx.fillRect(cx - r, cy - t / 2, r - gap, t); fctx.fillRect(cx + gap, cy - t / 2, r - gap, t);
      fctx.fillRect(cx - t / 2, cy - r, t, r - gap); fctx.fillRect(cx - t / 2, cy + gap, t, r - gap);
      fctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
    drawHud();
  }
  function drawHud() {
    var m = Math.max(18, Math.min(64, W * 0.04));
    /* jauge de vie, bas gauche, au-dessus de la ligne de tag */
    var bw = 140, bh = 8, bx = m, by = H - 78 - bh;
    var low = st.life <= 40;
    fctx.fillStyle = INK;
    fctx.fillRect(bx - 2, by - 2, bw + 4, 1); fctx.fillRect(bx - 2, by + bh + 1, bw + 4, 1);
    fctx.fillRect(bx - 2, by - 2, 1, bh + 4); fctx.fillRect(bx + bw + 1, by - 2, 1, bh + 4);
    fctx.fillStyle = low ? RED : INK;
    var blink = st.hurt > 0 && (Math.floor(st.hurt / 50) % 2);
    if (!blink) fctx.fillRect(bx, by, Math.round(bw * st.life / MAXLIFE), bh);
    fctx.fillStyle = INK; fctx.font = '400 10px Inter, system-ui, sans-serif'; fctx.textAlign = 'left';
    fctx.letterSpacing = '3px';
    fctx.fillText((document.documentElement.getAttribute('data-lang') === 'en' ? 'LIFE' : 'VIE') + '   ' + String(st.score).padStart(3, '0'), bx, by - 8);
  }
  requestAnimationFrame(frame);
  }
})();
