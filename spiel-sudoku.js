/* Hoppels Sudoku – 6×6 mit 2×3-Kästchen, immer eindeutig lösbar, eigene Umsetzung ohne Bibliothek.
   Zahl 1–6 in jede Zeile, jede Spalte und jedes Kästchen genau einmal. Doppelte Zahlen werden rot markiert.
   Bis zu 3 Tipps pro Rätsel. */
(function(){
"use strict";
window.HoppelSudoku={start:start};

var N=6,BR=2,BC=3;
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function copy(g){return g.map(function(r){return r.slice();});}
function can(g,r,c,v){
  var i,br=r-r%BR,bc=c-c%BC,j;
  for(i=0;i<N;i++){if(g[r][i]===v||g[i][c]===v)return false;}
  for(i=0;i<BR;i++)for(j=0;j<BC;j++)if(g[br+i][bc+j]===v)return false;
  return true;
}
function emptyGrid(){var g=[],i;for(i=0;i<N;i++)g.push([0,0,0,0,0,0]);return g;}
function fill(g){
  for(var r=0;r<N;r++)for(var c=0;c<N;c++){
    if(g[r][c]===0){
      var vs=shuffle([1,2,3,4,5,6]);
      for(var k=0;k<vs.length;k++){if(can(g,r,c,vs[k])){g[r][c]=vs[k];if(fill(g))return true;g[r][c]=0;}}
      return false;
    }
  }
  return true;
}
function countSolutions(g,limit){
  var best=null,bc=9,r,c,v;
  for(r=0;r<N;r++)for(c=0;c<N;c++){
    if(g[r][c]===0){
      var n=0;for(v=1;v<=N;v++)if(can(g,r,c,v))n++;
      if(n<bc){bc=n;best=[r,c];if(n===0)return 0;}
    }
  }
  if(!best)return 1;
  var total=0;
  for(v=1;v<=N;v++){
    if(can(g,best[0],best[1],v)){g[best[0]][best[1]]=v;total+=countSolutions(g,limit-total);g[best[0]][best[1]]=0;if(total>=limit)return total;}
  }
  return total;
}
function makePuzzle(givens){
  var sol=emptyGrid();fill(sol);
  var p=copy(sol),cells=[],r,c;
  for(r=0;r<N;r++)for(c=0;c<N;c++)cells.push([r,c]);
  cells=shuffle(cells);
  var left=N*N;
  for(var i=0;i<cells.length&&left>givens;i++){
    var rr=cells[i][0],cc=cells[i][1],keep=p[rr][cc];
    p[rr][cc]=0;
    if(countSolutions(copy(p),2)!==1)p[rr][cc]=keep;else left--;
  }
  return {puzzle:p,solution:sol};
}

function el(tag,attrs){
  var e=document.createElement(tag);
  if(attrs)for(var k in attrs){if(k==="class")e.className=attrs[k];else if(k.indexOf("on")===0)e.addEventListener(k.slice(2),attrs[k]);else if(k==="html")e.innerHTML=attrs[k];else e.setAttribute(k,attrs[k]);}
  for(var i=2;i<arguments.length;i++){var x=arguments[i];if(x==null)continue;e.append(x.nodeType?x:document.createTextNode(String(x)));}
  return e;
}
function injectCss(){
  if(document.getElementById("sud-css"))return;
  var s=document.createElement("style");s.id="sud-css";
  s.textContent=
   ".sud-wrap{max-width:420px;margin:0 auto}"+
   ".sud-bar{display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;font-weight:700}"+
   ".sud{display:grid;grid-template-columns:repeat(6,1fr);width:100%;aspect-ratio:1;border:3px solid var(--ink,#1B1A1E);border-radius:10px;overflow:hidden;background:var(--paper,#fff);touch-action:manipulation}"+
   ".sud button{font:inherit;font-size:clamp(20px,6vw,30px);font-weight:800;border:1px solid var(--edge,#ccc);background:var(--paper,#fff);color:var(--blue-deep,#2C51AC);padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:0}"+
   ".sud button.g{color:var(--ink,#1B1A1E);background:var(--paper-deep,#f3efe6);cursor:default}"+
   ".sud button.rb{border-right:3px solid var(--ink,#1B1A1E)}.sud button.bb{border-bottom:3px solid var(--ink,#1B1A1E)}"+
   ".sud button.sel{background:#e5dcf7;outline:3px solid var(--lilac,#8B6FC4);outline-offset:-3px}"+
   ".sud button.bad{color:var(--bad,#C2506B);background:var(--bad-bg,#FAE9ED)}"+
   ".sud button.hint{color:var(--ok,#3F8A5C)}"+
   ".sud-pad{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:10px 0}"+
   ".sud-pad button{font:inherit;font-size:24px;font-weight:800;min-height:52px;border:2px solid var(--edge,#ccc);border-radius:12px;background:var(--paper,#fff);color:var(--ink,#1B1A1E);cursor:pointer;touch-action:manipulation}"+
   ".sud-pad button:active{transform:scale(.96)}"+
   ".sud-msg{min-height:26px;text-align:center;font-weight:700}";
  document.head.append(s);
}

function start(box,opt){
  opt=opt||{};injectCss();
  var pz=makePuzzle(opt.givens||20),given=pz.puzzle.map(function(r){return r.map(function(v){return v>0;});});
  var cur=copy(pz.puzzle),sol=pz.solution,hinted={},hintsLeft=3,sel=null,over=false,t0=Date.now();
  var timeEl=el("span",null,"0:00"),hintBtn=el("button",{class:"btn small",onclick:hint},"💡 Tipp (3)");
  var msg=el("div",{class:"sud-msg"}),grid=el("div",{class:"sud"}),pad=el("div",{class:"sud-pad"}),cells=[];
  var r,c;
  for(r=0;r<N;r++)for(c=0;c<N;c++)(function(r,c){
    var b=el("button",{type:"button","aria-label":"Feld Zeile "+(r+1)+" Spalte "+(c+1),onclick:function(){if(over||given[r][c])return;sel=[r,c];draw();}});
    if(c%BC===BC-1&&c<N-1)b.classList.add("rb");
    if(r%BR===BR-1&&r<N-1)b.classList.add("bb");
    cells.push(b);grid.append(b);
  })(r,c);
  for(var v=1;v<=N;v++)(function(v){pad.append(el("button",{type:"button",onclick:function(){put(v);}},String(v)));})(v);
  pad.append(el("button",{type:"button","aria-label":"Löschen",onclick:function(){put(0);}},"⌫"));
  box.replaceChildren(el("div",{class:"sud-wrap"},el("div",{class:"sud-bar"},el("span",null,"⏱ ",timeEl),hintBtn),grid,pad,msg,
    el("div",{style:"text-align:center"},el("button",{class:"btn small",onclick:function(){finish(false);}},"Aufhören"))));
  var timer=setInterval(function(){var s=Math.floor((Date.now()-t0)/1000);timeEl.textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0");},500);
  function onKey(e){
    if(over)return;
    if(e.key>="1"&&e.key<="6"){put(+e.key);}
    else if(e.key==="Backspace"||e.key==="Delete"||e.key==="0"){put(0);}
    else if(sel&&(e.key==="ArrowLeft"||e.key==="ArrowRight"||e.key==="ArrowUp"||e.key==="ArrowDown")){
      e.preventDefault();var nr=sel[0]+(e.key==="ArrowDown"?1:e.key==="ArrowUp"?-1:0),nc=sel[1]+(e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0);
      if(nr>=0&&nr<N&&nc>=0&&nc<N){sel=[nr,nc];draw();}
    }
  }
  document.addEventListener("keydown",onKey);
  function conflicts(){
    var bad={},rr,cc,k,j;
    for(rr=0;rr<N;rr++)for(cc=0;cc<N;cc++){
      var v=cur[rr][cc];if(!v)continue;
      for(k=0;k<N;k++){
        if(k!==cc&&cur[rr][k]===v){bad[rr+","+cc]=1;}
        if(k!==rr&&cur[k][cc]===v){bad[rr+","+cc]=1;}
      }
      var br=rr-rr%BR,bc=cc-cc%BC;
      for(k=0;k<BR;k++)for(j=0;j<BC;j++){var r2=br+k,c2=bc+j;if((r2!==rr||c2!==cc)&&cur[r2][c2]===v)bad[rr+","+cc]=1;}
    }
    return bad;
  }
  function draw(){
    var bad=conflicts(),i=0,rr,cc;
    for(rr=0;rr<N;rr++)for(cc=0;cc<N;cc++){
      var b=cells[i++],v=cur[rr][cc];
      b.textContent=v?String(v):"";
      b.classList.toggle("g",given[rr][cc]);
      b.classList.toggle("sel",!!sel&&sel[0]===rr&&sel[1]===cc);
      b.classList.toggle("bad",!!bad[rr+","+cc]);
      b.classList.toggle("hint",!!hinted[rr+","+cc]);
    }
    hintBtn.textContent="💡 Tipp ("+hintsLeft+")";hintBtn.disabled=hintsLeft<=0;
    var full=true,anyBad=false;
    for(rr=0;rr<N;rr++)for(cc=0;cc<N;cc++){if(!cur[rr][cc])full=false;}
    for(var key in bad)anyBad=true;
    if(full&&!anyBad)finish(true);
  }
  function put(v){
    if(over||!sel)return;
    cur[sel[0]][sel[1]]=v;delete hinted[sel[0]+","+sel[1]];
    msg.textContent="";draw();
  }
  function hint(){
    if(over||hintsLeft<=0)return;
    var opts=[],rr,cc;
    for(rr=0;rr<N;rr++)for(cc=0;cc<N;cc++)if(!given[rr][cc]&&cur[rr][cc]!==sol[rr][cc])opts.push([rr,cc]);
    if(!opts.length)return;
    var pick=(sel&&opts.filter(function(o){return o[0]===sel[0]&&o[1]===sel[1];})[0])||opts[Math.floor(Math.random()*opts.length)];
    cur[pick[0]][pick[1]]=sol[pick[0]][pick[1]];hinted[pick[0]+","+pick[1]]=1;hintsLeft--;
    sel=pick;msg.textContent="Das Feld ist gelöst – schau, warum die Zahl passt!";draw();
  }
  function finish(solved){
    if(over)return;over=true;
    clearInterval(timer);document.removeEventListener("keydown",onKey);
    var sec=Math.floor((Date.now()-t0)/1000),used=3-hintsLeft;
    if(solved)msg.textContent="✔ Gelöst! Super gemacht!";
    setTimeout(function(){if(opt.onEnd)opt.onEnd({solved:solved,seconds:sec,hints:used});},solved?900:0);
  }
  draw();
  return {stop:function(){over=true;clearInterval(timer);document.removeEventListener("keydown",onKey);}};
}
})();
