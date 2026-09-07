/* BB boot — load, migrate, init engine + UI, daily check. Prototype file untouched. */
(function () {
  BB.Save.load();
  BB.Audio.sound.muted = !BB.Save.data.settings.sound;
  BB.Music.init();
  BB.Engine.init("gameCanvas");
  BB.UI.decor();
  BB.UI.bind();
  BB.UI.refreshHome();
  gameState = "HOME";
  // QA helpers: ?nodaily=1 skips daily modal, ?autostart=blitz|infinite|level:N jumps in
  var qs = "";
  try { qs = window.location.search || ""; } catch (e) {}
  if (qs.indexOf("nodaily") < 0 && !BB.UI.dailyCheck()) BB.UI.show("homeScreen");
  else BB.UI.show("homeScreen");
  try {
    var m = qs.match(/autostart=([a-z]+)(?::(\d+))?/);
    if (m) {
      if (m[1] === "blitz") startBlitz();
      else if (m[1] === "infinite") startInfinite();
      else if (m[1] === "level") startLevel(parseInt(m[2] || "1", 10));
    }
  } catch (e) {}
})();
