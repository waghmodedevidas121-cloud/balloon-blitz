/* BB.Ads — AdSense/H5-game-ad ready framework.
   CURRENT MODE: safe local test stubs (no real ads, no data sent).
   AFTER APPROVAL: fill PROVIDER hooks below; game code needs zero changes. */
window.BB = window.BB || {};
BB.Ads = (function () {
  var cfg = {
    enabled: true,          // master switch (false = everything no-ops)
    mode: "test",           // "test" | "live"
    cooldownSec: 90,        // gap between any two interstitials
    minSessionGames: 2,     // no interstitial before N runs
    rewardedPerRun: 3,      // max rewarded watches per run
    showOnGameOver: true,   // auto interstitial policy point
    bannerSlotId: "",       // e.g. "/xxxx/yyyy" or element id from provider
    rewardedSlotId: ""
  };
  var st = { lastShown: 0, runs: 0, rewardedThisRun: 0 };

  /* ---- PROVIDER HOOKS (fill when AdSense is approved) ----
     Each must call done(success). Keep every call async. */
  var PROVIDER = {
    // e.g. adbreak.getInstance().showAdBreak() / adsense interstitial wrapper
    interstitial: function (done) { done(false); },
    // e.g. adsense rewarded / H5Rewarded wrapper; MUST resolve true only on complete watch
    rewarded: function (done) { done(false); },
    // Optional persistent banner; called once at startup when live
    banner: function () {}
  };

  function TEST_INTERSTITIAL(done) {
    var last = BB.Music && document.fullscreenElement;
    try { if (last && document.exitFullscreen) document.exitFullscreen(); } catch (e) {}
    var ov = document.createElement("div");
    ov.id = "adOverlay";
    ov.style.cssText = "position:absolute;inset:0;z-index:99;background:rgba(4,6,16,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:-apple-system,sans-serif;color:#fff;text-align:center;padding:24px";
    ov.innerHTML = '<div style="font-size:13px;letter-spacing:2px;color:#9cb2ff;font-weight:800">TEST AD — ADSENSE SLOT</div>' +
      '<div style="font-size:26px;font-weight:900">📺 Interstitial Placeholder</div>' +
      '<div style="font-size:12px;color:#a0aec0;max-width:300px">Real ad will appear here once AdSense is approved. (No data is being sent right now.)</div>' +
      '<button id="adSkipBtn" style="margin-top:10px;padding:12px 34px;border:none;border-radius:14px;font-size:15px;font-weight:900;background:linear-gradient(135deg,#ff0844,#ff7a5c);color:#fff">Skip Ad ✓</button>';
    document.body.appendChild(ov);
    ov.querySelector("#adSkipBtn").addEventListener("click", function () { ov.remove(); done(true); });
  }
  function TEST_REWARDED(done) {
    var ov = document.createElement("div");
    ov.id = "adOverlay";
    ov.style.cssText = "position:absolute;inset:0;z-index:99;background:rgba(4,6,16,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:-apple-system,sans-serif;color:#fff;text-align:center;padding:24px";
    ov.innerHTML = '<div style="font-size:13px;letter-spacing:2px;color:#ffd23f;font-weight:800">TEST REWARDED AD — ADSENSE SLOT</div>' +
      '<div style="font-size:26px;font-weight:900">🎁 Watch to Earn</div>' +
      '<div style="font-size:12px;color:#a0aec0;max-width:300px">Reward is granted only after the full watch. Placeholder closes in 3s…</div>' +
      '<div id="adBar" style="width:220px;height:8px;background:rgba(255,255,255,.12);border-radius:8px;overflow:hidden"><div id="adFill" style="height:100%;width:0%;background:linear-gradient(90deg,#ffd23f,#ff0844);transition:width 1s linear"></div></div>';
    document.body.appendChild(ov);
    var fill = ov.querySelector("#adFill"), p = 0;
    var iv = setInterval(function () {
      p += 33.4; fill.style.width = Math.min(100, p) + "%";
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(function () { ov.remove(); done(true); }, 250);
      }
    }, 1000);
  }

  function ready() { return cfg.enabled; }
  function canShow() {
    if (!ready()) return false;
    var now = Date.now();
    if (st.runs < cfg.minSessionGames) return false;
    return (now - st.lastShown) > cfg.cooldownSec * 1000;
  }

  /* Interstitial: gameplay-madhye kabhi nahi. Game over zalyavar ekda (policy-safe). */
  function maybeInterstitial(onDone) {
    onDone = onDone || function () {};
    if (cfg.mode === "test") {
      if (!canShow()) { onDone(false); return false; }
      st.lastShown = Date.now();
      TEST_INTERSTITIAL(function () { onDone(true); });
      return true;
    }
    if (!canShow()) { onDone(false); return false; }
    st.lastShown = Date.now();
    PROVIDER.interstitial(function (ok) { onDone(!!ok); });
    return true;
  }

  /* Rewarded: optionally user tap var. Reward fact ad complete zalyavar. */
  function showRewarded(onReward, onFail) {
    onReward = onReward || function () {}; onFail = onFail || function () {};
    if (!ready() || st.rewardedThisRun >= cfg.rewardedPerRun) { onFail(); return false; }
    st.rewardedThisRun++;
    if (cfg.mode === "test") {
      TEST_REWARDED(function (ok) { ok ? onReward() : onFail(); });
      return true;
    }
    PROVIDER.rewarded(function (ok) { ok ? onReward() : onFail(); });
    return true;
  }

  function notifyRunStart() { st.runs++; st.rewardedThisRun = 0; }
  function onGameOver() {
    if (cfg.showOnGameOver) maybeInterstitial(function () {});
  }
  function goLive(bannerSlot, rewardedSlot) {
    cfg.mode = "live";
    if (bannerSlot) cfg.bannerSlotId = bannerSlot;
    if (rewardedSlot) cfg.rewardedSlotId = rewardedSlot;
    try { PROVIDER.banner(); } catch (e) {}
  }
  function getCfg() { return cfg; }

  return { maybeInterstitial: maybeInterstitial, showRewarded: showRewarded,
    notifyRunStart: notifyRunStart, onGameOver: onGameOver, goLive: goLive, getCfg: getCfg };
})();
