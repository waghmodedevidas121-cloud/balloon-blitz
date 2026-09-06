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
    RED:    { key: "RED",    color: "#ff3366", points: 10,  speed: 2.2, r: 30, prob: 0.32 },
    BLUE:   { key: "BLUE",   color: "#33ccff", points: 20,  speed: 2.7, r: 28, prob: 0.23 },
    GREEN:  { key: "GREEN",  color: "#33ff77", points: 30,  speed: 3.1, r: 26, prob: 0.18 },
    GOLD:   { key: "GOLD",   color: "#ffd700", points: 100, speed: 4.5, r: 24, prob: 0.08, isGold: true },
    BOMB:   { key: "BOMB",   color: "#161826", points: 0,   speed: 2.0, r: 32, prob: 0.07, isBomb: true },
    FREEZE: { key: "FREEZE", color: "#00f5d4", points: 25,  speed: 2.3, r: 26, prob: 0.05, isFreeze: true },
    GIFT:   { key: "GIFT",   color: "#c26bff", points: 15,  speed: 2.6, r: 27, prob: 0.07, isGift: true }
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
    { coins: 50 }, { coins: 75 }, { coins: 100 }, { gems: 1 },
    { coins: 150 }, { coins: 200 }, { gems: 3 }
  ],
  MISSIONS: [
    { id: "m_pop50",  name: "Warm Fingers", desc: "Pop 50 balloons today",  target: 50,   reward: { coins: 50 }, metric: "pop" },
    { id: "m_score1k", name: "High Roller", desc: "Score 1,000 in one game", target: 1000, reward: { coins: 60 }, metric: "score" },
    { id: "m_fever",  name: "Fever Dream",  desc: "Trigger Fever once",     target: 1,    reward: { coins: 40 }, metric: "fever" }
  ]
};
