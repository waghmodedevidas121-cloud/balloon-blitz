/* BB.Save — versioned save. Migrates old prototype key, NEVER wipes progress. */
window.BB = window.BB || {};
BB.Save = (function () {
  var NEW_KEY = "balloon_blitz_save_v1";
  var OLD_KEY = "balloon_blitz_mobile_save";
  function defaults() {
    return {
      version: 1, totalPops: 0, blitzHighScore: 0, infiniteHighScore: 0,
      maxWave: 0, maxCombo: 0, levelsProgress: { 1: { unlocked: true, stars: 0 } },
      puzzleProgress: { 1: { unlocked: true, stars: 0 } },
      achievements: {}, settings: { sound: true, vibration: true, effects: true, music: true },
      gamesPlayed: 0, bombsPopped: 0, fevers: 0,
      xp: 0, plevel: 1, coins: 0, gems: 0,
      inventory: { skins: ["default"], effects: ["spark"] },
      equipped: { skin: "default", effect: "spark" },
      rewards: { lastDaily: "", streak: 0 },
      missions: {}, board: []
    };
  }
  var data = defaults();
  function migrateOld() {
    try {
      var raw = localStorage.getItem(OLD_KEY);
      if (!raw) return false;
      var old = JSON.parse(raw);
      ["totalPops", "blitzHighScore", "infiniteHighScore", "maxWave", "maxCombo",
       "levelsProgress", "achievements", "settings", "gamesPlayed"].forEach(function (k) {
        if (old[k] !== undefined) data[k] = old[k];
      });
      if (!data.levelsProgress || !data.levelsProgress[1]) data.levelsProgress[1] = { unlocked: true, stars: 0 };
      data.settings = Object.assign({ sound: true, vibration: true, effects: true, music: true }, old.settings || {});
      data.achievements = old.achievements || {};
      return true;
    } catch (e) { return false; }
  }
  function load() {
    try {
      var raw = localStorage.getItem(NEW_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        data = Object.assign(defaults(), p);
        data.settings = Object.assign(defaults().settings, p.settings || {});
        if (data.settings.music === undefined) data.settings.music = true;
        data.equipped = Object.assign(defaults().equipped, p.equipped || {});
        data.inventory = Object.assign(defaults().inventory, p.inventory || {});
        data.rewards = Object.assign(defaults().rewards, p.rewards || {});
        if (!data.puzzleProgress || !data.puzzleProgress[1]) {
          data.puzzleProgress = Object.assign({ 1: { unlocked: true, stars: 0 } }, data.puzzleProgress || {});
        }
      } else if (migrateOld()) {
        save(); // persist migrated copy under new key; old key left intact as backup
      }
    } catch (e) { data = defaults(); }
    return data;
  }
  function save() {
    try { data.version = 1; localStorage.setItem(NEW_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function resetKeepSettings() {
    var s = data.settings;
    data = defaults(); data.settings = s; save();
  }
  return { load: load, save: save, resetKeepSettings: resetKeepSettings,
    get data() { return data; } };
})();
