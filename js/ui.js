/* BB.UI — shell router + all screens. Engine calls UI.show/announce/flash/ripple. */
window.BB = window.BB || {};
BB.UI = (function () {
  var SCREENS = ["homeScreen", "levelSelectScreen", "dashboardScreen", "shopScreen",
    "boardScreen", "levelCompleteScreen", "gameOverScreen", "pauseScreen", "settingsModal", "howToModal", "dailyModal"];
  var NAV = ["homeScreen", "levelSelectScreen", "shopScreen", "boardScreen", "dashboardScreen"];
  var annT = null;
  function $(id) { return document.getElementById(id); }
  function announce(main, sub, color) {
    $("annMain").textContent = main;
    $("annMain").style.color = color || "#fff";
    $("annSub").textContent = sub || "";
    var b = $("announceBanner");
    b.classList.add("show"); clearTimeout(annT);
    annT = setTimeout(function () { b.classList.remove("show"); }, 1400);
  }
  function flash(a) {
    if (BB.Save.data.settings.effects === false) return;
    var f = $("flashOverlay");
    f.style.transition = "none"; f.style.opacity = a || 0.35;
    requestAnimationFrame(function () { f.style.transition = "opacity .4s ease"; f.style.opacity = 0; });
  }
  function ripple(x, y, cls) {
    try {
      var d = document.createElement("div");
      d.className = "touch-ripple " + (cls || "");
      d.style.left = x + "px"; d.style.top = y + "px";
      $("touchRippleContainer").appendChild(d);
      setTimeout(function () { d.remove(); }, 360);
    } catch (e) {}
  }
  function show(id) {
    SCREENS.forEach(function (s) { var el = $(s); if (el) el.classList.toggle("hidden", s !== id); });
    var st = BB.Engine.state(), playing = (st.state === "PLAYING" || st.state === "PAUSED");
    if (playing) { try { BB.Engine.lockInput(); } catch (e) {} }
    $("mobileHud").style.display = playing ? "flex" : "none";
    $("mobileBottomHud").style.display = playing ? "flex" : "none";
    $("mobileObjBanner").style.display = (playing && st.mode === "LEVELS") ? "block" : "none";
    var navOn = (!playing && NAV.indexOf(id) >= 0);
    $("bottomNav").style.display = navOn ? "flex" : "none";
    document.body.classList.toggle("nav-visible", navOn);
    document.querySelectorAll("#bottomNav button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.screen === id);
    });
    var menuThemes = { homeScreen: "home", levelSelectScreen: "home", dashboardScreen: "home", shopScreen: "home", boardScreen: "home", gameOverScreen: "home", levelCompleteScreen: "campaign" };
    if (menuThemes[id]) { try { BB.Music.play("home"); } catch (e) {} }
    if (id === "homeScreen") refreshHome();
    if (id === "levelSelectScreen") renderLevels();
    if (id === "dashboardScreen") renderProfile();
    if (id === "shopScreen") renderShop();
    if (id === "boardScreen") renderBoard("local");
  }
  function wallet() {
    var u = BB.Save.data;
    ["coinBal", "coinBal2"].forEach(function (id) { var el = $(id); if (el) el.innerText = u.coins || 0; });
    ["gemBal", "gemBal2"].forEach(function (id) { var el = $(id); if (el) el.innerText = u.gems || 0; });
  }
  function refreshHome() {
    var u = BB.Save.data, r = BB.Player.rank(), stars = BB.Player.totalStars();
    var best = Math.max(u.blitzHighScore || 0, u.infiniteHighScore || 0);
    $("homeRank").innerText = r.name + " • Lv" + (u.plevel || 1);
    $("homePops").innerText = u.totalPops || 0;
    $("homeBest").innerText = best;
    $("homeStars").innerText = stars + "⭐";
    $("homeCombo").innerText = "x" + (u.maxCombo || 1);
    var un = Object.keys(u.levelsProgress || {}).filter(function (k) { return u.levelsProgress[k].unlocked; }).length;
    $("campaignMeta").innerText = "Stage " + Math.min(10, un) + "/10 • " + stars + "/30 ⭐";
    $("survivalMeta").innerText = "Best: " + (u.infiniteHighScore || 0) + " • Wave " + (u.maxWave || 1);
    $("blitzMeta").innerText = "Best: " + (u.blitzHighScore || 0);
    wallet(); syncSettings();
  }
  function renderLevels() {
    var g = $("mLevelsGrid"); g.innerHTML = "";
    var stars = BB.Player.totalStars(), cleared = 0, u = BB.Save.data;
    Object.keys(u.levelsProgress).forEach(function (k) { if (u.levelsProgress[k].stars > 0) cleared++; });
    $("campaignProgress").innerText = "Progress: " + stars + "/30 ⭐ • " + cleared + "/10 cleared";
    BB.Content.LEVELS.forEach(function (l) {
      var p = u.levelsProgress[l.id] || { unlocked: l.id === 1, stars: 0 };
      var cur = p.unlocked && !p.stars;
      var c = document.createElement("div");
      c.className = "m-lvl-card" + (p.unlocked ? "" : " locked") + (cur ? " current" : "");
      c.innerHTML = '<div class="m-lvl-num">' + (p.unlocked ? l.id : "🔒") + "</div>" +
        '<div class="m-lvl-info"><div class="m-lvl-obj">Lv ' + l.id + " • " + l.desc + "</div>" +
        '<div class="m-lvl-sub">⏱ ' + l.time + "s • " + (p.unlocked ? "Tap to play" : "Locked") + "</div>" +
        '<div class="m-lvl-stars">' + (p.stars > 0 ? "⭐".repeat(p.stars) + "☆".repeat(3 - p.stars) : (p.unlocked ? "☆☆☆" : "🔒 🔒 🔒")) + "</div></div>";
      c.dataset.lvl = l.id; c.dataset.locked = p.unlocked ? "0" : "1";
      g.appendChild(c);
    });
    if (!g.dataset.bound) {
      g.dataset.bound = "1";
      var pd = null;
      var pick = function (e) { return (e.target && e.target.closest) ? e.target.closest(".m-lvl-card") : null; };
      g.addEventListener("pointerdown", function (e) {
        var c = pick(e); pd = c ? { id: c.dataset.lvl, x: e.clientX, y: e.clientY } : null;
      });
      g.addEventListener("pointerup", function (e) {
        if (!pd) return;
        var c = pick(e), dx = e.clientX - pd.x, dy = e.clientY - pd.y, id = pd.id;
        pd = null;
        if (!c || c.dataset.lvl !== id || dx * dx + dy * dy > 14 * 14) return;
        if (c.dataset.locked === "1") {
          BB.Audio.sound.init(); BB.Audio.sound.vibrate(40);
          announce("🔒 LOCKED", "Clear previous stage first", "#ff5e7a");
        } else startLevel(parseInt(id, 10));
      });
      g.addEventListener("pointercancel", function () { pd = null; });
    }
  }
  function renderProfile() {
    var u = BB.Save.data, r = BB.Player.rank(), stars = BB.Player.totalStars();
    $("mPlayerRank").innerText = "RANK: " + r.name + " • Lv" + (u.plevel || 1) + " (" + (u.xp || 0) + " XP)";
    $("rankFill").style.width = ((r.index + 1) / 5 * 100) + "%";
    $("rankNext").innerText = r.index < 4 ? "Next: " + BB.Player.RANKS[r.index + 1] : "Max rank 👑";
    $("mDashPops").innerText = u.totalPops || 0;
    $("mDashBlitz").innerText = u.blitzHighScore || 0;
    $("mDashInfinite").innerText = u.infiniteHighScore || 0;
    $("mDashWave").innerText = u.maxWave || 1;
    $("mDashCombo").innerText = "x" + (u.maxCombo || 1);
    $("mDashStars").innerText = stars + " / 30";
    wallet();
    var ml = $("missionsList"); ml.innerHTML = "";
    BB.Rewards.missions().forEach(function (m) {
      var row = document.createElement("div"); row.className = "ach-row" + (m.done ? " unlocked" : "");
      row.innerHTML = '<div class="ach-ico">🎯</div><div><div class="ach-name">' + m.def.name +
        " (" + m.progress + "/" + m.def.target + ")" + "</div><div class='ach-desc'>" + m.def.desc +
        " • +" + (m.def.reward.coins || m.def.reward.gems) + (m.def.reward.coins ? "🪙" : "💎") + "</div></div>" +
        "<div class='ach-state'>" + (m.claimed ? "✓" : (m.done ? "<button class='toggle on' data-m='" + m.def.id + "'>CLAIM</button>" : "…")) + "</div>";
      ml.appendChild(row);
    });
    ml.querySelectorAll("button[data-m]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (BB.Rewards.claimMission(b.dataset.m)) { renderProfile(); announce("🎁 MISSION DONE", "Reward claimed", "#ffd23f"); }
      });
    });
    var c = $("achievementsList"); c.innerHTML = "";
    BB.Content.ACHIEVEMENTS.forEach(function (a) {
      var un = BB.Achievements.isUn(a.id);
      var d = document.createElement("div"); d.className = "ach-row" + (un ? " unlocked" : "");
      d.innerHTML = '<div class="ach-ico">' + a.icon + "</div><div><div class='ach-name'>" + a.name +
        "</div><div class='ach-desc'>" + a.desc + "</div></div><div class='ach-state'>" + (un ? "✓" : "🔒") + "</div>";
      c.appendChild(d);
    });
  }
  function renderShop() {
    wallet();
    function draw(list, type, elId, key) {
      var el = $(elId); el.innerHTML = "";
      list.forEach(function (it) {
        var owned = BB.Economy.owned(type, it.id);
        var eq = BB.Save.data.equipped[key] === it.id;
        var d = document.createElement("div"); d.className = "ach-row" + (eq ? " unlocked" : "");
        var btn = eq ? "EQUIPPED" : (owned ? "<button class='toggle on'>EQUIP</button>" : "<button class='toggle'>" + BB.Economy.costText(it.cost) + "</button>");
        d.innerHTML = '<div class="ach-ico">' + (type === "skins" ? "🎈" : "✨") + "</div><div><div class='ach-name'>" + it.name +
          "</div><div class='ach-desc'>" + it.desc + "</div></div><div class='ach-state'>" + btn + "</div>";
        var b = d.querySelector("button");
        if (b && !eq) b.addEventListener("click", function () {
          var ok = owned ? BB.Economy.equip(type, it.id) : BB.Economy.buy(type, it.id);
          if (ok) { renderShop(); announce(owned ? "✔ EQUIPPED" : "🛒 PURCHASED", it.name, "#00f5d4"); }
          else announce("❌ NOT ENOUGH", "Play to earn coins", "#ff5e7a");
        });
        el.appendChild(d);
      });
    }
    draw(BB.Content.SKINS, "skins", "skinsList", "skin");
    draw(BB.Content.EFFECTS, "effects", "effectsList", "effect");
  }
  function renderBoard(tab) {
    tab = tab || "local";
    document.querySelectorAll(".board-tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    var rows = tab === "local" ? BB.Board.local() : tab === "weekly" ? BB.Board.weekly()
      : tab === "mine" ? BB.Board.personal() : BB.Board.global();
    var el = $("boardList"); el.innerHTML = "";
    if (!rows.length) el.innerHTML = "<p style='color:var(--muted);font-size:12px'>No scores yet — go play!</p>";
    rows.forEach(function (r, i) {
      var d = document.createElement("div"); d.className = "ach-row" + (i === 0 ? " unlocked" : "");
      d.innerHTML = "<div class='ach-ico'>#" + (i + 1) + "</div><div><div class='ach-name'>" + r.n +
        "</div></div><div class='ach-state'>" + r.score + "</div>";
      el.appendChild(d);
    });
    if (tab === "global") {
      var p = document.createElement("p");
      p.style.cssText = "font-size:10px;color:var(--muted);margin-top:6px";
      p.innerText = "Global board is demo data — real backend in FUTURE phase.";
      el.appendChild(p);
    }
  }
  function showLevelComplete(r) {
    $("mLevelStars").innerText = "⭐".repeat(r.stars) + "☆".repeat(3 - r.stars);
    $("mLevelSummary").innerText = "Objective cleared!";
    $("mLevelScoreVal").innerText = r.score;
    $("mLevelTimeVal").innerText = r.time + "s";
    $("mLevelRewardVal").innerText = "+" + r.coins + "🪙 +" + r.xp + "XP" + (r.levelUp ? " • LV UP!" : "");
    $("btnNextStage").style.display = (currentLevelId < 10) ? "flex" : "none";
    announce("🎉 STAGE CLEAR!", r.stars + " stars", "#33ff77");
    show("levelCompleteScreen");
  }
  function showGameOver(r) {
    var t = $("mGameOverTitle"), s = $("mGameOverSub"), st = BB.Engine.state();
    $("mEndScore").innerText = r.score;
    $("mEndPops").innerText = r.pops;
    $("mEndCombo").innerText = "x" + r.combo;
    $("mEndBest").innerText = Math.max(BB.Save.data.blitzHighScore || 0, BB.Save.data.infiniteHighScore || 0);
    $("mNewHighBadge").style.display = r.isHigh ? "inline-block" : "none";
    $("mEndReward").innerText = "+" + r.coins + "🪙 +" + r.xp + "XP" + (r.levelUp ? " • LEVEL UP!" : "");
    if (st.mode === "INFINITE") {
      t.innerText = "SURVIVAL OVER"; s.innerText = "You survived " + r.pops + " pops!";
      $("mEndWaveRow").innerText = "🌊 Reached WAVE " + r.wave + " • Best " + (BB.Save.data.maxWave || r.wave);
    } else if (st.mode === "LEVELS") {
      t.innerText = "TIME UP"; s.innerText = "Objective not reached — try again!";
      $("mEndWaveRow").innerText = "🎯 Stage " + currentLevelId;
    } else {
      t.innerText = "TIME UP!"; s.innerText = "60-second Blitz finished!";
      $("mEndWaveRow").innerText = "🔥 Max combo x" + r.combo;
    }
    if (r.isHigh) BB.Audio.sound.victory();
    show("gameOverScreen");
  }
  function syncSettings() {
    var s = BB.Save.data.settings;
    [["btnSound", s.sound], ["setSoundBtn", s.sound], ["setVibBtn", s.vibration], ["setFxBtn", s.effects], ["setMusicBtn", s.music !== false]]
      .forEach(function (pair) {
        var el = $(pair[0]); if (!el) return;
        if (el.classList.contains("toggle")) { el.innerText = pair[1] ? "ON" : "OFF"; el.classList.toggle("on", !!pair[1]); }
        else if (pair[0] === "btnSound") { el.innerText = pair[1] ? "🔊" : "🔇"; }
      });
    BB.Audio.sound.muted = !s.sound;
  }
  function setSetting(k, v) {
    BB.Save.data.settings[k] = v; BB.Save.save(); syncSettings();
    try { BB.Music.apply(); } catch (e) {}
  }
  function bind() {
    $("btnPlayPrimary").addEventListener("click", function () { BB.Audio.sound.init(); renderLevels(); gameState = "HOME"; show("levelSelectScreen"); });
    $("btnPlayBlitz").addEventListener("click", startBlitz);
    $("btnPlayInfinite").addEventListener("click", startInfinite);
    $("btnPlayLevels").addEventListener("click", function () { renderLevels(); gameState = "HOME"; show("levelSelectScreen"); });
    $("btnOpenDashboard").addEventListener("click", function () { gameState = "HOME"; show("dashboardScreen"); });
    $("btnOpenSettings").addEventListener("click", function () { syncSettings(); show("settingsModal"); });
    $("btnCloseSettings").addEventListener("click", function () { show("homeScreen"); gameState = "HOME"; });
    $("btnHowTo").addEventListener("click", function () { show("howToModal"); });
    $("btnCloseHowTo").addEventListener("click", function () { show("settingsModal"); });
    $("setSoundBtn").addEventListener("click", function () { setSetting("sound", !BB.Save.data.settings.sound); });
    $("setVibBtn").addEventListener("click", function () { setSetting("vibration", !BB.Save.data.settings.vibration); });
    $("setFxBtn").addEventListener("click", function () { setSetting("effects", !BB.Save.data.settings.effects); });
    $("setMusicBtn").addEventListener("click", function () { setSetting("music", !(BB.Save.data.settings.music !== false)); });
    $("setFullBtn").addEventListener("click", function () {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {});
      else document.exitFullscreen().catch(function () {});
    });
    $("btnResetProgress").addEventListener("click", function () {
      if (confirm("Reset all progress? Stars, scores, coins and achievements will be wiped.")) {
        var s = BB.Save.data.settings;
        BB.Save.resetKeepSettings(); BB.Save.data.settings = s; BB.Save.save();
        refreshHome(); announce("🗑️ RESET DONE", "Fresh start", "#ff5e7a"); gameState = "HOME"; show("homeScreen");
      }
    });
    $("btnBackLevels").addEventListener("click", function () { gameState = "HOME"; show("homeScreen"); });
    $("btnBackDashboard").addEventListener("click", function () { gameState = "HOME"; show("homeScreen"); });
    $("btnBackShop").addEventListener("click", function () { gameState = "HOME"; show("homeScreen"); });
    $("btnBackBoard").addEventListener("click", function () { gameState = "HOME"; show("homeScreen"); });
    $("btnEndHome").addEventListener("click", function () { gameState = "HOME"; show("homeScreen"); });
    $("btnNextLevelMenu").addEventListener("click", function () { gameState = "HOME"; renderLevels(); show("levelSelectScreen"); });
    $("btnNextStage").addEventListener("click", function () {
      if (currentLevelId < 10) startLevel(currentLevelId + 1);
      else { gameState = "HOME"; show("homeScreen"); }
    });
    $("btnReplayLevel").addEventListener("click", function () { startLevel(currentLevelId); });
    $("btnRetry").addEventListener("click", function () {
      var st = BB.Engine.state();
      if (st.mode === "BLITZ") startBlitz();
      else if (st.mode === "INFINITE") startInfinite();
      else startLevel(currentLevelId);
    });
    $("btnAdCoins").addEventListener("click", function () {
      BB.Ads.showRewarded(function () {
        BB.Economy.addCoins(75); BB.Save.save(); wallet();
        announce("🎁 +75 COINS", "Thanks for watching!", "#ffd23f");
        $("btnAdCoins").style.display = "none";
      }, function () { announce("❌ AD NOT READY", "Try again in a bit", "#ff5e7a"); });
    });
    $("btnAdLife").addEventListener("click", function () {
      BB.Ads.showRewarded(function () {
        var st = BB.Engine.state();
        if (st.mode === "INFINITE") { startInfinite(); }
        else if (st.mode === "LEVELS") { startLevel(currentLevelId); }
        else { startBlitz(); }
      }, function () { announce("❌ AD NOT READY", "Try again in a bit", "#ff5e7a"); });
    });
    $("hudHomeBtn").addEventListener("click", function () {
      if (gameState === "PLAYING") {
        gameState = "PAUSED";
        $("pauseInfo").innerText = gameMode + " • Score " + score;
        show("pauseScreen");
      }
    });
    $("btnResume").addEventListener("click", function () { gameState = "PLAYING"; show(null); });
    $("btnRestartPause").addEventListener("click", function () {
      var st = BB.Engine.state();
      if (st.mode === "BLITZ") startBlitz();
      else if (st.mode === "INFINITE") startInfinite();
      else startLevel(currentLevelId);
    });
    $("btnQuitHome").addEventListener("click", function () { gameState = "HOME"; endFever(); show("homeScreen"); });
    $("btnSound").addEventListener("click", function () { setSetting("sound", !BB.Save.data.settings.sound); });
    $("btnFullscreen").addEventListener("click", function () {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {});
      else document.exitFullscreen().catch(function () {});
    });
    document.querySelectorAll("#bottomNav button").forEach(function (b) {
      b.addEventListener("click", function () { BB.Audio.sound.init(); gameState = "HOME"; show(b.dataset.screen); });
    });
    document.querySelectorAll(".board-tab").forEach(function (t) {
      t.addEventListener("click", function () { renderBoard(t.dataset.tab); });
    });
    $("btnClaimDaily").addEventListener("click", function () {
      var r = BB.Rewards.claimDaily();
      if (r) {
        $("dailyRewardText").innerText = "Day " + r.streak + ": " +
          (r.prize.coins ? r.prize.coins + " coins 🪙" : r.prize.gems + " gems 💎") + " claimed! ✓";
        $("btnClaimDaily").style.display = "none";
        refreshHome();
        setTimeout(function () { gameState = "HOME"; show("homeScreen"); }, 1200);
      }
    });
    $("btnDailyLater").addEventListener("click", function () { show("homeScreen"); });
    // PLAY burst (display only)
    $("btnPlayPrimary").addEventListener("pointerdown", function (e) {
      try {
        var r = e.currentTarget.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var cols = ["#ff0844", "#ffd23f", "#00f5d4", "#ffffff"];
        for (var i = 0; i < 14; i++) {
          var s = document.createElement("span"); s.className = "hh-burst";
          var sz = 5 + Math.random() * 7;
          s.style.width = sz + "px"; s.style.height = sz + "px";
          s.style.background = cols[i % cols.length];
          s.style.left = cx + "px"; s.style.top = cy + "px"; s.style.position = "fixed";
          var a = (Math.PI * 2 * i / 14) + Math.random() * 0.5, dd = 46 + Math.random() * 64;
          s.style.setProperty("--dx", Math.cos(a) * dd + "px");
          s.style.setProperty("--dy", Math.sin(a) * dd + "px");
          document.body.appendChild(s);
          (function (el) { setTimeout(function () { el.remove(); }, 600); })(s);
        }
        if (BB.Save.data.settings.vibration && navigator.vibrate) navigator.vibrate(15);
      } catch (err) {}
    });
  }
  function decor() {
    var w = $("bgDecor");
    var cols = ["#ff3366", "#33ccff", "#33ff77", "#ffd700", "#a29bfe", "#00f5d4"];
    for (var i = 0; i < 7; i++) {
      var d = document.createElement("div"); d.className = "bg-balloon";
      var s = 20 + Math.random() * 34;
      d.style.width = s + "px"; d.style.height = (s * 1.22) + "px";
      d.style.left = (Math.random() * 96) + "vw";
      d.style.background = "radial-gradient(circle at 32% 28%, #fff 0 12%, " + cols[i % cols.length] + " 38%, #0a0e24 92%)";
      d.style.animationDuration = (17 + Math.random() * 10) + "s";
      d.style.animationDelay = (-Math.random() * 18) + "s";
      w.appendChild(d);
    }
    var fx = $("homeFx");
    if (fx) {
      for (var j = 0; j < 16; j++) {
        var p = document.createElement("div"); p.className = "hh-dot";
        var ss = 2 + Math.random() * 4;
        p.style.width = ss + "px"; p.style.height = ss + "px";
        p.style.left = (Math.random() * 100) + "%"; p.style.bottom = "-10px";
        p.style.background = cols[j % cols.length];
        p.style.boxShadow = "0 0 8px " + cols[j % cols.length];
        p.style.animationDuration = (6 + Math.random() * 7) + "s";
        p.style.animationDelay = (-Math.random() * 8) + "s";
        fx.appendChild(p);
      }
      ["🎈", "🎈", "🎈", "✨", "🎈", "✨", "🎈"].forEach(function (e) {
        var m = document.createElement("div"); m.className = "hh-mini"; m.textContent = e;
        m.style.left = (4 + Math.random() * 92) + "%"; m.style.bottom = "-16px";
        m.style.animationDuration = (8 + Math.random() * 8) + "s";
        m.style.animationDelay = (-Math.random() * 9) + "s";
        fx.appendChild(m);
      });
    }
  }
  function dailyCheck() {
    var st = BB.Rewards.dailyStatus();
    if (st.claimable && (BB.Save.data.gamesPlayed || 0) >= 0) {
      var prize = BB.Content.DAILY[(st.streak - 1) % BB.Content.DAILY.length];
      $("dailyRewardText").innerText = "Day " + st.streak + ": " +
        (prize.coins ? prize.coins + " coins 🪙" : prize.gems + " gems 💎") + " waiting!";
      $("btnClaimDaily").style.display = "flex";
      gameState = "HOME"; show("dailyModal");
      return true;
    }
    return false;
  }
  return { show: show, announce: announce, flash: flash, ripple: ripple,
    showLevelComplete: showLevelComplete, showGameOver: showGameOver,
    bind: bind, decor: decor, dailyCheck: dailyCheck, refreshHome: refreshHome, syncSettings: syncSettings };
})();
