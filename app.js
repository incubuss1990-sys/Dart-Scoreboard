"use strict";
const STORE="dartboard-v1-state";
const TARGETS=[20,19,18,17,16,15,25];
const closedCount=player=>TARGETS.filter(n=>player.marks[n]>=3).length;
const closedFieldsMarkup=player=>{const closed=TARGETS.filter(n=>player.marks[n]>=3);return closed.length?closed.map(n=>'<span class="cricket-field-chip">'+(n===25?'Bull':n)+'</span>').join(''):'<span class="cricket-field-empty">Noch keine</span>';};
const $=id=>document.getElementById(id);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let game=null,undo=[],entryMode="single",mult=1,draft=[];
const freshPlayer=(name,start)=>({name,score:start,marks:Object.fromEntries(TARGETS.map(n=>[n,0])),scored:0,darts:0,turns:0,checkoutAttempts:0,checkouts:0});
const isCricket=()=>game?.mode==="cricket";
const active=()=>game.players[game.active];
const copy=v=>JSON.parse(JSON.stringify(v));
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(game))}catch(e){}};
const toast=msg=>{const e=$("toast");e.textContent=msg;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600)};
const error=msg=>{$("inputError").textContent=msg};
const capture=()=>{undo.push(copy(game));if(undo.length>120)undo.shift()};
const announce=msg=>{$("statusMessage").textContent=msg};
function openSetup(){ $("setupModal").hidden=false; $("modeSelect").value=game?.mode||"501";$("outSelect").value=game?.out||"double";$("playerCount").value=game?.players.length||2;updateSetupMode();updateNames(); }
function closeSetup(){ $("setupModal").hidden=true; }
function updateSetupMode(){ $("outModeWrap").hidden=$("modeSelect").value==="cricket"; }
function updateNames(){
 const old=[...$("playerNames").querySelectorAll("input")].map(x=>x.value);
 const number=Number($("playerCount").value);
 $("playerNames").replaceChildren();
 for(let i=0;i<number;i++){const input=document.createElement("input");input.type="text";input.maxLength=30;input.autocomplete="off";input.placeholder="Spieler "+(i+1);input.value=old[i]??game?.players[i]?.name??"";input.setAttribute("aria-label","Name Spieler "+(i+1));$("playerNames").append(input)}
}
function startGame(e){
 e.preventDefault();
 if(game&&!confirm("Das aktuelle Spiel durch ein neues Spiel ersetzen?"))return;
 const mode=$("modeSelect").value;
 const names=[...$("playerNames").querySelectorAll("input")].map((i,n)=>i.value.trim()||"Spieler "+(n+1));
 game={mode,out:$("outSelect").value,players:names.map(n=>freshPlayer(n,mode==="cricket"?0:Number(mode))),active:0,round:1,turn:[],startScore:mode==="cricket"?0:Number(mode),history:[],winner:null};
 undo=[];draft=[];entryMode="single";mult=1;save();closeSetup();render();toast("Game on!");
}
function advanceTurn(description,points,darts,extra={}){
 const player=active();
 player.turns++;
 game.history.unshift({player:player.name,points,darts,description,round:game.round,...extra});
 if(game.history.length>80)game.history.pop();
 game.turn=[];
 if(game.winner===null){game.active=(game.active+1)%game.players.length;if(game.active===0)game.round++;game.startScore=active().score}
}
function cricketWinner(idx){
 const p=game.players[idx];
 if(!TARGETS.every(n=>p.marks[n]>=3))return false;
 return game.players.every((other,i)=>i===idx||p.score>=other.score);
}
function cricketHit(n,m){
 if(!TARGETS.includes(n)||m<1||m>3)return false;
 const player=active(),before=player.marks[n],after=before+m;
 player.marks[n]=Math.min(3,after);
 let gain=0;
 if(after>3&&game.players.some((p,i)=>i!==game.active&&p.marks[n]<3))gain=(after-Math.max(before,3))*(n===25?25:n);
 player.score+=gain;player.scored+=gain;
 return gain;
}
function hitScore(n,m){return n===25?(m===2?50:25):n*m}
function dartLabel(n,m){return n===0?"Miss":n===25?(m===2?"Bull 50":"Bull 25"):({1:"S",2:"D",3:"T"}[m]+n)}
function validHit(n,m){
 if(n===0)return m===1;
 if(n===25)return m===1||m===2;
 if(isCricket())return TARGETS.includes(n)&&!(n===25&&m===3);
 return n>=1&&n<=20&&m>=1&&m<=3;
}
function applyHit(n,m){
 error("");
 if(game.winner!==null)return;
 if(!validHit(n,m)){error("Ungültiges Feld.");return}
 const player=active(),previous=game.turn.length,turnScore=game.turn.reduce((a,x)=>a+x.score,0),score=hitScore(n,m),name=dartLabel(n,m);
 capture();
 if(isCricket()){
  const earned=n===0?0:cricketHit(n,m);
  game.turn.push({n,m,score:earned,label:name});
  player.darts++;
  if(cricketWinner(game.active)){game.winner=game.active;advanceTurn(game.turn.map(x=>x.label).join(" · "),game.turn.reduce((a,x)=>a+x.score,0),game.turn.length,{win:true});toast(player.name+" gewinnt! 🏆")}
  else if(game.turn.length===3){advanceTurn(game.turn.map(x=>x.label).join(" · "),game.turn.reduce((a,x)=>a+x.score,0),3)}
 }else{
  const remaining=game.startScore-turnScore-score;
  const invalid=remaining<0||(game.out==="double"&&remaining===1)||(remaining===0&&game.out==="double"&&m!==2);
  player.darts++;
  if(invalid){
   const consumed=previous+1,desc=[...game.turn.map(x=>x.label),name].join(" · ");
   player.darts+=3-consumed;
   player.score=game.startScore;
   player.scored-=turnScore;
   advanceTurn("BUST · "+desc,0,3,{bust:true});
   toast("Bust! Punkte bleiben unverändert");
  }else{
   player.score=remaining;
   player.scored+=score;
   game.turn.push({n,m,score,label:name});
   if(remaining===0){player.checkoutAttempts++;player.checkouts++;game.winner=game.active;advanceTurn(game.turn.map(x=>x.label).join(" · "),game.turn.reduce((a,x)=>a+x.score,0),game.turn.length,{win:true});toast(player.name+" gewinnt! 🏆")}
   else if(game.turn.length===3)advanceTurn(game.turn.map(x=>x.label).join(" · "),game.turn.reduce((a,x)=>a+x.score,0),3);
  }
 }
 save();render();
}
function endTurn(){
 if(!game||game.winner!==null)return;
 if(entryMode==="total"&&isCricket()&&draft.length){commitDraft();return}
 if(!game.turn.length){toast("Noch kein Dart geworfen");return}
 capture();
 const d=game.turn.length,pts=game.turn.reduce((a,x)=>a+x.score,0);
 advanceTurn(game.turn.map(x=>x.label).join(" · "),pts,d);save();render();
}
function submitTotal(){
 error("");if(!game||game.winner!==null)return;
 if(game.turn.length){error("Bitte zuerst die laufende Einzelwurf-Aufnahme beenden.");return}
 const raw=$("totalScore").value.trim(),points=Number(raw),used=Number($("dartsUsed").value);
 if(raw===""||!Number.isInteger(points)||points<0||points>180){error("Bitte 0 bis 180 Punkte eingeben.");return}
 const p=active(),remaining=p.score-points;
 if(game.out==="double"&&remaining===0&&!$("doubleCheckout").checked){error("Für Double-Out muss der letzte Dart ein Double oder Bull 50 sein.");return}
 if(game.out==="double"&&remaining===0&&points<2){error("Ungültiger Checkout.");return}
 capture();
 const bust=remaining<0||(game.out==="double"&&remaining===1);
 if(bust){p.darts+=3;advanceTurn("BUST · "+points+" Punkte eingegeben",0,3,{bust:true});toast("Bust! Punkte bleiben unverändert")}
 else{
  p.score=remaining;p.scored+=points;p.darts+=used;
  if(remaining===0){p.checkoutAttempts++;p.checkouts++;game.winner=game.active}
  advanceTurn("Gesamteingabe",points,used,{win:remaining===0});
  if(remaining===0)toast(p.name+" gewinnt! 🏆");
 }
 $("totalScore").value="";$("doubleCheckout").checked=false;$("dartsUsed").value="3";save();render();
}
function addDraft(n,m){
 if(draft.length>=3){error("Maximal drei Darts pro Aufnahme.");return}
 if(!validHit(n,m))return;
 draft.push({n,m,label:dartLabel(n,m)});
 renderDraft();error("");
}
function renderDraft(){
 $("draftList").innerHTML=draft.length?draft.map(x=>'<span class="draft-pill">'+safe(x.label)+'</span>').join(""):'<span class="help">Noch keine Treffer erfasst.</span>';
 $("commitDraft").disabled=!draft.length;
}
function commitDraft(){
 if(!draft.length)return;
 if(game.turn.length){error("Beende zuerst die laufende Aufnahme.");return}
 capture();
 const p=active(),items=draft.slice(),pointsStart=p.score;
 for(const {n,m} of items){if(n!==0)cricketHit(n,m);p.darts++;game.turn.push({n,m,label:dartLabel(n,m),score:0});if(cricketWinner(game.active)){game.winner=game.active;break}}
 const length=game.turn.length;
 const desc=game.turn.map(x=>x.label).join(" · ");
 advanceTurn(desc,p.score-pointsStart,length,{win:game.winner!==null});
 if(game.winner!==null)toast(p.name+" gewinnt! 🏆");
 draft=[];save();render();
}
function renderSegments(){
 const html=(isCricket()?[20,19,18,17,16,15]:[20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]).map(n=>'<button type="button" data-n="'+n+'">'+n+'</button>').join("")+
 '<button class="special" type="button" data-n="25" data-m="1">Bull 25</button><button class="special" type="button" data-n="25" data-m="2">Bull 50</button><button class="miss" type="button" data-n="0" data-m="1">Miss</button>';
 $("segmentGrid").innerHTML=html;
 let box=$("cricketTotal").querySelector(".cricket-input");
 if(!box){box=document.createElement("div");box.className="cricket-input";$("cricketTotal").insertBefore(box,$("draftList"))}
 box.innerHTML='<div class="multiplier-control" role="group" aria-label="Trefferart">'+[1,2,3].map(x=>'<button type="button" data-mult="'+x+'" class="choice '+(mult===x?'selected':'')+'">'+({1:"Single",2:"Double",3:"Triple"}[x])+' <strong>×'+x+'</strong></button>').join("")+'</div><div class="segment-grid">'+html+'</div>';
 if(isCricket()){box.querySelector('[data-n="25"][data-m="1"]').textContent="Bull 25";box.querySelector('[data-n="25"][data-m="2"]').textContent="Bull 50"}
}
function render(){
 const has=!!game;$("emptyState").hidden=has;$("matchView").hidden=!has;
 if(!has){$("gameLabel").textContent="Noch kein Spiel";return}
 $("gameLabel").textContent=(isCricket()?"CRICKET":game.mode+" · "+(game.out==="double"?"Double-Out":"Single-Out"));
 $("roundLabel").textContent="Runde "+game.round;
 const winner=game.winner===null?null:game.players[game.winner];
 announce(winner?winner.name+" hat das Spiel gewonnen! 🏆":active().name+" ist am Zug");
 const soloCricket=isCricket()&&game.players.length===1;
 $("playersGrid").innerHTML=game.players.map((p,i)=>'<article class="player-card '+(game.active===i&&game.winner===null?'current ':'')+(game.winner===i?'winner':'')+'"><div class="tag">'+(game.winner===i?'🏆 GEWINNER':game.active===i&&game.winner===null?'● AM ZUG':'SPIELER '+(i+1))+'</div><div class="player-name">'+safe(p.name)+'</div><div class="player-score">'+(soloCricket?closedCount(p)+" / "+TARGETS.length:p.score)+'</div><div class="player-meta"><span>'+(soloCricket?'Felder geschlossen':isCricket()?'Cricket-Punkte':'Restpunkte')+'</span><span>'+p.darts+' Darts</span></div>'+(isCricket()?'<div class="cricket-progress"><div class="cricket-progress-text"><span>'+(soloCricket?'Cricket-Punkte':'Felder geschlossen')+'</span><strong>'+(soloCricket?p.score:closedCount(p)+' / '+TARGETS.length)+'</strong></div><div class="cricket-progress-bar"><span style="width:'+Math.round(closedCount(p)/TARGETS.length*100)+'%"></span></div><div class="cricket-closed-caption">Geschlossene Felder</div><div class="cricket-closed-fields">'+closedFieldsMarkup(p)+'</div></div>':'')+'</article>').join("");
 $("activePlayerName").textContent=winner?"Spiel beendet":active().name;
 $("throwCount").textContent=winner?"🏆 Sieg":"Dart "+Math.min(game.turn.length+1,3)+" von 3";
 $("turnProgress").innerHTML=[0,1,2].map(i=>'<span class="dart-chip '+(game.turn[i]?'filled':'')+'">'+(game.turn[i]?safe(game.turn[i].label):"Dart "+(i+1))+'</span>').join("");
 $("singleTab").classList.toggle("active",entryMode==="single");$("totalTab").classList.toggle("active",entryMode==="total");
 $("singleTab").setAttribute("aria-pressed",String(entryMode==="single"));$("totalTab").setAttribute("aria-pressed",String(entryMode==="total"));
 $("singlePanel").hidden=entryMode!=="single";$("totalPanel").hidden=entryMode!=="total";
 $("x01Total").hidden=isCricket();$("cricketTotal").hidden=!isCricket();
 $("checkoutExtra").hidden=game.out!=="double";
 $("cricketBoard").hidden=!isCricket();
 $("endTurnBtn").disabled=game.winner!==null||(!game.turn.length&&!(isCricket()&&draft.length));
 $("undoBtn").disabled=!undo.length;
 $("submitTotal").disabled=game.winner!==null;
 $("commitDraft").disabled=game.winner!==null||!draft.length;
 $("clearDraft").disabled=!draft.length;
 renderSegments();renderMultiplier();renderDraft();renderStats();renderHistory();renderCricket();
 document.querySelectorAll(".segment-grid button,.multiplier-control button").forEach(b=>b.disabled=game.winner!==null);
}
function renderMultiplier(){document.querySelectorAll("[data-mult]").forEach(b=>b.classList.toggle("selected",Number(b.dataset.mult)===mult))}
function renderStats(){
 $("statsTable").innerHTML='<table><thead><tr><th>Spieler</th><th>'+(isCricket()?'Punkte / Dart':'3-Dart-Ø')+'</th><th>Darts</th><th>Aufn.</th></tr></thead><tbody>'+
 game.players.map(p=>'<tr><td>'+safe(p.name)+'</td><td><strong>'+(p.darts?(p.scored/p.darts*(isCricket()?1:3)).toFixed(1).replace(".",","):"0,0")+'</strong></td><td>'+p.darts+'</td><td>'+p.turns+'</td></tr>').join("")+'</tbody></table>';
}
function renderHistory(){
 $("historyList").innerHTML=game.history.length?game.history.slice(0,12).map(h=>'<div class="history-entry"><div><strong>'+safe(h.player)+'</strong> · Runde '+h.round+'<small>'+safe(h.description)+'</small></div><b>'+(h.bust?'BUST':h.win?'🏆':(h.points>=0?'+':'')+h.points)+'</b></div>').join(""):'<p class="help">Noch keine abgeschlossene Aufnahme.</p>';
}
function renderCricket(){
 if(!isCricket())return;
 const mark=n=>n>=3?'✓':n===2?'⊗':n===1?'×':'–';
 $("cricketTable").innerHTML='<table><thead><tr><th>Feld</th>'+game.players.map(p=>'<th>'+safe(p.name)+'</th>').join("")+'</tr></thead><tbody>'+TARGETS.map(n=>'<tr><td>'+(n===25?'BULL':n)+'</td>'+game.players.map(p=>'<td><strong>'+mark(p.marks[n])+'</strong></td>').join("")+'</tr>').join("")+'</tbody></table>';
}
document.addEventListener("click",e=>{
 const multBtn=e.target.closest("[data-mult]");
 if(multBtn){mult=Number(multBtn.dataset.mult);renderMultiplier();return}
 const seg=e.target.closest(".segment-grid button[data-n]");
 if(seg&&game&&game.winner===null){const n=Number(seg.dataset.n),m=seg.dataset.m?Number(seg.dataset.m):mult;
  if(n===25||n===0) {if(isCricket()&&entryMode==="total")addDraft(n,m);else applyHit(n,m)}
  else if(isCricket()&&entryMode==="total")addDraft(n,m);else applyHit(n,m);
 }
});
$("newGameBtn").addEventListener("click",openSetup);$("startFirstBtn").addEventListener("click",openSetup);$("closeSetup").addEventListener("click",closeSetup);
$("setupModal").addEventListener("click",e=>{if(e.target===$("setupModal"))closeSetup()});
$("modeSelect").addEventListener("change",updateSetupMode);$("playerCount").addEventListener("change",updateNames);$("setupForm").addEventListener("submit",startGame);
$("singleTab").addEventListener("click",()=>{entryMode="single";draft=[];error("");render()});
$("totalTab").addEventListener("click",()=>{if(game.turn.length){toast("Laufende Aufnahme zuerst beenden");return}entryMode="total";error("");render()});
$("undoBtn").addEventListener("click",()=>{if(!undo.length)return;game=undo.pop();draft=[];save();error("");render();toast("Letzte Aktion rückgängig")});
$("endTurnBtn").addEventListener("click",endTurn);$("submitTotal").addEventListener("click",submitTotal);$("commitDraft").addEventListener("click",commitDraft);
$("clearDraft").addEventListener("click",()=>{draft=[];renderDraft()});
$("totalScore").addEventListener("keydown",e=>{if(e.key==="Enter")submitTotal()});
try{const stored=JSON.parse(localStorage.getItem(STORE)||"null");if(stored&&Array.isArray(stored.players)&&stored.players.length&&stored.mode){game=stored}}catch(e){}
render();
