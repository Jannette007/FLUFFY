// ==============================
// F.L.U.F.F.Y - script.js (3x3 layout + Main Menu)
// ==============================

// ---------- DATA ----------
const COMBAT_CARDS = [
  // 24 HP (1)
  {name:"Vor’næth", hp:24, img:"assets/vornaeth.png", tier:"24"},
  // 18 HP (4)
  {name:"Hilakoh", hp:18, img:"assets/hilakoh.png", tier:"18"},
  {name:"Hielga",  hp:18, img:"assets/hielga.png",  tier:"18"},
  {name:"Clair",   hp:18, img:"assets/clair.png",   tier:"18"},
  {name:"Chloe",   hp:18, img:"assets/chloe.png",   tier:"18"},
  // 12 HP (6)
  {name:"Glinky",  hp:12, img:"assets/glinky.png",   tier:"12"},
  {name:"Jahmp",   hp:12, img:"assets/jahmp.png",    tier:"12"},
  {name:"Besal",   hp:12, img:"assets/besal.png",    tier:"12"},
  {name:"Nyxroth", hp:12, img:"assets/nyxaroth.png", tier:"12"},
  {name:"Uvogorr", hp:12, img:"assets/ulvogorr.png", tier:"12"},
  {name:"Echthuun",hp:12, img:"assets/echthuun.png", tier:"12"},
  // 6 HP (7)
  {name:"Mint",     hp:6, img:"assets/mint.png",     tier:"6"},
  {name:"Sedama",   hp:6, img:"assets/sedama.png",   tier:"6"},
  {name:"Cynthia",  hp:6, img:"assets/cynthia.png",  tier:"6"},
  {name:"Cassandra",hp:6, img:"assets/cassandra.png",tier:"6"},
  {name:"Carol",    hp:6, img:"assets/carol.png",    tier:"6"},
  {name:"Azqurath", hp:6, img:"assets/azqurath.png", tier:"6"},
  {name:"Ka’rythul",hp:6, img:"assets/karythul.png", tier:"6"},
];

// 6 specials: 2 heal, 2 swap, 1 revive, 1 skip
const SPECIAL_CARDS = [
  {name:"Weepy (Heal)",    type:"heal",   img:"assets/weepy.png"},
  {name:"Heal",            type:"heal",   img:"assets/heal2.png"},
  {name:"Glorpus (Swap)",  type:"swap",   img:"assets/glorpus.png"},
  {name:"Swap",            type:"swap",   img:"assets/swap2.png"},
  {name:"Payaso (Revival)",type:"revive", img:"assets/payaso.png"},
  {name:"Skipa (Skip)",    type:"skip",   img:"assets/skip.png"},
];

// ---------- TABLES ----------
function damageForTier(tier, roll){
  if(tier==="24"){
    if(roll===20) return 12;
    if(roll>=16)  return 10;
    if(roll>=11)  return 8;
    return 6;
  }
  if(tier==="18"){
    if(roll===20) return 10;
    if(roll>=16)  return 8;
    if(roll>=11)  return 6;
    return 4;
  }
  if(tier==="12"){
    if(roll===20) return 8;
    if(roll>=16)  return 7;
    if(roll>=11)  return 5;
    return 3;
  }
  if(tier==="6"){
    if(roll===20) return 6;
    if(roll>=16)  return 5;
    if(roll>=11)  return 3;
    return 1;
  }
  return 0;
}
function healAmount(roll){
  if(roll===20) return "FULL";
  if(roll>=16)  return 8;
  if(roll>=11)  return 6;
  return 3;
}
function revivePercent(roll){
  if(roll===20) return 1.0;
  if(roll>=16)  return 0.75;
  if(roll>=11)  return 0.5;
  return 0.25;
}
function swapOutcome(roll){
  if(roll===20) return {mode:"swapAndExtraTurn"};
  if(roll>=16)  return {mode:"swapAnyTwo"};
  if(roll>=11)  return {mode:"youChooseOpponentCard"};
  return {mode:"opponentPicksRandom"};
}
function skipOutcome(roll){
  if(roll===20) return {skip:2, rollTwiceChooseBest:true};
  if(roll>=16)  return {skip:2};
  if(roll>=11)  return {skip:1};
  return {skip:1};
}

// ---------- UTILS ----------
const $ = s => document.querySelector(s);
function d20(){ return Math.floor(Math.random()*20)+1; }
function log(msg){
  const el = document.createElement('div');
  el.className = 'entry';
  el.textContent = msg;
  $('#log').prepend(el);
}
function shuffle(a){ return a.sort(()=>Math.random()-0.5); }

