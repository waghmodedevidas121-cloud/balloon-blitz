/* BB.Economy — coins/gems, shop inventory, equip. Cosmetic-only, no real money. */
window.BB = window.BB || {};
BB.Economy = (function () {
  function d() { return BB.Save.data; }
  function canAfford(cost) {
    cost = cost || {};
    return (d().coins || 0) >= (cost.coins || 0) && (d().gems || 0) >= (cost.gems || 0);
  }
  function pay(cost) {
    if (!canAfford(cost)) return false;
    cost = cost || {};
    d().coins -= (cost.coins || 0); d().gems -= (cost.gems || 0);
    BB.Save.save(); return true;
  }
  function addCoins(n) { d().coins = (d().coins || 0) + n; BB.Save.save(); }
  function addGems(n) { d().gems = (d().gems || 0) + n; BB.Save.save(); }
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function owned(type, id) { return (d().inventory[type] || []).indexOf(id) >= 0; }
  function buy(type, id) {
    var cat = type === "skins" ? BB.Content.SKINS : BB.Content.EFFECTS;
    var item = find(cat, id);
    if (!item || owned(type, id)) return false;
    if (!pay(item.cost)) return false;
    d().inventory[type].push(id); d().equipped[type === "skins" ? "skin" : "effect"] = id;
    BB.Save.save(); return true;
  }
  function equip(type, id) {
    if (!owned(type, id)) return false;
    d().equipped[type === "skins" ? "skin" : "effect"] = id;
    BB.Save.save(); return true;
  }
  function skinColors() {
    var s = find(BB.Content.SKINS, d().equipped.skin);
    return (s && s.colors) || null;
  }
  function effectId() { return d().equipped.effect || "spark"; }
  function costText(cost) {
    cost = cost || {}; var p = [];
    if (cost.coins) p.push(cost.coins + " 🪙"); if (cost.gems) p.push(cost.gems + " 💎");
    return p.length ? p.join(" ") : "Free";
  }
  return { canAfford: canAfford, addCoins: addCoins, addGems: addGems, buy: buy, equip: equip,
    owned: owned, skinColors: skinColors, effectId: effectId, costText: costText };
})();
