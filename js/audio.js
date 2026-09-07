/* BB.Audio — same synth engine, reads settings from BB.Save. */
window.BB = window.BB || {};
BB.Audio = (function () {
  function MobileAudio() {
    this.ctx = null; this.muted = false;
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
  }
  MobileAudio.prototype.settings = function () {
    return (BB.Save && BB.Save.data.settings) || { sound: true, vibration: true, effects: true };
  };
  MobileAudio.prototype.init = function () {
    if (!this.ctx) { var A = window.AudioContext || window.webkitAudioContext; if (A) this.ctx = new A(); }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  };
  MobileAudio.prototype.vibrate = function (p) {
    try { if (this.settings().vibration && navigator.vibrate) navigator.vibrate(p); } catch (e) {}
  };
  MobileAudio.prototype.wallBounce = function () {
    this.vibrate(15);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var n = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(650, n);
      o.frequency.exponentialRampToValueAtTime(300, n + 0.08);
      g.gain.setValueAtTime(0.2, n);
      g.gain.exponentialRampToValueAtTime(0.001, n + 0.08);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(n); o.stop(n + 0.08);
    } catch (e) {}
  };
  MobileAudio.prototype.slingshotTwang = function () {
    this.vibrate(25);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var n = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(480, n);
      o.frequency.exponentialRampToValueAtTime(120, n + 0.18);
      g.gain.setValueAtTime(0.35, n);
      g.gain.exponentialRampToValueAtTime(0.001, n + 0.18);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(n); o.stop(n + 0.18);
    } catch (e) {}
  };
  MobileAudio.prototype.toggleMute = function () { this.muted = !this.muted; return this.muted; };
  MobileAudio.prototype.pop = function (i) {
    i = i || 0; this.vibrate(18);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var n = this.ctx.currentTime, f = this.scale[i % this.scale.length];
      var o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f * 1.5, n);
      o.frequency.exponentialRampToValueAtTime(f * 0.5, n + 0.1);
      g.gain.setValueAtTime(0.3, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.1);
      o.connect(g); g.connect(this.ctx.destination); o.start(n); o.stop(n + 0.1);
    } catch (e) {}
  };
  MobileAudio.prototype.bomb = function () {
    this.vibrate([40, 40, 80]);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var n = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(160, n);
      o.frequency.exponentialRampToValueAtTime(25, n + 0.6);
      g.gain.setValueAtTime(0.6, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.6);
      o.connect(g); g.connect(this.ctx.destination); o.start(n); o.stop(n + 0.6);
    } catch (e) {}
  };
  MobileAudio.prototype.freeze = function () {
    this.vibrate([20, 20, 20]);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var n = this.ctx.currentTime, self = this;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        var o = self.ctx.createOscillator(), g = self.ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(f, n + i * 0.05);
        g.gain.setValueAtTime(0.18, n + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, n + i * 0.05 + 0.2);
        o.connect(g); g.connect(self.ctx.destination); o.start(n + i * 0.05); o.stop(n + i * 0.05 + 0.2);
      });
    } catch (e) {}
  };
  MobileAudio.prototype.lifeLost = function () {
    this.vibrate([60, 40, 100]);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var n = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(240, n);
      o.frequency.exponentialRampToValueAtTime(70, n + 0.25);
      g.gain.setValueAtTime(0.35, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.25);
      o.connect(g); g.connect(this.ctx.destination); o.start(n); o.stop(n + 0.25);
    } catch (e) {}
  };
  MobileAudio.prototype.victory = function () {
    this.vibrate([40, 30, 40, 30, 80]);
    if (!this.ctx || this.muted || !this.settings().sound) return;
    try {
      var self = this;
      [440, 554.37, 659.25, 880].forEach(function (f, i) {
        var o = self.ctx.createOscillator(), g = self.ctx.createGain(), t = self.ctx.currentTime + i * 0.08;
        o.type = "triangle"; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g); g.connect(self.ctx.destination); o.start(t); o.stop(t + 0.3);
      });
    } catch (e) {}
  };
  var sound = new MobileAudio();
  /* Subtle generative ambient BGM — quiet pads + sparse plucks, no audio files. */
  sound.musicOn = function () {
    var s = this.settings();
    return !this.muted && s.sound && s.music !== false;
  };
  sound.bgmStart = function () {
    if (!this.ctx || this._bgmTimer) return;
    try {
      this._bgmMaster = this.ctx.createGain(); this._bgmMaster.gain.value = 0.9;
      var comp = this.ctx.createDynamicsCompressor();
      this._bgmMaster.connect(comp); comp.connect(this.ctx.destination);
      this._bgmDelay = this.ctx.createDelay(1); this._bgmDelay.delayTime.value = 0.45;
      var fb = this.ctx.createGain(); fb.gain.value = 0.32;
      this._bgmDelay.connect(fb); fb.connect(this._bgmDelay); this._bgmDelay.connect(this._bgmMaster);
      this._bgmStep = 0;
      var self = this;
      this._bgmTimer = setInterval(function () { self._bgmTick(); }, 1000);
      this._bgmTick();
    } catch (e) {}
  };
  sound.bgmStop = function () { if (this._bgmTimer) { clearInterval(this._bgmTimer); this._bgmTimer = null; } };
  sound._bgmTick = function () {
    if (!this.musicOn()) return;
    try {
      var t = this.ctx.currentTime + 0.1;
      var chords = [[110, 130.81, 164.81], [87.31, 110, 130.81], [130.81, 164.81, 196], [98, 123.47, 146.83]];
      var ch = chords[this._bgmStep % chords.length]; this._bgmStep++;
      var lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 750;
      lp.connect(this._bgmMaster);
      ch.forEach(function (f) {
        [0, 4].forEach(function (det) {
          var o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = "triangle"; o.frequency.value = f; o.detune.value = det - 2;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.028, t + 2.0);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
          o.connect(g); g.connect(lp); o.start(t); o.stop(t + 4.8);
        }, this);
      }, this);
      if (Math.random() < 0.6) {
        var scale = [440, 523.25, 587.33, 659.25, 783.99, 880];
        var f = scale[Math.floor(Math.random() * scale.length)];
        var o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.035, t + 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        o.connect(g); g.connect(this._bgmMaster); g.connect(this._bgmDelay);
        o.start(t + 0.4); o.stop(t + 2.4);
      }
    } catch (e) {}
  };
  return { sound: sound };
})();