// ---------- SOUND ----------
const sounds = {};
function initSounds(){
  try{
    sounds.click = new Audio('click.mp3');
    sounds.hover = new Audio('hover.mp3');
  }catch(e){
    // if files missing, it's fine
  }
}
function playSound(name){
  const s = sounds[name];
  if(!s) return;
  try{
    s.currentTime = 0;
    s.play();
  }catch(e){}
}

// ---------- CONFETTI ----------
function spawnConfetti(count=80, duration=3500){
  for(let i=0;i<count;i++){
    const conf=document.createElement('div');
    conf.className='confetti-piece';
    conf.style.left = Math.random()*100 + 'vw';
    conf.style.backgroundColor = `hsl(${Math.random()*360},80%,60%)`;
    conf.style.animationDelay = (Math.random()*0.5)+'s';
    document.body.appendChild(conf);
  }
  setTimeout(()=>{
    document.querySelectorAll('.confetti-piece').forEach(e=>e.remove());
  }, duration);
}

// ---------- STATE ----------
const state = {
  players: [
    {id:0, name:"Player 1", combats:[], specials:[], graveyard:[], skipTurns:0},
    {id:1, name:"Player 2", combats:[], specials:[], graveyard:[], skipTurns:0},
  ],
  current: 0,
  attackRoll: null,
  selectedOwn: null,
  targetOpponent: null,
  hasRolled: false,
  gameOver: false,
};

// ---------- SETUP ----------
function setupGame(){
  state.players.forEach(p=>{ p.combats=[]; p.specials=[]; p.graveyard=[]; p.skipTurns=0; });
  state.attackRoll=null;
  state.selectedOwn=null;
  state.targetOpponent=null;
  state.hasRolled=false;
  state.gameOver=false;
  $('#roll-result').textContent = 'Roll: —';
  $('#log').innerHTML = '';

  // initiative: both roll; reroll on tie
  let p1,p2; do{p1=d20();p2=d20();}while(p1===p2);
  state.current = (p1>p2)?0:1;
  log(`Start Roll — P1:${p1}, P2:${p2}. ${state.players[state.current].name} starts.`);
  $('#roll-result').textContent=`P1:${p1} vs P2:${p2} → ${state.players[state.current].name} starts`;

  dealCards(); render(); updateTurnIndicator();
}

function dealCards(){
  const shuffledCombat=shuffle([...COMBAT_CARDS]);
  const shuffledSpecial=shuffle([...SPECIAL_CARDS]);
  state.players[0].combats=shuffledCombat.slice(0,9).map(c=>({...c,id:crypto.randomUUID(),maxhp:c.hp,alive:true,type:'combat'}));
  state.players[1].combats=shuffledCombat.slice(9,18).map(c=>({...c,id:crypto.randomUUID(),maxhp:c.hp,alive:true,type:'combat'}));
  state.players[0].specials=shuffledSpecial.slice(0,3).map(s=>({...s,id:crypto.randomUUID(),type:s.type}));
  state.players[1].specials=shuffledSpecial.slice(3,6).map(s=>({...s,id:crypto.randomUUID(),type:s.type}));
}

// ---------- RENDER ----------
function updateTurnIndicator(){
  $('#turn-indicator').textContent=`Turn: ${state.players[state.current].name}`;
  updateActivePlayerHighlight();
}

function updateActivePlayerHighlight() {
  document.querySelectorAll('.player-area').forEach((el, idx) => {
    el.classList.toggle('active', idx === state.current);
  });
}

function render(){
  renderPlayer(0,'p1');
  renderPlayer(1,'p2');
}

function renderPlayer(idx,key){
  const p=state.players[idx];
  const area=document.getElementById(`${key}-hand`);
  area.innerHTML='';

  area.appendChild(sectionLabel('Combat Cards'));
  area.appendChild(renderGrid(p.combats,p));

  area.appendChild(sectionLabel('Special Cards'));
  area.appendChild(renderGrid(p.specials,p,true));

  area.appendChild(sectionLabel('Graveyard'));
  const gy=document.createElement('div');
  gy.className='graveyard';
  p.graveyard.forEach(c=>{
    const g=document.createElement('div');
    g.className='grave-card fade-in-up';
    g.style.backgroundImage=`url('${c.img||''}')`;
    gy.appendChild(g);
  });
  area.appendChild(gy);
}

