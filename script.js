// ==============================
// F.L.U.F.F.Y - script.js
// With AI, FX, Swap Fixes, and Card Zoom
// ==============================

// ---------- DATA ----------
const COMBAT_CARDS = [
  // 24 HP (1)
  { name: "Vor’næth", hp: 24, img: "assets/vornaeth.png", tier: "24" },
  // 18 HP (4)
  { name: "Hilakoh",   hp: 18, img: "assets/hilakoh.png",  tier: "18" },
  { name: "Hielga",    hp: 18, img: "assets/hielga.png",   tier: "18" },
  { name: "Clair",     hp: 18, img: "assets/clair.png",    tier: "18" },
  { name: "Chloe",     hp: 18, img: "assets/chloe.png",    tier: "18" },
  // 12 HP (6)
  { name: "Glinky",    hp: 12, img: "assets/glinky.png",    tier: "12" },
  { name: "Jahmp",     hp: 12, img: "assets/jahmp.png",     tier: "12" },
  { name: "Besal",     hp: 12, img: "assets/besal.png",     tier: "12" },
  { name: "Nyxroth",   hp: 12, img: "assets/nyxaroth.png",  tier: "12" },
  { name: "Uvogorr",   hp: 12, img: "assets/ulvogorr.png",  tier: "12" },
  { name: "Echthuun",  hp: 12, img: "assets/echthuun.png",  tier: "12" },
  // 6 HP (7)
  { name: "Mint",       hp: 6, img: "assets/mint.png",       tier: "6" },
  { name: "Sedama",     hp: 6, img: "assets/sedama.png",     tier: "6" },
  { name: "Cynthia",    hp: 6, img: "assets/cynthia.png",    tier: "6" },
  { name: "Cassandra",  hp: 6, img: "assets/cassandra.png",  tier: "6" },
  { name: "Carol",      hp: 6, img: "assets/carol.png",      tier: "6" },
  { name: "Azqurath",   hp: 6, img: "assets/azqurath.png",   tier: "6" },
  { name: "Ka’rythul",  hp: 6, img: "assets/karythul.png",   tier: "6" },
];

// 6 specials: 2 heal, 2 swap, 1 revive, 1 skip
const SPECIAL_CARDS = [
  { name: "Weepy (Heal)",     type: "heal",   img: "assets/weepy.png" },
  { name: "Heal",             type: "heal",   img: "assets/heal2.png" },
  { name: "Glorpus (Swap)",   type: "swap",   img: "assets/glorpus.png" },
  { name: "Swap",             type: "swap",   img: "assets/swap2.png" },
  { name: "Payaso (Revival)", type: "revive", img: "assets/payaso.png" },
  { name: "Skipa (Skip)",     type: "skip",   img: "assets/skip.png" },
];

// ---------- TABLES ----------
function damageForTier(tier, roll) {
  if (tier === "24") {
    if (roll === 20) return 12;
    if (roll >= 16)  return 10;
    if (roll >= 11)  return 8;
    return 6;
  }
  if (tier === "18") {
    if (roll === 20) return 10;
    if (roll >= 16)  return 8;
    if (roll >= 11)  return 6;
    return 4;
  }
  if (tier === "12") {
    if (roll === 20) return 8;
    if (roll >= 16)  return 7;
    if (roll >= 11)  return 5;
    return 3;
  }
  if (tier === "6") {
    if (roll === 20) return 6;
    if (roll >= 16)  return 5;
    if (roll >= 11)  return 3;
    return 1;
  }
  return 0;
}

function healAmount(roll) {
  if (roll === 20) return "FULL";
  if (roll >= 16)  return 8;
  if (roll >= 11)  return 6;
  return 3;
}

function revivePercent(roll) {
  if (roll === 20) return 1.0;
  if (roll >= 16)  return 0.75;
  if (roll >= 11)  return 0.5;
  return 0.25;
}

function swapOutcome(roll) {
  if (roll === 20) return { mode: "swapAndExtraTurn" };
  if (roll >= 16)  return { mode: "swapAnyTwo" };
  if (roll >= 11)  return { mode: "youChooseOpponentCard" };
  return { mode: "opponentPicksRandom" };
}

