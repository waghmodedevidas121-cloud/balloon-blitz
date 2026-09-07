/* BB.Content — content-driven catalog. Add LEVEL 11 / NEW BALLOON / NEW SKIN here, no engine rewrite. */
window.BB = window.BB || {};
BB.Content = {
  LEVELS: [
    { id: 1, target: 18, time: 40, desc: "Pop 18 balloons" },
    { id: 2, target: 30, time: 35, desc: "Pop 30 balloons" },
    { id: 3, target: 4, time: 30, desc: "Pop 4 Golden balloons", type: "gold" },
    { id: 4, target: 3, time: 30, desc: "Detonate 3 Bombs", type: "bomb" },
    { id: 5, target: 4, time: 30, desc: "Pop 4 Slow-Mo balloons", type: "freeze" },
    { id: 6, target: 12, time: 30, desc: "Reach 12x Combo", type: "combo" },
    { id: 7, target: 45, time: 35, desc: "Pop 45 Fast balloons" },
    { id: 8, target: 5, time: 35, desc: "Detonate 5 Bombs", type: "bomb" },
    { id: 9, target: 2, time: 40, desc: "Trigger 2 Fevers", type: "fever" },
    { id: 10, target: 2000, time: 40, desc: "Score 2,000 pts", type: "score" }
  ],
  SPECS: {
    RED:    { key: "RED",    color: "#ff3823", points: 10,  speed: 2.2, r: 36, prob: 0.22 },
    PINK:   { key: "PINK",   color: "#ff4da6", points: 15,  speed: 2.3, r: 36, prob: 0.20 },
    BLUE:   { key: "BLUE",   color: "#1bb2eb", points: 20,  speed: 2.7, r: 34, prob: 0.20 },
    GREEN:  { key: "GREEN",  color: "#42d61a", points: 30,  speed: 3.0, r: 34, prob: 0.16 },
    GOLD:   { key: "GOLD",   color: "#ffcc00", points: 100, speed: 4.4, r: 33, prob: 0.07, isGold: true },
    BOMB:   { key: "BOMB",   color: "#222533", points: 0,   speed: 2.0, r: 36, prob: 0.05, isBomb: true },
    FREEZE: { key: "FREEZE", color: "#00e5ff", points: 25,  speed: 2.3, r: 34, prob: 0.05, isFreeze: true },
    GIFT:   { key: "GIFT",   color: "#a855f7", points: 15,  speed: 2.6, r: 34, prob: 0.05, isGift: true }
  },
  SKINS: [
    { id: "default", name: "Classic Pop", cost: { coins: 0 }, colors: null, desc: "Original arcade look" },
    { id: "candy",   name: "Candy Pop",   cost: { coins: 300 }, colors: { RED: "#ff5da2", BLUE: "#7dd0ff", GREEN: "#7dffb2" }, desc: "Sweet pastel burst" },
    { id: "magma",   name: "Magma Pop",   cost: { coins: 800 }, colors: { RED: "#ff4d00", BLUE: "#ff9a3d", GREEN: "#ffd23f" }, desc: "Hot lava balloons" },
    { id: "royal",   name: "Royal Pop",   cost: { gems: 5 }, colors: { RED: "#c26bff", BLUE: "#6b8cff", GREEN: "#5dffd3" }, desc: "Premium neon royalty" }
  ],
  EFFECTS: [
    { id: "spark", name: "Spark Shards", cost: { coins: 0 }, desc: "Classic square burst" },
    { id: "orbit", name: "Orbit Pop", cost: { coins: 250 }, desc: "Round bubble burst" },
    { id: "comet", name: "Comet Pop", cost: { gems: 3 }, desc: "Bright comet core" }
  ],
  ACHIEVEMENTS: [
    { id: "first_pop",  icon: "🎈", name: "First Pop",          desc: "Pop your first balloon",      reward: { coins: 25 } },
    { id: "bomb10",     icon: "💥", name: "Bomb Expert",        desc: "Detonate 10 bombs",           reward: { coins: 100 } },
    { id: "fever1",     icon: "🔥", name: "Fever Master",       desc: "Trigger Fever Mode",          reward: { coins: 80 } },
    { id: "combo12",    icon: "⚡", name: "Combo King",         desc: "Reach a 12x combo",           reward: { coins: 120 } },
    { id: "pop300",     icon: "👑", name: "Balloon Master",     desc: "Pop 300 balloons total",      reward: { gems: 3 } },
    { id: "camp_done",  icon: "🏆", name: "Campaign Complete",  desc: "Clear all 10 stages",         reward: { gems: 5 } }
  ],
  POWERUPS: [
    { id: "gatling", name: "Gatling Gun", icon: "⚡", color: "#ffd23f" },
    { id: "shotgun", name: "Triple Spread", icon: "🎯", color: "#ff5e7a" },
    { id: "laser", name: "Laser Cannon", icon: "🔆", color: "#00f5d4" },
    { id: "time", name: "+10s Time", icon: "⏱️", color: "#33ff77" },
    { id: "life", name: "+1 Life", icon: "❤️", color: "#ff5e7a" }
  ],
  DAILY: [
    { day: 1, coins: 50, icon: "🪙", label: "+50" },
    { day: 2, coins: 100, icon: "🪙", label: "+100" },
    { day: 3, coins: 150, icon: "🪙", label: "+150" },
    { day: 4, gems: 2, icon: "💎", label: "+2 Gems" },
    { day: 5, coins: 250, icon: "🪙", label: "+250" },
    { day: 6, coins: 400, icon: "🪙", label: "+400" },
    { day: 7, coins: 800, gems: 5, icon: "👑", label: "800 + 5💎" }
  ],
  MISSIONS: [
    { id: "m_pop50",  name: "Warm Fingers", desc: "Pop 50 balloons today",  target: 50,   reward: { coins: 50 }, metric: "pop" },
    { id: "m_score1k", name: "High Roller", desc: "Score 1,000 in one game", target: 1000, reward: { coins: 60 }, metric: "score" },
    { id: "m_fever",  name: "Fever Dream",  desc: "Trigger Fever once",     target: 1,    reward: { coins: 40 }, metric: "fever" }
  ]
};
