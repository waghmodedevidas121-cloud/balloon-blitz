/* BB.Engine — core gameplay. Same physics, scoring, waves, fever as prototype.
   Hooks: coins/XP/missions/achievements. UI-independent (needs HUD ids only). */
window.BB = window.BB || {};
var canvas, ctx, width, height, dpr;
var gameMode = "BLITZ", gameState = "HOME";
var score = 0, timeLeft = 60, combo = 1, maxCombo = 1, comboTimer = 0, balloonsPopped = 0;
var lives = 3, wave = 1, currentLevelId = 1, levelProgressCount = 0, feversThisRun = 0, lifeGrace = 0;
var currentPuzzleId = 1, puzzleDarts = 0, puzzleDartsLeft = 0, puzzleTotalBalloons = 0, puzzleActiveBalloons = 0;
var feverCharge = 0, isFever = false, feverTimer = 0, slowMoTimer = 0;
var shakeIntensity = 0, shakeDuration = 0, runCoins = 0;
var mousePos = { x: 0, y: 0 };
var balloons = [], particles = [], textPopups = [], shockwaves = [], lasers = [], powerupDrops = [], needleRays = [];
var currentWeapon = "pistol", weaponTimer = 0, weaponShownSec = -1;
var bossBalloon = null, bossHp = 0, maxBossHp = 0;
var slingshotDarts = [], slingshotArrowsLeft = 5, slingshotTotalPops = 0, slingshotState = { dragging: false, curX: 0, curY: 0 };
var currentSlingshotStage = 1, slingshotTotalBalloons = 0, slingshotActiveBalloons = 0;
function sound() { return BB.Audio.sound; }
function effectsOn() { return BB.Save.data.settings.effects !== false; }

/* ---------- CARTOON BALLOON SPRITES (kids-game style: dark outline, flat bright fill, bold shine, cute faces) ---------- */
var SPRITES = {};
function hexToRgb(h) {
  var v = h.replace("#", "");
  return { r: parseInt(v.substr(0, 2), 16), g: parseInt(v.substr(2, 2), 16), b: parseInt(v.substr(4, 2), 16) };
}
function mixc(hex, target, t) {
  var c = hexToRgb(hex);
  var f = function (a, b) { return Math.round(a + (b - a) * t); };
  return "rgb(" + f(c.r, target[0]) + "," + f(c.g, target[1]) + "," + f(c.b, target[2]) + ")";
}
function getCartoonOutline(colorHex, kind) {
  if (kind === "bomb") return "#161928";
  if (kind === "gift") return "#2e0854";
  if (kind === "freeze") return "#043c4a";
  var c = hexToRgb(colorHex);
  var r = Math.max(10, Math.round(c.r * 0.32));
  var g = Math.max(10, Math.round(c.g * 0.32));
  var b = Math.max(10, Math.round(c.b * 0.32));
  return "rgb(" + r + "," + g + "," + b + ")";
}

