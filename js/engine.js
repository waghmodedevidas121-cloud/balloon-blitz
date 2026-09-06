/* BB.Engine — core gameplay. Same physics, scoring, waves, fever as prototype.
   Hooks: coins/XP/missions/achievements. UI-independent (needs HUD ids only). */
window.BB = window.BB || {};
var canvas, ctx, width, height, dpr;
var gameMode = "BLITZ", gameState = "HOME";
var score = 0, timeLeft = 60, combo = 1, maxCombo = 1, comboTimer = 0, balloonsPopped = 0;
var lives = 3, wave = 1, currentLevelId = 1, levelProgressCount = 0, feversThisRun = 0, lifeGrace = 0;
var feverCharge = 0, isFever = false, feverTimer = 0, slowMoTimer = 0;
var shakeIntensity = 0, shakeDuration = 0, runCoins = 0;
var mousePos = { x: 0, y: 0 };
var balloons = [], particles = [], textPopups = [], shockwaves = [], lasers = [], powerupDrops = [];
var currentWeapon = "pistol", weaponTimer = 0, weaponShownSec = -1;
function sound() { return BB.Audio.sound; }
function effectsOn() { return BB.Save.data.settings.effects !== false; }
var dragStart = {};
var lastMovePop = 0;
var inputLockUntil = 0;
function lockInput() { inputLockUntil = Date.now() + 500; }
function isUiTouch(e) {
  try { return !!(e.target && e.target.closest && e.target.closest("button,#mobileHud,#bottomNav,.overlay-view")); }
  catch (err) { return false; }
}