function skipOutcome(roll) {
  if (roll === 20) return { skip: 2, rollTwiceChooseBest: true };
  if (roll >= 16)  return { skip: 2 };
  if (roll >= 11)  return { skip: 1 };
  return { skip: 1 };
}

// ---------- UTILS ----------
const $ = sel => document.querySelector(sel);

function d20() {
  return Math.floor(Math.random() * 20) + 1;
}

function log(msg) {
  const el = document.createElement('div');
  el.className = 'entry newest';
  el.textContent = msg;

  const old = document.querySelector('#log .newest');
  if (old) old.classList.remove('newest');

  $('#log').prepend(el);
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ---------- SOUND ----------
const sounds = {};

function initSounds() {
  try {
    sounds.click = new Audio('click.mp3');
    sounds.hover = new Audio('hover.mp3');
  } catch (e) {
    // if files missing, it's fine
  }
}

function playSound(name) {
  const s = sounds[name];
  if (!s) return;
  try {
    s.currentTime = 0;
    s.play();
  } catch (e) {}
}

// ---------- CONFETTI ----------
function spawnConfetti(count = 80, duration = 3500) {
  for (let i = 0; i < count; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti-piece';
    conf.style.left = Math.random() * 100 + 'vw';
    conf.style.backgroundColor = `hsl(${Math.random() * 360},80%,60%)`;
    conf.style.animationDelay = (Math.random() * 0.5) + 's';
    document.body.appendChild(conf);
  }
  setTimeout(() => {
    document.querySelectorAll('.confetti-piece').forEach(e => e.remove());
  }, duration);
}

// ---------- DICE ANIMATION ----------
function animateDice(roll) {
  const dice = document.getElementById('dice-animation');
  if (!dice) return;
  dice.style.backgroundImage = "url('assets/d20.png')";
  dice.style.display = 'block';

  dice.style.animation = 'none';
  void dice.offsetWidth;  // restart animation
  dice.style.animation = 'diceRoll 0.8s ease';

  setTimeout(() => {
    dice.style.display = 'none';
  }, 900);
}

// ---------- DAMAGE / HEAL FX HELPERS ----------
function showFloatingText(cardNode, text, type) {
  const rect = cardNode.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `floating-text ${type}`;
  el.textContent = text;

  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top  = (rect.top  + rect.height / 2) + 'px';

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function playShake(cardNode) {
  cardNode.classList.add('shake');
  setTimeout(() => cardNode.classList.remove('shake'), 300);
}

function playBlood(cardNode) {
  const rect = cardNode.getBoundingClientRect();
  const splat = document.createElement('div');
  splat.className = 'blood-splatter';
  splat.style.left = (rect.left + rect.width / 2 - 45) + 'px';
  splat.style.top  = (rect.top  + rect.height / 2 - 45) + 'px';
  document.body.appendChild(splat);
  setTimeout(() => splat.remove(), 500);
}

function playHealGlow(cardNode) {
  cardNode.classList.add('heal-glow');
  setTimeout(() => cardNode.classList.remove('heal-glow'), 800);
}

function playSparkles(cardNode, count = 12) {
  const rect = cardNode.getBoundingClientRect();
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';

    const angle = Math.random() * Math.PI * 2;
    const dist  = 40 + Math.random() * 20;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    s.style.setProperty('--dx', dx + 'px');
    s.style.setProperty('--dy', dy + 'px');

    s.style.left = (rect.left + rect.width / 2) + 'px';
    s.style.top  = (rect.top  + rect.height / 2) + 'px';

    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}

// ---------- AI TOGGLE ----------
let AI_ENABLED = false;  // false = Human vs Human, true = Player 2 is AI

// ---------- STATE ----------
const state = {
  players: [
    { id: 0, name: "Player 1", combats: [], specials: [], graveyard: [], skipTurns: 0 },
    { id: 1, name: "Player 2", combats: [], specials: [], graveyard: [], skipTurns: 0 },
  ],
  current: 0,
  attackRoll: null,
  selectedOwn: null,
  targetOpponent: null,
  hasRolled: false,
  gameOver: false,
};

// ---------- SETUP ----------
function setupGame() {
  state.players.forEach(p => {
    p.combats = [];
    p.specials = [];
    p.graveyard = [];
    p.skipTurns = 0;
  });

  state.attackRoll = null;
  state.selectedOwn = null;
  state.targetOpponent = null;
  state.hasRolled = false;
  state.gameOver = false;

  $('#roll-result').textContent = 'Roll: —';
  $('#log').innerHTML = '';

  // initiative: both roll; reroll on tie
  let p1, p2;
  do {
    p1 = d20();
    p2 = d20();
  } while (p1 === p2);

  state.current = (p1 > p2) ? 0 : 1;
  log(`Start Roll — P1: ${p1}, P2: ${p2}. ${state.players[state.current].name} starts.`);
  $('#roll-result').textContent =
    `P1:${p1} vs P2:${p2} → ${state.players[state.current].name} starts`;

  dealCards();
  render();
  updateTurnIndicator();

  if (AI_ENABLED && state.current === 1 && !state.gameOver) {
    scheduleAITurn();
  }
}

function dealCards() {
  const shuffledCombat  = shuffle([...COMBAT_CARDS]);
  const shuffledSpecial = shuffle([...SPECIAL_CARDS]);

  state.players[0].combats = shuffledCombat.slice(0, 9).map(c => ({
    ...c,
    id: crypto.randomUUID(),
    maxhp: c.hp,
    alive: true,
    type: 'combat'
  }));
  state.players[1].combats = shuffledCombat.slice(9, 18).map(c => ({
    ...c,
    id: crypto.randomUUID(),
    maxhp: c.hp,
    alive: true,
    type: 'combat'
  }));

  state.players[0].specials = shuffledSpecial.slice(0, 3).map(s => ({
    ...s,
    id: crypto.randomUUID(),
    type: s.type
  }));
  state.players[1].specials = shuffledSpecial.slice(3, 6).map(s => ({
    ...s,
    id: crypto.randomUUID(),
    type: s.type
  }));
}

// ---------- RENDER ----------
function updateTurnIndicator() {
  $('#turn-indicator').textContent = `Turn: ${state.players[state.current].name}`;
  updateActivePlayerHighlight();
}

function updateActivePlayerHighlight() {
  document.querySelectorAll('.player-area').forEach((el, idx) => {
    el.classList.toggle('active', idx === state.current);
  });
}

function render() {
  renderPlayer(0, 'p1');
  renderPlayer(1, 'p2');
}

function renderPlayer(idx, key) {
  const p    = state.players[idx];
  const area = document.getElementById(`${key}-hand`);
  if (!area) return;

  area.innerHTML = '';

  const h2 = document.createElement('h2');
  h2.textContent = p.name;
  area.appendChild(h2);

  area.appendChild(sectionLabel('Combat Cards'));
  area.appendChild(renderGrid(p.combats, p));

  area.appendChild(sectionLabel('Special Cards'));
  area.appendChild(renderGrid(p.specials, p, true));

  area.appendChild(sectionLabel('Graveyard'));
  const gy = document.createElement('div');
  gy.className = 'graveyard';
  p.graveyard.forEach(c => {
    const g = document.createElement('div');
    g.className = 'grave-card fade-in-up';
    g.style.backgroundImage = `url('${c.img || ''}')`;
    gy.appendChild(g);
  });
  area.appendChild(gy);
}

function sectionLabel(text) {
  const el = document.createElement('div');
  el.className = 'section-label';
  el.textContent = text;
  return el;
}

function renderGrid(cards, owner, isSpecial = false) {
  const grid = document.createElement('div');
  grid.className = isSpecial ? 'special-row' : 'combat-grid';
  cards.forEach(card => {
    grid.appendChild(renderCard(card, owner, isSpecial));
  });
  return grid;
}

function renderCard(card, owner, isSpecial) {
  const tpl  = document.getElementById('card-template');
  const node = tpl.content.firstElementChild.cloneNode(true);

  node.dataset.cardId = card.id;
  node.dataset.owner  = owner.id;

  const imgEl  = node.querySelector('.img');
  const nameEl = node.querySelector('.name');
  imgEl.style.backgroundImage = `url('${card.img || ''}')`;
  nameEl.textContent = card.name + (card.type === 'combat' ? '' : ' • ' + card.type.toUpperCase());

  // selection highlights
  if (state.selectedOwn && state.selectedOwn.id === card.id) {
    node.classList.add('selected-own');
  }
  if (state.targetOpponent && state.targetOpponent.id === card.id) {
    node.classList.add('selected-target');
  }

  const actionsEl = node.querySelector('.actions');

  if (card.type === 'combat') {
    updateHPUI(node, card);
    const btn = document.createElement('button');
    btn.textContent = (owner.id === state.current ? 'Select' : 'Target');

    const isAITurn = AI_ENABLED && state.current === 1;
    const disableAITurnClick = isAITurn && owner.id === 1;

    btn.disabled = (
      (owner.id === state.current && state.attackRoll == null) ||
      state.gameOver ||
      disableAITurnClick
    );

    btn.onclick = () => {
      if (state.gameOver) return;

      const isAITurnNow = AI_ENABLED && state.current === 1;
      if (isAITurnNow && owner.id === 1) {
        log("AI is thinking... please wait.");
        return;
      }

      if (owner.id === state.current) {
        if (!card.alive) return log('Dead card.');
        if (state.attackRoll == null) return log('Roll first.');
        state.selectedOwn = card;
        state.targetOpponent = null;
        log(`${owner.name} selected ${card.name}, now pick target.`);
        render();
      } else {
        if (!state.selectedOwn) return log('Select your attacker.');
        if (!card.alive)       return log('Target dead.');
        state.targetOpponent = card;
        render();
        doAttack();
      }
    };

    actionsEl.appendChild(btn);
  } else {
    // special card
    const hpbar  = node.querySelector('.hpbar');
    const hptext = node.querySelector('.hptext');
    if (hpbar)  hpbar.remove();
    if (hptext) hptext.remove();

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';

    const isAITurn = AI_ENABLED && state.current === 1;
    const disableAITurnClick = isAITurn && owner.id === 1;

    playBtn.disabled = (
      owner.id !== state.current ||
      state.attackRoll == null ||
      state.gameOver ||
      disableAITurnClick
    );

    playBtn.onclick = () => playSpecial(owner, card);
    actionsEl.appendChild(playBtn);
  }

  // Always-visible blue "+" icon for zoomed preview
  const plus = document.createElement('div');
  plus.className = 'card-plus';
  plus.textContent = '+';
  plus.onclick = (e) => {
    e.stopPropagation();
    openCardPreview(card);
  };
  node.appendChild(plus);

  return node;
}

function updateHPUI(node, card) {
  const fill = node.querySelector('.hpfill');
  const txt  = node.querySelector('.hptext');
  if (!fill || !txt) return;
  const pct = Math.max(0, Math.round((card.hp / card.maxhp) * 100));
  fill.style.width = pct + '%';
  txt.textContent  = `HP: ${Math.max(0, card.hp)}/${card.maxhp}`;
}

// ---------- GAMEPLAY ----------
function rollAndShow() {
  if (state.gameOver) {
    log('Game is over. Press Reset to play again.');
    return;
  }

  if (AI_ENABLED && state.current === 1) {
    log("It's the AI's turn. Please wait.");
    return;
  }

  if (state.hasRolled) {
    log('You can only roll once per turn.');
    return;
  }

  const r = d20();
  state.attackRoll = r;
  state.hasRolled = true;

  $('#roll-result').textContent = `Roll: ${r}`;
  log(`${state.players[state.current].name} rolled ${r}.`);

  animateDice(r);
  playSound('click');

  render();
  return r;
}

function doAttack() {
  if (state.gameOver) return;
  const a = state.selectedOwn,
        t = state.targetOpponent;

  if (!a || !t) return;

  const me  = state.players[state.current];
  const opp = state.players[1 - state.current];

  if (state.attackRoll == null) return log('Roll first.');

  const roll = state.attackRoll;
  state.attackRoll = null;

  const dmg = damageForTier(a.tier, roll);
  t.hp -= dmg;

  log(`${me.name}'s ${a.name} rolled ${roll} → dealt ${dmg} damage to ${opp.name}'s ${t.name}.`);

  // VISUAL FX: Damage
  const node = document.querySelector(`[data-card-id="${t.id}"]`);
  if (node) {
    playShake(node);
    playBlood(node);
    showFloatingText(node, `-${dmg}`, 'damage');
  }

  if (t.hp <= 0) {
    t.alive = false;
    log(`${t.name} has been destroyed!`);
    opp.graveyard.push(t);
    opp.combats = opp.combats.filter(c => c.id !== t.id);
  }

  state.selectedOwn = null;
  state.targetOpponent = null;

  render();
  endTurn();
}

// ---------- SPECIAL CARDS ----------
function playSpecial(owner, card) {
  if (state.gameOver) return;
  if (owner.id !== state.current) return log('Not your turn.');
  if (state.attackRoll == null) return log('Roll first.');

  // AI cannot play specials
  if (AI_ENABLED && owner.id === 1) {
    log('AI does not use special cards.');
    return;
  }

  const r = state.attackRoll;
  state.attackRoll = null;

  switch (card.type) {
    case 'heal':   return doHeal(owner, card, r);
    case 'revive': return doRevive(owner, card, r);
    case 'swap':   return doSwap(owner, card, r);
    case 'skip':   return doSkip(owner, card, r);
  }
}

function removeSpecial(owner, card) {
  owner.specials = owner.specials.filter(s => s.id !== card.id);
  render();
}

// ---------- HEAL ----------
function doHeal(owner, card, roll) {
  const alive = owner.combats.filter(c => c.alive);
  if (!alive.length) return log('No alive cards.');

  openCardPicker(alive, 'Choose a card to HEAL:', (chosen) => {
    const amt = healAmount(roll);

    if (amt === 'FULL') {
      chosen.hp = chosen.maxhp;
      log(`${owner.name} FULL HEALED ${chosen.name}!`);
    } else {
      chosen.hp = Math.min(chosen.maxhp, chosen.hp + amt);
      log(`${owner.name} healed ${chosen.name} by ${amt}.`);
    }

    // FX
    const node = document.querySelector(`[data-card-id="${chosen.id}"]`);
    if (node) {
      playHealGlow(node);
      playSparkles(node);
      showFloatingText(node, `+${amt === 'FULL' ? chosen.maxhp : amt}`, 'heal');
    }

    removeSpecial(owner, card);
    render();
    endTurn();
  });
}

// ---------- REVIVE ----------
function doRevive(owner, card, roll) {
  const gy = owner.graveyard;
  if (!gy.length) return log('No dead cards.');

  openCardPicker(gy, 'Choose a card to REVIVE:', (chosen) => {
    const pct = revivePercent(roll);
    chosen.hp = Math.round(chosen.maxhp * pct);
    chosen.alive = true;

    owner.combats.push(chosen);
    owner.graveyard = owner.graveyard.filter(x => x.id !== chosen.id);

    log(`${owner.name} revived ${chosen.name} (${Math.round(pct * 100)}%)!`);

    // FX
    const area = document.querySelector('#game-board');
    if (area) playSparkles(area, 16);

    removeSpecial(owner, card);
    render();
    endTurn();
  });
}

// ---------- SKIP ----------
function doSkip(owner, card, roll) {
  const out = skipOutcome(roll);
  const opp = state.players[1 - owner.id];

  opp.skipTurns += out.skip;

  log(`${owner.name} used SKIP → ${opp.name} skips ${out.skip} turn(s).`);

  removeSpecial(owner, card);
  render();

  endTurn(); // skip consumes your turn
}

// ---------- SWAP (FULLY FIXED) ----------
function doSwap(owner, card, roll) {
  const out = swapOutcome(roll);
  const mode = out.mode;

  const me  = owner;
  const opp = state.players[1 - owner.id];

  const myAlive  = me.combats.filter(c => c.alive);
  const oppAlive = opp.combats.filter(c => c.alive);

  if (!myAlive.length || !oppAlive.length) {
    log('Swap not possible.');
    return;
  }

  // Mode A — Opponent chooses randomly
  if (mode === 'opponentPicksRandom') {
    const give = myAlive[Math.floor(Math.random() * myAlive.length)];
    const rec  = oppAlive[Math.floor(Math.random() * oppAlive.length)];

    const myIndex = me.combats.findIndex(x => x.id === give.id);
    const opIndex = opp.combats.findIndex(x => x.id === rec.id);

    if (myIndex >= 0 && opIndex >= 0) {
      const tmp = me.combats[myIndex];
      me.combats[myIndex] = opp.combats[opIndex];
      opp.combats[opIndex] = tmp;
    }

    log(`${opp.name} randomly swapped ${give.name} ↔ ${rec.name}.`);

    removeSpecial(owner, card);
    render();
    endTurn();
    return;
  }

  // Mode B — Multi-step selection
  let oppNeed = 1, myNeed = 1;
  if (mode === 'swapAnyTwo' || mode === 'swapAndExtraTurn') {
    oppNeed = 2;
    myNeed = 2;
  }

  const keepTurn = (mode === 'swapAndExtraTurn');

  // STEP 1 — Pick opponent cards
  function step1() {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <h3>Pick ${oppNeed === 1 ? 'an opponent card' : 'two opponent cards'}:</h3>
      <p>Roll: ${roll}</p>
      <div class="picker-grid"></div>
      <div class="picker-footer">
        <button class="cancel-btn">Cancel</button>
        <button class="next-btn" disabled>Next</button>
      </div>
    `;

    const grid = panel.querySelector('.picker-grid');
    modal.appendChild(panel);
    document.body.appendChild(modal);

    let selectedOpp = [];

    oppAlive.forEach(cardX => {
      const b = document.createElement('button');
      b.className = 'picker-item card-picker-medium';
      b.innerHTML = `
        <div class="picker-card-img"></div>
        <div class="picker-card-name">${cardX.name}</div>
      `;
      b.querySelector('.picker-card-img').style.backgroundImage =
        `url('${cardX.img}')`;

      b.onclick = () => {
        const idx = selectedOpp.findIndex(c => c.id === cardX.id);
        if (idx >= 0) {
          selectedOpp.splice(idx, 1);
          b.classList.remove('selected');
        } else {
          if (selectedOpp.length >= oppNeed) return;
          selectedOpp.push(cardX);
          b.classList.add('selected');
        }
        panel.querySelector('.next-btn').disabled =
          (selectedOpp.length !== oppNeed);
      };

      grid.appendChild(b);
    });

    // CANCEL FIX — keeps roll, frees UI
    panel.querySelector('.cancel-btn').onclick = () => {
      modal.remove();
      state.selectedOwn = null;
      state.targetOpponent = null;
      render();
    };

    panel.querySelector('.next-btn').onclick = () => {
      if (selectedOpp.length !== oppNeed) return;
      modal.remove();
      step2(selectedOpp);
    };
  }

  // STEP 2 — Pick your own cards
  function step2(selectedOpp) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <h3>Pick ${myNeed === 1 ? 'your card' : 'your cards'} to give:</h3>
      <div class="picker-grid"></div>
      <div class="picker-footer">
        <button class="back-btn">Back</button>
        <button class="swap-btn" disabled>Swap</button>
      </div>
    `;

    const grid = panel.querySelector('.picker-grid');
    modal.appendChild(panel);
    document.body.appendChild(modal);

    let selectedMine = [];

    myAlive.forEach(cardX => {
      const b = document.createElement('button');
      b.className = 'picker-item card-picker-medium';
      b.innerHTML = `
        <div class="picker-card-img"></div>
        <div class="picker-card-name">${cardX.name}</div>
      `;
      b.querySelector('.picker-card-img').style.backgroundImage =
        `url('${cardX.img}')`;

      b.onclick = () => {
        const idx = selectedMine.findIndex(c => c.id === cardX.id);
        if (idx >= 0) {
          selectedMine.splice(idx, 1);
          b.classList.remove('selected');
        } else {
          if (selectedMine.length >= myNeed) return;
          selectedMine.push(cardX);
          b.classList.add('selected');
        }
        panel.querySelector('.swap-btn').disabled =
          (selectedMine.length !== myNeed);
      };

      grid.appendChild(b);
    });

    // BACK FIX — keeps roll & normal gameplay
    panel.querySelector('.back-btn').onclick = () => {
      modal.remove();
      state.selectedOwn = null;
      state.targetOpponent = null;
      step1();
    };

    panel.querySelector('.swap-btn').onclick = () => {
      if (selectedMine.length !== myNeed) return;
      modal.remove();
      performSwap(selectedOpp, selectedMine);
    };
  }

  // PERFORM SWAP
  function performSwap(oppSel, mySel) {
    const pairs = [];

    for (let i = 0; i < oppSel.length; i++) {
      const oppCard = oppSel[i];
      const myCard  = mySel[i];

      const myIndex = me.combats.findIndex(x => x.id === myCard.id);
      const opIndex = opp.combats.findIndex(x => x.id === oppCard.id);

      if (myIndex >= 0 && opIndex >= 0) {
        const tmp = me.combats[myIndex];
        me.combats[myIndex] = opp.combats[opIndex];
        opp.combats[opIndex] = tmp;
        pairs.push(`${myCard.name} ↔ ${oppCard.name}`);
      }
    }

    log(`${me.name} swapped: ${pairs.join(', ')}.`);

    removeSpecial(owner, card);
    render();

    if (!keepTurn) endTurn();
  }

  step1();
}

// ---------- CARD PREVIEW (Zoomed View) ----------
function openCardPreview(card) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.style.maxWidth = "420px";
  panel.style.textAlign = "center";

  panel.innerHTML = `
    <h2>${card.name}</h2>
    <img src="${card.img}" alt="${card.name}" style="
      width: 100%;
      max-width: 260px;
      border-radius: 12px;
      display: block;
      margin: 0 auto 12px;
    ">
    <div style="text-align:right;">
      <button id="preview-close">Close</button>
    </div>
  `;

  modal.appendChild(panel);
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('preview-close').onclick = () => modal.remove();
}

// ---------- CARD PICKER (Heal / Revive / Swap Step 1) ----------
function openCardPicker(cards, title, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h3>${title}</h3>
    <div class="picker-grid"></div>
  `;

  const grid = panel.querySelector('.picker-grid');
  modal.appendChild(panel);
  document.body.appendChild(modal);

  cards.forEach(c => {
    const b = document.createElement('button');
    b.className = 'picker-item card-picker-medium';
    b.innerHTML = `
      <div class="picker-card-img"></div>
      <div class="picker-card-name">${c.name}</div>
    `;
    b.querySelector('.picker-card-img').style.backgroundImage = `url('${c.img}')`;

    b.onclick = () => {
      modal.remove();
      callback(c);
    };

    grid.appendChild(b);
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

// ---------- SIMPLE IMAGE MODAL ----------
function openImageModal(src, title) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>${title}</h2>
    <img src="${src}" class="info-image">
    <div style="text-align:right;margin-top:10px;">
      <button id="info-close-btn">Close</button>
    </div>
  `;

  modal.appendChild(panel);
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('info-close-btn').onclick = () => modal.remove();
}

// ---------- SIMPLE TEXT MODAL ----------
function openSimpleModal(title, bodyHTML) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>${title}</h2>
    <div>${bodyHTML}</div>
    <div style="text-align:right;margin-top:10px;">
      <button id="info-close-btn">Close</button>
    </div>
  `;

  modal.appendChild(panel);
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  document.getElementById('info-close-btn').onclick = () => modal.remove();
}

// ---------- SETTINGS MODAL (AI Toggle) ----------
function openSettingsModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <h2>Settings</h2>
    <div class="settings-row">
      <span>AI Opponent (Player 2):</span>
      <button id="ai-toggle-btn" class="ai-toggle-btn ${AI_ENABLED ? 'on' : ''}">
        ${AI_ENABLED ? 'Awaken the AI' : 'Let the human fight'}
      </button>
    </div>
    <p class="settings-hint">When awakened, Player 2 becomes a fully automated AI enemy.</p>
    <div style="text-align:right;margin-top:10px;">
      <button id="settings-close-btn">Close</button>
    </div>
  `;

  modal.appendChild(panel);
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  const toggleBtn = document.getElementById('ai-toggle-btn');
  const closeBtn  = document.getElementById('settings-close-btn');

  toggleBtn.onclick = () => {
    AI_ENABLED = !AI_ENABLED;
    log(`AI opponent ${AI_ENABLED ? 'awakened' : 'disabled'}.`);

    toggleBtn.textContent = AI_ENABLED ? 'Awaken the AI' : 'Let the human fight';
    toggleBtn.classList.toggle('on', AI_ENABLED);

    if (AI_ENABLED && state.current === 1 && !state.gameOver) {
      scheduleAITurn();
    }
  };

  closeBtn.onclick = () => modal.remove();
}

