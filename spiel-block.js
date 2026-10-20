/* Hoppel-Blöcke – eigene Umsetzung ohne Bibliothek (Block-Blast-Art, Hoppel-Version).
   Feld 8×8. Unten liegen drei Steine, die man mit dem Finger (oder der Maus) aufs Feld zieht. Gedreht wird nicht.
   Volle Reihen und Spalten verschwinden. Es gibt keinen Zeitdruck: zu Ende ist es, wenn keiner der drei Steine mehr passt.
   Etwa jeder 5. bis 7. Stein ist ein Hasen-Stein (einzeln oder als Zweierblock). Drei Hasen in einer Reihe
   (waagerecht oder senkrecht) = Hoppel-Bonus: die Hasen verschwinden, Extrapunkte.
   Level = 1 + Punkte/300: je höher, desto öfter kommen schwierige Formen (Zickzack, große Winkel, Quadrat 3×3 …) – erst spät.
   Aufeinanderfolgende Treffer (Combo) geben Extrapunkte. Keine Texte im Spiel, nur Zeichen. */
(function(){
"use strict";
window.HoppelBlock={start:start};

var N=8;
var EMOJI="\"Segoe UI Emoji\",\"Apple Color Emoji\",\"Noto Color Emoji\",sans-serif";
var COLORS=["#B9A3E3","#8FB3F0","#9AD4AE","#F3D582","#F4B0CB","#F5C39A","#9ED8DC"];
var BUNNYCOL="#FFF6E3";
/* Grundformen (t = ab welchem Level), später zufällig gedreht und gespiegelt */
var BASES=[
  {s:["#"],t:1,w:1},
  {s:["##"],t:1,w:3},
  {s:["###"],t:1,w:3},
  {s:["#.","##"],t:1,w:3},
  {s:["##","##"],t:1,w:3},
  {s:["####"],t:2,w:2},
  {s:["#.","#.","##"],t:2,w:2},
  {s:["###",".#."],t:2,w:2},
  {s:[".##","##."],t:3,w:2},
  {s:["###","###"],t:3,w:2},
  {s:["#####"],t:5,w:1},
  {s:["###","###","###"],t:6,w:1},
  {s:["#..","#..","###"],t:6,w:1},
  {s:[".#.","###",".#."],t:8,w:1},
  {s:["#.#","###"],t:8,w:1}
];
var BUNNIES=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]]];

function parse(rows){var c=[];rows.forEach(function(r,i){for(var j=0;j<r.length;j++)if(r[j]==="#")c.push([i,j]);});return c;}
function norm(cells){
  var mr=99,mc=99;cells.forEach(function(p){if(p[0]<mr)mr=p[0];if(p[1]<mc)mc=p[1];});
  return cells.map(function(p){return [p[0]-mr,p[1]-mc];});
}
function rotate(cells){return norm(cells.map(function(p){return [p[1],-p[0]];}));}
function mirror(cells){var m=0;cells.forEach(function(p){if(p[1]>m)m=p[1];});return cells.map(function(p){return [p[0],m-p[1]];});}
function sizeOf(cells){var h=0,w=0;cells.forEach(function(p){if(p[0]+1>h)h=p[0]+1;if(p[1]+1>w)w=p[1]+1;});return {w:w,h:h};}
function levelOf(score){return 1+Math.floor(score/300);}
function el(tag,css,txt){var e=document.createElement(tag);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e;}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

