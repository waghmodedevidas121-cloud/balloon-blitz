/* BB boot — load, migrate, init engine + UI, daily check. */
(function () {
  // Splash Screen sequence (failsafe: loading can never trap the user)
  var splashText = document.querySelector(".splash-text");
  var splashFill = document.querySelector(".splash-loader-fill");
  var splashDone = false;
  function setProgress(pct, txt) {
    if (splashFill) splashFill.style.width = pct + "%";
    if (txt && splashText) splashText.innerText = txt;
  }
  function hideSplash() {
    if (splashDone) return; splashDone = true;
    var splash = document.getElementById("splashScreen");
    if (splash) splash.classList.add("hidden");
  }
  setTimeout(hideSplash, 5000); // absolute failsafe
  setProgress(40, "INITIALIZING...");

  setTimeout(function() {
    try {
      BB.Save.load();
      BB.Audio.sound.muted = !BB.Save.data.settings.sound;
      BB.Music.init();
      setProgress(70, "LOADING ASSETS...");

      BB.Engine.init("gameCanvas");
      BB.UI.decor();
      BB.UI.bind();
      BB.UI.refreshHome();
      gameState = "HOME";
      setProgress(100, "READY!");

      setTimeout(function() {
        hideSplash();
        try {
          if (!BB.UI.dailyCheck()) BB.UI.show("homeScreen");
        } catch (e) { BB.UI.show("homeScreen"); }
      }, 400); // Hold at 100% for a moment
    } catch (e) {
      hideSplash();
      try { BB.UI.show("homeScreen"); } catch (e2) {}
    }
  }, 100);
})();
