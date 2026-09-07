/* BB.Player — profile, XP/level, ranks, per-game recording. */
window.BB = window.BB || {};
BB.Player = (function () {
  var RANKS = ["NOVICE", "ROOKIE", "SKILLED", "EXPERT", "MASTER"];
  var XP_STEPS = [0, 100, 300, 700, 1500, 3000, 6000];
  function d() { return BB.Save.data; }
  function totalCampaignStars() {
    var s = 0, lp = d().levelsProgress || {};
    for (var k in lp) s += (lp[k].stars || 0);
    return s;
  }
  function totalPuzzleStars() {
    var s = 0, pp = d().puzzleProgress || {};
    for (var k in pp) s += (pp[k].stars || 0);
    return s;
  }
  function totalStars() {
    return totalCampaignStars() + totalPuzzleStars();
  }
  function rank() {
    var pops = d().totalPops || 0, stars = totalStars(), idx = 0;
    if (pops >= 400 || stars >= 22) idx = 4;
    else if (pops >= 180 || stars >= 14) idx = 3;
    else if (pops >= 70 || stars >= 7) idx = 2;
    else if (pops >= 15 || stars >= 2) idx = 1;
    return { name: RANKS[idx], index: idx };
  }
  function levelFor(xp) {
    var lv = 1;
    for (var i = 0; i < XP_STEPS.length; i++) if (xp >= XP_STEPS[i]) lv = i + 1;
    return lv;
  }
  function addXP(n) {
    var dd = d(); dd.xp = (dd.xp || 0) + Math.max(0, Math.round(n));
    var nl = levelFor(dd.xp), up = nl > (dd.plevel || 1);
    dd.plevel = nl; BB.Save.save();
    return { up: up, level: nl };
  }
  // Called by engine at game end. Returns {xp, coins} earned.
  function recordGame(mode, r) {
    var dd = d(), coins = 0;
    dd.gamesPlayed = (dd.gamesPlayed || 0) + 1;
    if (mode === "BLITZ" && r.score > (dd.blitzHighScore || 0)) dd.blitzHighScore = r.score;
    if (mode === "INFINITE" && r.score > (dd.infiniteHighScore || 0)) dd.infiniteHighScore = r.score;
    if (mode === "SLING" && r.score > (dd.slingshotHighScore || 0)) dd.slingshotHighScore = r.score;
    if ((r.combo || 1) > (dd.maxCombo || 0)) dd.maxCombo = r.combo;
    if ((r.wave || 0) > (dd.maxWave || 0)) dd.maxWave = r.wave;
    coins += Math.floor((r.score || 0) / 40) + (r.pops || 0);
    var xp = (r.pops || 0) * 2 + Math.floor((r.score || 0) / 20);
    BB.Save.save();
    var lv = addXP(xp);
    return { xp: xp, coins: coins, levelUp: lv.up, level: lv.level };
  }
  return { RANKS: RANKS, totalStars: totalStars, totalCampaignStars: totalCampaignStars, totalPuzzleStars: totalPuzzleStars, rank: rank, addXP: addXP, recordGame: recordGame };
})();
