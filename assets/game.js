/* ARCHIVE — mini jeu du header. Bi-couleur, rétro, seamless.
   Les monstres sortent de derrière le logo et avancent vers la caméra.
   Clic : tir de shotgun (6 coups, rechargement auto). 5 vies. */
(function () {
  'use strict';
  var root = document.getElementById('hero');
  if (!root) return;
  var coarse = window.matchMedia('(pointer:coarse)').matches || window.innerWidth < 720;
  if (coarse) return;

  var INK = '#EDE7DC', RED = '#FF3B2F', BG = '#0B0A09';
  var back = document.getElementById('c-back'), front = document.getElementById('c-front');
  var bctx = back.getContext('2d'), fctx = front.getContext('2d');
  var flash = root.querySelector('.flash');
  var over = root.querySelector('.gameover');
  var overScore = over.querySelector('[data-score]');
  var W = 0, H = 0, DPR = 1;

  /* ---------- sprites (bitmaps) : '#' crème, '*' rouge ---------- */
  var MON = {
    walk1: [
      '....##....##....',
      '....#......#....',
      '...##########...',
      '..############..',
      '.###**####**###.',
      '.###**####**###.',
      '.##############.',
      '.##.###..###.##.',
      '.##..######..##.',
      '#....######....#',
      '#...########...#',
      '....##.##.##....',
      '...###.##.###...',
      '...##..##..##...',
      '..##...##...##..',
      '.###...###..###.'
    ],
    walk2: [
      '....##....##....',
      '....#......#....',
      '...##########...',
      '..############..',
      '.###**####**###.',
      '.###**####**###.',
      '.##############.',
      '.##.###..###.##.',
      '.##..######..##.',
      '.#...######...#.',
      '.#..########..#.',
      '....##.##.##....',
      '...###.##.###...',
      '...##..##..##...',
      '..###..##..###..',
      '.......###......'
    ],
    attack: [
      '#...##....##...#',
      '#...#......#...#',
      '#..##########..#',
      '#.############.#',
      '####**####**####',
      '.###**####**###.',
      '.##############.',
      '.###.######.###.',
      '..##.**..**.##..',
      '..##.######.##..',
      '...##########...',
      '....##.##.##....',
      '...###.##.###...',
      '...##..##..##...',
      '..##...##...##..',
      '.###...###..###.'
    ],
    death: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..*..........*..',
      '....*..##..*....',
      '..*..######..*..',
      '.....##**##.....',
      '...*########*...',
      '.....######.....',
      '..*.##.##.##.*..',
      '...##..##..##...',
      '.*..........*...',
      '................'
    ]
  };
  var HEART = [
    '.##..##.',
    '########',
    '########',
    '########',
    '.######.',
    '..####..',
    '...##...',
    '........'
  ];
  var HEART_OFF = [
    '.##..##.',
    '#..##..#',
    '#......#',
    '#......#',
    '.#....#.',
    '..#..#..',
    '...##...',
    '........'
  ];
  var SHELL = [
    '.**.',
    '.**.',
    '.##.',
    '.##.',
    '.##.',
    '.##.',
    '####',
    '####'
  ];
  var SHELL_OFF = [
    '.**.',
    '.**.',
    '.#..',
    '..#.',
    '.#..',
    '..#.',
    '#..#',
    '####'
  ];
  /* shotgun à pompe vu à la première personne, canon vers le haut. 16 x 44 */
  var GUN = [
    '......#**#......',
    '......####......',
    '......#.##......',
    '......####......',
    '......####......',
    '......####......',
    '......#.##......',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.....##.###.....',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '...##########...',
    '...##########...',
    '...#........#...',
    '...##########...',
    '...##########...',
    '...#........#...',
    '...##########...',
    '...##########...',
    '...#........#...',
    '...##########...',
    '.....######.....',
    '.....######.....',
    '.....######.....',
    '.##############.',
    '..#.#.#.#.#.#.#.',
    '.#########....#.',
    '.#########....#.',
    '.#########....#.',
    '.#########....#.',
    '.##############.',
    '.##############.',
    '.##############.',
    '.##############.',
    '.##############.',
    '.#............#.',
    '.##############.',
    '..############..',
    '..############..',
    '..#..........#..',
    '..############..'
  ];
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

  function bake(rows, px) {
    px = px || 1;
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
  var S = {};
  for (var k in MON) S[k] = bake(MON[k], 4);
  S.heart = bake(HEART, 4); S.heartOff = bake(HEART_OFF, 4);
  S.shell = bake(SHELL, 4); S.shellOff = bake(SHELL_OFF, 4);
  S.gun = bake(GUN, 4); S.flash = bake(FLASH, 4);

  /* ---------- état ---------- */
  var st;
  function reset() {
    st = {
      mons: [], parts: [], lives: 5, ammo: 6, score: 0, kills: 0,
      reloading: 0, spawnT: 1200, t: 0, mx: -1, my: -1, inside: false,
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

  /* ---------- monstres ---------- */
  function spawn() {
    var side = Math.random() < .5 ? -1 : 1;
    st.mons.push({
      z: 1, dx: side * (0.25 + Math.random() * 0.75), vy: Math.random() * 0.25 - 0.1,
      speed: 0.075 + Math.random() * 0.045 + Math.min(st.kills, 40) * 0.0012,
      state: 'walk', anim: Math.random() * 1000, atkT: 0, deadT: 0, hitT: 0, id: Math.random()
    });
  }
  function geom(m) {
    var p = 1 - m.z;
    var scale = 0.035 + Math.pow(p, 2.4) * 0.42;      // fraction de H
    var size = scale * H;
    var cx = W / 2 + m.dx * p * W * 0.42;
    var cy = H * 0.44 + m.vy * H * 0.1 + Math.pow(p, 1.6) * H * 0.46;
    return { x: cx - size / 2, y: cy - size / 2, s: size };
  }

  /* ---------- tir ---------- */
  function shoot() {
    if (st.over) { reset(); return; }
    if (st.reloading > 0 || st.ammo <= 0) return;
    st.ammo--;
    st.recoil = 1; st.muzzle = 90; st.shake = 6;
    if (st.ammo === 0) st.reloading = 1500;
    /* test d'impact : du plus proche au plus loin */
    var order = st.mons.slice().sort(function (a, b) { return a.z - b.z; });
    for (var i = 0; i < order.length; i++) {
      var m = order[i];
      if (m.state === 'dead') continue;
      var g = geom(m);
      var pad = g.s * 0.12;
      if (st.mx >= g.x - pad && st.mx <= g.x + g.s + pad && st.my >= g.y - pad && st.my <= g.y + g.s + pad) {
        m.state = 'dead'; m.deadT = 420;
        st.kills++;
        st.score += Math.round(10 + (1 - m.z) * 40);
        burst(g.x + g.s / 2, g.y + g.s / 2, g.s);
        return;
      }
    }
  }
  function burst(x, y, s) {
    for (var i = 0; i < 14; i++) {
      var a = Math.random() * Math.PI * 2, v = (0.6 + Math.random()) * s * 1.6;
      st.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s * 0.8, life: 380 + Math.random() * 260, sz: Math.max(2, s * 0.06), red: Math.random() < .75 });
    }
  }
  function hurt() {
    st.lives--; st.hurt = 220; st.shake = 14;
    flash.style.opacity = .35;
    setTimeout(function () { flash.style.opacity = 0; }, 90);
    if (st.lives <= 0) {
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
  root.addEventListener('contextmenu', function (e) { e.preventDefault(); if (st.ammo < 6 && st.reloading <= 0) { st.reloading = 1500; st.ammo = 0; } });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'r' || e.key === 'R') { if (st.ammo < 6 && st.reloading <= 0) { st.reloading = 1500; st.ammo = 0; } }
  });
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
    var maxMons = 3 + Math.min(5, Math.floor(st.kills / 6));
    if (st.spawnT <= 0 && st.mons.length < maxMons) {
      spawn();
      st.spawnT = Math.max(650, 2100 - st.kills * 35) * (0.7 + Math.random() * 0.6);
    }
    if (st.reloading > 0) { st.reloading -= dt; if (st.reloading <= 0) { st.reloading = 0; st.ammo = 6; } }
    if (st.recoil > 0) st.recoil = Math.max(0, st.recoil - dt / 140);
    if (st.muzzle > 0) st.muzzle -= dt;
    if (st.hurt > 0) st.hurt -= dt;
    if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 0.06);

    for (var i = st.mons.length - 1; i >= 0; i--) {
      var m = st.mons[i];
      m.anim += dt;
      if (m.state === 'dead') { m.deadT -= dt; if (m.deadT <= 0) st.mons.splice(i, 1); continue; }
      if (m.state === 'walk') {
        m.z -= m.speed * dt / 1000;
        if (m.z <= 0.1) { m.z = 0.1; m.state = 'attack'; m.atkT = 0; }
      } else if (m.state === 'attack') {
        m.atkT += dt;
        if (m.atkT >= 380 && !m.struck) { m.struck = true; hurt(); if (st.over) return; }
        if (m.atkT >= 1500) { m.atkT = 0; m.struck = false; }
      }
    }
    for (var j = st.parts.length - 1; j >= 0; j--) {
      var p = st.parts[j];
      p.life -= dt; if (p.life <= 0) { st.parts.splice(j, 1); continue; }
      p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += 900 * dt / 1000;
    }
  }

  function drawSprite(ctx, img, x, y, s) {
    ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(s), Math.round(s));
  }
  function draw(now) {
    bctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bctx.clearRect(0, 0, W, H); fctx.clearRect(0, 0, W, H);
    bctx.imageSmoothingEnabled = false; fctx.imageSmoothingEnabled = false;
    var sx = 0, sy = 0;
    if (st.shake > 0) { sx = (Math.random() - .5) * st.shake; sy = (Math.random() - .5) * st.shake; }

    /* monstres, du plus loin au plus proche */
    var order = st.mons.slice().sort(function (a, b) { return b.z - a.z; });
    for (var i = 0; i < order.length; i++) {
      var m = order[i], g = geom(m);
      var ctx = m.z > 0.55 ? bctx : fctx;
      var img;
      if (m.state === 'dead') img = S.death;
      else if (m.state === 'attack') img = (m.atkT > 260 && m.atkT < 520) ? S.attack : S.walk1;
      else img = (Math.floor(m.anim / 260) % 2) ? S.walk2 : S.walk1;
      var bob = m.state === 'walk' ? Math.sin(m.anim / 130) * g.s * 0.03 : 0;
      if (m.state === 'dead') { ctx.globalAlpha = Math.max(0, m.deadT / 420); }
      drawSprite(ctx, img, g.x + sx, g.y + bob + sy, g.s);
      ctx.globalAlpha = 1;
    }
    /* particules */
    for (var j = 0; j < st.parts.length; j++) {
      var p = st.parts[j];
      fctx.fillStyle = p.red ? RED : INK;
      fctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.sz), Math.round(p.sz));
    }

    if (st.over) { drawHud(); return; }
    if (!st.engaged) return;

    /* shotgun au premier plan */
    var gw = Math.max(80, Math.min(W * 0.085, 124)), gh = gw * (44 / 16);
    var ax = st.mx < 0 ? W / 2 : st.mx, ay = st.my < 0 ? H / 2 : st.my;
    var baseX = W / 2 + (ax - W / 2) * 0.16, baseY = H + gh * 0.02;
    var ang = Math.atan2(ax - baseX, baseY - ay);
    ang = Math.max(-0.35, Math.min(0.35, ang));
    var rec = Math.sin(st.recoil * Math.PI) ;
    fctx.save();
    fctx.translate(baseX + sx, baseY + rec * gh * 0.12 + sy);
    fctx.rotate(ang - rec * 0.08);
    fctx.drawImage(S.gun, Math.round(-gw / 2), Math.round(-gh), Math.round(gw), Math.round(gh));
    if (st.muzzle > 0) {
      var fs = gw * 0.9 * (0.7 + 0.3 * Math.random());
      fctx.drawImage(S.flash, Math.round(-fs / 2), Math.round(-gh - fs * 0.62), Math.round(fs), Math.round(fs));
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
    /* cœurs, bas gauche, au-dessus de la ligne de tag */
    var hs = 26, hy = H - 78 - hs;
    for (var i = 0; i < 5; i++) {
      var img = i < st.lives ? S.heart : S.heartOff;
      var jump = (st.hurt > 0 && i === st.lives) ? -4 : 0;
      fctx.drawImage(img, Math.round(m + i * (hs + 6)), Math.round(hy + jump), hs, hs);
    }
    /* chargeur, côté droit, vertical */
    var ss = 14, sh = 28, x = W - m - ss, y0 = H / 2 - (6 * (sh + 6)) / 2;
    for (var k = 0; k < 6; k++) {
      var on = k < st.ammo;
      if (st.reloading > 0) on = k < Math.floor((1 - st.reloading / 1500) * 6.999);
      fctx.drawImage(on ? S.shell : S.shellOff, Math.round(x), Math.round(y0 + k * (sh + 6)), ss, sh);
    }
    /* score, discret, sous les cartouches */
    fctx.fillStyle = INK; fctx.font = '500 11px "JetBrains Mono", Menlo, monospace';
    fctx.textAlign = 'right'; fctx.letterSpacing = '2px';
    fctx.fillText(String(st.score).padStart(3, '0'), W - m + 2, y0 + 6 * (sh + 6) + 16);
  }
  requestAnimationFrame(frame);
})();