class MobileBalloon {
  constructor(y) { this.reset(y === undefined ? null : y); this.spawnScale = 0; }
  reset(y) {
    var SPECS = BB.Content.SPECS, r = Math.random(), c = 0, sel = SPECS.RED;
    for (var k in SPECS) { c += SPECS[k].prob; if (r <= c) { sel = SPECS[k]; break; } }
    this.spec = sel; this.radius = sel.r;
    this.x = this.radius + 25 + Math.random() * Math.max(10, width - (this.radius + 25) * 2);
    this.drawX = this.x;
    this.y = (y !== null && y !== undefined) ? y : (height + this.radius + 20 + Math.random() * 80);
    var bonus = (gameMode === "INFINITE") ? (wave - 1) * 0.35 : 0;
    this.speed = sel.speed + Math.random() * 0.6 + bonus;
    this.wobble = Math.random() * 100; this.popped = false; this.spawnScale = 0;
  }
  update(dt, scale) {
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
    var x = this.drawX, y = this.y, rr = this.radius * (0.6 + 0.4 * this.spawnScale);
    var skin = BB.Economy.skinColors();
    var base = (skin && skin[this.spec.key]) || this.spec.color;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x, y + this.radius * 1.2); ctx.lineTo(x, y + this.radius * 2.4);
    ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - rr * 1.15);
    ctx.bezierCurveTo(x + rr * 1.2, y - rr * 1.15, x + rr * 1.1, y + rr * 0.8, x, y + rr * 1.2);
    ctx.bezierCurveTo(x - rr * 1.1, y + rr * 0.8, x - rr * 1.2, y - rr * 1.15, x, y - rr * 1.15);
    ctx.closePath();
    if (this.spec.isBomb) {
      ctx.fillStyle = "#161928"; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#ff3344"; ctx.stroke();
      ctx.fillStyle = "#ff4444"; ctx.font = Math.floor(this.radius * 0.9) + "px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("💣", x, y);
    } else if (this.spec.isGift) {
      ctx.fillStyle = "#2a1540"; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#c26bff";
      ctx.shadowColor = "#c26bff"; ctx.shadowBlur = 16; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff"; ctx.font = Math.floor(this.radius * 0.95) + "px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🎁", x, y);
    } else {
      var grad = ctx.createRadialGradient(Math.max(1, x - rr * 0.35), Math.max(1, y - rr * 0.4),
        Math.max(1, rr * 0.1), x, y, Math.max(2, rr * 1.2));
      grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.35, base); grad.addColorStop(1, "#050712");
      ctx.fillStyle = grad;
      if (this.spec.isGold) { ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 18; }
      else if (this.spec.isFreeze) { ctx.shadowColor = "#00f5d4"; ctx.shadowBlur = 16; }
      ctx.fill(); ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(x - rr * 0.35, y - rr * 0.45, Math.max(1, rr * 0.25), Math.max(1, rr * 0.14), Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fill();
      if (this.spec.isFreeze) {
        ctx.fillStyle = "#fff"; ctx.font = "16px Arial";
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("❄️", x, y);
      }
    }
    ctx.restore();
  }
  containsPoint(px, py) {
    var hr = this.radius * 1.4 + 15, dx = px - this.drawX, dy = py - this.y;
    return (dx * dx + dy * dy) <= (hr * hr);
  }
}
class MobileParticle {
  constructor(x, y, color, heavy) {
    this.x = x; this.y = y; this.color = color;
    var a = Math.random() * Math.PI * 2, s = (heavy ? 5 : 3) + Math.random() * (heavy ? 10 : 6);
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
    this.size = 3.5 + Math.random() * 4; this.life = 1;
    this.decay = 0.022 + Math.random() * 0.025;
  }
  update(dt) {
    this.x += this.vx * 60 * dt; this.y += this.vy * 60 * dt;
    this.vy += 0.25 * 60 * dt; this.life -= this.decay * 60 * dt;
  }
  draw() {
    ctx.save(); ctx.globalAlpha = Math.max(0, this.life);
    var fx = BB.Economy.effectId();
    if (fx === "orbit") {
      ctx.fillStyle = this.color; ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 1.4, 0, Math.PI * 2); ctx.fill();
    } else if (fx === "comet") {
      ctx.fillStyle = this.color; ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(this.x - 1.5, this.y - 1.5, 3, 3);
    } else {
      ctx.fillStyle = this.color; ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
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
    ctx.save(); ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = this.isBig ? "900 24px -apple-system,sans-serif" : "bold 18px -apple-system,sans-serif";
    ctx.fillStyle = this.color; ctx.shadowColor = "rgba(0,0,0,.8)"; ctx.shadowBlur = 6;
    ctx.textAlign = "center"; ctx.fillText(this.text, this.x, this.y); ctx.restore();
  }
}
class MobileShockwave {
  constructor(x, y, m) { this.x = x; this.y = y; this.r = 10; this.maxR = m; this.life = 1; }
  update(dt) { this.r += (this.maxR - this.r) * 14 * dt; this.life -= 2.4 * dt; }
  draw() {
    ctx.save(); ctx.globalAlpha = Math.max(0, this.life);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff4422"; ctx.lineWidth = 4 * this.life; ctx.stroke(); ctx.restore();
  }
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
  burst(bx, by, "#c26bff", 24); burst(bx, by, "#ffd700", 10);
  spawnRipple(bx, by, "gold"); addFever(6); earnCoins(3);
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
    if (particles.length > 340) particles.shift();
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
  currentWeapon = "pistol"; weaponTimer = 0; weaponShownSec = -1;
  powerupDrops.length = 0; lasers.length = 0; shakeDuration = 0;
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
function startInfinite() {
  sound().init(); BB.Music.playMode("survival");
  BB.Ads.notifyRunStart(); lockInput();
  gameMode = "INFINITE"; gameState = "PLAYING"; resetRun(); lives = 3; wave = 1;
  BB.Save.data.gamesPlayed = (BB.Save.data.gamesPlayed || 0) + 1; BB.Save.save();
  initBalloons(); updateHud(); BB.UI.show(null);
  BB.UI.announce("♾️ SURVIVE!", "Protect 3 lives", "#a29bfe");
  textPopups.push(new MobileTextPopup("SURVIVE & POP! ♾️", width / 2, height / 2, "#a29bfe", true));
}
function startLevel(id) {
  sound().init(); BB.Music.playMode("LEVELS");
  BB.Ads.notifyRunStart(); lockInput(); currentLevelId = id;
  var l = BB.Content.LEVELS[id - 1];
  gameMode = "LEVELS"; gameState = "PLAYING"; resetRun();
  timeLeft = l.time; levelProgressCount = 0;
  BB.Save.data.gamesPlayed = (BB.Save.data.gamesPlayed || 0) + 1; BB.Save.save();
  initBalloons(); updateHud(); BB.UI.show(null);
  BB.UI.announce("STAGE " + id, l.desc.toUpperCase(), "#00f5d4");
  textPopups.push(new MobileTextPopup("STAGE " + id + "! 🎯", width / 2, height / 2, "#00f5d4", true));
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
function popBalloon(b) {
  if (b.popped) return;
  b.popped = true; balloonsPopped++;
  BB.Save.data.totalPops++;
  BB.Rewards.track("pop", 1);
  var bx = b.drawX, by = b.y;
  addFever(b.spec.points ? b.spec.points * 0.16 : 7);
  if (b.spec.isBomb) {
    sound().bomb(); BB.Save.data.bombsPopped = (BB.Save.data.bombsPopped || 0) + 1;
    triggerShake(14, 0.4); BB.UI.flash(0.25);
    shockwaves.push(new MobileShockwave(bx, by, 220));
    burst(bx, by, "#ff5e3a", 26, true); burst(bx, by, "#ffd23f", 14, true);
    textPopups.push(new MobileTextPopup("BOOM! 💥", bx, by - 20, "#ff4444", true));
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
    burst(bx, by, "#7df9ff", 22); burst(bx, by, "#ffffff", 8);
    textPopups.push(new MobileTextPopup("SLOW-MO! ❄️", bx, by - 20, "#7df9ff", true));
    spawnRipple(bx, by, "freeze"); earnCoins(2);
    if (gameMode === "LEVELS" && BB.Content.LEVELS[currentLevelId - 1].type === "freeze") {
      levelProgressCount++; checkLevelWin();
    }
  } else if (b.spec.isGift) { grantAbility(b);
  } else {
    sound().pop(combo);
    if (b.spec.isGold) {
      burst(bx, by, "#ffd23f", 26, true); burst(bx, by, "#fff6c9", 12);
      triggerShake(5, 0.18); spawnRipple(bx, by, "gold"); earnCoins(5);
    } else { burst(bx, by, (BB.Economy.skinColors() || {})[b.spec.key] || b.spec.color, 18); spawnRipple(bx, by, ""); earnCoins(1); }
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
  setTimeout(function () { b.reset(null); }, 400);
}
function checkLevelWin() {
  var cur = BB.Content.LEVELS[currentLevelId - 1];
  if (levelProgressCount >= cur.target) {
    gameState = "LEVEL_COMPLETE"; sound().victory(); endFever();
    var stars = timeLeft >= 12 ? 3 : (timeLeft >= 5 ? 2 : 1);
    var lp = BB.Save.data.levelsProgress;
    if (!lp[currentLevelId]) lp[currentLevelId] = { unlocked: true, stars: 0 };
    lp[currentLevelId].stars = Math.max(lp[currentLevelId].stars, stars);
    if (currentLevelId < 10) {
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
    document.getElementById("hudModeVal").innerText = "STG " + currentLevelId;
    document.getElementById("mTargetLbl").innerText = "TIME";
    document.getElementById("mTargetVal").innerText = Math.ceil(timeLeft);
    document.getElementById("mobileObjBanner").innerText = "LVL " + currentLevelId + ": " + l.desc + " (" + levelProgressCount + "/" + l.target + ")";
  }
  updateWeaponBadge();
}
function handleTouchAt(x, y) {
  if (gameState !== "PLAYING") return;
  fireAt(x, y);
}
function fireAt(px, py) {
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
    if (!b.popped && b.containsPoint(px, py)) { popBalloon(b); hit = true; best = b; break; }
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
  if (slowMoTimer > 0) { ctx.fillStyle = "rgba(0,245,212,.07)"; ctx.fillRect(0, 0, width, height); ctx.fillStyle = "rgba(0,245,212,.04)"; ctx.fillRect(0, height * 0.22, width, height * 0.78); }
  if (isFever) { var h = (curT * 0.15) % 360; ctx.fillStyle = "hsla(" + h + ",85%,55%,.07)"; ctx.fillRect(0, 0, width, height); }
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
  for (var j = shockwaves.length - 1; j >= 0; j--) { var s = shockwaves[j]; s.update(dt); s.draw(); if (s.life <= 0) shockwaves.splice(j, 1); }
  for (var k = particles.length - 1; k >= 0; k--) { var p = particles[k]; p.update(dt); p.draw(); if (p.life <= 0) particles.splice(k, 1); }
  for (var t = textPopups.length - 1; t >= 0; t--) { var tp = textPopups[t]; tp.update(dt); tp.draw(); if (tp.life <= 0) textPopups.splice(t, 1); }
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
      if (e.pointerId !== undefined) dragStart[e.pointerId] = { x: e.clientX, y: e.clientY };
      handleTouchAt(e.clientX, e.clientY);
    });
    window.addEventListener("pointerup", function (e) { if (e.pointerId !== undefined) delete dragStart[e.pointerId]; });
    window.addEventListener("pointercancel", function (e) { if (e.pointerId !== undefined) delete dragStart[e.pointerId]; });
    window.addEventListener("touchmove", function (e) {
      BB.Audio.sound.init(); if (isUiTouch(e)) return;
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
    return { mode: gameMode, state: gameState, score: score, combo: combo, lives: lives, wave: wave, level: currentLevelId };
  }
};
