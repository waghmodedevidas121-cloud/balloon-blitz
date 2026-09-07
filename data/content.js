/* BB.Content — content-driven catalog with 500 Progressive Levels & 20 Worlds. */
window.BB = window.BB || {};

(function () {
  var WORLDS = [
    { id: 1,  name: "Sunny Valley",      icon: "☀️", start: 1,   end: 25 },
    { id: 2,  name: "Rainbow Meadow",     icon: "🌈", start: 26,  end: 50 },
    { id: 3,  name: "Neon Carnival",      icon: "🎪", start: 51,  end: 75 },
    { id: 4,  name: "Thunder Grove",      icon: "⚡", start: 76,  end: 100 },
    { id: 5,  name: "Candy Kingdom",      icon: "🍭", start: 101, end: 125 },
    { id: 6,  name: "Frost Glacier",      icon: "❄️", start: 126, end: 150 },
    { id: 7,  name: "Molten Volcano",     icon: "🌋", start: 151, end: 175 },
    { id: 8,  name: "Mystic Jungle",      icon: "🌴", start: 176, end: 200 },
    { id: 9,  name: "Crystal Cavern",     icon: "💎", start: 201, end: 225 },
    { id: 10, name: "Sky Citadel",        icon: "🏰", start: 226, end: 250 },
    { id: 11, name: "Starry Twilight",    icon: "✨", start: 251, end: 275 },
    { id: 12, name: "Deep Coral",         icon: "🌊", start: 276, end: 300 },
    { id: 13, name: "Cyber Metropolis",   icon: "🏙️", start: 301, end: 325 },
    { id: 14, name: "Solar Flares",       icon: "☀️", start: 326, end: 350 },
    { id: 15, name: "Phantom Castle",     icon: "👻", start: 351, end: 375 },
    { id: 16, name: "Diamond Peaks",      icon: "🔷", start: 376, end: 400 },
    { id: 17, name: "Dragon's Lair",      icon: "🐉", start: 401, end: 425 },
    { id: 18, name: "Vortex Nebula",      icon: "🌀", start: 426, end: 450 },
    { id: 19, name: "Galactic Gates",     icon: "🚀", start: 451, end: 475 },
    { id: 20, name: "Cosmic Apex",        icon: "👑", start: 476, end: 500 }
  ];

  function generate500Levels() {
    var arr = [];
    var types = ["pop", "gold", "bomb", "freeze", "combo", "score", "shield", "pop"];
    var tutorial = [
      { target: 18, time: 40, desc: "Pop 18 balloons", type: "pop" },
      { target: 30, time: 35, desc: "Pop 30 balloons", type: "pop" },
      { target: 4,  time: 30, desc: "Pop 4 Golden balloons", type: "gold" },
      { target: 3,  time: 30, desc: "Detonate 3 Bombs", type: "bomb" },
      { target: 4,  time: 30, desc: "Pop 4 Slow-Mo balloons", type: "freeze" },
      { target: 12, time: 30, desc: "Reach 12x Combo", type: "combo" },
      { target: 45, time: 35, desc: "Pop 45 Fast balloons", type: "pop" },
      { target: 5,  time: 35, desc: "Detonate 5 Bombs", type: "bomb" },
      { target: 2,  time: 40, desc: "Trigger 2 Fevers", type: "fever" }
    ];

    for (var i = 1; i <= 500; i++) {
      var isBoss = (i % 10 === 0);
      var worldIdx = Math.floor((i - 1) / 25);
      var speedScale = 1.0 + Math.min(1.8, (i - 1) * 0.0035);
      var hasShields = (i >= 30);
      var hasHazards = (i >= 50);

      if (isBoss) {
        var bossHp = 15 + Math.floor(i * 0.28);
        arr.push({
          id: i,
          isBoss: true,
          target: bossHp,
          time: Math.max(30, 45 - Math.floor(i * 0.02)),
          desc: "Defeat King Blimp (" + bossHp + " HP)",
          type: "boss",
          speedMult: speedScale,
          hasShields: hasShields,
          hasHazards: hasHazards,
          world: worldIdx + 1
        });
      } else if (i <= 9) {
        var tut = tutorial[i - 1];
        arr.push(Object.assign({ id: i, speedMult: 1.0, world: 1 }, tut));
      } else {
        var t = types[(i * 3 + 5) % types.length];
        var targetVal = 20, descStr = "", timeLimit = Math.max(28, 42 - Math.floor(i * 0.025));

        if (t === "pop") {
          targetVal = 25 + Math.min(80, Math.floor(i * 0.18));
          descStr = "Pop " + targetVal + " balloons";
        } else if (t === "gold") {
          targetVal = 4 + Math.min(12, Math.floor(i * 0.03));
          descStr = "Collect " + targetVal + " Gold balloons";
        } else if (t === "bomb") {
          targetVal = 4 + Math.min(10, Math.floor(i * 0.025));
          descStr = "Detonate " + targetVal + " Bombs";
        } else if (t === "freeze") {
          targetVal = 4 + Math.min(10, Math.floor(i * 0.025));
          descStr = "Pop " + targetVal + " Slow-Mo balloons";
        } else if (t === "combo") {
          targetVal = Math.min(25, 10 + Math.floor(i * 0.04));
          descStr = "Reach " + targetVal + "x Combo";
        } else if (t === "score") {
          targetVal = 1500 + i * 25;
          descStr = "Score " + targetVal.toLocaleString() + " pts";
        } else if (t === "shield") {
          targetVal = 5 + Math.min(15, Math.floor(i * 0.04));
          descStr = "Shatter " + targetVal + " Shields 🛡️";
        }

        arr.push({
          id: i,
          target: targetVal,
          time: timeLimit,
          desc: descStr,
          type: t,
          speedMult: speedScale,
          hasShields: hasShields,
          hasHazards: hasHazards,
          world: worldIdx + 1
        });
      }
    }
    return arr;
  }

  window.BB.Content = {
    WORLDS: WORLDS,
    LEVELS: generate500Levels(),
    MAX_LEVELS: 500,
  PUZZLES: [
    {
      id: 1,
      name: "The First Domino",
      desc: "1 Dart: Follow the arrows! Find the starting trigger!",
      darts: 1,
      balloons: [
        { key: "RED", x: 0.22, y: 0.45, dir: "RIGHT" },
        { key: "RED", x: 0.50, y: 0.45, dir: "RIGHT" },
        { key: "RED", x: 0.78, y: 0.45, dir: "UP" }
      ]
    },
    {
      id: 2,
      name: "The Square Loop",
      desc: "1 Dart: A continuous 4-way loop! Any node clears it!",
      darts: 1,
      balloons: [
        { key: "BLUE", x: 0.32, y: 0.32, dir: "RIGHT" },
        { key: "BLUE", x: 0.68, y: 0.32, dir: "DOWN" },
        { key: "BLUE", x: 0.68, y: 0.58, dir: "LEFT" },
        { key: "BLUE", x: 0.32, y: 0.58, dir: "UP" }
      ]
    },
    {
      id: 3,
      name: "Double Fork",
      desc: "1 Dart: Center balloon shoots both left and right (↔️)!",
      darts: 1,
      balloons: [
        { key: "GOLD",  x: 0.50, y: 0.45, dir: "HORIZ" },
        { key: "GREEN", x: 0.22, y: 0.45, dir: "UP" },
        { key: "GREEN", x: 0.22, y: 0.26, dir: "RIGHT" },
        { key: "PINK",  x: 0.78, y: 0.45, dir: "DOWN" },
        { key: "PINK",  x: 0.78, y: 0.64, dir: "LEFT" }
      ]
    },
    {
      id: 4,
      name: "The Snake Path",
      desc: "1 Dart: Trace backwards to find the snake head!",
      darts: 1,
      balloons: [
        { key: "RED",  x: 0.22, y: 0.32, dir: "DOWN" },
        { key: "PINK", x: 0.78, y: 0.32, dir: "LEFT" },
        { key: "RED",  x: 0.22, y: 0.58, dir: "RIGHT" },
        { key: "PINK", x: 0.78, y: 0.58, dir: "UP" },
        { key: "GOLD", x: 0.78, y: 0.45, dir: "LEFT" }
      ]
    },
    {
      id: 5,
      name: "Bomb Detonator",
      desc: "1 Dart: Guide the needle into the 4-way Bomb!",
      darts: 1,
      balloons: [
        { key: "BOMB",  x: 0.50, y: 0.45, dir: "ALL" },
        { key: "RED",   x: 0.50, y: 0.24, dir: "DOWN" },
        { key: "BLUE",  x: 0.22, y: 0.45, dir: "DOWN" },
        { key: "BLUE",  x: 0.22, y: 0.66, dir: "RIGHT" },
        { key: "GREEN", x: 0.78, y: 0.45, dir: "UP" },
        { key: "GREEN", x: 0.78, y: 0.24, dir: "LEFT" },
        { key: "PINK",  x: 0.50, y: 0.66, dir: "LEFT" }
      ]
    },
    {
      id: 6,
      name: "Twin Circuits",
      desc: "2 Darts: Two separate arrow circuits!",
      darts: 2,
      balloons: [
        { key: "RED",  x: 0.30, y: 0.30, dir: "DOWN" },
        { key: "RED",  x: 0.30, y: 0.45, dir: "DOWN" },
        { key: "RED",  x: 0.30, y: 0.60, dir: "RIGHT" },
        { key: "BLUE", x: 0.70, y: 0.60, dir: "UP" },
        { key: "BLUE", x: 0.70, y: 0.45, dir: "UP" },
        { key: "BLUE", x: 0.70, y: 0.30, dir: "LEFT" }
      ]
    },
    {
      id: 7,
      name: "Crossfire Split",
      desc: "2 Darts: Master vertical (↕️) and horizontal (↔️) beamers!",
      darts: 2,
      balloons: [
        { key: "GOLD",  x: 0.50, y: 0.45, dir: "VERT" },
        { key: "GOLD",  x: 0.50, y: 0.30, dir: "HORIZ" },
        { key: "PINK",  x: 0.50, y: 0.16, dir: "LEFT" },
        { key: "PINK",  x: 0.50, y: 0.62, dir: "RIGHT" },
        { key: "GREEN", x: 0.22, y: 0.30, dir: "DOWN" },
        { key: "GREEN", x: 0.78, y: 0.30, dir: "DOWN" },
        { key: "BLUE",  x: 0.78, y: 0.62, dir: "LEFT" }
      ]
    },
    {
      id: 8,
      name: "The Matrix",
      desc: "2 Darts: Navigate through the grid circuit!",
      darts: 2,
      balloons: [
        { key: "RED",   x: 0.25, y: 0.28, dir: "RIGHT" },
        { key: "RED",   x: 0.50, y: 0.28, dir: "RIGHT" },
        { key: "RED",   x: 0.75, y: 0.28, dir: "DOWN" },
        { key: "BLUE",  x: 0.75, y: 0.45, dir: "LEFT" },
        { key: "BLUE",  x: 0.50, y: 0.45, dir: "DOWN" },
        { key: "BLUE",  x: 0.25, y: 0.45, dir: "UP" },
        { key: "GREEN", x: 0.50, y: 0.62, dir: "RIGHT" },
        { key: "GREEN", x: 0.75, y: 0.62, dir: "UP" }
      ]
    },
    {
      id: 9,
      name: "Sub-Zero Cross",
      desc: "2 Darts: Freeze shatters the row, unlocking the Bomb!",
      darts: 2,
      balloons: [
        { key: "FREEZE", x: 0.50, y: 0.32, dir: "HORIZ" },
        { key: "RED",    x: 0.25, y: 0.32, dir: "DOWN" },
        { key: "RED",    x: 0.75, y: 0.32, dir: "DOWN" },
        { key: "BOMB",   x: 0.50, y: 0.55, dir: "ALL" },
        { key: "GREEN",  x: 0.25, y: 0.55, dir: "RIGHT" },
        { key: "GREEN",  x: 0.75, y: 0.55, dir: "LEFT" }
      ]
    },
    {
      id: 10,
      name: "Grand Arrow Master",
      desc: "3 Darts: 12 directional balloons! The ultimate puzzle!",
      darts: 3,
      balloons: [
        { key: "GOLD",  x: 0.50, y: 0.44, dir: "ALL" },
        { key: "RED",   x: 0.25, y: 0.26, dir: "RIGHT" },
        { key: "RED",   x: 0.50, y: 0.26, dir: "RIGHT" },
        { key: "RED",   x: 0.75, y: 0.26, dir: "DOWN" },
        { key: "BLUE",  x: 0.75, y: 0.44, dir: "DOWN" },
        { key: "BLUE",  x: 0.75, y: 0.62, dir: "LEFT" },
        { key: "BLUE",  x: 0.50, y: 0.62, dir: "LEFT" },
        { key: "GREEN", x: 0.25, y: 0.62, dir: "UP" },
        { key: "GREEN", x: 0.25, y: 0.44, dir: "UP" },
        { key: "PINK",  x: 0.38, y: 0.35, dir: "DOWN" },
        { key: "PINK",  x: 0.62, y: 0.35, dir: "LEFT" },
        { key: "PINK",  x: 0.50, y: 0.53, dir: "UP" }
      ]
    }
  ],
  SLING_STAGES: [
    {
      id: 1,
      name: "The Straight Pierce",
      desc: "2 Arrows: Aim straight through the row of 3 balloons!",
      arrows: 2,
      balloons: [
        { key: "RED", x: 0.50, y: 0.24 },
        { key: "RED", x: 0.50, y: 0.38 },
        { key: "RED", x: 0.50, y: 0.52 }
      ]
    },
    {
      id: 2,
      name: "TNT Barrel Blast",
      desc: "2 Arrows: Hit the center TNT Bomb to clear the ring!",
      arrows: 2,
      balloons: [
        { key: "BOMB",  x: 0.50, y: 0.38 },
        { key: "BLUE",  x: 0.34, y: 0.30 },
        { key: "BLUE",  x: 0.66, y: 0.30 },
        { key: "PINK",  x: 0.28, y: 0.46 },
        { key: "PINK",  x: 0.72, y: 0.46 },
        { key: "GREEN", x: 0.50, y: 0.54 }
      ]
    },
    {
      id: 3,
      name: "Wall Bounce Bank",
      desc: "2 Arrows: Bank off the left or right wall for a trickshot!",
      arrows: 2,
      balloons: [
        { key: "GOLD",  x: 0.18, y: 0.26 },
        { key: "GOLD",  x: 0.82, y: 0.26 },
        { key: "RED",   x: 0.18, y: 0.42 },
        { key: "RED",   x: 0.82, y: 0.42 }
      ]
    },
    {
      id: 4,
      name: "The Arc Bridge",
      desc: "2 Arrows: Match the gravity curve to pierce all 5!",
      arrows: 2,
      balloons: [
        { key: "BLUE",  x: 0.24, y: 0.44 },
        { key: "BLUE",  x: 0.37, y: 0.32 },
        { key: "GOLD",  x: 0.50, y: 0.26 },
        { key: "BLUE",  x: 0.63, y: 0.32 },
        { key: "BLUE",  x: 0.76, y: 0.44 }
      ]
    },
    {
      id: 5,
      name: "Pyramid Stack",
      desc: "2 Arrows: Hit the TNT foundation to topple the pyramid!",
      arrows: 2,
      balloons: [
        { key: "BOMB",  x: 0.50, y: 0.54 },
        { key: "GREEN", x: 0.36, y: 0.42 },
        { key: "GREEN", x: 0.64, y: 0.42 },
        { key: "PINK",  x: 0.43, y: 0.30 },
        { key: "PINK",  x: 0.57, y: 0.30 },
        { key: "GOLD",  x: 0.50, y: 0.18 }
      ]
    },
    {
      id: 6,
      name: "Twin Pillars",
      desc: "2 Arrows: 1 piercing arrow down each pillar!",
      arrows: 2,
      balloons: [
        { key: "RED",  x: 0.30, y: 0.24 },
        { key: "RED",  x: 0.30, y: 0.38 },
        { key: "RED",  x: 0.30, y: 0.52 },
        { key: "BLUE", x: 0.70, y: 0.24 },
        { key: "BLUE", x: 0.70, y: 0.38 },
        { key: "BLUE", x: 0.70, y: 0.52 }
      ]
    },
    {
      id: 7,
      name: "The Cross Target",
      desc: "2 Arrows: Split shot into the central Bomb!",
      arrows: 2,
      balloons: [
        { key: "BOMB",   x: 0.50, y: 0.40 },
        { key: "FREEZE", x: 0.50, y: 0.22 },
        { key: "FREEZE", x: 0.50, y: 0.58 },
        { key: "PINK",   x: 0.24, y: 0.40 },
        { key: "PINK",   x: 0.76, y: 0.40 }
      ]
    },
    {
      id: 8,
      name: "Sub-Zero Corridor",
      desc: "2 Arrows: Shatter with Freeze to unleash the double chain!",
      arrows: 2,
      balloons: [
        { key: "FREEZE", x: 0.50, y: 0.32 },
        { key: "BOMB",   x: 0.32, y: 0.48 },
        { key: "BOMB",   x: 0.68, y: 0.48 },
        { key: "GOLD",   x: 0.50, y: 0.18 },
        { key: "GREEN",  x: 0.20, y: 0.32 },
        { key: "GREEN",  x: 0.80, y: 0.32 }
      ]
    },
    {
      id: 9,
      name: "Double TNT Vault",
      desc: "2 Arrows: Trigger both explosive vaults!",
      arrows: 2,
      balloons: [
        { key: "BOMB", x: 0.35, y: 0.36 },
        { key: "BOMB", x: 0.65, y: 0.36 },
        { key: "RED",  x: 0.20, y: 0.24 },
        { key: "RED",  x: 0.50, y: 0.24 },
        { key: "RED",  x: 0.80, y: 0.24 },
        { key: "BLUE", x: 0.35, y: 0.52 },
        { key: "BLUE", x: 0.65, y: 0.52 }
      ]
    },
    {
      id: 10,
      name: "Carnival Master",
      desc: "3 Arrows: 11 targets! The grand trickshot finale!",
      arrows: 3,
      balloons: [
        { key: "BOMB",  x: 0.50, y: 0.38 },
        { key: "GOLD",  x: 0.35, y: 0.24 },
        { key: "GOLD",  x: 0.65, y: 0.24 },
        { key: "RED",   x: 0.20, y: 0.38 },
        { key: "RED",   x: 0.80, y: 0.38 },
        { key: "BLUE",  x: 0.35, y: 0.52 },
        { key: "BLUE",  x: 0.65, y: 0.52 },
        { key: "PINK",  x: 0.50, y: 0.20 },
        { key: "PINK",  x: 0.50, y: 0.56 },
        { key: "GREEN", x: 0.20, y: 0.56 },
        { key: "GREEN", x: 0.80, y: 0.56 }
      ]
    },
    {
      id: 11,
      name: "Ice Fortress",
      desc: "3 Arrows: Shatter through barriers to reach inner targets!",
      arrows: 3,
      balloons: [
        { key: "FREEZE", x: 0.50, y: 0.30 },
        { key: "GOLD",   x: 0.50, y: 0.18 },
        { key: "RED",    x: 0.30, y: 0.30 },
        { key: "RED",    x: 0.70, y: 0.30 },
        { key: "BLUE",   x: 0.40, y: 0.44 },
        { key: "BLUE",   x: 0.60, y: 0.44 }
      ]
    },
    {
      id: 12,
      name: "Double Wall Bank",
      desc: "3 Arrows: Bank arrow off left and right walls for trickshots!",
      arrows: 3,
      balloons: [
        { key: "GOLD",  x: 0.15, y: 0.24 },
        { key: "GOLD",  x: 0.85, y: 0.24 },
        { key: "BOMB",  x: 0.15, y: 0.42 },
        { key: "BOMB",  x: 0.85, y: 0.42 },
        { key: "RED",   x: 0.50, y: 0.20 }
      ]
    },
    {
      id: 13,
      name: "TNT Domino Cascade",
      desc: "2 Arrows: Trigger the explosive domino chain!",
      arrows: 2,
      balloons: [
        { key: "BOMB",  x: 0.30, y: 0.48 },
        { key: "BOMB",  x: 0.50, y: 0.36 },
        { key: "BOMB",  x: 0.70, y: 0.24 },
        { key: "GREEN", x: 0.20, y: 0.48 },
        { key: "PINK",  x: 0.80, y: 0.24 },
        { key: "GOLD",  x: 0.50, y: 0.20 }
      ]
    },
    {
      id: 14,
      name: "The Triple Pillar",
      desc: "3 Arrows: 3 vertical columns of pure targets!",
      arrows: 3,
      balloons: [
        { key: "RED",   x: 0.25, y: 0.24 },
        { key: "RED",   x: 0.25, y: 0.38 },
        { key: "RED",   x: 0.25, y: 0.52 },
        { key: "GOLD",  x: 0.50, y: 0.20 },
        { key: "BOMB",  x: 0.50, y: 0.34 },
        { key: "GOLD",  x: 0.50, y: 0.48 },
        { key: "BLUE",  x: 0.75, y: 0.24 },
        { key: "BLUE",  x: 0.75, y: 0.38 },
        { key: "BLUE",  x: 0.75, y: 0.52 }
      ]
    },
    {
      id: 15,
      name: "Frozen Citadel",
      desc: "3 Arrows: Freeze blasts clear the exterior shield!",
      arrows: 3,
      balloons: [
        { key: "FREEZE", x: 0.35, y: 0.35 },
        { key: "FREEZE", x: 0.65, y: 0.35 },
        { key: "BOMB",   x: 0.50, y: 0.46 },
        { key: "GOLD",   x: 0.50, y: 0.22 },
        { key: "PINK",   x: 0.20, y: 0.24 },
        { key: "PINK",   x: 0.80, y: 0.24 },
        { key: "GREEN",  x: 0.50, y: 0.58 }
      ]
    },
    {
      id: 16,
      name: "The Orbiting Crown",
      desc: "3 Arrows: Golden crown formation surrounding a TNT core!",
      arrows: 3,
      balloons: [
        { key: "BOMB",  x: 0.50, y: 0.36 },
        { key: "GOLD",  x: 0.36, y: 0.22 },
        { key: "GOLD",  x: 0.50, y: 0.18 },
        { key: "GOLD",  x: 0.64, y: 0.22 },
        { key: "BLUE",  x: 0.28, y: 0.36 },
        { key: "BLUE",  x: 0.72, y: 0.36 },
        { key: "RED",   x: 0.36, y: 0.50 },
        { key: "RED",   x: 0.64, y: 0.50 }
      ]
    },
    {
      id: 17,
      name: "Ricochet Alley",
      desc: "3 Arrows: Double bounce trickshots required!",
      arrows: 3,
      balloons: [
        { key: "RED",   x: 0.16, y: 0.20 },
        { key: "RED",   x: 0.84, y: 0.20 },
        { key: "BLUE",  x: 0.16, y: 0.34 },
        { key: "BLUE",  x: 0.84, y: 0.34 },
        { key: "GOLD",  x: 0.50, y: 0.28 },
        { key: "BOMB",  x: 0.50, y: 0.42 }
      ]
    },
    {
      id: 18,
      name: "Sub-Zero Vault",
      desc: "3 Arrows: Dual freeze keys to blast the vault!",
      arrows: 3,
      balloons: [
        { key: "FREEZE", x: 0.30, y: 0.28 },
        { key: "FREEZE", x: 0.70, y: 0.28 },
        { key: "BOMB",   x: 0.50, y: 0.36 },
        { key: "PINK",   x: 0.20, y: 0.42 },
        { key: "PINK",   x: 0.80, y: 0.42 },
        { key: "GOLD",   x: 0.40, y: 0.50 },
        { key: "GOLD",   x: 0.60, y: 0.50 }
      ]
    },
    {
      id: 19,
      name: "The Grand Matrix",
      desc: "4 Arrows: 12 targets in a magnificent 3x4 grid!",
      arrows: 4,
      balloons: [
        { key: "RED",   x: 0.25, y: 0.20 },
        { key: "GOLD",  x: 0.50, y: 0.20 },
        { key: "RED",   x: 0.75, y: 0.20 },
        { key: "BLUE",  x: 0.25, y: 0.32 },
        { key: "BOMB",  x: 0.50, y: 0.32 },
        { key: "BLUE",  x: 0.75, y: 0.32 },
        { key: "GREEN", x: 0.25, y: 0.44 },
        { key: "BOMB",  x: 0.50, y: 0.44 },
        { key: "GREEN", x: 0.75, y: 0.44 },
        { key: "PINK",  x: 0.25, y: 0.56 },
        { key: "GOLD",  x: 0.50, y: 0.56 },
        { key: "PINK",  x: 0.75, y: 0.56 }
      ]
    },
    {
      id: 20,
      name: "King Blimp Siege",
      desc: "4 Arrows: Massive fortress with explosive defenses!",
      arrows: 4,
      balloons: [
        { key: "BOMB",   x: 0.50, y: 0.36 },
        { key: "FREEZE", x: 0.35, y: 0.24 },
        { key: "FREEZE", x: 0.65, y: 0.24 },
        { key: "GOLD",   x: 0.50, y: 0.18 },
        { key: "RED",    x: 0.20, y: 0.36 },
        { key: "RED",    x: 0.80, y: 0.36 },
        { key: "BLUE",   x: 0.35, y: 0.48 },
        { key: "BLUE",   x: 0.65, y: 0.48 },
        { key: "GREEN",  x: 0.50, y: 0.56 }
      ]
    },
    {
      id: 21,
      name: "Twin Diamond Peaks",
      desc: "3 Arrows: Double diamond targets requiring clean center shots!",
      arrows: 3,
      balloons: [
        { key: "RED",  x: 0.30, y: 0.22 },
        { key: "GOLD", x: 0.20, y: 0.32 },
        { key: "GOLD", x: 0.40, y: 0.32 },
        { key: "BOMB", x: 0.30, y: 0.42 },
        { key: "BLUE", x: 0.70, y: 0.22 },
        { key: "GOLD", x: 0.60, y: 0.32 },
        { key: "GOLD", x: 0.80, y: 0.32 },
        { key: "BOMB", x: 0.70, y: 0.42 }
      ]
    },
    {
      id: 22,
      name: "The Slalom Course",
      desc: "3 Arrows: S-curved obstacle course testing your aim arc!",
      arrows: 3,
      balloons: [
        { key: "RED",   x: 0.25, y: 0.20 },
        { key: "BLUE",  x: 0.45, y: 0.28 },
        { key: "BOMB",  x: 0.65, y: 0.36 },
        { key: "GREEN", x: 0.45, y: 0.44 },
        { key: "PINK",  x: 0.25, y: 0.52 },
        { key: "GOLD",  x: 0.75, y: 0.22 }
      ]
    },
    {
      id: 23,
      name: "Double Helix",
      desc: "4 Arrows: Interlocking twin spirals of candy balloons!",
      arrows: 4,
      balloons: [
        { key: "RED",   x: 0.35, y: 0.18 },
        { key: "BLUE",  x: 0.65, y: 0.18 },
        { key: "BOMB",  x: 0.50, y: 0.26 },
        { key: "BLUE",  x: 0.35, y: 0.34 },
        { key: "RED",   x: 0.65, y: 0.34 },
        { key: "BOMB",  x: 0.50, y: 0.42 },
        { key: "GREEN", x: 0.35, y: 0.50 },
        { key: "PINK",  x: 0.65, y: 0.50 },
        { key: "GOLD",  x: 0.50, y: 0.58 }
      ]
    },
    {
      id: 24,
      name: "Explosive Crossfire",
      desc: "4 Arrows: Quad bombs guarding the inner gold treasure!",
      arrows: 4,
      balloons: [
        { key: "GOLD", x: 0.50, y: 0.36 },
        { key: "BOMB", x: 0.50, y: 0.22 },
        { key: "BOMB", x: 0.50, y: 0.50 },
        { key: "BOMB", x: 0.30, y: 0.36 },
        { key: "BOMB", x: 0.70, y: 0.36 },
        { key: "RED",  x: 0.20, y: 0.22 },
        { key: "RED",  x: 0.80, y: 0.22 },
        { key: "BLUE", x: 0.20, y: 0.50 },
        { key: "BLUE", x: 0.80, y: 0.50 }
      ]
    },
    {
      id: 25,
      name: "Grand Archery Master",
      desc: "5 Arrows: 15 targets! The ultimate fantasy trickshot championship!",
      arrows: 5,
      balloons: [
        { key: "GOLD",   x: 0.50, y: 0.16 },
        { key: "FREEZE", x: 0.35, y: 0.24 },
        { key: "FREEZE", x: 0.65, y: 0.24 },
        { key: "BOMB",   x: 0.50, y: 0.32 },
        { key: "RED",    x: 0.20, y: 0.28 },
        { key: "RED",    x: 0.80, y: 0.28 },
        { key: "BLUE",   x: 0.20, y: 0.42 },
        { key: "BLUE",   x: 0.80, y: 0.42 },
        { key: "BOMB",   x: 0.35, y: 0.46 },
        { key: "BOMB",   x: 0.65, y: 0.46 },
        { key: "PINK",   x: 0.50, y: 0.46 },
        { key: "GREEN",  x: 0.25, y: 0.56 },
        { key: "GREEN",  x: 0.75, y: 0.56 },
        { key: "GOLD",   x: 0.40, y: 0.58 },
        { key: "GOLD",   x: 0.60, y: 0.58 }
      ]
    }
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
})();
