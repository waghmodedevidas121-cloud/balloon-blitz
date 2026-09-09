/* BB.UI — shell router + all screens. Engine calls UI.show/announce/flash/ripple. */
window.BB = window.BB || {};
BB.UI = (function () {
  var SCREENS = ["homeScreen", "levelSelectScreen", "dashboardScreen", "shopScreen",
    "boardScreen", "levelCompleteScreen", "gameOverScreen", "pauseScreen", "settingsModal", "howToModal", "dailyModal"];
  var NAV = ["homeScreen", "levelSelectScreen", "shopScreen", "boardScreen", "dashboardScreen"];
  var annT = null;
  var currentMapTab = "campaign";
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
    $("mobileBottomHud").style.display = "none";
    $("mobileObjBanner").style.display = "none";
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
    if (id === "dailyModal") renderDailyGrid();
  }
  function wallet() {
    var u = BB.Save.data;
    ["coinBal", "coinBal2"].forEach(function (id) { var el = $(id); if (el) el.innerText = u.coins || 0; });
    ["gemBal", "gemBal2"].forEach(function (id) { var el = $(id); if (el) el.innerText = u.gems || 0; });
  }
  function refreshHome() {
    var u = BB.Save.data, r = BB.Player.rank(), stars = BB.Player.totalStars();
    var best = Math.max(u.blitzHighScore || 0, u.infiniteHighScore || 0);
    var setT = function (id, t) { var el = $(id); if (el) el.innerText = t; };
    setT("homeRank", r.name + " • Lv" + (u.plevel || 1));
    setT("homePops", u.totalPops || 0);
    setT("homeBest", best);
    setT("homeStars", stars + "⭐");
    setT("homeCombo", "x" + (u.maxCombo || 1));
    var un = Object.keys(u.levelsProgress || {}).filter(function (k) { return u.levelsProgress[k].unlocked; }).length;
    setT("campaignMeta", "Stage " + un + "/500 • " + (BB.Player.totalCampaignStars ? BB.Player.totalCampaignStars() : stars) + " ⭐");
    setT("survivalMeta", "Best: " + (u.infiniteHighScore || 0) + " • Wave " + (u.maxWave || 1));
    setT("blitzMeta", "Best: " + (u.blitzHighScore || 0));

    // Update Tactical Puzzle mode meta
    var pp = u.puzzleProgress || {};
    var pStars = 0, pCleared = 0;
    BB.Content.PUZZLES.forEach(function (pz) {
      var p = pp[pz.id];
      if (p && p.stars > 0) pCleared++;
      if (p && p.stars) pStars += p.stars;
    });
    var pNext = Math.min(10, Object.keys(pp).filter(function (k) { return pp[k].unlocked; }).length);
    var pMeta = $("puzzleMeta");
    if (pMeta) pMeta.innerText = "Stage " + pNext + "/10 • " + pStars + "/30 ⭐";

    var sMeta = $("slingMeta");
    var sp = u.slingshotProgress || {};
    var sStars = 0, sCleared = 0;
    (BB.Content.SLING_STAGES || []).forEach(function (stg) {
      var p = sp[stg.id];
      if (p && p.stars > 0) sCleared++;
      if (p && p.stars) sStars += p.stars;
    });
    var sNext = Math.min(25, Object.keys(sp).filter(function (k) { return sp[k].unlocked; }).length);
    if (sMeta) sMeta.innerText = "Stage " + sNext + "/25 • " + sStars + "/75 ⭐";

    // Update Home daily gift pill in header
    var st = BB.Rewards.dailyStatus();
    var dPill = $("dailyPillText");
    if (dPill) {
      dPill.innerText = st.claimable ? "FREE" : "DAY " + st.streak;
    }
    var dWrap = $("btnHomeDaily");
    if (dWrap) {
      dWrap.style.display = "flex";
      if (st.claimable) {
        dWrap.classList.add("ready");
      } else {
        dWrap.classList.remove("ready");
      }
    }
    wallet(); syncSettings();
  }
  function renderLevels() {
    var isCampaign = (currentMapTab === "campaign");
    var isPuzzle = (currentMapTab === "puzzles");
    var isSlingshot = (currentMapTab === "slingshot");

    var tabC = $("tabCampaign"), tabP = $("tabPuzzles"), tabS = $("tabSlingshot");
    if (tabC) tabC.classList.toggle("active", isCampaign);
    if (tabP) tabP.classList.toggle("active", isPuzzle);
    if (tabS) tabS.classList.toggle("active", isSlingshot);

    var contC = $("campaignMapContainer"), contP = $("puzzleMapContainer"), contS = $("slingshotMapContainer");
    if (contC) contC.style.display = isCampaign ? "block" : "none";
    if (contP) contP.style.display = isPuzzle ? "block" : "none";
    if (contS) contS.style.display = isSlingshot ? "block" : "none";

    if (isCampaign) {
      renderCampaignGrid();
    } else if (isPuzzle) {
      renderPuzzleGrid();
    } else {
      renderSlingshotGrid();
    }
  }
  var selectedCampId = 1;
  var selectedCampWorld = 1;
  var selectedPuzId = 1;

  function updateCampMissionCard() {
    var l = BB.Content.LEVELS[selectedCampId - 1] || BB.Content.LEVELS[0];
    var tag = $("campTag"), time = $("campTime"), title = $("campTitle"), btn = $("btnLaunchCampaign");
    var u = BB.Save.data, p = (u.levelsProgress && u.levelsProgress[l.id]) || { unlocked: l.id === 1, stars: 0 };

    if (l.isBoss) {
      if (tag) { tag.innerText = "👑 BOSS STAGE " + l.id; tag.style.background = "linear-gradient(135deg, #ea580c, #9a3412)"; }
      if (time) time.innerText = "⏱ " + l.time + "s";
      if (title) title.innerText = l.desc;
      if (btn) {
        if (!p.unlocked) {
          btn.innerText = "🔒 LOCKED (CLEAR STG " + (l.id - 1) + ")";
          btn.classList.remove("primary");
          btn.style.opacity = "0.55";
        } else {
          btn.innerText = "⚔️ FIGHT BOSS " + l.id;
          btn.classList.add("primary");
          btn.style.opacity = "1";
        }
      }
    } else {
      if (tag) { tag.innerText = "STAGE " + l.id; tag.style.background = "linear-gradient(135deg, #7c3aed, #4c1d95)"; }
      if (time) time.innerText = "⏱ " + l.time + "s";
      if (title) title.innerText = l.desc;
      if (btn) {
        if (!p.unlocked) {
          btn.innerText = "🔒 LOCKED (CLEAR STG " + (l.id - 1) + ")";
          btn.classList.remove("primary");
          btn.style.opacity = "0.55";
        } else {
          btn.innerText = "▶ PLAY STAGE " + l.id;
          btn.classList.add("primary");
          btn.style.opacity = "1";
        }
      }
    }
  }

  function updatePuzMissionCard() {
    var pz = BB.Content.PUZZLES[selectedPuzId - 1] || BB.Content.PUZZLES[0];
    var tag = $("puzTag"), darts = $("puzDarts"), title = $("puzTitle"), desc = $("puzDesc"), btn = $("btnLaunchPuzzle");
    if (tag) tag.innerText = "PUZZLE " + pz.id;
    if (darts) darts.innerText = "🎯 " + pz.darts + " Dart" + (pz.darts > 1 ? "s" : "");
    if (title) title.innerText = pz.name;
    if (desc) desc.innerText = pz.desc;
    if (btn) btn.innerText = "▶ SOLVE PUZZLE " + pz.id;
  }

  function renderCampaignGrid() {
    var g = $("mLevelsGrid"); if (!g) return;
    g.innerHTML = "";
    var stars = BB.Player.totalCampaignStars ? BB.Player.totalCampaignStars() : 0, cleared = 0, u = BB.Save.data;
    Object.keys(u.levelsProgress).forEach(function (k) { if (u.levelsProgress[k].stars > 0) cleared++; });
    $("campaignProgress").innerText = "Progress: " + stars + "/1500 ⭐ • " + cleared + "/500 cleared";

    // Auto-select latest unlocked stage
    var highestUnlocked = 1;
    BB.Content.LEVELS.forEach(function (l) {
      if (u.levelsProgress[l.id] && u.levelsProgress[l.id].unlocked) highestUnlocked = l.id;
    });

    // Auto-align world to selected stage if not explicitly set
    if (!selectedCampWorld) {
      selectedCampWorld = Math.min(20, Math.floor((highestUnlocked - 1) / 25) + 1);
    }
    var w = BB.Content.WORLDS[selectedCampWorld - 1] || BB.Content.WORLDS[0];
    if (selectedCampId < w.start || selectedCampId > w.end) {
      selectedCampId = w.start;
    }

    var w = BB.Content.WORLDS[selectedCampWorld - 1] || BB.Content.WORLDS[0];
    var wTitle = $("worldTitle"), wSub = $("worldSub"), pBtn = $("btnPrevWorld"), nBtn = $("btnNextWorld");
    if (wTitle) wTitle.innerText = "WORLD " + w.id + ": " + w.name.toUpperCase();
    if (wSub) wSub.innerText = "Stages " + w.start + " - " + w.end + " • " + w.icon;
    if (pBtn) pBtn.disabled = (selectedCampWorld <= 1);
    if (nBtn) nBtn.disabled = (selectedCampWorld >= BB.Content.WORLDS.length);

    updateCampMissionCard();

    for (var lid = w.start; lid <= w.end; lid++) {
      var l = BB.Content.LEVELS[lid - 1];
      if (!l) break;
      var p = u.levelsProgress[l.id] || { unlocked: l.id === 1, stars: 0 };
      var isSel = (l.id === selectedCampId);
      var isBoss = !!l.isBoss;
      var c = document.createElement("div");
      c.className = "arcade-tile" + (p.unlocked ? "" : " locked") + (isSel ? " selected" : "") + (isBoss ? " boss-tile" : "");

      var starStr = p.stars > 0 ? "⭐".repeat(p.stars) : (p.unlocked ? "☆☆☆" : "");
      var crownBadge = isBoss ? '<span class="boss-crown">👑</span>' : '';
      c.innerHTML = crownBadge + '<div class="tile-num">' + (p.unlocked ? l.id : "🔒") + "</div>" +
        '<div class="tile-stars">' + starStr + "</div>";
      c.dataset.lvl = l.id; c.dataset.locked = p.unlocked ? "0" : "1";
      g.appendChild(c);
    }

    if (!g.dataset.bound) {
      g.dataset.bound = "1";
      g.addEventListener("click", function (e) {
        var tile = e.target.closest(".arcade-tile");
        if (!tile) return;
        var id = parseInt(tile.dataset.lvl, 10);
        if (tile.dataset.locked === "1") {
          BB.Audio.sound.init(); BB.Audio.sound.vibrate(40);
          announce("🔒 LOCKED", "Clear Stage " + (id - 1) + " first!", "#ff5e7a");
        } else {
          BB.Audio.sound.init();
          if (selectedCampId === id) {
            startLevel(id);
          } else {
            selectedCampId = id;
            renderCampaignGrid();
          }
        }
      });
    }

    var prevWBtn = $("btnPrevWorld");
    if (prevWBtn && !prevWBtn.dataset.bound) {
      prevWBtn.dataset.bound = "1";
      prevWBtn.addEventListener("click", function () {
        if (selectedCampWorld > 1) {
          selectedCampWorld--;
          selectedCampId = BB.Content.WORLDS[selectedCampWorld - 1].start;
          renderCampaignGrid();
        }
      });
    }

    var nextWBtn = $("btnNextWorld");
    if (nextWBtn && !nextWBtn.dataset.bound) {
      nextWBtn.dataset.bound = "1";
      nextWBtn.addEventListener("click", function () {
        if (selectedCampWorld < BB.Content.WORLDS.length) {
          selectedCampWorld++;
          selectedCampId = BB.Content.WORLDS[selectedCampWorld - 1].start;
          renderCampaignGrid();
        }
      });
    }

    var playBtn = $("btnLaunchCampaign");
    if (playBtn && !playBtn.dataset.bound) {
      playBtn.dataset.bound = "1";
      playBtn.addEventListener("click", function () {
        var u = BB.Save.data;
        var p = (u.levelsProgress && u.levelsProgress[selectedCampId]) || { unlocked: selectedCampId === 1 };
        if (!p.unlocked) {
          BB.Audio.sound.init(); BB.Audio.sound.vibrate(40);
          announce("🔒 LOCKED", "Clear Stage " + (selectedCampId - 1) + " first!", "#ff5e7a");
          return;
        }
        BB.Audio.sound.init();
        startLevel(selectedCampId);
      });
    }
  }

  function renderPuzzleGrid() {
    var g = $("mPuzzlesGrid"); if (!g) return;
    g.innerHTML = "";
    var u = BB.Save.data, pp = u.puzzleProgress || {};
    var stars = 0, cleared = 0;
    BB.Content.PUZZLES.forEach(function (pz) {
      var p = pp[pz.id] || { unlocked: pz.id === 1, stars: 0 };
      if (p.stars > 0) cleared++;
      stars += (p.stars || 0);
    });
    $("puzzleProgress").innerText = "Progress: " + stars + "/30 ⭐ • " + cleared + "/10 cleared";

    var highestUnlocked = 1;
    BB.Content.PUZZLES.forEach(function (pz) {
      if (pp[pz.id] && pp[pz.id].unlocked) highestUnlocked = pz.id;
    });
    if (!pp[selectedPuzId] || !pp[selectedPuzId].unlocked) {
      selectedPuzId = highestUnlocked;
    }
    updatePuzMissionCard();

    BB.Content.PUZZLES.forEach(function (pz) {
      var p = pp[pz.id] || { unlocked: pz.id === 1, stars: 0 };
      var isSel = (pz.id === selectedPuzId);
      var c = document.createElement("div");
      c.className = "arcade-tile" + (p.unlocked ? "" : " locked") + (isSel ? " selected" : "");
      
      var starStr = p.stars > 0 ? "⭐".repeat(p.stars) : (p.unlocked ? "☆☆☆" : "");
      c.innerHTML = '<div class="tile-num">' + (p.unlocked ? pz.id : "🔒") + "</div>" +
        '<div class="tile-stars">' + starStr + "</div>";
      c.dataset.pz = pz.id; c.dataset.locked = p.unlocked ? "0" : "1";
      g.appendChild(c);
    });

    if (!g.dataset.bound) {
      g.dataset.bound = "1";
      g.addEventListener("click", function (e) {
        var tile = e.target.closest(".arcade-tile");
        if (!tile) return;
        var id = parseInt(tile.dataset.pz, 10);
        if (tile.dataset.locked === "1") {
          BB.Audio.sound.init(); BB.Audio.sound.vibrate(40);
          announce("🔒 LOCKED", "Solve Puzzle " + (id - 1) + " first!", "#ff5e7a");
        } else {
          BB.Audio.sound.init();
          if (selectedPuzId === id) {
            BB.Engine.startPuzzle(id);
          } else {
            selectedPuzId = id;
            renderPuzzleGrid();
          }
        }
      });
    }

    var playPuzBtn = $("btnLaunchPuzzle");
    if (playPuzBtn && !playPuzBtn.dataset.bound) {
      playPuzBtn.dataset.bound = "1";
      playPuzBtn.addEventListener("click", function () {
        BB.Audio.sound.init();
        BB.Engine.startPuzzle(selectedPuzId);
      });
    }
  }

  var selectedSlingId = 1;

  function updateSlingMissionCard() {
    var stg = (BB.Content.SLING_STAGES && BB.Content.SLING_STAGES[selectedSlingId - 1]) || { name: "Stage", arrows: 2, desc: "Aim and shoot" };
    var tag = $("slingTag"), arrows = $("slingArrows"), title = $("slingTitle"), desc = $("slingDesc"), btn = $("btnLaunchSlingshot");
    var u = BB.Save.data, sp = (u.slingshotProgress && u.slingshotProgress[selectedSlingId]) || { unlocked: selectedSlingId === 1 };

    if (tag) tag.innerText = "STAGE " + (stg.id || selectedSlingId);
    if (arrows) arrows.innerText = "🏹 " + stg.arrows + " Arrows";
    if (title) title.innerText = stg.name;
    if (desc) desc.innerText = stg.desc;
    if (btn) {
      if (!sp.unlocked) {
        btn.innerText = "🔒 LOCKED (CLEAR STG " + (selectedSlingId - 1) + ")";
        btn.classList.remove("primary");
        btn.style.opacity = "0.55";
      } else {
        btn.innerText = "▶ SHOOT STAGE " + (stg.id || selectedSlingId);
        btn.classList.add("primary");
        btn.style.opacity = "1";
      }
    }
  }

  function renderSlingshotGrid() {
    var g = $("mSlingshotGrid"); if (!g) return;
    g.innerHTML = "";
    var u = BB.Save.data, sp = u.slingshotProgress || {};
    var stars = 0, cleared = 0;
    (BB.Content.SLING_STAGES || []).forEach(function (stg) {
      var p = sp[stg.id] || { unlocked: stg.id === 1, stars: 0 };
      if (p.stars > 0) cleared++;
      stars += (p.stars || 0);
    });
    $("slingshotProgress").innerText = "Progress: " + stars + "/75 ⭐ • " + cleared + "/25 cleared";

    var highestUnlocked = 1;
    (BB.Content.SLING_STAGES || []).forEach(function (stg) {
      if (sp[stg.id] && sp[stg.id].unlocked) highestUnlocked = stg.id;
    });
    if (!sp[selectedSlingId] || !sp[selectedSlingId].unlocked) {
      selectedSlingId = highestUnlocked;
    }
    updateSlingMissionCard();

    (BB.Content.SLING_STAGES || []).forEach(function (stg) {
      var p = sp[stg.id] || { unlocked: stg.id === 1, stars: 0 };
      var isSel = (stg.id === selectedSlingId);
      var c = document.createElement("div");
      c.className = "arcade-tile" + (p.unlocked ? "" : " locked") + (isSel ? " selected" : "");

      var starStr = p.stars > 0 ? "⭐".repeat(p.stars) : (p.unlocked ? "☆☆☆" : "");
      c.innerHTML = '<div class="tile-num">' + (p.unlocked ? stg.id : "🔒") + "</div>" +
        '<div class="tile-stars">' + starStr + "</div>";
      c.dataset.sling = stg.id; c.dataset.locked = p.unlocked ? "0" : "1";
      g.appendChild(c);
    });

    if (!g.dataset.bound) {
      g.dataset.bound = "1";
      g.addEventListener("click", function (e) {
        var tile = e.target.closest(".arcade-tile");
        if (!tile) return;
        var id = parseInt(tile.dataset.sling, 10);
        if (tile.dataset.locked === "1") {
          BB.Audio.sound.init(); BB.Audio.sound.vibrate(40);
          announce("🔒 LOCKED", "Clear Slingshot " + (id - 1) + " first!", "#ff5e7a");
        } else {
          BB.Audio.sound.init();
          if (selectedSlingId === id) {
            BB.Engine.startSlingshot(id);
          } else {
            selectedSlingId = id;
            renderSlingshotGrid();
          }
        }
      });
    }

    var playSlingBtn = $("btnLaunchSlingshot");
    if (playSlingBtn && !playSlingBtn.dataset.bound) {
      playSlingBtn.dataset.bound = "1";
      playSlingBtn.addEventListener("click", function () {
        var u = BB.Save.data, sp = (u.slingshotProgress && u.slingshotProgress[selectedSlingId]) || { unlocked: selectedSlingId === 1 };
        if (!sp.unlocked) {
          BB.Audio.sound.init(); BB.Audio.sound.vibrate(40);
          announce("🔒 LOCKED", "Clear Slingshot " + (selectedSlingId - 1) + " first!", "#ff5e7a");
          return;
        }
        BB.Audio.sound.init();
        BB.Engine.startSlingshot(selectedSlingId);
      });
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
    var isPz = !!r.isPuzzle;
    var isSling = !!r.isSlingshot;
    var tEl = $("mLevelCompleteTitle");
    if (tEl) tEl.innerText = isPz ? "PUZZLE SOLVED! 🧠" : (isSling ? "TRICKSHOT CLEAR! 🏹" : "LEVEL COMPLETE!");
    $("mLevelStars").innerText = "⭐".repeat(r.stars) + "☆".repeat(3 - r.stars);
    $("mLevelSummary").innerText = (isPz || isSling) ? ("Cleared with " + r.time + "!") : "Objective cleared!";
    $("mLevelScoreVal").innerText = r.score;
    var lbl = $("mLevelTimeLbl");
    if (lbl) lbl.innerText = (isPz || isSling) ? "Remaining" : "Time Left";
    $("mLevelTimeVal").innerText = (isPz || isSling) ? r.time : (r.time + "s");
    $("mLevelRewardVal").innerText = "+" + r.coins + "🪙 +" + r.xp + "XP" + (r.levelUp ? " • LV UP!" : "");
    var canNext = isPz ? (r.puzzleId < BB.Content.PUZZLES.length)
      : (isSling ? (r.slingshotId < BB.Content.SLING_STAGES.length)
      : (currentLevelId < (BB.Content.MAX_LEVELS || 500)));
    $("btnNextStage").style.display = canNext ? "flex" : "none";
    announce(isPz ? "🧠 PUZZLE SOLVED!" : (isSling ? "🏹 STAGE CLEAR!" : "🎉 STAGE CLEAR!"), r.stars + " stars", isSling ? "#f97316" : (isPz ? "#00f5d4" : "#33ff77"));
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
    $("btnRetry").innerText = "▶ Replay";
    if (r.isPuzzle || st.mode === "PUZZLE") {
      t.innerText = "OUT OF DARTS! 🎯";
      s.innerText = "Puzzle unsolved • " + (r.unpopped || 0) + " balloons left";
      $("mEndWaveRow").innerText = "🧩 Tactical Puzzle " + (r.puzzleId || st.puzzle || 1);
      $("btnRetry").innerText = "🔄 Try Again";
    } else if (st.mode === "SLING") {
      t.innerText = "OUT OF ARROWS! 🏹";
      s.innerText = "Slingshot run finished • " + r.pops + " balloons pierced!";
      $("mEndWaveRow").innerText = "🏹 Best Score: " + (BB.Save.data.slingshotHighScore || r.score);
      $("btnRetry").innerText = "▶ Play Again";
    } else if (st.mode === "INFINITE") {
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
    $("btnPlayPrimary").addEventListener("click", function () { BB.Audio.sound.init(); currentMapTab = "campaign"; renderLevels(); gameState = "HOME"; show("levelSelectScreen"); });
    $("btnPlayBlitz").addEventListener("click", startBlitz);
    $("btnPlayInfinite").addEventListener("click", startInfinite);
    $("btnPlayLevels").addEventListener("click", function () { currentMapTab = "campaign"; renderLevels(); gameState = "HOME"; show("levelSelectScreen"); });
    if ($("btnPlaySlingshot")) $("btnPlaySlingshot").addEventListener("click", function () { BB.Audio.sound.init(); currentMapTab = "slingshot"; renderLevels(); gameState = "HOME"; show("levelSelectScreen"); });
    if ($("btnPlayPuzzle")) $("btnPlayPuzzle").addEventListener("click", function () { BB.Audio.sound.init(); currentMapTab = "puzzles"; renderLevels(); gameState = "HOME"; show("levelSelectScreen"); });
    if ($("tabCampaign")) $("tabCampaign").addEventListener("click", function () { currentMapTab = "campaign"; renderLevels(); });
    if ($("tabPuzzles")) $("tabPuzzles").addEventListener("click", function () { currentMapTab = "puzzles"; renderLevels(); });
    if ($("tabSlingshot")) $("tabSlingshot").addEventListener("click", function () { currentMapTab = "slingshot"; renderLevels(); });
    if ($("hudResetPuzzleBtn")) $("hudResetPuzzleBtn").addEventListener("click", function () { BB.Engine.resetPuzzle(); });
    $("btnOpenDashboard").addEventListener("click", function () { gameState = "HOME"; show("dashboardScreen"); });
    if ($("btnOpenDashboardHeader")) $("btnOpenDashboardHeader").addEventListener("click", function () { gameState = "HOME"; show("dashboardScreen"); });
    if ($("btnOpenShopHeader1")) $("btnOpenShopHeader1").addEventListener("click", function () { gameState = "HOME"; show("shopScreen"); });
    if ($("btnOpenShopHeader2")) $("btnOpenShopHeader2").addEventListener("click", function () { gameState = "HOME"; show("shopScreen"); });
    if ($("btnHomeDaily")) $("btnHomeDaily").addEventListener("click", function () {
      renderDailyGrid();
      gameState = "HOME";
      show("dailyModal");
    });
    $("btnClaimDaily").addEventListener("click", function () {
      var r = BB.Rewards.claimDaily();
      if (r) {
        BB.Audio.sound.victory();
        renderDailyGrid();
        wallet();
        refreshHome();
        announce("🎁 REWARD CLAIMED!", "+" + (r.prize.coins ? r.prize.coins + " Coins" : r.prize.gems + " Gems"), "#ffd000");
        setTimeout(function () { gameState = "HOME"; show("homeScreen"); }, 1400);
      }
    });
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
      var st = BB.Engine.state();
      if (st.mode === "PUZZLE") {
        if (st.puzzle < BB.Content.PUZZLES.length) BB.Engine.startPuzzle(st.puzzle + 1);
        else { gameState = "HOME"; currentMapTab = "puzzles"; renderLevels(); show("levelSelectScreen"); }
      } else if (st.mode === "SLING") {
        if (st.slingshot < BB.Content.SLING_STAGES.length) BB.Engine.startSlingshot(st.slingshot + 1);
        else { gameState = "HOME"; currentMapTab = "slingshot"; renderLevels(); show("levelSelectScreen"); }
      } else {
        if (currentLevelId < (BB.Content.MAX_LEVELS || 500)) startLevel(currentLevelId + 1);
        else { gameState = "HOME"; show("homeScreen"); }
      }
    });
    $("btnReplayLevel").addEventListener("click", function () {
      var st = BB.Engine.state();
      if (st.mode === "PUZZLE") BB.Engine.startPuzzle(st.puzzle);
      else if (st.mode === "SLING") BB.Engine.startSlingshot(st.slingshot);
      else startLevel(currentLevelId);
    });
    $("btnRetry").addEventListener("click", function () {
      var st = BB.Engine.state();
      if (st.mode === "BLITZ") startBlitz();
      else if (st.mode === "INFINITE") startInfinite();
      else if (st.mode === "PUZZLE") BB.Engine.startPuzzle(st.puzzle);
      else if (st.mode === "SLING") BB.Engine.startSlingshot(st.slingshot);
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
        else if (st.mode === "PUZZLE") { BB.Engine.startPuzzle(st.puzzle); }
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
      else if (st.mode === "PUZZLE") BB.Engine.startPuzzle(st.puzzle);
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
    if (!w) return;
    w.innerHTML = "";
    var cols = ["#ff3366", "#33ccff", "#33ff77", "#ffd700", "#a29bfe", "#00f5d4", "#ff884d"];
    for (var i = 0; i < 9; i++) {
      var d = document.createElement("div"); d.className = "bg-balloon";
      var s = 22 + Math.random() * 32;
      d.style.width = s + "px"; d.style.height = (s * 1.25) + "px";
      d.style.left = (Math.random() * 94) + "vw";
      d.style.background = "radial-gradient(circle at 35% 30%, #ffffff 0%, " + cols[i % cols.length] + " 45%, #080c24 95%)";
      d.style.opacity = (0.2 + Math.random() * 0.18).toString();
      d.style.animationDuration = (14 + Math.random() * 12) + "s";
      d.style.animationDelay = (-Math.random() * 20) + "s";
      w.appendChild(d);
    }
    for (var j = 0; j < 14; j++) {
      var sp = document.createElement("div"); sp.className = "bg-sparkle";
      var sz = 3 + Math.random() * 4;
      sp.style.width = sz + "px"; sp.style.height = sz + "px";
      sp.style.left = (Math.random() * 96) + "vw";
      sp.style.top = (Math.random() * 85) + "vh";
      sp.style.animationDelay = (Math.random() * 3) + "s";
      sp.style.animationDuration = (2 + Math.random() * 2) + "s";
      w.appendChild(sp);
    }
    var fx = $("homeFx");
    if (fx) fx.innerHTML = "";
  }
  function renderDailyGrid() {
    var g = $("dailyCalendarGrid");
    if (!g) return;
    g.innerHTML = "";
    var st = BB.Rewards.dailyStatus();
    var todayClaimed = !st.claimable;
    var curStreak = st.streak;

    $("dailyRewardText").innerText = todayClaimed
      ? "Day " + curStreak + " collected! Next reward unlocks tomorrow ⏰"
      : "Day " + curStreak + " reward is waiting! Tap claim below!";

    BB.Content.DAILY.forEach(function(d) {
      var card = document.createElement("div");
      var isClaimed = d.day < curStreak || (d.day === curStreak && todayClaimed);
      var isActive = d.day === curStreak && !todayClaimed;
      var isMega = d.day === 7;

      card.className = "daily-day-card" +
        (isMega ? " mega-card" : "") +
        (isActive ? " active" : "") +
        (isClaimed ? " claimed" : "");

      var badge = isClaimed
        ? '<div class="daily-day-badge">✓</div>'
        : (isActive ? '<div class="daily-day-badge" style="background:#ffd000;color:#1a0f00">READY</div>' : '');

      card.innerHTML = badge +
        '<div class="daily-day-num">Day ' + d.day + '</div>' +
        '<div class="daily-day-ico">' + d.icon + '</div>' +
        '<div class="daily-day-rew">' + d.label + '</div>';

      g.appendChild(card);
    });

    var claimBtn = $("btnClaimDaily");
    if (claimBtn) {
      if (todayClaimed) {
        claimBtn.innerText = "✓ COLLECTED TODAY";
        claimBtn.classList.remove("primary");
        claimBtn.disabled = true;
        claimBtn.style.opacity = "0.55";
      } else {
        claimBtn.innerText = "🎁 CLAIM REWARD";
        claimBtn.classList.add("primary");
        claimBtn.disabled = false;
        claimBtn.style.opacity = "1";
      }
    }
  }
  function dailyCheck() {
    var st = BB.Rewards.dailyStatus();
    renderDailyGrid();
    if (st.claimable && (BB.Save.data.gamesPlayed || 0) >= 0) {
      gameState = "HOME"; show("dailyModal");
      return true;
    }
    return false;
  }
  return { show: show, announce: announce, flash: flash, ripple: ripple,
    showLevelComplete: showLevelComplete, showGameOver: showGameOver,
    bind: bind, decor: decor, dailyCheck: dailyCheck, refreshHome: refreshHome, syncSettings: syncSettings };
})();
