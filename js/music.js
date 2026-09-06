/* BB.Music — per-screen internet tracks (Kevin MacLeod, CC-BY 4.0) with fade.
   Falls back to synth BGM if a file is missing. Respects Sound + Music toggles. */
window.BB = window.BB || {};
BB.Music = (function () {
  var FILES = {
    home: "assets/audio/home.mp3",         // Fluffing a Duck — light menu
    campaign: "assets/audio/campaign.mp3", // Pixelland — 8-bit adventure
    blitz: "assets/audio/blitz.mp3",       // Run Amok — high energy
    survival: "assets/audio/survival.mp3"  // Sneaky Snitch — tense
  };
  var VOL = 0.32, FADE_MS = 600;
  var el = null, want = "home", faded = null;
  function enabled() {
    var s = BB.Save.data.settings;
    return s.music !== false && s.sound && !BB.Audio.sound.muted;
  }
  function ensure() {
    if (el) return el;
    el = new Audio();
    el.loop = true; el.preload = "auto"; el.volume = 0;
    el.addEventListener("error", function () {
      el = null; // file missing → caller falls back to synth
      try { BB.Audio.sound.bgmStart(); } catch (e) {}
    });
    return el;
  }
  function ramp(to, done) {
    var a = ensure(); if (!a) { if (done) done(); return; }
    clearInterval(faded);
    var from = a.volume, steps = 8, i = 0;
    faded = setInterval(function () {
      i++;
      a.volume = from + (to - from) * (i / steps);
      if (i >= steps) { clearInterval(faded); a.volume = to; if (done) done(); }
    }, FADE_MS / steps);
  }
  function startFile(name) {
    var a = ensure(); if (!a) return false;
    try {
      a.src = FILES[name]; a.load();
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () {});
      ramp(VOL);
      return true;
    } catch (e) { return false; }
  }
  function play(name) {
    want = name;
    if (!enabled()) return false;
    if (!FILES[name]) return false;
    var a = ensure(); if (!a) return false;
    try {
      var cur = (a.src || "").split("/").pop();
      if (cur === FILES[name].split("/").pop() && !a.paused) return true;
    } catch (e) {}
    if (!a.paused) {
      ramp(0, function () { try { a.pause(); } catch (e) {} startFile(name); });
    } else startFile(name);
    return true;
  }
  // Try real track for a mode; fall back to synth BGM when unavailable.
  function playMode(mode) {
    var map = { BLITZ: "blitz", INFINITE: "survival", LEVELS: "campaign" };
    if (!play(map[mode] || "home")) {
      try { BB.Audio.sound.bgmStart(); } catch (e) {}
    }
  }
  function apply() {
    if (!el) { if (enabled()) play(want); return; }
    if (enabled()) {
      if (el.paused) play(want);
      else ramp(VOL);
    } else ramp(0, function () { try { el.pause(); } catch (e) {} });
  }
  function init() {
    var unlock = function () {
      try {
        if (enabled() && el && el.paused) { var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else if (enabled() && !el) play(want);
      } catch (e) {}
    };
    window.addEventListener("pointerdown", unlock);
    document.addEventListener("visibilitychange", function () {
      if (!el) return;
      try {
        if (document.hidden) el.pause();
        else if (enabled()) { var pr = el.play(); if (pr && pr.catch) pr.catch(function () {}); }
      } catch (e) {}
    });
  }
  return { play: play, playMode: playMode, apply: apply, init: init,
    get want() { return want; } };
})();
