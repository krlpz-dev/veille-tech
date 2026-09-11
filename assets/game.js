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

  /* ---------- squelette : corps 24 x 32, deux tons ('#' clair, '+' ombre, '*' rouge, '@' blanc), case 36 x 40 ---------- */
  var SHADE = '#8A8276', RED2 = '#8E1E17';
  var BODY = {
    walk1: [
      '........########........',
      '.......##########.......',
      '......############......',
      '......###+####+###......',
      '......##..####..##......',
      '......#+.*+##+*.+#......',
      '......###+####+###......',
      '.......###+##+###.......',
      '.......+#.#.#.#.#+......',
      '........++#+#+#++.......',
      '..........+##+..........',
      '.....+###########+......',
      '....##....+##+....#.....',
      '...##+####+##+######....',
      '...#+.+...+##+...++#....',
      '...#+.####+##+####.#....',
      '..+#..+...+##+...+.#+...',
      '..#+...###+##+###..+#...',
      '..#.......+##+......#...',
      '.+#......+###+......#+..',
      '.++.......+#+.......++..',
      '.........+###+..........',
      '........##+#+##.........',
      '.......+#+...+#+........',
      '.......##.....##........',
      '.......#+.....+#........',
      '......+#+.....+#+.......',
      '......##.......##.......',
      '......#+.......+#.......',
      '......#+.......+#.......',
      '.....+##.......##+......',
      '.....###.......###......'
    ],
    walk2: [
      '........########........',
      '.......##########.......',
      '......############......',
      '......###+####+###......',
      '......##..####..##......',
      '......#+.*+##+*.+#......',
      '......###+####+###......',
      '.......###+##+###.......',
      '.......+#.#.#.#.#+......',
      '........++#+#+#++.......',
      '..........+##+..........',
      '.....+###########+......',
      '....##....+##+....#.....',
      '...##+####+##+######....',
      '...#+.+...+##+...++#....',
      '...#+.####+##+####.#....',
      '..+#..+...+##+...+.#+...',
      '..#+...###+##+###..+#...',
      '..#.......+##+......#...',
      '.+#......+###+......#+..',
      '.++.......+#+.......++..',
      '.........+###+..........',
      '........##+#+##.........',
      '........#+...+#+........',
      '.......##.....##........',
      '......+#......+#........',
      '......##.......#+.......',
      '.....+#........+#.......',
      '.....##.........#+......',
      '.....#+.........+#......',
      '....+##.........##+.....',
      '....###.........###.....'
    ],
    attack: [
      '........########.....+#.',
      '.......##########....##.',
      '......############...#+.',
      '......###+####+###..+#..',
      '......##..####..##..##..',
      '......#+.*+##+*.+#..#+..',
      '......###+####+###.+#...',
      '.......###+##+###..##...',
      '.......+#.#.#.#.#+.#+...',
      '........++#+#+#++.+#....',
      '..........+##+....##....',
      '.....+###########+#.....',
      '....##....+##+....#.....',
      '...##+####+##+####......',
      '...#+.+...+##+...+......',
      '...#+.####+##+####......',
      '..+#..+...+##+...+......',
      '..#+...###+##+###.......',
      '..#.......+##+..........',
      '.+#......+###+..........',
      '.++.......+#+...........',
      '.........+###+..........',
      '........##+#+##.........',
      '.......+#+...+#+........',
      '.......##.....##........',
      '.......#+.....+#........',
      '......+#+.....+#+.......',
      '......##.......##.......',
      '......#+.......+#.......',
      '......#+.......+#.......',
      '.....+##.......##+......',
      '.....###.......###......'
    ]
  };
  /* main droite (col, row) dans le repère du corps, par frame */
  var HAND = { walk1: [21, 19], walk2: [21, 19], attack: [22, 0] };
  function line(x0, y0, x1, y1, c) {
    var out = [], dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (var i = 0; i <= n; i++) out.push([x0 + dx * i, y0 + dy * i, c || '#']);
    return out;
  }
  function block(x0, y0, x1, y1, c) { var o = []; for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) o.push([x, y, c || '#']); return o; }
  var WEAPONS = {
    sword: {
      walk: [[0, 1, '+'], [0, 2, '+'], [0, 3, '+'], [1, 1, '+'], [1, 2, '+'], [0, 0, '#'], [1, 0, '+']]
        .concat(line(-2, -1, 3, -1)).concat([[-2, 0, '+'], [3, 0, '+']])
        .concat(line(0, -2, 0, -14)).concat(line(1, -2, 1, -13, '+')).concat([[0, -15, '#'], [1, -14, '+'], [0, -16, '+']]),
      attack: [[0, 0, '#'], [-1, 0, '+'], [-1, 1, '+'], [0, 1, '+'], [1, -2, '#'], [1, -1, '#'], [1, 0, '#'], [1, 1, '+'], [1, 2, '+']]
        .concat(line(2, -1, 14, -1)).concat(line(2, 0, 14, 0)).concat(line(2, 1, 13, 1, '+')).concat([[15, 0, '#'], [16, 0, '+']])
    },
    axe: {
      walk: line(0, 2, 0, -13, '+').concat(line(0, 1, 0, -12)).concat(block(1, -13, 5, -6)).concat(block(4, -12, 5, -7, '+'))
        .concat([[6, -12, '#'], [6, -11, '#'], [6, -10, '+'], [6, -9, '+'], [6, -8, '+'], [2, -14, '#'], [3, -14, '+'], [2, -5, '+'], [3, -5, '+'], [1, -12, '+'], [1, -7, '+']]),
      attack: line(0, 0, 8, 0).concat(line(0, 1, 8, 1, '+')).concat(block(9, -4, 15, 3)).concat(block(9, 1, 15, 3, '+'))
        .concat([[16, -3, '#'], [16, -2, '#'], [16, -1, '+'], [16, 0, '+'], [16, 1, '+'], [16, 2, '+'], [10, -5, '#'], [11, -5, '#'], [12, -5, '+'], [10, 4, '+'], [11, 4, '+'], [12, 4, '+']])
    },
    mace: {
      walk: line(0, 2, 0, -9, '+').concat(line(0, 1, 0, -8)).concat(block(-2, -15, 3, -10)).concat(block(1, -14, 3, -11, '+'))
        .concat([[-1, -16, '#'], [0, -16, '#'], [2, -16, '+'], [-3, -14, '#'], [-3, -11, '#'], [4, -14, '+'], [4, -11, '+'], [-1, -9, '+'], [2, -9, '+'], [0, -17, '#'], [-4, -13, '#'], [5, -12, '+'], [-4, -12, '+'], [5, -13, '#']]),
      attack: line(0, 0, 7, 0).concat(line(0, 1, 7, 1, '+')).concat(block(8, -3, 13, 2)).concat(block(8, 0, 13, 2, '+'))
        .concat([[9, -4, '#'], [12, -4, '#'], [14, -2, '#'], [14, 1, '+'], [9, 3, '+'], [12, 3, '+'], [7, -2, '#'], [7, 2, '+'], [15, 0, '#'], [15, -1, '#'], [10, -5, '#'], [11, 4, '+'], [10, 4, '+']])
    }
  };
  WEAPONS.shield = WEAPONS.sword;
  /* bouclier rond, posé au bras gauche : cols -2..7, rows 11..20 */
  var SHIELD = [
    '...####...',
    '..#+##+#..',
    '.#+#..#+#.',
    '.#+#..#+#.',
    '##+#..#+##',
    '##+#..#+##',
    '.#+#..#+#.',
    '.#+#..#+#.',
    '..#+##+#..',
    '...+##+...'
  ];
  var SHIELD_AT = [-2, 11];
  /* dégradation : pixels effacés par stade (col, row) dans le repère du corps */
  var DAMAGE = [
    [],
    [[9, 0], [10, 0], [9, 1], [10, 2], [8, 13], [9, 13], [14, 15], [15, 15], [7, 8], [8, 8], [8, 9]],
    [[9, 0], [10, 0], [9, 1], [10, 2], [8, 13], [9, 13], [14, 15], [15, 15], [7, 8], [8, 8], [8, 9], [11, 8], [12, 8], [12, 9], [13, 9], [7, 16], [8, 16], [13, 17], [14, 17], [8, 3], [7, 3], [15, 0], [14, 1], [9, 12]]
  ];
  var LEFT_ARM = block(1, 12, 5, 20);
  var HORNS = [[6, -1], [5, -2], [4, -3], [4, -4], [3, -5], [17, -1], [18, -2], [19, -3], [19, -4], [20, -5], [7, 0], [16, 0], [5, -1], [18, -1], [3, -6], [20, -6]];
  var HORNS_SHADE = [[6, 0], [17, 0], [5, -3], [18, -3], [4, -5], [19, -5]];
  var CELL_W = 36, CELL_H = 40, OX = 6, OY = 7;

  function blank(w, h) { var g = []; for (var j = 0; j < h; j++) g.push(new Array(w).fill('.')); return g; }
  function put(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
  function compose(variant, frame, stage, boss) {
    var g = blank(CELL_W, CELL_H);
    var body = BODY[frame];
    for (var j = 0; j < body.length; j++) for (var i = 0; i < body[j].length; i++) if (body[j][i] !== '.') put(g, i + OX, j + OY, body[j][i]);
    if (boss) {
      HORNS.forEach(function (p) { put(g, p[0] + OX, p[1] + OY, '#'); });
      HORNS_SHADE.forEach(function (p) { put(g, p[0] + OX, p[1] + OY, '+'); });
      put(g, 9 + OX, 5 + OY, '@'); put(g, 14 + OX, 5 + OY, '@');
      put(g, 7 + OX, 9 + OY, '#'); put(g, 16 + OX, 9 + OY, '#');
    }
    DAMAGE[stage].forEach(function (p) { put(g, p[0] + OX, p[1] + OY, '.'); });
    if (stage === 2 && frame !== 'attack') LEFT_ARM.forEach(function (p) { put(g, p[0] + OX, p[1] + OY, '.'); });
    var hand = HAND[frame];
    var w = WEAPONS[variant][frame === 'attack' ? 'attack' : 'walk'];
    w.forEach(function (p) { put(g, hand[0] + p[0] + OX, hand[1] + p[1] + OY, p[2]); });
    if (variant === 'shield' && stage === 0) {
      for (var sj = 0; sj < SHIELD.length; sj++) for (var si = 0; si < SHIELD[sj].length; si++) {
        if (SHIELD[sj][si] !== '.') put(g, si + SHIELD_AT[0] + OX, sj + SHIELD_AT[1] + OY, SHIELD[sj][si]);
      }
    }
    return g.map(function (r) { return r.join(''); });
  }
  function bake(rows, px, pal) {
    px = px || PX;
    pal = pal || { '#': INK, '+': SHADE, '*': RED, '@': INK };
    var w = rows[0].length, h = rows.length;
    var c = document.createElement('canvas');
    c.width = w * px; c.height = h * px;
    var x = c.getContext('2d');
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var ch = rows[j][i];
      if (ch === '.') continue;
      x.fillStyle = pal[ch] || INK;
      x.fillRect(i * px, j * px, px, px);
    }
    return c;
  }
  var PAL_BOSS = { '#': RED, '+': RED2, '*': INK, '@': INK };
  var PAL_RED = { '#': RED, '+': RED2, '*': RED, '@': RED };
  var VARIANTS = ['sword', 'shield', 'axe', 'mace'];
  var SPR = {};
  VARIANTS.forEach(function (v) {
    SPR[v] = [];
    for (var s = 0; s < 3; s++) {
      SPR[v][s] = { walk1: bake(compose(v, 'walk1', s)), walk2: bake(compose(v, 'walk2', s)), attack: bake(compose(v, 'attack', s)) };
    }
  });
  /* mini boss : squelette rouge, cornu, à la hache */
  SPR.boss = [];
  for (var bs = 0; bs < 3; bs++) {
    SPR.boss[bs] = { walk1: bake(compose('axe', 'walk1', bs, true), PX, PAL_BOSS), walk2: bake(compose('axe', 'walk2', bs, true), PX, PAL_BOSS), attack: bake(compose('axe', 'attack', bs, true), PX, PAL_BOSS) };
  }
  window.__ARCHIVE_SPR = SPR;
  var BONE_ROWS = ['##...+#', '.#####+', '#+...++'], SKULL_ROWS = ['.#####.', '#######', '#+.#.+#', '#######', '.+#+#+.', '..+.+..'];
  var BONE = bake(BONE_ROWS, PX), SKULL = bake(SKULL_ROWS, PX);
  var BONE_R = bake(BONE_ROWS, PX, PAL_RED), SKULL_R = bake(SKULL_ROWS, PX, PAL_RED);

  /* ---------- fusil à pompe vu du dessus, 20 x 48 (la pompe est un calque séparé) ---------- */
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
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
    '........####........',
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
  var PUMP = [
    '******',
    '******',
    '*....*',
    '******',
    '******',
    '*....*',
    '******',
    '******'
  ];
  var PUMP_COL = 7, PUMP_ROW = 12;
  var GUN_W = 20, GUN_H = 48;
  var SHELL_SLOTS = [24, 26, 28, 30, 32, 34]; /* rangée de chaque cartouche, colonnes 1 à 4 */
  var PORT = [12.5, 28]; /* fenêtre d'éjection, en cellules */
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
  var S = { gun: bake(GUN), pump: bake(PUMP), flash: bake(FLASH) };
  var FONT = '400 20px "Micro 5", "JetBrains Mono", monospace', FONT_S = '400 16px "Micro 5", "JetBrains Mono", monospace';
  if (document.fonts && document.fonts.load) { document.fonts.load(FONT).catch(function () {}); }
  /* viseur pixel art : quatre barres, vide au centre */
  var CROSS = (function () {
    var rows = [];
    for (var y = -9; y <= 9; y++) {
      var r = '';
      for (var x = -9; x <= 9; x++) {
        var v = (Math.abs(x) <= 1 && Math.abs(y) >= 4 && Math.abs(y) <= 9) || (Math.abs(y) <= 1 && Math.abs(x) >= 4 && Math.abs(x) <= 9);
        r += v ? '*' : '.';
      }
      rows.push(r);
    }
    return bake(rows, PX);
  })();

  /* ---------- textes de fin ---------- */
  var ENDINGS = {
    fr: ['Tu rejoins la grande guerre squelette', 'Tué par Jean-Michel Squelette', 'Le reuf t’a donné l’heure', 'Le bourbier t’a rattrapé mon ami', 'Capturé par le gang', 'Pas terrible', 'Mort de chez mort', 'Va bosser plutôt'],
    en: ['You join the great skeleton war', 'Killed by Jean-Michel Skeleton', 'Bro clocked you', 'Caught my opps lackin', 'Captured by the gang', 'Not great', 'Dead as dead gets', 'Go do some work instead']
  };
  var overLine = over.querySelector('[data-line]');

  /* ---------- état ---------- */
  var MAXLIFE = 100, HIT = 20, RELOAD = 1500, PUMP_T = 380;
  var st;
  function reset() {
    st = {
      mons: [], parts: [], fx: [], life: MAXLIFE, ammo: 6, score: 0, kills: 0,
      reloading: 0, spawnT: 700, t: 0, mx: -1, my: -1, inside: false,
      recoil: 0, muzzle: 0, pump: 0, over: false, engaged: false, hurt: 0, shake: 0, sinceBoss: 0, intro: [2000, 2600, 3300]
    };
    over.classList.remove('on');
    root.classList.add('playing'); root.classList.remove('over');
  }
  reset();
  window.__ARCHIVE_STATE = function () { return st; };

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
  var HP = { sword: 3, shield: 4, axe: 3, mace: 4, boss: 9 };
  function difficulty() { return Math.min(1, st.kills / 32 + st.t / 170000); } /* 0 → 1 en 32 kills ou 3 min */
  function spawn() {
    var side = Math.random() < .5 ? -1 : 1;
    var boss = st.kills >= 4 && st.sinceBoss >= 5 && Math.random() < 0.35;
    var v = boss ? 'boss' : VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
    if (boss) st.sinceBoss = 0;
    var d = difficulty();
    st.mons.push({
      v: v, boss: boss, hp: HP[v], maxhp: HP[v],
      z: 1, dx: side * (0.35 + Math.random() * 0.65), vy: Math.random() * 0.2 - 0.1,
      speed: (boss ? 0.045 : 0.05) + Math.random() * 0.03 + d * 0.06,
      state: 'walk', anim: Math.random() * 1000, atkT: 0, hitT: 0, critT: 0, struck: false, born: 0
    });
  }
  var ZSTOP = 0.28;
  function geom(m) {
    var p = 1 - m.z;
    var scale = (0.19 + Math.pow(p, 2.2) * 0.42) * (m.boss ? 1.3 : 1);      /* fraction de H */
    var size = scale * H;
    var cx = W / 2 + m.dx * W * (0.15 + 0.42 * p);
    var cy = H * 0.42 + m.vy * H * 0.1 + Math.pow(p, 1.6) * H * 0.4;
    return { x: cx - size / 2, y: cy - size * 0.62, s: size, h: size * CELL_H / CELL_W };
  }
  function stage(m) { return m.hp <= 1 ? 2 : (m.hp < m.maxhp ? 1 : 0); }

  /* ---------- tir ---------- */
  var gunPose = null; /* dernière pose du fusil, pour les douilles */
  function shoot() {
    if (st.over) return;
    if (st.reloading > 0 || st.ammo <= 0 || st.pump > 0) return;
    st.ammo--;
    st.recoil = 1; st.muzzle = 90; st.shake = 6; st.pump = PUMP_T;
    if (gunPose) ejectShell();
    if (st.ammo === 0) st.reloading = RELOAD;
    var order = st.mons.slice().sort(function (a, b) { return a.z - b.z; });
    for (var i = 0; i < order.length; i++) {
      var m = order[i];
      var g = geom(m);
      var bx = g.x + g.s * (OX / CELL_W), bw = g.s * (24 / CELL_W), by = g.y + g.h * (OY / CELL_H), bh = g.h * (32 / CELL_H);
      if (st.mx >= bx && st.mx <= bx + bw && st.my >= by && st.my <= by + bh) {
        var headTop = g.y + g.h * (OY / CELL_H), headBottom = g.y + g.h * ((OY + 10) / CELL_H);
        var head = st.my <= headBottom && st.my >= headTop - g.h * 0.05 && Math.abs(st.mx - (g.x + g.s * ((OX + 12) / CELL_W))) < g.s * 0.19;
        var dmg = 1 + Math.floor(Math.random() * 3);   /* 1 à 3 */
        if (head) { dmg *= 2; crit(g.x + g.s * ((OX + 12) / CELL_W), g.y + g.h * (OY / CELL_H), g.s); m.critT = 140; }
        m.hp -= dmg; m.hitT = 160;
        sparks(st.mx, st.my, g.s, 6 + dmg * 2, m.boss);
        if (m.hp <= 0) {
          st.kills++; st.sinceBoss++;
          st.score += (m.boss ? 50 : 10) + Math.round((1 - m.z) * 20) + (head ? 15 : 0);
          bones(g.x + g.s / 2, g.y + g.h * 0.6, g.s, m.boss);
          st.mons.splice(st.mons.indexOf(m), 1);
        }
        return;
      }
    }
  }
  function ejectShell() {
    var gp = gunPose, cell = gp.gw / GUN_W;
    var lx = -gp.gw / 2 + PORT[0] * cell, ly = -gp.gh + PORT[1] * cell;
    var c = Math.cos(gp.ang), s = Math.sin(gp.ang);
    var x = gp.x + lx * c - ly * s, y = gp.y + lx * s + ly * c;
    st.parts.push({ kind: 'shell', x: x, y: y, vx: 260 + Math.random() * 160, vy: -(320 + Math.random() * 160), rot: gp.ang, vr: 12 + Math.random() * 10, life: 900, max: 900, sz: cell * 2.6 });
  }
  function crit(x, y, s) {
    st.fx.push({ kind: 'label', x: x, y: y - s * 0.1, life: 620, max: 620, text: 'CRIT' });
  }
  var tintC = document.createElement('canvas'), tintX = tintC.getContext('2d');
  function drawTinted(ctx, img, x, y, w, h) {
    tintC.width = img.width; tintC.height = img.height;
    tintX.clearRect(0, 0, tintC.width, tintC.height);
    tintX.drawImage(img, 0, 0);
    tintX.globalCompositeOperation = 'source-atop'; tintX.fillStyle = RED; tintX.fillRect(0, 0, tintC.width, tintC.height);
    tintX.globalCompositeOperation = 'source-over';
    ctx.drawImage(tintC, x, y, w, h);
  }
  function sparks(x, y, s, n, red) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (0.5 + Math.random()) * s * 1.4;
      st.parts.push({ kind: 'spark', red: red, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - s * 0.4, life: 220 + Math.random() * 180, max: 400, sz: Math.max(2, s * 0.03) });
    }
  }
  function bones(x, y, s, red) {
    for (var i = 0; i < 7; i++) {
      var a = -Math.PI * (0.15 + Math.random() * 0.7), v = (0.6 + Math.random() * 0.8) * s * 1.8;
      st.parts.push({ kind: i === 0 ? 'skull' : 'bone', red: red, x: x + (Math.random() - .5) * s * 0.4, y: y + (Math.random() - .5) * s * 0.4,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 14, life: 700 + Math.random() * 400, max: 1100, sz: s * (i === 0 ? 0.22 : 0.2) });
    }
    sparks(x, y, s, 10, red);
  }
  function hurt(m) {
    st.life = Math.max(0, st.life - (m.boss ? HIT * 1.5 : HIT)); st.hurt = 220; st.shake = 14;
    flash.style.opacity = .3;
    setTimeout(function () { flash.style.opacity = 0; }, 90);
    if (st.life <= 0) {
      st.over = true; st.mons = [];
      var lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr';
      var list = ENDINGS[lang];
      overLine.textContent = list[Math.floor(Math.random() * list.length)];
      overScore.textContent = String(st.score).padStart(3, '0');
      over.classList.add('on');
      root.classList.remove('playing'); root.classList.add('over');
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
  over.querySelector('button').addEventListener('click', function () { reset(); st.engaged = true; });
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
    var active = visible && !st.over;
    if (active) update(dt);
    draw(now);
    requestAnimationFrame(frame);
  }
  function update(dt) {
    st.t += dt;
    st.spawnT -= dt;
    var d = difficulty();
    while (st.intro.length && st.t >= st.intro[0]) { st.intro.shift(); spawn(); st.spawnT = 2400; }
    var maxMons = 2 + Math.floor(d * 5);
    if (st.spawnT <= 0 && st.mons.length < maxMons) {
      spawn();
      st.spawnT = (2600 - d * 1800) * (0.7 + Math.random() * 0.6);
    }
    if (st.reloading > 0) { st.reloading -= dt; if (st.reloading <= 0) { st.reloading = 0; st.ammo = 6; } }
    if (st.recoil > 0) st.recoil = Math.max(0, st.recoil - dt / 140);
    if (st.pump > 0) st.pump = Math.max(0, st.pump - dt);
    if (st.muzzle > 0) st.muzzle -= dt;
    if (st.hurt > 0) st.hurt -= dt;
    if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 0.06);

    for (var i = st.mons.length - 1; i >= 0; i--) {
      var m = st.mons[i];
      m.anim += dt; m.born += dt;
      if (m.hitT > 0) m.hitT -= dt;
      if (m.critT > 0) m.critT -= dt;
      if (m.state === 'walk') {
        m.z -= m.speed * dt / 1000;
        if (m.z <= ZSTOP) { m.z = ZSTOP; m.state = 'attack'; m.atkT = 0; m.struck = false; }
      } else {
        m.atkT += dt;
        if (m.atkT >= 420 && !m.struck) { m.struck = true; if (st.inside) { hurt(m); if (st.over) return; } }
        if (m.atkT >= 2200 - d * 800) { m.atkT = 0; m.struck = false; }
      }
    }
    for (var j = st.parts.length - 1; j >= 0; j--) {
      var p = st.parts[j];
      p.life -= dt; if (p.life <= 0) { st.parts.splice(j, 1); continue; }
      p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += 1100 * dt / 1000;
      if (p.rot !== undefined) p.rot += p.vr * dt / 1000;
    }
    for (var k = st.fx.length - 1; k >= 0; k--) { st.fx[k].life -= dt; if (st.fx[k].life <= 0) st.fx.splice(k, 1); }
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
      var fade = Math.min(1, m.born / 700);
      ctx.globalAlpha = fade * (m.hitT > 0 && (Math.floor(m.hitT / 40) % 2) ? 0.55 : 1);
      if (m.critT > 0) drawTinted(ctx, img, Math.round(g.x + sx), Math.round(g.y + bob + kick + sy), Math.round(g.s), Math.round(g.h));
      else ctx.drawImage(img, Math.round(g.x + sx), Math.round(g.y + bob + kick + sy), Math.round(g.s), Math.round(g.h));
      ctx.globalAlpha = 1;
      if (m.hp < m.maxhp) {
        var bw = g.s * 0.5, bh = Math.max(3, g.s * 0.025), bx = g.x + g.s * ((OX + 12) / CELL_W) - bw / 2, by = g.y + g.h * ((OY - 3) / CELL_H);
        ctx.fillStyle = INK; ctx.fillRect(Math.round(bx - 2), Math.round(by - 2), Math.round(bw + 4), Math.round(bh + 4));
        ctx.fillStyle = BG; ctx.fillRect(Math.round(bx - 1), Math.round(by - 1), Math.round(bw + 2), Math.round(bh + 2));
        ctx.fillStyle = RED; ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw * m.hp / m.maxhp), Math.round(bh));
      }
    }
    /* particules : éclats, os, douilles */
    for (var j = 0; j < st.parts.length; j++) {
      var p = st.parts[j];
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max * 0.6)));
      if (p.kind === 'spark') {
        fctx.fillStyle = p.red ? RED : INK; fctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.sz), Math.round(p.sz));
      } else if (p.kind === 'shell') {
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.fillStyle = RED; fctx.fillRect(Math.round(-p.sz / 2), Math.round(-p.sz * 0.2), Math.round(p.sz * 0.72), Math.round(p.sz * 0.4));
        fctx.fillStyle = INK; fctx.fillRect(Math.round(p.sz * 0.22), Math.round(-p.sz * 0.2), Math.round(p.sz * 0.28), Math.round(p.sz * 0.4));
        fctx.restore();
      } else {
        var im = p.kind === 'skull' ? (p.red ? SKULL_R : SKULL) : (p.red ? BONE_R : BONE);
        var pw = p.sz, ph = pw * im.height / im.width;
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.drawImage(im, Math.round(-pw / 2), Math.round(-ph / 2), Math.round(pw), Math.round(ph));
        fctx.restore();
      }
    }
    fctx.globalAlpha = 1;
    /* coup critique : étiquette plate qui monte, façon dégâts de RPG */
    for (var k = 0; k < st.fx.length; k++) {
      var f = st.fx[k], q = 1 - f.life / f.max;
      fctx.globalAlpha = q < 0.7 ? 1 : 1 - (q - 0.7) / 0.3;
      var ly = f.y - q * 34, lw = 46, lh = 18;
      fctx.fillStyle = RED; fctx.fillRect(Math.round(f.x - lw / 2), Math.round(ly - lh / 2), lw, lh);
      fctx.fillStyle = BG; fctx.font = FONT; fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.letterSpacing = '1px';
      fctx.fillText(f.text, Math.round(f.x + 1), Math.round(ly + 1));
    }
    fctx.globalAlpha = 1;

    if (st.over) { drawHud(); return; }
    var rise = Math.min(1, Math.max(0, (st.t - 4000) / 700)); rise = 1 - Math.pow(1 - rise, 3);
    if (rise <= 0) { drawHud(); return; }

    /* fusil au premier plan */
    var gw = Math.max(44, Math.min(W * 0.055, H * 0.1, 96)), gh = gw * (GUN_H / GUN_W), cell = gw / GUN_W;
    var ax = st.mx < 0 ? W / 2 : st.mx, ay = st.my < 0 ? H / 2 : st.my;
    var baseX = W / 2 + (ax - W / 2) * 0.16, baseY = H + gh * 0.04;
    var ang = Math.atan2(ax - baseX, baseY - ay);
    ang = Math.max(-0.35, Math.min(0.35, ang));
    var rec = Math.sin(st.recoil * Math.PI);
    var gx = baseX + sx, gy = baseY + rec * gh * 0.1 + sy + (1 - rise) * gh * 1.1, gang = ang - rec * 0.06;
    gunPose = { x: gx, y: gy, ang: gang, gw: gw, gh: gh };
    fctx.save();
    fctx.translate(gx, gy);
    fctx.rotate(gang);
    fctx.drawImage(S.gun, Math.round(-gw / 2), Math.round(-gh), Math.round(gw), Math.round(gh));
    /* pompe : recule puis revient après chaque tir */
    var pq = st.pump > 0 ? Math.sin((1 - st.pump / PUMP_T) * Math.PI) : 0;
    var py = -gh + (PUMP_ROW + pq * 4.5) * cell, pxx = -gw / 2 + PUMP_COL * cell;
    fctx.drawImage(S.pump, Math.round(pxx), Math.round(py), Math.round(cell * 6), Math.round(cell * 8));
    /* cartouches sur le côté du boîtier : le chargeur visible */
    var shown = st.ammo;
    if (st.reloading > 0) shown = Math.floor((1 - st.reloading / RELOAD) * 6.999);
    for (var kk = 0; kk < shown; kk++) {
      var row = SHELL_SLOTS[kk];
      var yy = -gh + row * cell, xx = -gw / 2 + 1 * cell;
      fctx.fillStyle = RED; fctx.fillRect(Math.round(xx), Math.round(yy), Math.round(cell * 3), Math.round(cell * 1.6));
      fctx.fillStyle = INK; fctx.fillRect(Math.round(xx + cell * 3), Math.round(yy), Math.round(cell * 1.2), Math.round(cell * 1.6));
    }
    if (st.muzzle > 0) {
      var fs = gw * 1.1 * (0.7 + 0.3 * Math.random());
      fctx.drawImage(S.flash, Math.round(-fs / 2), Math.round(-gh - fs * 0.6), Math.round(fs), Math.round(fs));
    }
    fctx.restore();
    /* indicateur munitions, à côté du curseur (là où l'œil regarde) */
    if (rise >= 1 && st.inside && st.mx >= 0) {
      var lang = document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'fr';
      var ix = Math.round(st.mx + 22), iy = Math.round(st.my - 22);
      fctx.font = FONT; fctx.textAlign = 'left'; fctx.textBaseline = 'middle'; fctx.letterSpacing = '1px';
      if (st.reloading > 0) {
        var q = 1 - st.reloading / RELOAD;
        var label = lang === 'en' ? 'RELOADING' : 'RECHARGE';
        var tw = Math.ceil(fctx.measureText(label).width), bw2 = tw + 16, bh2 = 20;
        fctx.fillStyle = INK; fctx.fillRect(ix - 1, iy - 1, bw2 + 2, bh2 + 2);
        fctx.fillStyle = BG; fctx.fillRect(ix, iy, bw2, bh2);
        var fw = Math.round(bw2 * q);
        fctx.fillStyle = INK; fctx.fillRect(ix, iy, fw, bh2);
        fctx.fillStyle = INK; fctx.fillText(label, ix + 8, iy + bh2 / 2 + 1);
        fctx.save(); fctx.beginPath(); fctx.rect(ix, iy, fw, bh2); fctx.clip();
        fctx.fillStyle = BG; fctx.fillText(label, ix + 8, iy + bh2 / 2 + 1);
        fctx.restore();
      } else if (st.ammo <= 2 && (Math.floor(st.t / 260) % 2 === 0)) {
        var tw2 = Math.ceil(fctx.measureText('LOW AMMO').width);
        fctx.fillStyle = RED; fctx.fillRect(ix, iy, tw2 + 16, 20);
        fctx.fillStyle = BG; fctx.fillText('LOW AMMO', ix + 8, iy + 11);
      }
    }

    /* viseur */
    if (st.inside && st.mx >= 0 && rise >= 1) {
      var cs = 48;
      fctx.drawImage(CROSS, Math.round(st.mx - cs / 2), Math.round(st.my - cs / 2), cs, cs);
    }
    drawHud();
  }
  function drawHud() {
    /* score à gauche du fusil, vie à droite ; apparition : contour qui se trace, puis jauge qui se remplit */
    var p1 = Math.min(1, Math.max(0, (st.t - 4700) / 600));
    var p2 = Math.min(1, Math.max(0, (st.t - 5300) / 800)); p2 = 1 - Math.pow(1 - p2, 3);
    if (p1 <= 0) return;
    var gw = Math.max(44, Math.min(W * 0.055, H * 0.1, 96));
    var gap = Math.max(36, gw * 0.9);
    var bw = 120, bh = 8, bx = Math.round(W / 2 + gw / 2 + gap), by = H - 42 - bh;
    var per = 2 * (bw + 4) + 2 * (bh + 4), len = per * p1;
    var segs = [[bx - 2, by - 2, bw + 4, 0], [bx + bw + 1, by - 2, 0, bh + 4], [bx + bw + 1, by + bh + 1, -(bw + 4), 0], [bx - 2, by + bh + 1, 0, -(bh + 4)]];
    fctx.fillStyle = INK;
    for (var i = 0; i < segs.length && len > 0; i++) {
      var sg = segs[i], L = Math.abs(sg[2]) + Math.abs(sg[3]), t = Math.min(1, len / L);
      var w = sg[2] * t, h = sg[3] * t;
      fctx.fillRect(Math.min(sg[0], sg[0] + w), Math.min(sg[1], sg[1] + h), Math.max(1, Math.abs(w)), Math.max(1, Math.abs(h)));
      len -= L;
    }
    var blink = st.hurt > 0 && (Math.floor(st.hurt / 50) % 2);
    fctx.fillStyle = RED;
    if (!blink && p2 > 0) fctx.fillRect(bx, by, Math.round(bw * (st.life / MAXLIFE) * p2), bh);
    fctx.globalAlpha = p2;
    fctx.fillStyle = INK; fctx.font = FONT; fctx.textAlign = 'right'; fctx.textBaseline = 'middle';
    fctx.letterSpacing = '1px';
    fctx.fillText('SCORE  ' + String(st.score).padStart(3, '0'), Math.round(W / 2 - gw / 2 - gap), by + bh / 2 + 1);
    fctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
  }
})();