function sectionLabel(text){
  const el=document.createElement('div');
  el.className='section-label';
  el.textContent=text;
  return el;
}

function renderGrid(cards,owner,isSpecial=false){
  const grid=document.createElement('div');
  grid.className=isSpecial?'special-row':'combat-grid';
  cards.forEach(card=>grid.appendChild(renderCard(card,owner,isSpecial)));
  return grid;
}

function renderCard(card,owner,isSpecial){
  const tpl=document.getElementById('card-template');
  const node=tpl.content.firstElementChild.cloneNode(true);
  node.dataset.cardId=card.id; node.dataset.owner=owner.id;
  node.querySelector('.img').style.backgroundImage=`url('${card.img||''}')`;
  node.querySelector('.name').textContent=card.name+(card.type==='combat'?'':' • '+card.type.toUpperCase());

  // selection highlights
  if(state.selectedOwn && state.selectedOwn.id===card.id){
    node.classList.add('selected-own');
  }
  if(state.targetOpponent && state.targetOpponent.id===card.id){
    node.classList.add('selected-target');
  }

  const act=node.querySelector('.actions');
  if(card.type==='combat'){
    updateHPUI(node,card);
    const btn=document.createElement('button');
    btn.textContent=(owner.id===state.current?'Select':'Target');
    btn.disabled=(owner.id===state.current && state.attackRoll==null) || state.gameOver;
    btn.onclick=()=>{
      if(state.gameOver) return;
      if(owner.id===state.current){
        if(!card.alive)return log('Dead card.');
        if(state.attackRoll==null)return log('Roll first.');
        state.selectedOwn=card;
        state.targetOpponent=null;
        log(`${owner.name} selected ${card.name}, now pick target.`);
        render();
      }else{
        if(!state.selectedOwn)return log('Select your attacker.');
        if(!card.alive)return log('Target dead.');
        state.targetOpponent=card; 
        render();
        doAttack();
      }
    };
    act.appendChild(btn);
  }else{
    node.querySelector('.hpbar').remove(); node.querySelector('.hptext').remove();
    const play=document.createElement('button');
    play.textContent='Play';
    play.disabled=(owner.id!==state.current||state.attackRoll==null||state.gameOver);
    play.onclick=()=>playSpecial(owner,card);
    act.appendChild(play);
  }
  return node;
}

function updateHPUI(node,card){
  const fill=node.querySelector('.hpfill');
  const txt=node.querySelector('.hptext');
  const pct=Math.max(0,Math.round((card.hp/card.maxhp)*100));
  fill.style.width=pct+'%';
  txt.textContent=`HP: ${Math.max(0,card.hp)}/${card.maxhp}`;
}

// ---------- GAMEPLAY ----------
function rollAndShow(){
  if(state.gameOver){
    log('Game is over. Press Reset to play again.');
    return;
  }
  if(state.hasRolled){
    log('You can only roll once per turn.');
    return;
  }
  const r=d20();
  state.attackRoll=r;
  state.hasRolled=true;
  $('#roll-result').textContent=`Roll: ${r}`;
  log(`${state.players[state.current].name} rolled ${r}.`);
  playSound('click');
  render();
  return r;
}

function doAttack(){
  if(state.gameOver) return;
  const a=state.selectedOwn,t=state.targetOpponent;
  const me=state.players[state.current],opp=state.players[1-state.current];
  if(!a || !t) return;
  if(state.attackRoll==null)return log('Roll first.');
  const roll=state.attackRoll; 
  state.attackRoll=null;

  const dmg=damageForTier(a.tier,roll); 
  t.hp-=dmg;
  log(`${me.name}'s ${a.name} rolled ${roll} → ${dmg} dmg to ${opp.name}'s ${t.name}.`);

  if(t.hp<=0){
    t.alive=false;
    log(`${t.name} destroyed!`);
    opp.graveyard.push(t);
    opp.combats=opp.combats.filter(c=>c.id!==t.id);
  }

  state.selectedOwn=null;
  state.targetOpponent=null;
  render();
  endTurn();
}

// ---------- SPECIALS ----------
function playSpecial(owner,card){
  if(state.gameOver) return;
  if(owner.id!==state.current)return log('Not your turn.');
  if(state.attackRoll==null)return log('Roll first.');
  const r=state.attackRoll; 
  state.attackRoll=null;
  switch(card.type){
    case'heal':return doHeal(owner,card,r);
    case'revive':return doRevive(owner,card,r);
    case'swap':return doSwap(owner,card,r);
    case'skip':return doSkip(owner,card,r);
  }
}

