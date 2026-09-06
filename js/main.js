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
  if (!BB.UI.dailyCheck()) BB.UI.show("homeScreen");
})();
