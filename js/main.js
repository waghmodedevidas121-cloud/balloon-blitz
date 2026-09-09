/* BB boot — load, migrate, init engine + UI, daily check. */
(function () {
  // Splash Screen sequence
  var splashText = document.querySelector(".splash-text");
  var splashFill = document.querySelector(".splash-loader-fill");
  if (splashFill) splashFill.style.width = "40%";
  
  setTimeout(function() {
    BB.Save.load();
    BB.Audio.sound.muted = !BB.Save.data.settings.sound;
    BB.Music.init();
    if (splashFill) splashFill.style.width = "70%";
    if (splashText) splashText.innerText = "LOADING ASSETS...";
    
    setTimeout(function() {
      BB.Engine.init("gameCanvas");
      BB.UI.decor();
      BB.UI.bind();
      BB.UI.refreshHome();
      gameState = "HOME";
      
      if (splashFill) splashFill.style.width = "100%";
      if (splashText) splashText.innerText = "READY!";
      
      setTimeout(function() {
        var splash = document.getElementById("splashScreen");
        if (splash) splash.classList.add("hidden");
        
        if (!BB.UI.dailyCheck()) BB.UI.show("homeScreen");
      }, 400); // Hold at 100% for a moment
    }, 150);
  }, 100);
})();