function removeSpecial(o,c){o.specials=o.specials.filter(s=>s.id!==c.id);render();}

function doHeal(o,c,r){
  const alive=o.combats.filter(c=>c.alive);
  if(!alive.length)return log('No alive cards.');
  openCardPicker(alive,'Choose a card to HEAL:',ch=>{
    const amt=healAmount(r);
    if(amt==='FULL'){ch.hp=ch.maxhp;log(`${o.name} FULL HEAL ${ch.name}`);}
    else{ch.hp=Math.min(ch.maxhp,ch.hp+amt);log(`${o.name} healed ${ch.name} by ${amt}.`);}
    removeSpecial(o,c);render();endTurn();
  });
}

function doRevive(o,c,r){
  if(o.combats.filter(c=>c.alive).length===0)return log('Cannot revive when dead.');
  const gy=o.graveyard;if(!gy.length)return log('No dead cards.');
  openCardPicker(gy,'Choose a card to REVIVE:',ch=>{
    const pct=revivePercent(r);ch.hp=Math.round(ch.maxhp*pct);
    ch.alive=true;o.combats.push(ch);o.graveyard=o.graveyard.filter(x=>x.id!==ch.id);
    log(`${o.name} revived ${ch.name} (${Math.round(pct*100)}%).`);
    removeSpecial(o,c);render();endTurn();
  });
}

function doSkip(o,c,r){
  const out=skipOutcome(r),opp=state.players[1-o.id];
  opp.skipTurns+=out.skip;
  log(`${o.name} used Skip → ${opp.name} skips ${out.skip} turn(s).`);
  removeSpecial(o,c);render();
  endTurn(); // skip counts as your turn
}