function getSprite(key, color, kind, radius) {
  var id = key + "|" + kind + "|" + radius;
  if (SPRITES[id]) return SPRITES[id];
  var SS = 2;
  var S = Math.ceil(radius * 2 * 1.5 + 14);
  var W = Math.ceil(S * SS);
  var cv = document.createElement("canvas"); cv.width = W; cv.height = W;
  var g = cv.getContext("2d"); g.scale(SS, SS);
  var cx = S / 2, cy = S * 0.46, r = radius;

  // 1) Smooth cartoon balloon silhouette
  function body() {
    g.beginPath();
    g.moveTo(cx - r * 0.14, cy + r * 1.05);
    g.bezierCurveTo(cx - r * 0.96, cy + r * 0.82, cx - r * 1.08, cy - r * 0.25, cx - r * 0.98, cy - r * 0.42);
    g.bezierCurveTo(cx - r * 0.86, cy - r * 1.08, cx - r * 0.36, cy - r * 1.24, cx, cy - r * 1.24);
    g.bezierCurveTo(cx + r * 0.36, cy - r * 1.24, cx + r * 0.86, cy - r * 1.08, cx + r * 0.98, cy - r * 0.42);
    g.bezierCurveTo(cx + r * 1.08, cy - r * 0.25, cx + r * 0.96, cy + r * 0.82, cx + r * 0.14, cy + r * 1.05);
    g.closePath();
  }

  var outline = getCartoonOutline(color, kind);

  // 2) Bright vibrant cartoon base fill
  body();
  if (kind === "bomb") {
    var bg = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r * 1.2);
    bg.addColorStop(0, "#3d4257"); bg.addColorStop(0.6, "#222533"); bg.addColorStop(1, "#11131c");
    g.fillStyle = bg;
  } else if (kind === "gift") {
    var gg = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r * 1.2);
    gg.addColorStop(0, "#a855f7"); gg.addColorStop(0.7, "#7e22ce"); gg.addColorStop(1, "#4c1d95");
    g.fillStyle = gg;
  } else if (kind === "freeze") {
    var fg = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r * 1.2);
    fg.addColorStop(0, "#67e8f9"); fg.addColorStop(0.7, "#06b6d4"); fg.addColorStop(1, "#0e7490");
    g.fillStyle = fg;
  } else {
    var cg = g.createLinearGradient(0, cy - r * 1.24, 0, cy + r * 1.05);
    cg.addColorStop(0, mixc(color, [255, 255, 255], 0.22));
    cg.addColorStop(0.5, color);
    cg.addColorStop(1, mixc(color, [10, 10, 20], 0.25));
    g.fillStyle = cg;
  }
  g.fill();

  // 3) ARTWORK DIRECTLY FROM REFERENCE IMAGE:
  if (key === "RED") {
    // RED BALLOON (Top-Left of Reference Image!): CUTE WINK FACE 😉
    var ex = r * 0.30, ey = -r * 0.04;
    // Left eye: Big open cartoon eye with dual catchlights
    g.fillStyle = "#ffffff";
    g.beginPath(); g.ellipse(cx - ex, cy + ey, r * 0.26, r * 0.34, -0.06, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1e1e2f";
    g.beginPath(); g.arc(cx - ex + r * 0.04, cy + ey, r * 0.16, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath(); g.arc(cx - ex + r * 0.02, cy + ey - r * 0.06, r * 0.065, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx - ex + r * 0.08, cy + ey + r * 0.04, r * 0.03, 0, Math.PI * 2); g.fill();

    // Right eye: Cute bold winking arc!
    g.strokeStyle = "#1e1e2f";
    g.lineWidth = Math.max(3.2, r * 0.12);
    g.lineCap = "round";
    g.beginPath();
    g.arc(cx + ex, cy + ey + r * 0.04, r * 0.20, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();

    // Cute curved smile
    g.strokeStyle = "#1e1e2f";
    g.lineWidth = Math.max(2.6, r * 0.09);
    g.beginPath();
    g.arc(cx, cy + r * 0.20, r * 0.22, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();

    // Rosy pink blush cheeks
    g.fillStyle = "rgba(255, 70, 110, 0.55)";
    g.beginPath(); g.ellipse(cx - ex - r * 0.04, cy + r * 0.26, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + ex + r * 0.04, cy + r * 0.26, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); g.fill();
  }
  else if (key === "PINK") {
    // PINK BALLOON (Held by Giraffe in Reference Image!): HUGE ADORABLE CARTOON EYES!
    var ex2 = r * 0.30, ey2 = -r * 0.04;
    var er_w = r * 0.26, er_h = r * 0.34;
    [-ex2, ex2].forEach(function(pos) {
      g.fillStyle = "#ffffff";
      g.beginPath(); g.ellipse(cx + pos, cy + ey2, er_w, er_h, pos > 0 ? 0.06 : -0.06, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#1e1e2f";
      g.beginPath(); g.arc(cx + pos + (pos > 0 ? -r * 0.03 : r * 0.03), cy + ey2, r * 0.16, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffffff";
      g.beginPath(); g.arc(cx + pos + (pos > 0 ? -r * 0.05 : r * 0.01), cy + ey2 - r * 0.06, r * 0.065, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx + pos + (pos > 0 ? -r * 0.01 : r * 0.05), cy + ey2 + r * 0.04, r * 0.032, 0, Math.PI * 2); g.fill();
    });
    // Cute curved smile
    g.strokeStyle = "#1e1e2f"; g.lineWidth = Math.max(2.6, r * 0.09); g.lineCap = "round";
    g.beginPath(); g.arc(cx, cy + r * 0.20, r * 0.22, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    // Rosy pink blush cheeks
    g.fillStyle = "rgba(255, 40, 90, 0.45)";
    g.beginPath(); g.ellipse(cx - ex2 - r * 0.04, cy + r * 0.26, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + ex2 + r * 0.04, cy + r * 0.26, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); g.fill();
  }
  else if (key === "GREEN") {
    // GREEN BALLOON (Top-Center of Reference Image!): CARTOON LETTER "A"
    g.font = "900 " + Math.floor(r * 1.1) + "px Arial Rounded MT Bold, 'Comic Sans MS', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineJoin = "round";
    g.strokeStyle = "#2b0d52"; g.lineWidth = Math.max(4, r * 0.18);
    g.strokeText("A", cx, cy + r * 0.04);
    g.fillStyle = "#a855f7";
    g.fillText("A", cx, cy + r * 0.04);
  }
  else if (key === "BLUE") {
    // BLUE BALLOON (Bottom-Left of Reference Image!): CARTOON PINK HEART ❤️
    var hw = r * 0.44, hy = cy + r * 0.06;
    g.save();
    g.beginPath();
    g.moveTo(cx, hy + hw * 0.85);
    g.bezierCurveTo(cx - hw * 1.35, hy + hw * 0.15, cx - hw * 1.15, hy - hw * 0.95, cx, hy - hw * 0.45);
    g.bezierCurveTo(cx + hw * 1.15, hy - hw * 0.95, cx + hw * 1.35, hy + hw * 0.15, cx, hy + hw * 0.85);
    g.closePath();
    g.strokeStyle = "#082c44"; g.lineWidth = Math.max(3.5, r * 0.14); g.lineJoin = "round";
    g.stroke();
    g.fillStyle = "#ff9ec4";
    g.fill();
    g.restore();
  }
  else if (kind === "gold") {
    // GOLD BALLOON (Top-Right of Reference Image!): CARTOON NUMBER "2"
    g.font = "900 " + Math.floor(r * 1.1) + "px Arial Rounded MT Bold, 'Comic Sans MS', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineJoin = "round";
    g.strokeStyle = "#52082b"; g.lineWidth = Math.max(4, r * 0.18);
    g.strokeText("2", cx, cy + r * 0.04);
    g.fillStyle = "#ff4785";
    g.fillText("2", cx, cy + r * 0.04);
  }
  else if (kind === "bomb") {
    // CARTOON BOMB: Bold Red Danger Badge "!"
    g.fillStyle = "#ff3344";
    g.beginPath(); g.arc(cx, cy + r * 0.08, r * 0.38, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff";
    g.font = "900 " + Math.floor(r * 0.50) + "px Arial Rounded MT Bold, sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("!", cx, cy + r * 0.10);
  }
  else if (kind === "freeze") {
    // FREEZE BALLOON: Bold Cartoon Snowflake
    g.strokeStyle = "rgba(255, 255, 255, 0.95)";
    g.lineWidth = Math.max(2.5, r * 0.09); g.lineCap = "round";
    var R1 = r * 0.52;
    g.beginPath();
    for (var s1 = 0; s1 < 3; s1++) {
      var ang = s1 * Math.PI / 3 + Math.PI / 6;
      var dx1 = Math.cos(ang) * R1, dy1 = Math.sin(ang) * R1;
      g.moveTo(cx - dx1, cy - dy1); g.lineTo(cx + dx1, cy + dy1);
    }
    g.stroke();
  }
  else if (kind === "gift") {
    // GIFT BALLOON: Cartoon Gift Box
    var bw = r * 0.60, bh = r * 0.50, byy = cy + r * 0.06;
    g.fillStyle = "rgba(255, 255, 255, 0.95)";
    g.fillRect(cx - bw / 2, byy - bh / 2, bw, bh);
    g.fillStyle = "#f59e0b";
    g.fillRect(cx - r * 0.07, byy - bh / 2, r * 0.14, bh);
    g.fillRect(cx - bw / 2, byy - r * 0.07, bw, r * 0.14);
  }

  // 4) SIGNATURE BOLD WHITE CARTOON SHINE (Directly from Reference Image!)
  g.save();
  body();
  g.clip();
  // Thick white crescent hugging the top-left curve
  g.strokeStyle = "rgba(255, 255, 255, 0.92)";
  g.lineWidth = r * 0.22;
  g.lineCap = "round";
  g.beginPath();
  g.arc(cx - r * 0.15, cy - r * 0.12, r * 0.76, Math.PI * 0.84, Math.PI * 1.36);
  g.stroke();
  // Separate crisp white oval highlight dot near crown
  g.fillStyle = "rgba(255, 255, 255, 0.92)";
  g.beginPath();
  g.arc(cx - r * 0.18, cy - r * 0.88, r * 0.08, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // 5) THICK BOLD CARTOON OUTLINE (Reference Image Signature!)
  body();
  g.strokeStyle = outline;
  g.lineWidth = Math.max(3.2, r * 0.11);
  g.lineJoin = "round";
  g.stroke();

  // 6) CUTE FLARED CARTOON KNOT (Reference Image Signature!)
  var knotColor = kind === "bomb" ? "#1e2233" : mixc(color, [10, 10, 20], 0.28);
  g.beginPath();
  g.moveTo(cx - r * 0.14, cy + r * 1.05);
  g.lineTo(cx - r * 0.22, cy + r * 1.28);
  g.quadraticCurveTo(cx, cy + r * 1.34, cx + r * 0.22, cy + r * 1.28);
  g.lineTo(cx + r * 0.14, cy + r * 1.05);
  g.closePath();
  g.fillStyle = knotColor;
  g.fill();
  g.strokeStyle = outline;
  g.lineWidth = Math.max(2.4, r * 0.08);
  g.stroke();

  SPRITES[id] = { cv: cv, half: S / 2, ss: SS };
  return SPRITES[id];
}

function drawSprite(x, y, radius, scale, key, color, kind) {
  var sp = getSprite(key, color, kind, radius);
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  var k = 0.6 + 0.4 * scale;
  ctx.translate(x, y); ctx.scale(k, k);
  var S = sp.cv.width / sp.ss;
  ctx.drawImage(sp.cv, -S / 2, -S / 2 * 0.94, S, S);
  ctx.restore();
}

var dragStart = {};
var lastMovePop = 0;
var inputLockUntil = 0;
function lockInput() { inputLockUntil = Date.now() + 500; }
function isUiTouch(e) {
  try { return !!(e.target && e.target.closest && e.target.closest("button,#mobileHud,#bottomNav,.overlay-view")); }
  catch (err) { return false; }
}

class MobileBalloon {
  getPuzzleAnchor() {
    var stageW = Math.min(width, 420);
    var stageH = Math.min(height, 720);
    var left = (width - stageW) / 2;
    var top = (height - stageH) / 2;
    return { x: left + this.relX * stageW, y: top + this.relY * stageH };
  }
  constructor(y, isPuzzle, specKey, relX, relY, dir) {
    this.isPuzzle = !!isPuzzle;
    this.dir = dir || "RIGHT";
    if (this.isPuzzle) {
      this.spec = BB.Content.SPECS[specKey] || BB.Content.SPECS.RED;
      this.radius = this.spec.r;
      this.relX = relX;
      this.relY = relY;
      var anc = this.getPuzzleAnchor();
      this.anchorX = anc.x;
      this.anchorY = anc.y;
      this.x = this.anchorX;
      this.y = this.anchorY;
      this.drawX = this.x;
      this.speed = 0;
      this.wobble = Math.random() * Math.PI * 2;
      this.popped = false;
      this.spawnScale = 0;
    } else {
      this.reset(y === undefined ? null : y);
      this.spawnScale = 0;
    }
  }
  reset(y) {
    if (this.isPuzzle) return;
    var SPECS = BB.Content.SPECS, r = Math.random(), c = 0, sel = SPECS.RED;
    for (var k in SPECS) { c += SPECS[k].prob; if (r <= c) { sel = SPECS[k]; break; } }
    this.spec = sel; this.radius = sel.r;
    this.x = this.radius + 25 + Math.random() * Math.max(10, width - (this.radius + 25) * 2);
    this.drawX = this.x;
    this.y = (y !== null && y !== undefined) ? y : (height + this.radius + 20 + Math.random() * 80);
    var bonus = (gameMode === "INFINITE") ? (wave - 1) * 0.35 : 0;
    var curLvl = (gameMode === "LEVELS") ? BB.Content.LEVELS[currentLevelId - 1] : null;
    var spdMult = (curLvl && curLvl.speedMult) || 1.0;
    this.speed = (sel.speed + Math.random() * 0.6 + bonus) * spdMult;
    this.wobble = Math.random() * 100; this.popped = false; this.spawnScale = 0;

    // Progressive mechanics: Shields and Hazards in higher campaign levels!
    this.shield = 0;
    this.isHazard = false;
    if (curLvl && !sel.isBomb && !sel.isGift && !sel.isFreeze) {
      if (curLvl.hasShields && Math.random() < 0.22) {
        this.shield = 1;
      } else if (curLvl.hasHazards && Math.random() < 0.12) {
        this.isHazard = true;
      }
    }
  }
  update(dt, scale) {
    if (this.isPuzzle) {
      if (this.spawnScale < 1) this.spawnScale = Math.min(1, this.spawnScale + dt * 4.5);
      this.wobble += dt * 2.0;
      var anc = this.getPuzzleAnchor();
      this.anchorX = anc.x;
      this.anchorY = anc.y;
      this.drawX = this.anchorX + Math.sin(this.wobble) * 5;
      this.y = this.anchorY + Math.cos(this.wobble * 0.8) * 6;
      return;
    }
    if (this.spawnScale < 1) this.spawnScale = Math.min(1, this.spawnScale + dt * 4);
    var slowZoneY = height * 0.22;
    var inSlow = (slowMoTimer > 0 && this.y > slowZoneY && this.y < height - this.radius);
    this.y -= this.speed * (inSlow ? 0.3 : scale) * 60 * dt;
    this.wobble += dt * 2.5;
    this.drawX = this.x + Math.sin(this.wobble) * 16;
    if (this.y < -this.radius * 2) {
      if (gameState === "PLAYING" && gameMode === "INFINITE" && !this.popped && !this.spec.isBomb && !this.spec.isGift && lifeGrace <= 0) { lifeGrace = 1.2; loseLife(); }
      this.reset(null);
    }
  }
  draw() {
    var x = this.drawX, y = this.y;
    var skin = BB.Economy.skinColors();
    var base = (skin && skin[this.spec.key]) || this.spec.color;
    ctx.save();
    var k = 0.6 + 0.4 * this.spawnScale;
    var r = this.radius * k;

    // String: live pendulum curve swaying naturally with wobble (like Image 1)
    var sw = Math.sin(this.wobble) * this.radius * 0.22;
    ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y + r * 1.15);
    ctx.bezierCurveTo(x + sw * 0.4, y + r * 1.5, x - sw * 0.5, y + r * 1.8, x + sw, y + r * 2.15);
    ctx.stroke();

    // Draw full cartoon balloon sprite (100% matched to Image 1!)
    drawSprite(x, y, this.radius, this.spawnScale, this.spec.key, base,
      this.spec.isBomb ? "bomb" : this.spec.isGift ? "gift" : this.spec.isGold ? "gold" : this.spec.isFreeze ? "freeze" : "normal");

    // If Hazard (Spike Balloon): Draw spiky outline and hazard glow
    if (this.isHazard) {
      ctx.save();
      ctx.strokeStyle = "#ff2a5f";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#ff2a5f";
      ctx.shadowBlur = 10;
      var spikes = 8;
      for (var si = 0; si < spikes; si++) {
        var sa = (si / spikes) * Math.PI * 2;
        var sx1 = x + Math.cos(sa) * (r * 0.95);
        var sy1 = y + Math.sin(sa) * (r * 0.95);
        var sx2 = x + Math.cos(sa) * (r * 1.35);
        var sy2 = y + Math.sin(sa) * (r * 1.35);
        ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
      }
      ctx.restore();
    }

    // If Shielded: Draw rotating glowing cyan energy bubble
    if (this.shield > 0) {
      ctx.save();
      ctx.strokeStyle = "#00f5d4";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#00f5d4";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      var arcRot = this.wobble * 2;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.28, arcRot, arcRot + Math.PI * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 1.28, arcRot + Math.PI, arcRot + Math.PI * 1.4);
      ctx.stroke();
      ctx.restore();
    }

    // Draw directional arrow strictly in Tactical Puzzle Mode!
    if (this.isPuzzle && !this.isSling && this.dir) {
      this.drawArrow(x, y, r);
    }

    // Clean bomb wick + glowing spark at top
    if (this.spec.isBomb) {
      ctx.fillStyle = "#d35400";
      ctx.fillRect(x - r * 0.12, y - r * 1.18, r * 0.24, r * 0.08);
      ctx.strokeStyle = "#dcdde1"; ctx.lineWidth = Math.max(1.5, r * 0.08); ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.18);
      ctx.quadraticCurveTo(x + r * 0.16, y - r * 1.34, x + r * 0.26, y - r * 1.28);
      ctx.stroke();
      var sx = x + r * 0.26, sy = y - r * 1.28;
      ctx.fillStyle = "#ff7675";
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, r * 0.10), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffeaa7";
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(1, r * 0.05), 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }
  drawArrow(x, y, r) {
    var d = this.dir;
    if (!d || d === "ALL" || this.spec.isBomb) return;
    ctx.save();
    ctx.translate(x, y - r * 0.05);

    if (d === "HORIZ") {
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(10, 14, 34, 0.95)";
      ctx.lineWidth = Math.max(3.5, r * 0.11);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-r * 0.44, 0); ctx.lineTo(r * 0.44, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.52, 0); ctx.lineTo(r * 0.22, -r * 0.22); ctx.lineTo(r * 0.22, r * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.52, 0); ctx.lineTo(-r * 0.22, -r * 0.22); ctx.lineTo(-r * 0.22, r * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd000";
      ctx.beginPath(); ctx.moveTo(r * 0.45, 0); ctx.lineTo(r * 0.24, -r * 0.14); ctx.lineTo(r * 0.24, r * 0.14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.24, -r * 0.14); ctx.lineTo(-r * 0.24, r * 0.14); ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    }
    if (d === "VERT") {
      ctx.rotate(Math.PI / 2);
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(10, 14, 34, 0.95)";
      ctx.lineWidth = Math.max(3.5, r * 0.11);
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-r * 0.44, 0); ctx.lineTo(r * 0.44, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(r * 0.52, 0); ctx.lineTo(r * 0.22, -r * 0.22); ctx.lineTo(r * 0.22, r * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.52, 0); ctx.lineTo(-r * 0.22, -r * 0.22); ctx.lineTo(-r * 0.22, r * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd000";
      ctx.beginPath(); ctx.moveTo(r * 0.45, 0); ctx.lineTo(r * 0.24, -r * 0.14); ctx.lineTo(r * 0.24, r * 0.14); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.24, -r * 0.14); ctx.lineTo(-r * 0.24, r * 0.14); ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    }

    var angle = 0;
    if (d === "RIGHT") angle = 0;
    else if (d === "DOWN") angle = Math.PI / 2;
    else if (d === "LEFT") angle = Math.PI;
    else if (d === "UP") angle = -Math.PI / 2;

    ctx.rotate(angle);
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Outer 3D white badge
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(10, 14, 34, 0.95)";
    ctx.lineWidth = Math.max(3.6, r * 0.12);
    ctx.lineCap = "round"; ctx.lineJoin = "round";

    var aw = r * 0.54, hw = r * 0.34, sw = r * 0.15;
    ctx.beginPath();
    ctx.moveTo(-aw * 0.75, -sw);
    ctx.lineTo(aw * 0.05, -sw);
    ctx.lineTo(aw * 0.05, -hw);
    ctx.lineTo(aw * 0.90, 0);
    ctx.lineTo(aw * 0.05, hw);
    ctx.lineTo(aw * 0.05, sw);
    ctx.lineTo(-aw * 0.75, sw);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Vibrant golden-amber inner arrow core
    ctx.shadowColor = "transparent";
    var ag = ctx.createLinearGradient(-aw * 0.75, 0, aw * 0.90, 0);
    ag.addColorStop(0, "#ffe066");
    ag.addColorStop(1, "#ff9800");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.moveTo(-aw * 0.65, -sw * 0.6);
    ctx.lineTo(aw * 0.02, -sw * 0.6);
    ctx.lineTo(aw * 0.02, -hw * 0.6);
    ctx.lineTo(aw * 0.72, 0);
    ctx.lineTo(aw * 0.02, hw * 0.6);
    ctx.lineTo(aw * 0.02, sw * 0.6);
    ctx.lineTo(-aw * 0.65, sw * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
  containsPoint(px, py) {
    var hr = this.radius * 1.4 + 15, dx = px - this.drawX, dy = py - this.y;
    return (dx * dx + dy * dy) <= (hr * hr);
  }
}

class BossBalloon {
  constructor(hp) {
    this.radius = 54;
    this.x = width / 2;
    this.y = height * 0.38;
    this.vx = 75;
    this.vy = 40;
    this.hp = hp;
    this.maxHp = hp;
    this.wobble = 0;
    this.popped = false;
  }
  update(dt) {
    this.wobble += dt * 3;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    var pad = this.radius + 20;
    if (this.x < pad) { this.x = pad; this.vx = Math.abs(this.vx); }
    if (this.x > width - pad) { this.x = width - pad; this.vx = -Math.abs(this.vx); }
    if (this.y < height * 0.16 + pad) { this.y = height * 0.16 + pad; this.vy = Math.abs(this.vy); }
    if (this.y > height * 0.65) { this.y = height * 0.65; this.vy = -Math.abs(this.vy); }
  }
  draw() {
    var x = this.x, y = this.y + Math.sin(this.wobble) * 8;
    var r = this.radius;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 16;

    // Boss Royal Purple & Crimson gradient
    var bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.2);
    bg.addColorStop(0, "#ff4d6d");
    bg.addColorStop(0.5, "#9333ea");
    bg.addColorStop(1, "#3b0764");
    ctx.fillStyle = bg;
    ctx.strokeStyle = "#ffd000";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3D Crescent Shine
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.24, r * 0.12, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Menacing cartoon boss eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x - r * 0.28, y - r * 0.08, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.28, y - r * 0.08, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e1b4b";
    ctx.beginPath(); ctx.arc(x - r * 0.24, y - r * 0.08, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.32, y - r * 0.08, r * 0.09, 0, Math.PI * 2); ctx.fill();

    // Boss Crown 👑
    ctx.font = "34px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👑", x, y - r * 1.05);

    // Floating Boss Health Bar
    var barW = 110, barH = 10;
    var pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - barW / 2 - 2, y + r * 1.15 - 2, barW + 4, barH + 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x - barW / 2, y + r * 1.15, barW, barH);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(x - barW / 2, y + r * 1.15, barW * pct, barH);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - barW / 2, y + r * 1.15, barW, barH);

    ctx.font = "900 10px -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.hp + " / " + this.maxHp + " HP", x, y + r * 1.15 + barH / 2 + 1);

    ctx.restore();
  }
  containsPoint(px, py) {
    var dx = px - this.x, dy = py - this.y;
    return (dx * dx + dy * dy) <= ((this.radius + 15) * (this.radius + 15));
  }
}

class MobileParticle {
  constructor(x, y, color, heavy) {
    this.x = x; this.y = y; this.color = color;
    var a = Math.random() * Math.PI * 2;
    var s = (heavy ? 4 : 2.6) + Math.random() * (heavy ? 7 : 4.5);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
    this.shard = Math.random() < 0.38;
    this.size = this.shard ? (3 + Math.random() * 3) : (1.8 + Math.random() * 2.4);
    this.rot = Math.random() * Math.PI; this.vr = (Math.random() - 0.5) * 0.25;
    this.life = 1; this.decay = 0.024 + Math.random() * 0.026;
  }
  update(dt) {
    this.x += this.vx * 60 * dt; this.y += this.vy * 60 * dt;
    this.vy += 0.18 * 60 * dt; this.vx *= (1 - Math.min(1, 0.9 * dt));
    this.life -= this.decay * 60 * dt; this.rot += this.vr;
  }
  draw() {
    var a = this.life;
    a = a * a * (3 - 2 * a); // smoothstep — fades in control, no flicker
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    if (this.shard) {
      ctx.translate(this.x, this.y); ctx.rotate(this.rot);
      ctx.fillStyle = this.color;
      var s = this.size;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.35); else ctx.rect(-s / 2, -s / 2, s, s);
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
class MobileTextPopup {
  constructor(t, x, y, c, big) {
    this.text = t; this.x = x; this.y = y;
    this.color = c || "#ffd700"; this.isBig = !!big; this.life = 1;
  }
  update(dt) { this.y -= 40 * dt; this.life -= 1.3 * dt; }
  draw() {
    var a = this.life;
    a = Math.min(1, a * 1.6); // hold full, fade at end
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    ctx.font = this.isBig ? "900 24px -apple-system,sans-serif" : "bold 18px -apple-system,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(4,6,14,.85)"; ctx.lineWidth = 4;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
class MobileShockwave {
  constructor(x, y, m, color) { this.x = x; this.y = y; this.r = 8; this.maxR = m; this.life = 1; this.color = color || "#ff5e3a"; }
  update(dt) { this.r += (this.maxR - this.r) * 14 * dt; this.life -= 2.4 * dt; }
  draw() {
    var a = this.life * this.life; // ease-out fade
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.strokeStyle = this.color; ctx.lineWidth = 3 * this.life; ctx.stroke();
    ctx.restore();
  }
}
class MobileNeedleRay {
  constructor(x1, y1, x2, y2, color) {
    this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
    this.color = color || "#ffffff";
    this.life = 1;
  }
  update(dt) { this.life -= 3.8 * dt; }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    var a = Math.max(0, this.life);
    ctx.globalAlpha = a;

    // Glowing wider beam outer
    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(5 * a, 2);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();

    // Piercing white core beam
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2.2 * a, 1);
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();

    // High energy spark star at tip
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x2, this.y2, 5.5 * a, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class SlingshotProjectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 13;
    this.life = 4.2;
    this.trail = [];
    this.pierceCount = 0;
  }
  update(dt) {
    this.life -= dt;
    this.vy += 340 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = -this.vx * 0.78;
      triggerShake(4, 0.1);
      sound().wallBounce();
      burst(this.x, this.y, "#ffd000", 8);
    } else if (this.x > width - this.radius) {
      this.x = width - this.radius;
      this.vx = -this.vx * 0.78;
      triggerShake(4, 0.1);
      sound().wallBounce();
      burst(this.x, this.y, "#ffd000", 8);
    }

    this.trail.push({ x: this.x, y: this.y, a: 1 });
    if (this.trail.length > 14) this.trail.shift();
    for (var i = 0; i < this.trail.length; i++) this.trail[i].a -= dt * 2.5;

    for (var b = balloons.length - 1; b >= 0; b--) {
      var bl = balloons[b];
      if (!bl.popped && bl.containsPoint(this.x, this.y)) {
        this.pierceCount++;
        popBalloon(bl);
        triggerShake(5, 0.12);

        this.vx *= 0.90;
        this.vy *= 0.90;

        var bonusPts = this.pierceCount * 100;
        score += bonusPts;
        if (this.pierceCount === 1) {
          textPopups.push(new MobileTextPopup("HIT! 🏹", this.x, this.y - 20, "#ffd000"));
        } else if (this.pierceCount === 2) {
          textPopups.push(new MobileTextPopup("DOUBLE PIERCE! 🏹 x2", this.x, this.y - 20, "#00f5d4"));
        } else if (this.pierceCount >= 3) {
          textPopups.push(new MobileTextPopup("TRICK SHOT! 🎯 +" + bonusPts, this.x, this.y - 20, "#ffbe0b", true));
          sound().victory();
        }
        updateHud();
        var rem = balloons.filter(function (o) { return !o.popped; }).length;
        slingshotActiveBalloons = rem;
        if (rem === 0) {
          setTimeout(winSlingshotStage, 380);
        }
      }
    }
  }
  draw() {
    ctx.save();
    for (var i = 1; i < this.trail.length; i++) {
      var p1 = this.trail[i - 1], p2 = this.trail[i];
      ctx.strokeStyle = "rgba(255, 190, 11, " + Math.max(0, p2.a * 0.8) + ")";
      ctx.lineWidth = 4.5 * p2.a;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    var angle = Math.atan2(this.vy, this.vx);
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();

    ctx.fillStyle = "#ffbe0b";
    ctx.strokeStyle = "#1a1000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(8, -8);
    ctx.lineTo(12, 0);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ff2a5f";
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(-22, -6);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-22, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function getSlingshotVectors() {
  var slingX = width / 2;
  var slingY = height - 90;
  var anchorY = slingY - 22;
  var MAX_PULL = 82;

  if (!slingshotState.dragging) {
    return {
      slingX: slingX,
      slingY: slingY,
      anchorY: anchorY,
      pouchX: slingX,
      pouchY: anchorY,
      dist: 0,
      vx: 0,
      vy: 0,
      active: false
    };
  }

  var rawDx = slingshotState.curX - slingX;
  var rawDy = slingshotState.curY - anchorY;

  if (rawDy < 5) rawDy = 5;

  var rawDist = Math.hypot(rawDx, rawDy);
  var clampedDist = Math.min(MAX_PULL, rawDist);
  var pullRatio = rawDist > 0 ? clampedDist / rawDist : 0;

  var pullDx = rawDx * pullRatio;
  var pullDy = rawDy * pullRatio;

  var pouchX = slingX + pullDx;
  var pouchY = anchorY + pullDy;

  var shootDx = -pullDx;
  var shootDy = -pullDy;
  var shootDist = Math.hypot(shootDx, shootDy);

  var powerRatio = clampedDist / MAX_PULL;
  var speed = 360 + powerRatio * 840;

  var vx = shootDist > 0 ? (shootDx / shootDist) * speed : 0;
  var vy = shootDist > 0 ? (shootDy / shootDist) * speed : -speed;

  return {
    slingX: slingX,
    slingY: slingY,
    anchorY: anchorY,
    pouchX: pouchX,
    pouchY: pouchY,
    dist: clampedDist,
    vx: vx,
    vy: vy,
    active: clampedDist > 16
  };
}

function drawSlingshot() {
  if (gameMode !== "SLING") return;
  var s = getSlingshotVectors();
  var slingX = s.slingX;
  var slingY = s.slingY;
  var leftForkX = slingX - 30, leftForkY = slingY - 38;
  var rightForkX = slingX + 30, rightForkY = slingY - 38;

  ctx.save();

  if (s.active && slingshotArrowsLeft > 0) {
    var simX = slingX, simY = s.anchorY - 15;
    var simVx = s.vx, simVy = s.vy;
    var simDt = 0.032;

    for (var i = 0; i < 20; i++) {
      simVy += 340 * simDt;
      simX += simVx * simDt;
      simY += simVy * simDt;
      if (simX < 14) { simX = 14; simVx = -simVx * 0.78; }
      if (simX > width - 14) { simX = width - 14; simVx = -simVx * 0.78; }

      var dotAlpha = Math.max(0.12, 1 - (i / 20));
      ctx.fillStyle = "rgba(255, 190, 11, " + dotAlpha + ")";
      ctx.shadowColor = "#ffbe0b";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(simX, simY, 4.5 * dotAlpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  var pouchX = s.pouchX;
  var pouchY = s.pouchY;

  var stretchRatio = s.dist / 82;
  var bandWidth = Math.max(2.8, 5 - stretchRatio * 2);

  ctx.strokeStyle = "#4e2710";
  ctx.lineWidth = bandWidth;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(leftForkX, leftForkY);
  ctx.lineTo(pouchX, pouchY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rightForkX, rightForkY);
  ctx.lineTo(pouchX, pouchY);
  ctx.stroke();

  ctx.fillStyle = "#8d4f2b";
  ctx.strokeStyle = "#3e1c0c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pouchX, pouchY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (slingshotArrowsLeft > 0) {
    ctx.save();
    var arrowAngle = s.active
      ? Math.atan2(s.vy, s.vx)
      : -Math.PI / 2;
    ctx.translate(pouchX, pouchY);
    ctx.rotate(arrowAngle);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(28, 0);
    ctx.stroke();

    ctx.fillStyle = "#ffbe0b";
    ctx.strokeStyle = "#1a1000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(20, -7);
    ctx.lineTo(23, 0);
    ctx.lineTo(20, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ff2a5f";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-18, -5);
    ctx.lineTo(-15, 0);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.strokeStyle = "#7c3818";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(leftForkX, leftForkY);
  ctx.lineTo(slingX, slingY);
  ctx.lineTo(rightForkX, rightForkY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(slingX, slingY);
  ctx.lineTo(slingX, slingY + 54);
  ctx.stroke();

  ctx.strokeStyle = "#ffbe0b";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(slingX, slingY + 24, 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function sfxPowerup() {
  var s = sound(); if (!s.ctx || s.muted || !s.settings().sound) return;
  try {
    var now = s.ctx.currentTime;
    [330, 440, 660, 880].forEach(function (freq, idx) {
      var o = s.ctx.createOscillator(), g = s.ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(freq, now + idx * 0.06);
      g.gain.setValueAtTime(0.2, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
      o.connect(g); g.connect(s.ctx.destination);
      o.start(now + idx * 0.06); o.stop(now + idx * 0.06 + 0.18);
    });
  } catch (e) {}
}
class PowerupDrop {
  constructor(x, y, forceId) {
    this.x = x; this.y = y; this.vy = 0.6; this.life = 8; this.radius = 22;
    var pool = (gameMode === "INFINITE") ? ["gatling", "shotgun", "laser", "life"] : ["gatling", "shotgun", "laser", "time"];
    var id = forceId || pool[Math.floor(Math.random() * pool.length)];
    this.type = BB.Content.POWERUPS.filter(function (p) { return p.id === id; })[0];
  }
  update(dt) { this.vy += 2.2 * dt; this.y += this.vy * 60 * dt; this.life -= dt; }
  draw() {
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(18,24,52,.92)";
    ctx.shadowColor = this.type.color; ctx.shadowBlur = 16; ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = this.type.color; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(this.type.icon, 0, 1); ctx.restore();
  }
  containsPoint(px, py) { return Math.hypot(px - this.x, py - this.y) <= this.radius + 16; }
}
class LaserBeam {
  constructor(x) { this.x = x; this.life = 0.25; }
  update(dt) { this.life -= dt; }
  draw() {
    ctx.save(); ctx.globalAlpha = Math.max(0, this.life / 0.25);
    ctx.strokeStyle = "#00f5d4"; ctx.lineWidth = 14;
    ctx.shadowColor = "#00f5d4"; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.moveTo(this.x, height); ctx.lineTo(this.x, 0); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  }
}
function grantAbility(b) {
  var pool = (gameMode === "INFINITE") ? ["gatling", "shotgun", "laser", "life"] : ["gatling", "shotgun", "laser", "time"];
  var id = pool[Math.floor(Math.random() * pool.length)];
  var bx = b.drawX, by = b.y;
  sound().pop(combo);
  burst(bx, by, "#c26bff", 16); burst(bx, by, "#ffd700", 8); spawnRipple(bx, by, "gold"); addFever(6); earnCoins(3);
  powerupDrops.push(new PowerupDrop(bx, by, id));
  textPopups.push(new MobileTextPopup("CATCH IT! 🎁", bx, by - 24, "#ffd23f", true));
  combo++;
  if (combo > maxCombo) maxCombo = combo;
  if (combo > BB.Save.data.maxCombo) BB.Save.data.maxCombo = combo;
  comboTimer = 2.4; updateHud();
}
function collectDrop(d) {
  if (d.type.id === "time") {
    timeLeft += 10; sfxPowerup();
    textPopups.push(new MobileTextPopup("+10s ⏱️", d.x, d.y - 20, "#33ff77", true));
  } else if (d.type.id === "life") {
    lives = Math.min(3, lives + 1); sfxPowerup();
    textPopups.push(new MobileTextPopup("+1 LIFE ❤️", d.x, d.y - 20, "#ff5e7a", true));
  } else activateWeapon(d.type.id, d.x, d.y);
  updateHud();
}
function activateWeapon(id, x, y) {
  var p = BB.Content.POWERUPS.filter(function (q) { return q.id === id; })[0];
  if (!p) return;
  currentWeapon = id; weaponTimer = 10; weaponShownSec = -1;
  sfxPowerup();
  textPopups.push(new MobileTextPopup(p.name.toUpperCase() + "! " + p.icon, x, y - 24, p.color, true));
  updateWeaponBadge();
}
function resetWeapon() { currentWeapon = "pistol"; weaponTimer = 0; weaponShownSec = -1; updateWeaponBadge(); }
function weaponHint() {
  if (gameMode === "BLITZ") return isFever ? ("🔥 FEVER x2 — " + Math.ceil(feverTimer) + "s") : "👆 Tap or Drag to Pop!";
  if (gameMode === "INFINITE") return "🌊 Wave " + wave + " • Speed rising";
  return "🎯 Clear the objective!";
}
function updateWeaponBadge() {
  var w = document.getElementById("mWName"), ic = document.getElementById("mWIcon");
  if (!w || !ic) return;
  if (currentWeapon !== "pistol" && weaponTimer > 0) {
    var p = BB.Content.POWERUPS.filter(function (q) { return q.id === currentWeapon; })[0];
    ic.textContent = p.icon; w.textContent = p.name + " (" + Math.ceil(weaponTimer) + "s)";
  } else { ic.textContent = "👆"; w.textContent = weaponHint(); }
}
function burst(x, y, color, n, heavy) {
  if (!effectsOn()) n = Math.min(n, 8);
  for (var i = 0; i < n; i++) {
    if (particles.length > 320) particles.shift();
    particles.push(new MobileParticle(x, y, color, heavy));
  }
}
function triggerShake(i, du) {
  if (!effectsOn()) return;
  shakeIntensity = Math.max(shakeIntensity, i); shakeDuration = Math.max(shakeDuration, du);
}
function spawnRipple(x, y, cls) { if (BB.UI) BB.UI.ripple(x, y, cls); }
function initBalloons() {
  balloons.length = 0;
  var c = Math.min(22, Math.max(14, Math.floor(width / 50)));
  for (var i = 0; i < c; i++) balloons.push(new MobileBalloon(Math.random() * (height + 100)));
}
function resetRun() {
  score = 0; combo = 1; maxCombo = 1; comboTimer = 0; balloonsPopped = 0;
  feverCharge = 0; isFever = false; feverTimer = 0; slowMoTimer = 0;
  feversThisRun = 0; runCoins = 0; lifeGrace = 0;
  bossBalloon = null; bossHp = 0; maxBossHp = 0;
  currentWeapon = "pistol"; weaponTimer = 0; weaponShownSec = -1;
  powerupDrops.length = 0; lasers.length = 0; shakeDuration = 0; needleRays.length = 0;
  document.body.classList.remove("fever-active");
  document.getElementById("mFeverBar").style.width = "0%";
  document.getElementById("mFeverPct").innerText = "0%";
}
function startBlitz() {
  sound().init(); BB.Music.playMode("BLITZ");
  BB.Ads.notifyRunStart(); lockInput();
  gameMode = "BLITZ"; gameState = "PLAYING"; resetRun(); timeLeft = 60;
  BB.Save.data.gamesPlayed = (BB.Save.data.gamesPlayed || 0) + 1; BB.Save.save();
  initBalloons(); updateHud(); BB.UI.show(null);
  BB.UI.announce("⚡ BLITZ!", "60 seconds — go!", "#ffd23f");
}
function initSlingshotStage(id) {
  balloons.length = 0;
  slingshotDarts.length = 0;
  var stg = (BB.Content.SLING_STAGES && BB.Content.SLING_STAGES[id - 1]) || BB.Content.SLING_STAGES[0];
  slingshotArrowsLeft = stg.arrows;
  stg.balloons.forEach(function (b) {
    var nb = new MobileBalloon(null, true, b.key, b.x, b.y);
    nb.isSling = true;
    balloons.push(nb);
  });
  slingshotTotalBalloons = balloons.length;
  slingshotActiveBalloons = balloons.length;
}
function startSlingshot(stageId) {
  sound().init();
  try { BB.Music.play("blitz"); } catch (e) {}
  BB.Ads.notifyRunStart(); lockInput();
  currentSlingshotStage = stageId || 1;
  gameMode = "SLING"; gameState = "PLAYING"; resetRun();
  initSlingshotStage(currentSlingshotStage);
  slingshotState.dragging = false;
  BB.Save.data.gamesPlayed = (BB.Save.data.gamesPlayed || 0) + 1; BB.Save.save();
  updateHud(); BB.UI.show(null);
  var stg = BB.Content.SLING_STAGES[currentSlingshotStage - 1];
  BB.UI.announce("🏹 STAGE " + currentSlingshotStage + ": " + stg.name.toUpperCase(), stg.desc, "#f97316");
}
function startInfinite() {
  sound().init(); BB.Music.playMode("survival");
  BB.Ads.notifyRunStart(); lockInput();
  gameMode = "INFINITE"; gameState = "PLAYING"; resetRun(); lives = 3; wave = 1;
  BB.Save.data.gamesPlayed = (BB.Save.data.gamesPlayed || 0) + 1; BB.Save.save();
  initBalloons(); updateHud(); BB.UI.show(null);
  BB.UI.announce("♾️ SURVIVE!", "Protect 3 lives", "#a29bfe");
}
function startLevel(id) {
  sound().init(); BB.Music.playMode("LEVELS");
  BB.Ads.notifyRunStart(); lockInput(); currentLevelId = id;
  var l = BB.Content.LEVELS[id - 1] || BB.Content.LEVELS[0];
  gameMode = "LEVELS"; gameState = "PLAYING"; resetRun();
  timeLeft = l.time; levelProgressCount = 0;
  if (l.isBoss) {
    bossHp = l.target;
    maxBossHp = l.target;
    bossBalloon = new BossBalloon(bossHp);
  }
  BB.Save.data.gamesPlayed = (BB.Save.data.gamesPlayed || 0) + 1; BB.Save.save();
  initBalloons(); updateHud(); BB.UI.show(null);
  BB.UI.announce(l.isBoss ? "👑 BOSS STAGE " + id : "STAGE " + id, l.desc.toUpperCase(), l.isBoss ? "#ffd000" : "#00f5d4");
}
function initPuzzle(id) {
  balloons.length = 0;
  needleRays.length = 0;
  var pz = (BB.Content.PUZZLES && BB.Content.PUZZLES[id - 1]) || BB.Content.PUZZLES[0];
  puzzleDarts = pz.darts;
  puzzleDartsLeft = pz.darts;
  pz.balloons.forEach(function (b) {
    balloons.push(new MobileBalloon(null, true, b.key, b.x, b.y, b.dir));
  });
  puzzleTotalBalloons = balloons.length;
  puzzleActiveBalloons = balloons.length;
}
function startPuzzle(id) {
  sound().init();
  try { BB.Music.play("campaign"); } catch (e) {}
  BB.Ads.notifyRunStart(); lockInput(); currentPuzzleId = id;
  gameMode = "PUZZLE"; gameState = "PLAYING"; resetRun();
  initPuzzle(id); updateHud(); BB.UI.show(null);
  var pz = BB.Content.PUZZLES[id - 1];
  BB.UI.announce("🧩 PUZZLE " + id + ": " + pz.name.toUpperCase(), pz.desc, "#00f5d4");
}
function loseLife() {
  if (gameState !== "PLAYING" || gameMode !== "INFINITE") return;
  lives = Math.max(0, lives - 1);
  sound().lifeLost(); triggerShake(10, 0.3); BB.UI.flash(0.18);
  textPopups.push(new MobileTextPopup("LIFE LOST! 💔", width / 2, height / 2, "#ff3366", true));
  BB.UI.announce("💔 LIFE LOST", lives > 0 ? lives + " left" : "", "#ff5e7a");
  updateHud(); if (lives <= 0) endGame();
}
function addFever(amt) {
  if (isFever) return;
  feverCharge = Math.min(100, feverCharge + amt);
  document.getElementById("mFeverBar").style.width = feverCharge + "%";
  document.getElementById("mFeverPct").innerText = Math.floor(feverCharge) + "%";
  if (feverCharge >= 100) {
    isFever = true; feverTimer = 7.0; feversThisRun++;
    BB.Save.data.fevers = (BB.Save.data.fevers || 0) + 1;
    document.body.classList.add("fever-active");
    sound().victory(); BB.UI.flash(0.4); triggerShake(8, 0.35);
    document.getElementById("mFeverLabel").innerText = "🔥 FEVER x2!";
    BB.UI.announce("🔥 FEVER MODE!", "2X SCORE — 7s", "#ffd700");
    textPopups.push(new MobileTextPopup("FEVER MODE!! 🔥", width / 2, height / 2, "#ffd700", true));
    BB.Rewards.track("fever", 1); BB.Save.save();
    if (gameMode === "LEVELS" && BB.Content.LEVELS[currentLevelId - 1].type === "fever") {
      levelProgressCount++; checkLevelWin();
    }
    var fresh = BB.Achievements.check();
    if (fresh.length) BB.UI.announce("🏆 " + fresh[0].name.toUpperCase(), "Achievement unlocked", "#ffd23f");
  }
}
function endFever() {
  isFever = false; feverCharge = 0;
  document.body.classList.remove("fever-active");
  document.getElementById("mFeverBar").style.width = "0%";
  document.getElementById("mFeverPct").innerText = "0%";
  document.getElementById("mFeverLabel").innerText = "🔥 FEVER";
}
function earnCoins(n) { runCoins += n; BB.Economy.addCoins(n); }
function findTargetInRay(sourceB, dx, dy) {
  var best = null, bestDist = Infinity;
  var corridor = sourceB.radius * 1.5;

  balloons.forEach(function (o) {
    if (o.popped || o === sourceB) return;
    var vx = o.drawX - sourceB.drawX;
    var vy = o.y - sourceB.y;
    var proj = vx * dx + vy * dy;
    if (proj <= 12) return;

    var perp = Math.abs(vx * (-dy) + vy * dx);
    if (perp <= corridor) {
      if (proj < bestDist) {
        bestDist = proj;
        best = o;
      }
    }
  });

  return { target: best, dist: bestDist };
}
function fireDirectionalRay(sourceB, dx, dy, rayColor, depth) {
  var res = findTargetInRay(sourceB, dx, dy);
  if (res.target) {
    var tb = res.target;
    needleRays.push(new MobileNeedleRay(sourceB.drawX, sourceB.y, tb.drawX, tb.y, rayColor));
    setTimeout(function () {
      if (!tb.popped && (gameState === "PLAYING" || gameState === "LEVEL_COMPLETE")) {
        popBalloon(tb, true, depth + 1);
      }
    }, 140);
  } else {
    var reach = Math.max(width, height) * 0.95;
    var endX = sourceB.drawX + dx * reach;
    var endY = sourceB.y + dy * reach;
    needleRays.push(new MobileNeedleRay(sourceB.drawX, sourceB.y, endX, endY, rayColor));
  }
}
function chainPop(sourceB, targetB, delay, rayColor, depth) {
  setTimeout(function () {
    if (targetB && !targetB.popped && (gameState === "PLAYING" || gameState === "LEVEL_COMPLETE")) {
      needleRays.push(new MobileNeedleRay(sourceB.drawX, sourceB.y, targetB.drawX, targetB.y, rayColor || "#ffffff"));
      popBalloon(targetB, true, (depth || 0) + 1);
    }
  }, delay);
}
function popBalloon(b, isChain, chainDepth) {
  if (b.popped) return;
  b.popped = true; balloonsPopped++;
  BB.Save.data.totalPops++;
  BB.Rewards.track("pop", 1);
  var bx = b.drawX, by = b.y;
  var depth = chainDepth || 1;
  addFever(b.spec.points ? b.spec.points * 0.16 : 7);

  if (gameMode === "PUZZLE") {
    var d = b.dir || "RIGHT";
    var rColor = (b.spec && b.spec.color) || "#ffffff";
    sound().pop(Math.min(10, depth));
    burst(bx, by, rColor, 14);
    spawnRipple(bx, by, "");
    earnCoins(1);
    textPopups.push(new MobileTextPopup(isChain ? "CHAIN x" + depth + "!" : "POP!", bx, by - 15, rColor));

    if (b.spec.isBomb || d === "ALL") {
      sound().bomb();
      BB.Save.data.bombsPopped = (BB.Save.data.bombsPopped || 0) + 1;
      triggerShake(12, 0.35); BB.UI.flash(0.2);
      shockwaves.push(new MobileShockwave(bx, by, 180, "#ff5e3a"));
      var allDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      allDirs.forEach(function (pair) {
        fireDirectionalRay(b, pair[0], pair[1], "#ff5e3a", depth);
      });
    } else if (d === "HORIZ") {
      fireDirectionalRay(b, -1, 0, rColor, depth);
      fireDirectionalRay(b, 1, 0, rColor, depth);
    } else if (d === "VERT") {
      fireDirectionalRay(b, 0, -1, rColor, depth);
      fireDirectionalRay(b, 0, 1, rColor, depth);
    } else if (d === "RIGHT") {
      fireDirectionalRay(b, 1, 0, rColor, depth);
    } else if (d === "LEFT") {
      fireDirectionalRay(b, -1, 0, rColor, depth);
    } else if (d === "UP") {
      fireDirectionalRay(b, 0, -1, rColor, depth);
    } else if (d === "DOWN") {
      fireDirectionalRay(b, 0, 1, rColor, depth);
    }

    var unp = balloons.filter(function (o) { return !o.popped; }).length;
    puzzleActiveBalloons = unp;
    updateHud();
    setTimeout(checkPuzzleStatus, 450);
    return;
  }
  if (b.spec.isBomb) {
    sound().bomb(); BB.Save.data.bombsPopped = (BB.Save.data.bombsPopped || 0) + 1;
    triggerShake(14, 0.4); BB.UI.flash(0.25);
    shockwaves.push(new MobileShockwave(bx, by, 220, "#ff5e3a"));
    burst(bx, by, "#ff5e3a", 18, true); burst(bx, by, "#ffd23f", 10, true); textPopups.push(new MobileTextPopup("BOOM! 💥", bx, by - 20, "#ff4444", true));
    spawnRipple(bx, by, "bomb"); earnCoins(2);
    balloons.forEach(function (o) {
      if (!o.popped && o !== b && Math.hypot(o.drawX - bx, o.y - by) < 180) {
        setTimeout(function () { popBalloon(o); }, 60);
      }
    });
    if (gameMode === "LEVELS" && BB.Content.LEVELS[currentLevelId - 1].type === "bomb") {
      levelProgressCount++; checkLevelWin();
    }
  } else if (b.spec.isFreeze) {
    sound().freeze(); slowMoTimer = 4.5;
    burst(bx, by, "#7df9ff", 14); burst(bx, by, "#ffffff", 6); shockwaves.push(new MobileShockwave(bx, by, 72, "#7df9ff")); textPopups.push(new MobileTextPopup("SLOW-MO! ❄️", bx, by - 20, "#7df9ff", true));
    spawnRipple(bx, by, "freeze"); earnCoins(2);
    if (gameMode === "LEVELS" && BB.Content.LEVELS[currentLevelId - 1].type === "freeze") {
      levelProgressCount++; checkLevelWin();
    }
  } else if (b.spec.isGift) { grantAbility(b);
  } else {
    sound().pop(combo);
    if (b.spec.isGold) {
      burst(bx, by, "#ffd23f", 16, true); burst(bx, by, "#fff6c9", 8); shockwaves.push(new MobileShockwave(bx, by, 64, "#ffd23f")); triggerShake(5, 0.18); spawnRipple(bx, by, "gold"); earnCoins(5);
    } else { burst(bx, by, (BB.Economy.skinColors() || {})[b.spec.key] || b.spec.color, 12); spawnRipple(bx, by, ""); earnCoins(1); }
    var pts = (b.spec.points || 10) * combo * (isFever ? 2 : 1);
    score += pts; combo++;
    if (combo > maxCombo) maxCombo = combo;
    if (combo > BB.Save.data.maxCombo) BB.Save.data.maxCombo = combo;
    comboTimer = 2.4;
    textPopups.push(new MobileTextPopup("+" + pts, bx, by - 15, b.spec.isGold ? "#ffd700" : "#ffffff"));
    if (combo === 8 || combo === 12 || combo === 20) BB.UI.announce("⚡ COMBO x" + combo, "Keep popping!", "#00f5d4");
    if (gameMode === "LEVELS") {
      var cur = BB.Content.LEVELS[currentLevelId - 1];
      if (!cur.type) levelProgressCount++;
      else if (cur.type === "gold" && b.spec.isGold) levelProgressCount++;
      else if (cur.type === "combo") levelProgressCount = Math.max(levelProgressCount, combo);
      else if (cur.type === "score") levelProgressCount = score;
      checkLevelWin();
    }
  }
  if (gameMode === "INFINITE" && balloonsPopped % 20 === 0) {
    wave++;
    if (wave > BB.Save.data.maxWave) BB.Save.data.maxWave = wave;
    earnCoins(10); triggerShake(6, 0.25);
    BB.UI.announce("🌊 WAVE " + wave, "Speed up!", "#ffd23f");
    textPopups.push(new MobileTextPopup("WAVE " + wave + "! ⚡", width / 2, height / 2, "#ffd23f", true));
  }
  updateHud();
  var fr = BB.Achievements.check();
  if (fr.length) BB.UI.announce("🏆 " + fr[0].name.toUpperCase(), "Achievement unlocked", "#ffd23f");
  BB.Save.save();
  if (!b.isPuzzle) setTimeout(function () { b.reset(null); }, 400);
}
function checkPuzzleStatus() {
  if (gameState !== "PLAYING" || gameMode !== "PUZZLE") return;
  var unpopped = balloons.filter(function (o) { return !o.popped; }).length;
  puzzleActiveBalloons = unpopped;
  updateHud();
  if (unpopped === 0) {
    winPuzzle();
  } else if (puzzleDartsLeft <= 0) {
    setTimeout(function () {
      if (gameState !== "PLAYING" || gameMode !== "PUZZLE") return;
      var rem = balloons.filter(function (o) { return !o.popped; }).length;
      if (rem === 0) winPuzzle();
      else failPuzzle();
    }, 350);
  }
}
function winPuzzle() {
  gameState = "LEVEL_COMPLETE";
  sound().victory(); endFever();
  var pz = BB.Content.PUZZLES[currentPuzzleId - 1];
  var stars = (pz.darts === 1) ? 3 : (puzzleDartsLeft >= 1 ? 3 : 2);
  var pp = BB.Save.data.puzzleProgress;
  if (!pp) pp = BB.Save.data.puzzleProgress = { 1: { unlocked: true, stars: 0 } };
  if (!pp[currentPuzzleId]) pp[currentPuzzleId] = { unlocked: true, stars: 0 };
  pp[currentPuzzleId].stars = Math.max(pp[currentPuzzleId].stars, stars);
  if (currentPuzzleId < BB.Content.PUZZLES.length) {
    if (!pp[currentPuzzleId + 1]) pp[currentPuzzleId + 1] = { unlocked: true, stars: 0 };
    else pp[currentPuzzleId + 1].unlocked = true;
  }
  var bonus = 70 + stars * 25;
  BB.Economy.addCoins(bonus);
  BB.Economy.addGems(stars >= 3 ? 1 : 0);
  var rec = BB.Player.recordGame("PUZZLE", { score: 1000 * stars, pops: puzzleTotalBalloons, combo: maxCombo, wave: 0 });
  BB.Save.save(); BB.Achievements.check();
  BB.UI.showLevelComplete({
    stars: stars,
    score: 1000 * stars,
    time: puzzleDartsLeft + " Left",
    coins: bonus + rec.coins,
    xp: rec.xp,
    levelUp: rec.levelUp,
    isPuzzle: true,
    puzzleId: currentPuzzleId
  });
}
function failPuzzle() {
  gameState = "GAMEOVER";
  sound().lifeLost(); endFever();
  var unpopped = balloons.filter(function (o) { return !o.popped; }).length;
  BB.UI.showGameOver({
    isPuzzle: true,
    puzzleId: currentPuzzleId,
    score: (puzzleTotalBalloons - unpopped) * 100,
    pops: puzzleTotalBalloons - unpopped,
    combo: maxCombo,
    wave: 0,
    coins: (puzzleTotalBalloons - unpopped) * 2,
    xp: (puzzleTotalBalloons - unpopped) * 3,
    unpopped: unpopped
  });
}
function winSlingshotStage() {
  if (gameState !== "PLAYING" || gameMode !== "SLING") return;
  gameState = "LEVEL_COMPLETE";
  sound().victory(); endFever();
  var stg = BB.Content.SLING_STAGES[currentSlingshotStage - 1] || BB.Content.SLING_STAGES[0];
  var stars = slingshotArrowsLeft >= 1 ? 3 : 2;
  var sp = BB.Save.data.slingshotProgress;
  if (!sp) sp = BB.Save.data.slingshotProgress = { 1: { unlocked: true, stars: 0 } };
  if (!sp[currentSlingshotStage]) sp[currentSlingshotStage] = { unlocked: true, stars: 0 };
  sp[currentSlingshotStage].stars = Math.max(sp[currentSlingshotStage].stars, stars);
  if (currentSlingshotStage < BB.Content.SLING_STAGES.length) {
    if (!sp[currentSlingshotStage + 1]) sp[currentSlingshotStage + 1] = { unlocked: true, stars: 0 };
    else sp[currentSlingshotStage + 1].unlocked = true;
  }
  var bonus = 80 + stars * 30;
  BB.Economy.addCoins(bonus);
  BB.Economy.addGems(stars >= 3 ? 1 : 0);
  var rec = BB.Player.recordGame("SLING", { score: score || (1000 * stars), pops: slingshotTotalBalloons, combo: maxCombo, wave: 0 });
  BB.Save.save(); BB.Achievements.check();
  BB.UI.showLevelComplete({
    stars: stars,
    score: score || (1000 * stars),
    time: slingshotArrowsLeft + " Left",
    coins: bonus + rec.coins,
    xp: rec.xp,
    levelUp: rec.levelUp,
    isSlingshot: true,
    slingshotId: currentSlingshotStage
  });
}
function failSlingshotStage() {
  if (gameState !== "PLAYING" || gameMode !== "SLING") return;
  gameState = "GAMEOVER";
  sound().lifeLost(); endFever();
  var unpopped = balloons.filter(function (o) { return !o.popped; }).length;
  BB.UI.showGameOver({
    isSlingshot: true,
    slingshotId: currentSlingshotStage,
    score: score,
    pops: slingshotTotalBalloons - unpopped,
    combo: maxCombo,
    wave: 0,
    coins: (slingshotTotalBalloons - unpopped) * 2,
    xp: (slingshotTotalBalloons - unpopped) * 3,
    unpopped: unpopped
  });
}
function checkLevelWin() {
  var cur = BB.Content.LEVELS[currentLevelId - 1];
  if (levelProgressCount >= cur.target) {
    gameState = "LEVEL_COMPLETE"; sound().victory(); endFever();
    var stars = timeLeft >= 12 ? 3 : (timeLeft >= 5 ? 2 : 1);
    var lp = BB.Save.data.levelsProgress;
    if (!lp[currentLevelId]) lp[currentLevelId] = { unlocked: true, stars: 0 };
    lp[currentLevelId].stars = Math.max(lp[currentLevelId].stars, stars);
    if (currentLevelId < (BB.Content.MAX_LEVELS || 500)) {
      if (!lp[currentLevelId + 1]) lp[currentLevelId + 1] = { unlocked: true, stars: 0 };
      else lp[currentLevelId + 1].unlocked = true;
    }
    var bonus = 50 + stars * 25;
    BB.Economy.addGems(stars >= 3 ? 1 : 0);
    BB.Economy.addCoins(bonus);
    var rec = BB.Player.recordGame("LEVELS", { score: score, pops: balloonsPopped, combo: maxCombo, wave: 0 });
    BB.Rewards.track("score", score);
    BB.Save.save(); BB.Achievements.check();
    BB.UI.showLevelComplete({ stars: stars, score: score, time: Math.ceil(timeLeft), coins: bonus + rec.coins, xp: rec.xp, levelUp: rec.levelUp });
  }
}
function endGame() {
  gameState = "GAMEOVER"; endFever();
  var before = Math.max(BB.Save.data.blitzHighScore || 0, BB.Save.data.infiniteHighScore || 0);
  var rec = BB.Player.recordGame(gameMode, { score: score, pops: balloonsPopped, combo: maxCombo, wave: wave });
  BB.Economy.addCoins(rec.coins);
  BB.Board.addScore(gameMode, score);
  BB.Rewards.track("score", score);
  BB.Save.save(); BB.Achievements.check();
  var isHigh = score > before && score > 0;
  BB.UI.showGameOver({ score: score, pops: balloonsPopped, combo: maxCombo, wave: wave, coins: rec.coins, xp: rec.xp, isHigh: isHigh, levelUp: rec.levelUp });
  try { BB.Ads.onGameOver(); } catch (e) {}
}
function updateHud() {
  document.getElementById("mScoreVal").innerText = score;
  var best = Math.max(BB.Save.data.blitzHighScore || 0, BB.Save.data.infiniteHighScore || 0, score);
  document.getElementById("mBestVal").innerText = best;
  document.getElementById("mComboVal").innerText = "x" + combo;
  document.getElementById("mCoinVal").innerText = BB.Save.data.coins || 0;
  if (combo > 1) {
    document.body.classList.add("combo-active");
  } else {
    document.body.classList.remove("combo-active");
  }
  var resetBtn = document.getElementById("hudResetPuzzleBtn");
  if (resetBtn) resetBtn.style.display = (gameMode === "PUZZLE" || gameMode === "SLING") ? "flex" : "none";

  if (gameMode === "BLITZ") {
    document.getElementById("hudModeVal").innerText = "BLITZ";
    document.getElementById("mTargetLbl").innerText = "TIME";
    document.getElementById("mTargetVal").innerText = Math.ceil(timeLeft);
  } else if (gameMode === "INFINITE") {
    document.getElementById("hudModeVal").innerText = "WAVE " + wave;
    document.getElementById("mTargetLbl").innerText = "LIVES";
    var h = ""; for (var i = 0; i < Math.max(0, lives); i++) h += "❤️";
    document.getElementById("mTargetVal").innerText = h || "💀";
  } else if (gameMode === "LEVELS") {
    var l = BB.Content.LEVELS[currentLevelId - 1];
    document.getElementById("hudModeVal").innerText = (l && l.isBoss ? "👑 BOSS " : "STG ") + currentLevelId;
    document.getElementById("mTargetLbl").innerText = "TIME";
    document.getElementById("mTargetVal").innerText = Math.ceil(timeLeft);
    var banner = document.getElementById("mobileObjBanner");
    if (banner && l) {
      banner.style.display = "block";
      if (l.isBoss) {
        banner.innerText = "👑 BOSS BATTLE: " + (bossHp || 0) + "/" + (maxBossHp || 0) + " HP (" + Math.ceil(timeLeft) + "s)";
      } else {
        banner.innerText = "LVL " + currentLevelId + ": " + l.desc + " (" + levelProgressCount + "/" + l.target + ")";
      }
    }
  } else if (gameMode === "PUZZLE") {
    var pz = (BB.Content.PUZZLES && BB.Content.PUZZLES[currentPuzzleId - 1]) || { name: "Puzzle", darts: 1 };
    document.getElementById("hudModeVal").innerText = "PUZZLE " + currentPuzzleId;
    document.getElementById("mTargetLbl").innerText = "DARTS";
    document.getElementById("mTargetVal").innerText = "🎯 " + puzzleDartsLeft;
    var banner = document.getElementById("mobileObjBanner");
    if (banner) {
      banner.style.display = "block";
      banner.innerText = "🧩 PUZZLE " + currentPuzzleId + ": " + pz.name + " (" + puzzleActiveBalloons + " left)";
    }
  } else if (gameMode === "SLING") {
    var stg = (BB.Content.SLING_STAGES && BB.Content.SLING_STAGES[currentSlingshotStage - 1]) || { name: "Slingshot", arrows: 2 };
    document.getElementById("hudModeVal").innerText = "SLING " + currentSlingshotStage;
    document.getElementById("mTargetLbl").innerText = "ARROWS";
    document.getElementById("mTargetVal").innerText = "🏹 " + slingshotArrowsLeft;
    var banner = document.getElementById("mobileObjBanner");
    if (banner) {
      banner.style.display = "block";
      banner.innerText = "🏹 STAGE " + currentSlingshotStage + ": " + stg.name + " (" + slingshotActiveBalloons + " left)";
    }
  }
  updateWeaponBadge();
}
function handleTouchAt(x, y) {
  if (gameState !== "PLAYING") return;
  fireAt(x, y);
}
function fireAt(px, py) {
  if (gameMode === "SLING") {
    // Direct tap disabled in Slingshot mode! Arrows must be aimed and shot from the slingshot!
    return;
  }
  if (gameMode === "PUZZLE") {
    if (puzzleDartsLeft <= 0) return;
    spawnRipple(px, py, "");
    var hitTarget = null;
    for (var pi = balloons.length - 1; pi >= 0; pi--) {
      var pb = balloons[pi];
      if (!pb.popped && pb.containsPoint(px, py)) { hitTarget = pb; break; }
    }
    if (hitTarget) {
      puzzleDartsLeft--;
      popBalloon(hitTarget);
      updateHud();
    }
    return;
  }

  // 1. Check King Blimp Boss tap!
  if (bossBalloon && !bossBalloon.popped && bossBalloon.containsPoint(px, py)) {
    bossBalloon.hp--;
    bossHp = bossBalloon.hp;
    triggerShake(7, 0.16);
    sound().laser();
    burst(px, py, "#ffd000", 14);
    textPopups.push(new MobileTextPopup("-1 HP! 👑", px, py - 20, "#ff4444"));
    levelProgressCount++;
    if (bossBalloon.hp <= 0) {
      bossBalloon.popped = true;
      burst(bossBalloon.x, bossBalloon.y, "#ffd700", 45, true);
      shockwaves.push(new MobileShockwave(bossBalloon.x, bossBalloon.y, 250, "#ffd700"));
      sound().victory();
      setTimeout(checkLevelWin, 350);
    }
    updateHud();
    return;
  }

  for (var i = powerupDrops.length - 1; i >= 0; i--) {
    var dp = powerupDrops[i];
    if (dp.containsPoint(px, py)) { powerupDrops.splice(i, 1); collectDrop(dp); return; }
  }
  spawnRipple(px, py, "");
  var i, b;
  if (currentWeapon === "laser") {
    lasers.push(new LaserBeam(px)); triggerShake(8, 0.2); sound().vibrate(30);
    balloons.forEach(function (bl) {
      if (!bl.popped && Math.abs(bl.drawX - px) < bl.radius + 18) popBalloon(bl);
    });
    return;
  }
  if (currentWeapon === "shotgun") {
    var hitS = false;
    [-46, 0, 46].forEach(function (ox) {
      for (var j = balloons.length - 1; j >= 0; j--) {
        var sb = balloons[j];
        if (!sb.popped && sb.containsPoint(px + ox, py)) { popBalloon(sb); hitS = true; break; }
      }
    });
    if (!hitS && combo > 1) { combo = 1; updateHud(); }
    return;
  }
  var hit = false, best = null;
  for (i = balloons.length - 1; i >= 0; i--) {
    b = balloons[i];
    if (!b.popped && b.containsPoint(px, py)) {
      // Hazard spike balloon hit!
      if (b.isHazard) {
        score = Math.max(0, score - 200);
        combo = 1;
        triggerShake(12, 0.35); BB.UI.flash(0.2);
        sound().bomb();
        burst(px, py, "#ff2a5f", 20, true);
        textPopups.push(new MobileTextPopup("OUCH! 🦔 -200", px, py - 20, "#ff2a5f", true));
        b.popped = true;
        setTimeout(function () { b.reset(null); }, 400);
        updateHud();
        return;
      }
      // Shielded balloon hit!
      if (b.shield > 0) {
        b.shield = 0;
        sound().laser();
        triggerShake(6, 0.15);
        burst(b.drawX, b.y, "#00f5d4", 16);
        textPopups.push(new MobileTextPopup("SHIELD BROKEN! 🛡️", b.drawX, b.y - 20, "#00f5d4"));
        var curLvl = BB.Content.LEVELS[currentLevelId - 1];
        if (curLvl && curLvl.type === "shield") {
          levelProgressCount++;
          checkLevelWin();
        }
        updateHud();
        return;
      }
      popBalloon(b); hit = true; best = b; break;
    }
  }
  if (currentWeapon === "gatling" && hit) {
    var extra = 0;
    var near = balloons.filter(function (o) { return !o.popped && o !== best; })
      .map(function (o) { return { o: o, d: Math.hypot(o.drawX - px, o.y - py) }; })
      .sort(function (a, c) { return a.d - c.d; });
    for (var k = 0; k < near.length; k++) {
      if (extra >= 2 || near[k].d > 140) break;
      popBalloon(near[k].o); extra++;
    }
  }
  if (!hit && combo > 1) { combo = 1; updateHud(); }
}
function loop(curT) {
  var dt = Math.min((curT - lastT) / 1000, 0.1); lastT = curT;
  if (isFever) {
    feverTimer -= dt;
    document.getElementById("mFeverPct").innerText = Math.ceil(Math.max(0, feverTimer)) + "s";
    if (feverTimer <= 0) endFever();
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (shakeDuration > 0) {
    shakeDuration -= dt;
    ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity);
    if (shakeDuration <= 0) shakeIntensity = 0;
  }
  ctx.clearRect(-20, -20, width + 40, height + 40);
  var scale = slowMoTimer > 0 ? 1.0 : (isFever ? 1.35 : 1.0);
  if (slowMoTimer > 0) slowMoTimer -= dt;
  if (lifeGrace > 0) lifeGrace -= dt;
  var frozen = (gameState === "PAUSED");
  if (slowMoTimer > 0) { ctx.fillStyle = "rgba(0,245,212,.05)"; ctx.fillRect(0, 0, width, height); ctx.fillStyle = "rgba(0,245,212,.03)"; ctx.fillRect(0, height * 0.22, width, height * 0.78); }
  if (isFever) { var h = (curT * 0.15) % 360; ctx.fillStyle = "hsla(" + h + ",70%,55%,.04)"; ctx.fillRect(0, 0, width, height); }
  if (bossBalloon && !bossBalloon.popped) {
    if (!frozen) bossBalloon.update(dt);
    bossBalloon.draw();
  }
  for (var i = 0; i < balloons.length; i++) { var b = balloons[i]; if (!frozen) b.update(dt, scale); if (!b.popped) b.draw(); }
  for (var d = powerupDrops.length - 1; d >= 0; d--) {
    var dr = powerupDrops[d]; if (!frozen) dr.update(dt); dr.draw();
    if (dr.life <= 0 || dr.y > height + 40) powerupDrops.splice(d, 1);
  }
  for (var lb = lasers.length - 1; lb >= 0; lb--) {
    var bm = lasers[lb]; bm.update(dt); bm.draw();
    if (bm.life <= 0) lasers.splice(lb, 1);
  }
  if (weaponTimer > 0) {
    weaponTimer -= dt;
    var ws = Math.ceil(weaponTimer);
    if (ws !== weaponShownSec) { weaponShownSec = ws; updateWeaponBadge(); }
    if (weaponTimer <= 0) resetWeapon();
  }
  for (var nr = needleRays.length - 1; nr >= 0; nr--) {
    var ray = needleRays[nr]; ray.update(dt); ray.draw();
    if (ray.life <= 0) needleRays.splice(nr, 1);
  }
  for (var j = shockwaves.length - 1; j >= 0; j--) { var s = shockwaves[j]; s.update(dt); s.draw(); if (s.life <= 0) shockwaves.splice(j, 1); }
  for (var k = particles.length - 1; k >= 0; k--) { var p = particles[k]; p.update(dt); p.draw(); if (p.life <= 0) particles.splice(k, 1); }
  for (var t = textPopups.length - 1; t >= 0; t--) { var tp = textPopups[t]; tp.update(dt); tp.draw(); if (tp.life <= 0) textPopups.splice(t, 1); }
  if (gameMode === "SLING") {
    for (var sd = slingshotDarts.length - 1; sd >= 0; sd--) {
      var sDart = slingshotDarts[sd];
      if (!frozen) sDart.update(dt);
      sDart.draw();
      if (sDart.life <= 0 || sDart.y > height + 60) {
        slingshotDarts.splice(sd, 1);
        if (slingshotArrowsLeft <= 0 && slingshotDarts.length === 0) {
          setTimeout(function () {
            if (gameState === "PLAYING" && gameMode === "SLING") endGame();
          }, 600);
        }
      }
    }
    drawSlingshot();
  }
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0 && combo > 1) { combo = 1; updateHud(); } }
  if (gameState === "PLAYING" && (gameMode === "BLITZ" || gameMode === "LEVELS")) {
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0; updateHud();
      if (gameMode === "LEVELS" && levelProgressCount >= BB.Content.LEVELS[currentLevelId - 1].target) checkLevelWin();
      else endGame();
    } else updateHud();
  }
  requestAnimationFrame(loop);
}
var lastT = performance.now();
function resizeCanvas() {
  width = window.innerWidth; height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
  mousePos.x = width / 2; mousePos.y = height / 2;
}
BB.Engine = {
  lockInput: function () { inputLockUntil = Date.now() + 500; },
  init: function (id) {
    canvas = document.getElementById(id); ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("orientationchange", function () { setTimeout(resizeCanvas, 150); });
    window.addEventListener("pointerdown", function (e) {
      BB.Audio.sound.init(); if (isUiTouch(e)) return;
      if (Date.now() < inputLockUntil) return;
      if (gameMode === "SLING") {
        if (e.clientY > height * 0.45) {
          slingshotState.dragging = true;
          slingshotState.curX = e.clientX;
          slingshotState.curY = e.clientY;
          return;
        }
      }
      if (e.pointerId !== undefined) dragStart[e.pointerId] = { x: e.clientX, y: e.clientY };
      handleTouchAt(e.clientX, e.clientY);
    });
    window.addEventListener("pointermove", function (e) {
      if (gameMode === "SLING" && slingshotState.dragging) {
        slingshotState.curX = e.clientX;
        slingshotState.curY = e.clientY;
      }
    });
    window.addEventListener("pointerup", function (e) {
      if (gameMode === "SLING" && slingshotState.dragging) {
        var s = getSlingshotVectors();
        slingshotState.dragging = false;
        if (s.active && slingshotArrowsLeft > 0) {
          slingshotArrowsLeft--;
          sound().slingshotTwang();
          triggerShake(5, 0.12);
          slingshotDarts.push(new SlingshotProjectile(s.slingX, s.anchorY - 15, s.vx, s.vy));
          updateHud();
        }
        return;
      }
      if (e.pointerId !== undefined) delete dragStart[e.pointerId];
    });
    window.addEventListener("pointercancel", function (e) {
      if (gameMode === "SLING") slingshotState.dragging = false;
      if (e.pointerId !== undefined) delete dragStart[e.pointerId];
    });
    window.addEventListener("touchmove", function (e) {
      BB.Audio.sound.init(); if (isUiTouch(e)) return;
      if (gameMode === "SLING" && slingshotState.dragging && e.touches.length > 0) {
        slingshotState.curX = e.touches[0].clientX;
        slingshotState.curY = e.touches[0].clientY;
        return;
      }
      var now = performance.now(); if (now - lastMovePop < 140) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var st = dragStart[t.identifier]; if (!st) continue;
        var dx = t.clientX - st.x, dy = t.clientY - st.y;
        if (dx * dx + dy * dy < 60 * 60) continue;
        lastMovePop = now;
        handleTouchAt(t.clientX, t.clientY);
        break;
      }
    }, { passive: true });
    window.addEventListener("touchend", function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) delete dragStart[e.changedTouches[i].identifier];
    });
    window.addEventListener("touchcancel", function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) delete dragTrail[e.changedTouches[i].identifier];
    });
    document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
    document.addEventListener("dblclick", function (e) { e.preventDefault(); }, { passive: false });
    initBalloons();
    requestAnimationFrame(loop);
  },
  dims: function () { return { w: width, h: height }; },
  state: function () {
    return { mode: gameMode, state: gameState, score: score, combo: combo, lives: lives, wave: wave, level: currentLevelId, puzzle: currentPuzzleId, slingshot: currentSlingshotStage };
  },
  startPuzzle: startPuzzle,
  startSlingshot: startSlingshot,
  resetSlingshot: function () { if (gameMode === "SLING") startSlingshot(currentSlingshotStage); },
  resetPuzzle: function () {
    if (gameMode === "PUZZLE") startPuzzle(currentPuzzleId);
    else if (gameMode === "SLING") startSlingshot(currentSlingshotStage);
  }
};