function start(box,opt){
  opt=opt||{};
  var DPR=Math.min(window.devicePixelRatio||1,3);
  var s={mode:"ready",grid:[],tray:[null,null,null],score:0,level:1,lines:0,trios:0,combo:0,flash:null,flashT:0,pops:[],banner:null,t:0,untilBunny:0,drag:null};
  var r,c;
  for(r=0;r<N;r++){s.grid.push([]);for(c=0;c<N;c++)s.grid[r].push(null);}

  /* ---------- Aufbau ---------- */
  var wrap=el("div","display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:100%;box-sizing:border-box;padding:8px;color:#fff;font-family:inherit;user-select:none;-webkit-user-select:none;touch-action:none");
  var head=el("div","display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap");
  var scoreEl=el("div","font-weight:800;font-size:22px;line-height:1.1;text-align:center","0");
  var lvEl=el("div","font-weight:800;font-size:22px;line-height:1.1;text-align:center","1");
  function stat(label,valEl){var d=el("div","text-align:center;min-width:64px");d.append(el("div","font-size:14px;opacity:.85",label),valEl);return d;}
  var pauseBtn=el("button","font:inherit;font-size:22px;width:46px;height:46px;border-radius:50%;border:3px solid #fff;background:#6B51A3;color:#fff;padding:0;cursor:pointer;touch-action:manipulation","⏸");
  pauseBtn.setAttribute("aria-label","Pause");
  head.append(stat("⭐",scoreEl),stat("🚀",lvEl),pauseBtn);
  var fieldBox=el("div","position:relative");
  var cv=el("canvas","display:block;border-radius:12px;touch-action:none;-webkit-tap-highlight-color:transparent");
  cv.setAttribute("aria-label","Spielfeld");
  var over=el("div","position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:12px;background:rgba(29,27,43,.9);border-radius:12px");
  fieldBox.append(cv,over);
  wrap.append(head,fieldBox);
  box.replaceChildren(wrap);

  var L={fc:30,tc:15,cw:240,ch:300,slots:[]};
  function layout(){
    var W=window.innerWidth,H=window.innerHeight,land=W>H*1.15,fc,tc,i;
    wrap.style.flexDirection=land?"row":"column";
    head.style.flexDirection=land?"column":"row";
    head.style.marginLeft=land?"0":"54px";head.style.marginTop=land?"54px":"0";
    if(land){
      fc=Math.max(18,Math.floor(Math.min((H-16)/N,(W-16-110-30)/(N+2.6))));
      tc=Math.floor(fc*.5);
      var trayW=5*tc+14;
      L={fc:fc,tc:tc,cw:N*fc+12+trayW,ch:N*fc,slots:[]};
      for(i=0;i<3;i++)L.slots.push({x:N*fc+12,y:i*N*fc/3,w:trayW,h:N*fc/3});
    }else{
      fc=Math.max(18,Math.floor(Math.min((W-16)/N,(H-16-70-22)/(N+2.7))));
      tc=Math.floor(fc*.5);
      var slotH=5*tc+10;
      L={fc:fc,tc:tc,cw:N*fc,ch:N*fc+12+slotH,slots:[]};
      for(i=0;i<3;i++)L.slots.push({x:i*N*fc/3,y:N*fc+12,w:N*fc/3,h:slotH});
    }
    cv.width=Math.round(L.cw*DPR);cv.height=Math.round(L.ch*DPR);
    cv.style.width=L.cw+"px";cv.style.height=L.ch+"px";
    draw();
  }

  /* ---------- Steine ---------- */
  function newPiece(lv){
    if(s.untilBunny<=0)s.untilBunny=5+Math.floor(Math.random()*3);
    s.untilBunny--;
    var cells,bunny=false,k;
    if(s.untilBunny===0){
      cells=BUNNIES[Math.floor(Math.random()*BUNNIES.length)].map(function(p){return p.slice();});bunny=true;k=-1;
    }else{
      var list=BASES.filter(function(b){return b.t<=lv;}),sum=0,i;
      list.forEach(function(b){sum+=b.w;});
      var rd=Math.random()*sum,base=list[0];
      for(i=0;i<list.length;i++){rd-=list[i].w;if(rd<0){base=list[i];break;}}
      cells=parse(base.s);
      var rot=Math.floor(Math.random()*4);while(rot-->0)cells=rotate(cells);
      if(Math.random()<.5)cells=mirror(cells);
      cells=norm(cells);
      k=Math.floor(Math.random()*COLORS.length);
    }
    var sz=sizeOf(cells);
    return {cells:cells,w:sz.w,h:sz.h,k:k,bunny:bunny};
  }
  function canPlace(cells,gx,gy){
    for(var i=0;i<cells.length;i++){
      var rr2=gy+cells[i][0],cc=gx+cells[i][1];
      if(rr2<0||rr2>=N||cc<0||cc>=N||s.grid[rr2][cc])return false;
    }
    return true;
  }
  function fitsAnywhere(p){
    for(var y=0;y<=N-p.h;y++)for(var x=0;x<=N-p.w;x++)if(canPlace(p.cells,x,y))return true;
    return false;
  }
  function refill(){
    var saved=s.untilBunny,set=null,att,strict=s.level<=3;
    for(att=0;att<40;att++){
      s.untilBunny=saved;
      var cand=[newPiece(s.level),newPiece(s.level),newPiece(s.level)];
      var fit=cand.filter(fitsAnywhere).length;
      set=cand;
      if(fit===3||(!strict&&fit>=1)||(att>=25&&fit>=1))break;
    }
    s.tray=set;
  }
  function anyMove(){return s.tray.some(function(p){return p&&fitsAnywhere(p);});}

  /* ---------- Punkte ---------- */
  function addScore(n){
    s.score+=n;scoreEl.textContent=String(s.score);
    var lv=levelOf(s.score);
    if(lv>s.level){s.level=lv;lvEl.textContent=String(lv);s.banner={a:"⭐ "+lv,life:1.6};}
  }
  function pop(txt,x,y,col){s.pops.push({t:txt,x:x,y:y,life:1.3,col:col||"#fff"});}

  /* ---------- Reihen, Spalten und Hasen ---------- */
  function findClears(){
    var mark={},rows=[],cols=[],runs=0,i,j,k,full;
    for(i=0;i<N;i++){
      full=true;for(j=0;j<N;j++)if(!s.grid[i][j]){full=false;break;}
      if(full){rows.push(i);for(j=0;j<N;j++)mark[i*N+j]=1;}
      full=true;for(j=0;j<N;j++)if(!s.grid[j][i]){full=false;break;}
      if(full){cols.push(i);for(j=0;j<N;j++)mark[j*N+i]=1;}
    }
    var bun={};
    function isB(a,b){return s.grid[a][b]&&s.grid[a][b].b;}
    for(i=0;i<N;i++){
      j=0;while(j<N){
        if(isB(i,j)){k=j;while(k<N&&isB(i,k))k++;if(k-j>=3){runs++;for(var q=j;q<k;q++)bun[i*N+q]=1;}j=k;}else j++;
      }
      j=0;while(j<N){
        if(isB(j,i)){k=j;while(k<N&&isB(k,i))k++;if(k-j>=3){runs++;for(var q2=j;q2<k;q2++)bun[q2*N+i]=1;}j=k;}else j++;
      }
    }
    var all={},key;
    for(key in mark)all[key]=1;
    for(key in bun)all[key]=1;
    return {cells:Object.keys(all).map(function(x){return +x;}),rows:rows,cols:cols,runs:runs,bun:Object.keys(bun).length,lineCells:mark};
  }
  function place(i,gx,gy){
    var p=s.tray[i];
    p.cells.forEach(function(q){s.grid[gy+q[0]][gx+q[1]]={c:p.k,b:p.bunny};});
    s.tray[i]=null;
    addScore(p.cells.length);
    var cl=findClears();
    if(cl.cells.length){s.flash=cl;s.flashT=.4;s.mode="clear";}
    else{s.combo=0;afterMove();}
  }
  function applyFlash(){
    var f=s.flash,k=f.rows.length+f.cols.length,bunInLines=0,sx=0,sy=0;
    s.flash=null;
    f.cells.forEach(function(i){
      var r2=Math.floor(i/N),c2=i%N,o=s.grid[r2][c2];
      if(o&&o.b&&f.lineCells[i])bunInLines++;
      sx+=c2;sy+=r2;s.grid[r2][c2]=null;
    });
    var n=f.cells.length,cx=(sx/n+.5)*L.fc,cy=(sy/n+.5)*L.fc,pts=0;
    if(k>0){s.combo++;s.lines+=k;pts+=20*k*k+10*(s.combo-1)*k+bunInLines*10;}else s.combo=0;
    if(f.runs>0){s.trios+=f.runs;pts+=100*f.runs+50*Math.max(0,f.bun-3*f.runs);}
    pop((f.runs>0?"🐰 ":"")+"+"+pts+(s.combo>1&&k>0?" 🔥"+s.combo:""),cx,cy,f.runs>0?"#FFE6F0":"#fff");
    addScore(pts);
    var empty=s.grid.every(function(row){return row.every(function(x){return !x;});});
    if(empty){pop("🌟 +300",L.fc*N/2,L.fc*N/2-L.fc*1.5,"#FFE9A8");addScore(300);}
    afterMove();
  }
  function afterMove(){
    if(s.tray.every(function(p){return !p;}))refill();
    if(!anyMove()){gameOver();return;}
    s.mode="play";
  }
  function gameOver(){
    s.mode="over";s.drag=null;
    over.replaceChildren(el("div","font-size:48px","🥕"),el("div","font-size:34px;font-weight:800","⭐ "+s.score));
    over.style.display="flex";
    setTimeout(function(){
      if(stopped)return;
      if(opt.onEnd)opt.onEnd({score:s.score,level:s.level,lines:s.lines,trios:s.trios});
    },1500);
  }

  /* ---------- Zeichnen ---------- */
  function paintCell(g,x,y,sz,cellObj,alpha){
    var col=cellObj.b?BUNNYCOL:COLORS[cellObj.c%COLORS.length];
    g.globalAlpha=alpha==null?1:alpha;
    g.fillStyle=col;rr(g,x+1,y+1,sz-2,sz-2,Math.max(3,sz*.2));g.fill();
    g.fillStyle="rgba(255,255,255,.28)";rr(g,x+2,y+2,sz-4,(sz-4)*.42,Math.max(2,sz*.15));g.fill();
    if(cellObj.b){g.font=Math.round(sz*.76)+"px "+EMOJI;g.textAlign="center";g.textBaseline="middle";g.fillStyle="#000";g.fillText("🐰",x+sz/2,y+sz/2+sz*.04);}
    g.globalAlpha=1;
  }
  function dropSpot(){
    var d=s.drag;if(!d)return null;
    var p=s.tray[d.i],fc=L.fc;
    var gx=Math.round((d.x-p.w*fc/2)/fc),gy=Math.round((d.y-d.off-p.h*fc/2)/fc);
    return canPlace(p.cells,gx,gy)?{x:gx,y:gy}:null;
  }
  function draw(){
    var g=cv.getContext("2d"),i,j,fc=L.fc;
    g.setTransform(DPR,0,0,DPR,0,0);
    g.clearRect(0,0,L.cw,L.ch);
    g.fillStyle="#2a2740";rr(g,0,0,N*fc,N*fc,12);g.fill();
    for(j=0;j<N;j++)for(i=0;i<N;i++){g.fillStyle="#35314f";rr(g,i*fc+2,j*fc+2,fc-4,fc-4,Math.max(3,fc*.16));g.fill();}
    var flashing={};
    if(s.flash)s.flash.cells.forEach(function(k){flashing[k]=1;});
    var blink=Math.floor(s.t*14)%2===0;
    for(j=0;j<N;j++)for(i=0;i<N;i++){
      var o=s.grid[j][i];if(!o)continue;
      if(flashing[j*N+i]){
        if(blink)paintCell(g,i*fc,j*fc,fc,o,.35);else{g.fillStyle="#fff";rr(g,i*fc+1,j*fc+1,fc-2,fc-2,4);g.fill();}
      }else paintCell(g,i*fc,j*fc,fc,o);
    }
    /* Vorschau, wo der Stein landet */
    var spot=dropSpot();
    if(spot){
      var pd=s.tray[s.drag.i];
      pd.cells.forEach(function(q){
        g.strokeStyle="rgba(255,255,255,.7)";g.lineWidth=2;rr(g,(spot.x+q[1])*fc+3,(spot.y+q[0])*fc+3,fc-6,fc-6,5);g.stroke();
      });
    }
    /* Ablage unten bzw. rechts */
    L.slots.forEach(function(sl,k){
      g.fillStyle="#2a2740";rr(g,sl.x+3,sl.y+3,sl.w-6,sl.h-6,12);g.fill();
      var p=s.tray[k];if(!p)return;
      var dragging=s.drag&&s.drag.i===k,tc=L.tc;
      var ox=sl.x+(sl.w-p.w*tc)/2,oy=sl.y+(sl.h-p.h*tc)/2;
      p.cells.forEach(function(q){paintCell(g,ox+q[1]*tc,oy+q[0]*tc,tc,{c:p.k,b:p.bunny},dragging?.25:1);});
    });
    if(s.drag){
      var pg=s.tray[s.drag.i],d=s.drag;
      pg.cells.forEach(function(q){paintCell(g,d.x-pg.w*fc/2+q[1]*fc,d.y-d.off-pg.h*fc/2+q[0]*fc,fc,{c:pg.k,b:pg.bunny},.92);});
    }
    s.pops.forEach(function(pp){
      g.globalAlpha=Math.min(1,pp.life);g.font="800 "+Math.round(fc*.7)+"px "+EMOJI;g.textAlign="center";g.textBaseline="middle";
      var px=Math.max(60,Math.min(N*fc-60,pp.x)),py=pp.y-(1.3-pp.life)*fc*1.6;
      g.strokeStyle="rgba(0,0,0,.6)";g.lineWidth=4;g.strokeText(pp.t,px,py);g.fillStyle=pp.col;g.fillText(pp.t,px,py);g.globalAlpha=1;
    });
    if(s.banner){
      g.globalAlpha=Math.min(1,s.banner.life);
      g.fillStyle="rgba(139,111,196,.94)";rr(g,fc*1.5,fc*3,N*fc-fc*3,fc*2,14);g.fill();
      g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";
      g.font="800 "+Math.round(fc*1.2)+"px "+EMOJI;g.fillText(s.banner.a,N*fc/2,fc*4.05);
      g.globalAlpha=1;
    }
  }

  /* ---------- Schleife ---------- */
  var raf=0,last=0,stopped=false;
  function frame(ts){
    if(stopped)return;
    var dt=Math.min(0.1,(ts-(last||ts))/1000);last=ts;
    s.t+=dt;
    if(s.mode==="clear"){s.flashT-=dt;if(s.flashT<=0)applyFlash();}
    s.pops.forEach(function(p){p.life-=dt;});s.pops=s.pops.filter(function(p){return p.life>0;});
    if(s.banner){s.banner.life-=dt;if(s.banner.life<=0)s.banner=null;}
    draw();
    raf=requestAnimationFrame(frame);
  }

  /* ---------- Start, Pause ---------- */
  function bigBtn(label,aria,fn){
    var b=el("button","font:inherit;font-size:40px;width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:#8B6FC4;color:#fff;cursor:pointer;touch-action:manipulation;padding:0",label);
    b.setAttribute("aria-label",aria);b.addEventListener("click",fn);return b;
  }
  function showReady(){
    over.replaceChildren(el("div","font-size:56px","🐰🧱"),bigBtn("▶","Start",begin),el("div","font-size:26px;opacity:.9","👆 ➡ 🟪"));
    over.style.display="flex";
  }
  function begin(){
    if(s.mode!=="ready")return;
    over.style.display="none";refill();s.mode="play";
    if(!anyMove())gameOver();
  }
  function setPause(on){
    if(on&&s.mode==="play"){
      s.mode="pause";s.drag=null;
      over.replaceChildren(el("div","font-size:48px","⏸"),bigBtn("▶","Weiter",function(){setPause(false);}));over.style.display="flex";
    }else if(!on&&s.mode==="pause"){
      s.mode="play";over.style.display="none";last=0;
    }
  }
  pauseBtn.addEventListener("click",function(){if(s.mode==="play")setPause(true);else if(s.mode==="pause")setPause(false);});
  function onVis(){if(document.hidden)setPause(true);}
  document.addEventListener("visibilitychange",onVis);

  /* ---------- Ziehen ---------- */
  function pos(e){var b=cv.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};}
  cv.addEventListener("pointerdown",function(e){
    if(e.cancelable)e.preventDefault();
    if(s.mode!=="play"||s.drag)return;
    var pt=pos(e),i;
    for(i=0;i<3;i++){
      var sl=L.slots[i];
      if(s.tray[i]&&pt.x>=sl.x&&pt.x<=sl.x+sl.w&&pt.y>=sl.y&&pt.y<=sl.y+sl.h){
        try{cv.setPointerCapture(e.pointerId);}catch(x){}
        s.drag={i:i,x:pt.x,y:pt.y,id:e.pointerId,off:e.pointerType==="mouse"?L.fc*.3:L.fc*2};
        return;
      }
    }
  });
  cv.addEventListener("pointermove",function(e){
    if(!s.drag||e.pointerId!==s.drag.id)return;
    var pt=pos(e);s.drag.x=pt.x;s.drag.y=pt.y;
  });
  cv.addEventListener("pointerup",function(e){
    if(!s.drag||e.pointerId!==s.drag.id)return;
    var pt=pos(e);s.drag.x=pt.x;s.drag.y=pt.y;
    var spot=dropSpot(),i=s.drag.i;
    s.drag=null;
    if(spot&&s.mode==="play")place(i,spot.x,spot.y);
  });
  cv.addEventListener("pointercancel",function(){s.drag=null;});

  function onKey(e){
    if(s.mode==="ready"&&(e.code==="Enter"||e.code==="Space")){e.preventDefault();begin();return;}
    if(e.code==="KeyP"&&!e.repeat){if(s.mode==="play")setPause(true);else if(s.mode==="pause")setPause(false);}
  }
  document.addEventListener("keydown",onKey);
  window.addEventListener("resize",layout);

  over.style.display="none";
  layout();showReady();
  if(window.__blockDebug)window.__blockState=s;
  raf=requestAnimationFrame(frame);
  return {stop:function(){
    stopped=true;cancelAnimationFrame(raf);
    document.removeEventListener("keydown",onKey);document.removeEventListener("visibilitychange",onVis);window.removeEventListener("resize",layout);
  }};
}
})();
