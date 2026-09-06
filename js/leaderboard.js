/* BB.Board — personal + local leaderboard. Global = clearly-labeled demo data. */
window.BB = window.BB || {};
BB.Board = (function () {
  var GLOBAL_DEMO = [
    { n: "Nova", score: 9800 }, { n: "Pixel", score: 7400 }, { n: "Aero", score: 6100 },
    { n: "Blitz", score: 4900 }, { n: "Comet", score: 3200 }
  ];
  function addScore(mode, score) {
    if (!score) return;
    BB.Save.data.board.push({ n: "YOU", mode: mode, score: score, date: Date.now() });
    if (BB.Save.data.board.length > 60) BB.Save.data.board.splice(0, BB.Save.data.board.length - 60);
    BB.Save.save();
  }
  function sorted(rows) { return rows.slice().sort(function (a, b) { return b.score - a.score; }); }
  function local() {
    return sorted(BB.Save.data.board.map(function (e) { return { n: e.n + " • " + e.mode, score: e.score }; })).slice(0, 10);
  }
  function personal() {
    var u = BB.Save.data;
    return [
      { n: "Blitz best", score: u.blitzHighScore || 0 },
      { n: "Survival best", score: u.infiniteHighScore || 0 }
    ];
  }
  function weekly() {
    var week = Date.now() - 7 * 864e5;
    return sorted(BB.Save.data.board.filter(function (e) { return e.date >= week; })
      .map(function (e) { return { n: e.n + " • " + e.mode, score: e.score }; })).slice(0, 10);
  }
  function global() { return GLOBAL_DEMO; }
  return { addScore: addScore, local: local, personal: personal, weekly: weekly, global: global };
})();
