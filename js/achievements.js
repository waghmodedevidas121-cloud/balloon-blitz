/* BB.Achievements — definitions from content, progress, rewards. */
window.BB = window.BB || {};
BB.Achievements = (function () {
  var CHECKS = {
    first_pop: function (u) { return u.totalPops >= 1; },
    bomb10: function (u) { return (u.bombsPopped || 0) >= 10; },
    fever1: function (u) { return (u.fevers || 0) >= 1; },
    combo12: function (u) { return u.maxCombo >= 12; },
    pop300: function (u) { return u.totalPops >= 300; },
    camp_done: function (u) {
      return !!(u.levelsProgress[10] && u.levelsProgress[10].stars > 0);
    }
  };
  function list() { return BB.Content.ACHIEVEMENTS; }
  function isUn(id) { return !!BB.Save.data.achievements[id]; }
  // Returns newly unlocked items (caller shows animation).
  function check() {
    var u = BB.Save.data, fresh = [];
    list().forEach(function (a) {
      if (!u.achievements[a.id] && CHECKS[a.id] && CHECKS[a.id](u)) {
        u.achievements[a.id] = Date.now(); fresh.push(a);
        if (a.reward) {
          if (a.reward.coins) u.coins = (u.coins || 0) + a.reward.coins;
          if (a.reward.gems) u.gems = (u.gems || 0) + a.reward.gems;
        }
      }
    });
    if (fresh.length) BB.Save.save();
    return fresh;
  }
  return { list: list, isUn: isUn, check: check };
})();