function doSwap(o,c,r){
  const out=swapOutcome(r),
        mode=out.mode,
        me=o,
        opp=state.players[1-o.id];
  const myAlive=me.combats.filter(x=>x.alive),
        oppAlive=opp.combats.filter(x=>x.alive);
  if(!myAlive.length||!oppAlive.length){
    log('Swap not possible.');
    return;
  }

  if(mode==='opponentPicksRandom'){
    const give=myAlive[Math.random()*myAlive.length|0],
          rec=oppAlive[Math.random()*oppAlive.length|0];
    const myIndex=me.combats.findIndex(x=>x.id===give.id);
    const opIndex=opp.combats.findIndex(x=>x.id===rec.id);
    if(myIndex>=0 && opIndex>=0){
      const tmp=me.combats[myIndex];
      me.combats[myIndex]=opp.combats[opIndex];
      opp.combats[opIndex]=tmp;
    }
    log(`${opp.name} randomly swapped ${give.name} ↔ ${rec.name}.`);
    removeSpecial(o,c);render();endTurn();
    return;
  }

  // For youChooseOpponentCard, swapAnyTwo, swapAndExtraTurn we use a 2-step UI
  let oppNeed=1, myNeed=1;
  if(mode==='swapAnyTwo' || mode==='swapAndExtraTurn'){
    oppNeed=2; myNeed=2;
  }
  const keepTurn=(mode==='swapAndExtraTurn');

  function step1(){
    const modal=document.createElement('div');
    modal.className='modal';
    const panel=document.createElement('div');
    panel.className='panel';
    panel.innerHTML=`<h3>Pick ${oppNeed===1?'an opponent card':'opponent cards'} to swap:</h3><p>Roll: ${r}</p>`;
    const grid=document.createElement('div');
    grid.className='picker-grid';
    panel.appendChild(grid);

    const footer=document.createElement('div');
    footer.style.marginTop='10px';
    footer.style.textAlign='right';

    const cancelBtn=document.createElement('button');
    cancelBtn.textContent='Cancel';
    cancelBtn.onclick=()=>document.body.removeChild(modal);

    const nextBtn=document.createElement('button');
    nextBtn.textContent='Next';
    nextBtn.disabled=true;

    let selectedOpp=[];
    oppAlive.forEach(card=>{
      const btn=document.createElement('button');
      btn.className='picker-item';
      btn.innerHTML=`<div class="picker-thumb" style="background-image:url('${card.img||''}')"></div><div>${card.name}</div>`;
      btn.onclick=()=>{
        const idx=selectedOpp.findIndex(c=>c.id===card.id);
        if(idx>=0){
          selectedOpp.splice(idx,1);
          btn.classList.remove('selected');
        }else{
          if(selectedOpp.length>=oppNeed) return;
          selectedOpp.push(card);
          btn.classList.add('selected');
        }
        nextBtn.disabled=(selectedOpp.length!==oppNeed);
      };
      grid.appendChild(btn);
    });

    nextBtn.onclick=()=>{
      if(selectedOpp.length!==oppNeed)return;
      document.body.removeChild(modal);
      step2(selectedOpp);
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(nextBtn);
    panel.appendChild(footer);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }

  function step2(selectedOpp){
    const modal=document.createElement('div');
    modal.className='modal';
    const panel=document.createElement('div');
    panel.className='panel';
    panel.innerHTML=`<h3>Pick ${myNeed===1?'your card':'your cards'} to give:</h3>`;
    const grid=document.createElement('div');
    grid.className='picker-grid';
    panel.appendChild(grid);

    const footer=document.createElement('div');
    footer.style.marginTop='10px';
    footer.style.textAlign='right';

    const backBtn=document.createElement('button');
    backBtn.textContent='Back';
    backBtn.onclick=()=>{ document.body.removeChild(modal); step1(); };

    const swapBtn=document.createElement('button');
    swapBtn.textContent='Swap';
    swapBtn.disabled=true;

    let selectedMine=[];
    myAlive.forEach(card=>{
      const btn=document.createElement('button');
      btn.className='picker-item';
      btn.innerHTML=`<div class="picker-thumb" style="background-image:url('${card.img||''}')"></div><div>${card.name}</div>`;
      btn.onclick=()=>{
        const idx=selectedMine.findIndex(c=>c.id===card.id);
        if(idx>=0){
          selectedMine.splice(idx,1);
          btn.classList.remove('selected');
        }else{
          if(selectedMine.length>=myNeed) return;
          selectedMine.push(card);
          btn.classList.add('selected');
        }
        swapBtn.disabled=(selectedMine.length!==myNeed);
      };
      grid.appendChild(btn);
    });

    swapBtn.onclick=()=>{
      if(selectedMine.length!==myNeed)return;
      document.body.removeChild(modal);
      performSwap(selectedOpp,selectedMine);
    };

    footer.appendChild(backBtn);
    footer.appendChild(swapBtn);
    panel.appendChild(footer);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }

  function performSwap(oppSel,mySel){
    const pairs=[];
    for(let i=0;i<oppSel.length;i++){
      const oppCard=oppSel[i];
      const myCard=mySel[i];
      const myIndex=me.combats.findIndex(x=>x.id===myCard.id);
      const opIndex=opp.combats.findIndex(x=>x.id===oppCard.id);
      if(myIndex>=0 && opIndex>=0){
        const tmp=me.combats[myIndex];
        me.combats[myIndex]=opp.combats[opIndex];
        opp.combats[opIndex]=tmp;
        pairs.push(`${myCard.name} ↔ ${oppCard.name}`);
      }
    }
    log(`${me.name} swapped: ${pairs.join(', ')}.`);
    removeSpecial(o,c);
    render();
    if(!keepTurn) endTurn();
  }

  step1();
}

// ---------- OVERLAY HELPERS ----------
function openCardPicker(cards,title,cb){
  const o=document.createElement('div');
  o.className='modal';
  o.innerHTML=`<div class="panel"><h3>${title}</h3><div class="picker-grid"></div></div>`;
  const g=o.querySelector('.picker-grid');
  cards.forEach(c=>{
    const b=document.createElement('button');
    b.className='picker-item';
    b.innerHTML=`<div class="picker-thumb" style="background-image:url('${c.img||''}')"></div><div>${c.name}</div>`;
    b.onclick=()=>{document.body.removeChild(o);cb(c);};
    g.appendChild(b);
  });
  o.addEventListener('click',e=>{if(e.target===o)document.body.removeChild(o);});
  document.body.appendChild(o);
}

function openImageModal(src,title){
  const o=document.createElement('div');
  o.className='modal';
  const p=document.createElement('div');
  p.className='panel';
  p.innerHTML = `<h2>${title}</h2>
    <img src="${src}" alt="${title}" class="info-image">
    <div style="text-align:right;margin-top:10px;">
      <button id="info-close-btn">Close</button>
    </div>`;
  o.appendChild(p);
  o.addEventListener('click',e=>{ if(e.target===o) document.body.removeChild(o); });
  document.body.appendChild(o);
  $('#info-close-btn').onclick=()=>document.body.removeChild(o);
}

function openSimpleModal(title,bodyHTML){
  const o=document.createElement('div');
  o.className='modal';
  const p=document.createElement('div');
  p.className='panel';
  p.innerHTML = `<h2>${title}</h2>
    <div>${bodyHTML}</div>
    <div style="text-align:right;margin-top:10px;">
      <button id="info-close-btn">Close</button>
    </div>`;
  o.appendChild(p);
  o.addEventListener('click',e=>{ if(e.target===o) document.body.removeChild(o); });
  document.body.appendChild(o);
  $('#info-close-btn').onclick=()=>document.body.removeChild(o);
}

// ---------- GAME OVER ----------
function showGameOver(winnerName){
  state.gameOver = true;
  const modal=document.createElement('div');
  modal.className='modal';
  const panel=document.createElement('div');
  panel.className='panel game-over-panel';
  panel.innerHTML=`<h2>Game Over!</h2><p>${winnerName} wins!</p>`;
  const btn=document.createElement('button');
  btn.textContent='Play Again';
  btn.onclick=()=>{
    document.body.removeChild(modal);
    document.querySelectorAll('.confetti-piece').forEach(e=>e.remove());
    setupGame();
  };
  panel.appendChild(btn);
  modal.appendChild(panel);
  document.body.appendChild(modal);

  spawnConfetti(80,3500);
}

// ---------- TURN ----------
function endTurn(){
  // Win check
  for(const p of state.players){
    if(p.combats.filter(c=>c.alive).length===0){
      const winner = state.players[1-p.id];
      log(`${winner.name} wins!`);
      showGameOver(winner.name);
      return;
    }
  }

  const next=1-state.current;
  const nextP=state.players[next];

  // if next player must skip, keep current and start new "virtual" turn
  if(nextP.skipTurns>0){
    nextP.skipTurns--;
    log(`${nextP.name} skips a turn! (${nextP.skipTurns} left)`);
    state.attackRoll=null;
    state.hasRolled=false;
    updateTurnIndicator();
    render();
    return;
  }

  state.current=next;
  state.attackRoll=null;
  state.selectedOwn=null;
  state.targetOpponent=null;
  state.hasRolled=false;
  updateTurnIndicator();
  render();
}

// ---------- MAIN MENU LOGIC ----------
function startGame(){
  if(document.body.classList.contains('game-started')){
    setupGame();
    return;
  }
  document.body.classList.add('game-started');
  setupGame();
  spawnConfetti(40,2500);
}

document.addEventListener('DOMContentLoaded', ()=>{
  initSounds();

  // Main menu buttons
  document.querySelectorAll('.menu-btn').forEach(btn=>{
    btn.addEventListener('mouseenter', ()=>playSound('hover'));
    btn.addEventListener('click', ()=>playSound('click'));
  });

  const startBtn = document.querySelector('.menu-btn[data-action="start"]');
  const howBtn   = document.querySelector('.menu-btn[data-action="how"]');
  const settingsBtn = document.querySelector('.menu-btn[data-action="settings"]');
  const aboutBtn = document.querySelector('.menu-btn[data-action="about"]');

  if(startBtn) startBtn.addEventListener('click', startGame);

  if(howBtn){
    howBtn.addEventListener('click', ()=>{
      openImageModal('howtoplay.png','How to Play');
    });
  }

  if(settingsBtn){
    settingsBtn.addEventListener('click', ()=>{
      openSimpleModal('Settings',
        `<p>Settings will be added later:</p>
         <ul>
           <li>AI Opponent: On / Off</li>
           <li>Sound volume slider</li>
           <li>Animation toggle</li>
         </ul>
         <p>For now, enjoy the default settings!</p>`);
    });
  }

  if(aboutBtn){
    aboutBtn.addEventListener('click', ()=>{
      openSimpleModal('About F.L.U.F.F.Y',
        `<p><strong>F.L.U.F.F.Y</strong> is a turn-based card battle where creatures
         from different worlds fight for asylum on your planet.</p>
         <p>Developed for your software game lab project as a digital
         adaptation of the physical card game.</p>`);
    });
  }

  // In-game controls
  $('#btn-roll').addEventListener('click', rollAndShow);
  $('#btn-reset').addEventListener('click', ()=>{
    if(!document.body.classList.contains('game-started')){
      document.body.classList.add('game-started');
    }
    setupGame();
  });
});
