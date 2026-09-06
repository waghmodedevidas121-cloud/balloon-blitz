/* BB.Rewards — daily login + streak + daily missions. All local, expandable. */
window.BB = window.BB || {};
BB.Rewards = (function () {
  function today() { return new Date().toISOString().slice(0, 10); }
  function yesterday() { var t = new Date(Date.now() - 864e5); return t.toISOString().slice(0, 10); }
  function dailyStatus() {
    var r = BB.Save.data.rewards;
    if (r.lastDaily === today()) return { claimable: false, streak: r.streak };
    return { claimable: true, streak: (r.lastDaily === yesterday()) ? r.streak + 1 : 1 };
  }
  function claimDaily() {
    var r = BB.Save.data.rewards, st = dailyStatus();
    if (!st.claimable) return null;
    r.streak = ((r.streak || 0) >= 7 || st.streak === 1 && r.lastDaily !== yesterday()) ? st.streak : st.streak;
    if (r.streak > 7) r.streak = 1;
    r.lastDaily = today();
    var prize = BB.Content.DAILY[(r.streak - 1) % BB.Content.DAILY.length];
    if (prize.coins) BB.Save.data.coins = (BB.Save.data.coins || 0) + prize.coins;
    if (prize.gems) BB.Save.data.gems = (BB.Save.data.gems || 0) + prize.gems;
    BB.Save.save();
    return { prize: prize, streak: r.streak };
  }
  function dayStore() {
    var m = BB.Save.data.missions, t = today();
    if (!m.date || m.date !== t) { m.date = t; m.prog = {}; m.claimed = {}; BB.Save.save(); }
    return m;
  }
  function track(metric, n) {
    var m = dayStore(); n = n || 1;
    BB.Content.MISSIONS.forEach(function (ms) {
      if (ms.metric !== metric) return;
      if (metric === "score") m.prog[ms.id] = Math.max(m.prog[ms.id] || 0, n);
      else m.prog[ms.id] = (m.prog[ms.id] || 0) + n;
    });
    BB.Save.save();
  }
  function missions() {
    var m = dayStore();
    return BB.Content.MISSIONS.map(function (ms) {
      var p = m.prog[ms.id] || 0;
      return { def: ms, progress: Math.min(p, ms.target), done: p >= ms.target, claimed: !!m.claimed[ms.id] };
    });
  }
  function claimMission(id) {
    var m = dayStore(), ms = null;
    BB.Content.MISSIONS.forEach(function (x) { if (x.id === id) ms = x; });
    if (!ms || (m.prog[id] || 0) < ms.target || m.claimed[id]) return false;
    m.claimed[id] = true;
    if (ms.reward.coins) BB.Save.data.coins = (BB.Save.data.coins || 0) + ms.reward.coins;
    if (ms.reward.gems) BB.Save.data.gems = (BB.Save.data.gems || 0) + ms.reward.gems;
    BB.Save.save(); return true;
  }
  return { dailyStatus: dailyStatus, claimDaily: claimDaily, track: track, missions: missions, claimMission: claimMission };
})();