// ---------- AI LOGIC ----------
function scheduleAITurn() {
  if (!AI_ENABLED || state.gameOver) return;
  if (state.current !== 1) return;

  setTimeout(aiTakeTurn, 700);
}

function aiTakeTurn() {
  if (!AI_ENABLED || state.gameOver) return;
  if (state.current !== 1) return;

  const me  = state.players[1];
  const opp = state.players[0];

  const myAlive  = me.combats.filter(c => c.alive);
  const oppAlive = opp.combats.filter(c => c.alive);

  if (!myAlive.length || !oppAlive.length) return;

  const roll = d20();
  state.attackRoll = roll;
  state.hasRolled = true;

  $('#roll-result').textContent = `Roll: ${roll}`;
  log(`${me.name} (AI) rolled ${roll}.`);

  animateDice(roll);

  const attacker = myAlive[Math.floor(Math.random() * myAlive.length)];
  const target   = oppAlive[Math.floor(Math.random() * oppAlive.length)];

  state.selectedOwn = attacker;
  state.targetOpponent = target;
  render();

  setTimeout(() => {
    if (!AI_ENABLED || state.gameOver) return;
    if (state.current !== 1) return;

    doAttack();
  }, 700);
}

// ---------- GAME OVER ----------
function showGameOver(winnerName) {
  state.gameOver = true;

  const modal = document.createElement('div');
  modal.className = 'modal';

  const panel = document.createElement('div');
  panel.className = 'panel game-over-panel';
  panel.innerHTML = `
    <h2>Game Over!</h2>
    <p>${winnerName} wins!</p>
  `;

  const btn = document.createElement('button');
  btn.textContent = 'Play Again';
  btn.onclick = () => {
    modal.remove();
    document.querySelectorAll('.confetti-piece').forEach(e => e.remove());
    setupGame();
  };

  panel.appendChild(btn);
  modal.appendChild(panel);
  document.body.appendChild(modal);

  spawnConfetti(80, 3500);
}

// ---------- TURN LOGIC ----------
function endTurn() {
  for (const p of state.players) {
    if (p.combats.filter(c => c.alive).length === 0) {
      const winner = state.players[1 - p.id];
      log(`${winner.name} wins!`);
      showGameOver(winner.name);
      return;
    }
  }

  const next = 1 - state.current;
  const nextP = state.players[next];

  if (nextP.skipTurns > 0) {
    nextP.skipTurns--;
    log(`${nextP.name} skips a turn! (${nextP.skipTurns} left)`);

    state.attackRoll = null;
    state.hasRolled = false;
    updateTurnIndicator();
    render();

    if (AI_ENABLED && state.current === 1 && !state.gameOver)
      scheduleAITurn();

    return;
  }

  state.current = next;
  state.attackRoll = null;
  state.selectedOwn = null;
  state.targetOpponent = null;
  state.hasRolled = false;

  updateTurnIndicator();
  render();

  if (AI_ENABLED && state.current === 1 && !state.gameOver)
    scheduleAITurn();
}

// ---------- MAIN MENU ----------
function startGame() {
  if (!document.body.classList.contains('game-started')) {
    document.body.classList.add('game-started');
  }
  setupGame();
  spawnConfetti(40, 2500);
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  initSounds();

  // Main Menu buttons
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => playSound('hover'));
    btn.addEventListener('click', () => playSound('click'));
  });

  const startBtn    = document.querySelector('.menu-btn[data-action="start"]');
  const howBtn      = document.querySelector('.menu-btn[data-action="how"]');
  const settingsBtn = document.querySelector('.menu-btn[data-action="settings"]');
  const aboutBtn    = document.querySelector('.menu-btn[data-action="about"]');

  if (startBtn) startBtn.onclick = startGame;

  if (howBtn) {
    howBtn.onclick = () => openImageModal('howtoplay.png', 'How to Play');
  }

  if (settingsBtn) {
    settingsBtn.onclick = () => openSettingsModal();
  }

  if (aboutBtn) {
    aboutBtn.onclick = () =>
      openSimpleModal(
        'About F.L.U.F.F.Y',
        `<p><strong>F.L.U.F.F.Y</strong> is a turn-based card battle where creatures fight for asylum on your planet.</p>
         <p>Developed for Game Comp Lab 9: Software Game.</p>`
      );
  }

  // In-game controls
  $('#btn-roll').onclick = rollAndShow;
  $('#btn-reset').onclick = () => {
    if (!document.body.classList.contains('game-started')) {
      document.body.classList.add('game-started');
    }
    setupGame();
  };
});
