/* Hoppel-Blöcke – eigene Umsetzung ohne Bibliothek (Tetris-Art, Hoppel-Version).
   Steine fallen von oben, volle Reihen verschwinden. Etwa jeder 10. bis 15. Stein ist ein einzelner Hasen-Stein.
   Drei Hasen in einer Reihe (waagerecht oder senkrecht) = Hoppel-Bonus: die drei Hasen verschwinden, Punkte extra.
   Je mehr Punkte, desto höher das Level: langsam schneller, schwierige Formen erst spät.
   Bedienung:
     Touch: Tippen = drehen · Finger nach links/rechts ziehen = schieben · nach unten wischen = fallen lassen
     Tastatur: Pfeil links/rechts = schieben · Leertaste (oder Pfeil hoch) = drehen · Pfeil runter = schneller · P = Pause
   Es gibt nur eine Runde: ist das Feld oben voll, ist das Spiel zu Ende. Keine Texte im Spiel, nur Zeichen. */
(function(){
"use strict";
window.HoppelBlock={start:start};

var COLS=10,ROWS=20;
var EMOJI="\"Segoe UI Emoji\",\"Apple Color Emoji\",\"Noto Color Emoji\",sans-serif";
var TOUCH=(navigator.maxTouchPoints||0)>0;
var COLORS=["#B9A3E3","#8FB3F0","#9AD4AE","#F3D582","#F4B0CB","#F5C39A","#9ED8DC"];
var BUNNYCOL="#FFF6E3";
var SHAPES={
  I:{c:[[0,0],[0,1],[0,2],[0,3]],k:5},
  O:{c:[[0,0],[0,1],[1,0],[1,1]],k:3},
  T:{c:[[0,1],[1,0],[1,1],[1,2]],k:0},
  L:{c:[[0,2],[1,0],[1,1],[1,2]],k:4},
  J:{c:[[0,0],[1,0],[1,1],[1,2]],k:1},
  S:{c:[[0,1],[0,2],[1,0],[1,1]],k:2},
  Z:{c:[[0,0],[0,1],[1,1],[1,2]],k:6},
  V:{c:[[0,0],[1,0],[1,1]],k:2},
  P:{c:[[0,1],[1,0],[1,1],[1,2],[2,1]],k:6},
  U:{c:[[0,0],[0,2],[1,0],[1,1],[1,2]],k:4},
  W:{c:[[0,0],[1,0],[1,1],[2,1],[2,2]],k:5},
  B:{c:[[0,0]],k:-1}
};

function rotate(cells){
  var n=cells.map(function(p){return [p[1],-p[0]];}),mr=99,mc=99;
  n.forEach(function(p){if(p[0]<mr)mr=p[0];if(p[1]<mc)mc=p[1];});
  return n.map(function(p){return [p[0]-mr,p[1]-mc];});
}
function widthOf(cells){var m=0;cells.forEach(function(p){if(p[1]>m)m=p[1];});return m+1;}
function heightOf(cells){var m=0;cells.forEach(function(p){if(p[0]>m)m=p[0];});return m+1;}
function levelOf(score){return 1+Math.floor(score/1000);}
function weights(lv){
  var w={I:2,O:2,T:2,L:2,J:2};
  if(lv>=3)w.V=1;
  if(lv>=4){w.S=1;w.Z=1;}
  if(lv>=6){w.S=2;w.Z=2;}
  if(lv>=8){w.P=1;w.U=1;}
  if(lv>=11){w.W=1;}
  return w;
}
var untilBunny=0;
function pickType(lv){
  if(untilBunny<=0)untilBunny=10+Math.floor(Math.random()*6);
  untilBunny--;
  if(untilBunny===0)return "B";
  var w=weights(lv),sum=0,k;
  for(k in w)sum+=w[k];
  var r=Math.random()*sum;
  for(k in w){r-=w[k];if(r<0)return k;}
  return "T";
}
function el(tag,css,txt){var e=document.createElement(tag);if(css)e.style.cssText=css;if(txt!=null)e.textContent=txt;return e;}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}

function start(box,opt){
  opt=opt||{};
  var DPR=Math.min(window.devicePixelRatio||1,3);
  var s={mode:"ready",grid:[],score:0,level:1,lines:0,trios:0,cur:null,next:null,acc:0,soft:false,flash:null,flashT:0,pops:[],banner:null,t:0};
  var r,c;
  for(r=0;r<ROWS;r++){s.grid.push([]);for(c=0;c<COLS;c++)s.grid[r].push(null);}

  /* ---------- Aufbau ---------- */
  var wrap=el("div","display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:100%;box-sizing:border-box;padding:8px;color:#fff;font-family:inherit;user-select:none;-webkit-user-select:none;touch-action:none");
  var head=el("div","display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap");
  var scoreEl=el("div","font-weight:800;font-size:20px;line-height:1.1;text-align:center","0");
  var lvEl=el("div","font-weight:800;font-size:20px;line-height:1.1;text-align:center","1");
  function stat(label,valEl){var d=el("div","text-align:center;min-width:64px");d.append(el("div","font-size:12px;opacity:.75",label),valEl);return d;}
  var nextCv=el("canvas","background:#2a2740;border-radius:10px");
  var nextBox=el("div","text-align:center");nextBox.append(el("div","font-size:14px;opacity:.85","➡"),nextCv);
  var pauseBtn=el("button","font:inherit;font-size:22px;width:46px;height:46px;border-radius:50%;border:3px solid #fff;background:#6B51A3;color:#fff;padding:0;cursor:pointer;touch-action:manipulation","⏸");
  pauseBtn.setAttribute("aria-label","Pause");
  head.append(stat("⭐",scoreEl),stat("🚀",lvEl),nextBox,pauseBtn);
  var fieldBox=el("div","position:relative");
  var cv=el("canvas","display:block;border-radius:10px;border:3px solid #6B51A3;background:#1d1b2b;touch-action:none;-webkit-tap-highlight-color:transparent");
  cv.setAttribute("aria-label","Spielfeld");
  var over=el("div","position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:12px;background:rgba(29,27,43,.88);border-radius:8px;font-size:16px;line-height:1.3");
  fieldBox.append(cv,over);
  wrap.append(head,fieldBox);
  box.replaceChildren(wrap);

  var cell=20;
  function layout(){
    var W=window.innerWidth,H=window.innerHeight,land=W>H*1.15;
    wrap.style.flexDirection=land?"row":"column";
    head.style.flexDirection=land?"column":"row";
    head.style.width=land?"110px":"auto";
    head.style.marginLeft=land?"0":"54px";head.style.marginTop=land?"54px":"0";
    var availH=land?H-16:H-16-70-16;
    var availW=land?W-16-110-30:W-16;
    cell=Math.max(10,Math.floor(Math.min(availH/ROWS,availW/COLS)));
    cv.width=cell*COLS*DPR;cv.height=cell*ROWS*DPR;
    cv.style.width=cell*COLS+"px";cv.style.height=cell*ROWS+"px";
    var nc=16;nextCv.width=nc*5*DPR;nextCv.height=nc*4*DPR;nextCv.style.width=nc*5+"px";nextCv.style.height=nc*4+"px";
    draw();drawNext();
  }

  /* ---------- Hilfen ---------- */
  function fits(cells,x,y){
    for(var i=0;i<cells.length;i++){
      var rr2=y+cells[i][0],cc=x+cells[i][1];
      if(cc<0||cc>=COLS||rr2>=ROWS)return false;
      if(rr2>=0&&s.grid[rr2][cc])return false;
    }
    return true;
  }
  function makePiece(type){
    var sh=SHAPES[type];
    return {type:type,cells:sh.c.map(function(p){return p.slice();}),k:sh.k,x:0,y:0};
  }
  function spawn(){
    var p=s.next||makePiece(pickType(s.level));
    s.next=makePiece(pickType(s.level));
    p.x=Math.floor((COLS-widthOf(p.cells))/2);p.y=0;
    s.cur=p;s.acc=0;
    drawNext();
    if(!fits(p.cells,p.x,p.y)){gameOver();}
  }
  function interval(){
    var base=Math.max(170,800*Math.pow(0.93,s.level-1));
    return s.soft?Math.min(base,50):base;
  }
  function addScore(n){
    s.score+=n;scoreEl.textContent=String(s.score);
    var lv=levelOf(s.score);
    if(lv>s.level){
      s.level=lv;lvEl.textContent=String(lv);
      s.banner={a:"⭐ "+lv,life:1.6};
    }
  }
  function pop(txt,x,y,col){s.pops.push({t:txt,x:x,y:y,life:1.3,col:col||"#fff"});}

  /* ---------- Bewegen ---------- */
  function move(dx){
    if(s.mode!=="play"||!s.cur)return;
    if(fits(s.cur.cells,s.cur.x+dx,s.cur.y)){s.cur.x+=dx;draw();}
  }
  function turn(){
    if(s.mode!=="play"||!s.cur||s.cur.type==="O"||s.cur.type==="B")return;
    var nc=rotate(s.cur.cells),kicks=[0,-1,1,-2,2];
    for(var i=0;i<kicks.length;i++){
      if(fits(nc,s.cur.x+kicks[i],s.cur.y)){s.cur.cells=nc;s.cur.x+=kicks[i];draw();return;}
    }
  }
  function hardDrop(){
    if(s.mode!=="play"||!s.cur)return;
    var n=0;
    while(fits(s.cur.cells,s.cur.x,s.cur.y+1)){s.cur.y++;n++;}
    addScore(n*2);lock();
  }
  function stepDown(){
    if(fits(s.cur.cells,s.cur.x,s.cur.y+1)){s.cur.y++;if(s.soft)addScore(1);}
    else lock();
  }
  function lock(){
    var p=s.cur;
    p.cells.forEach(function(q){
      var rr2=p.y+q[0],cc=p.x+q[1];
      if(rr2>=0&&rr2<ROWS)s.grid[rr2][cc]={c:p.k,b:p.type==="B"};
    });
    s.cur=null;
    resolve();
  }

  /* ---------- Reihen und Hasen ---------- */
  function findBunnies(){
    var mark={},runs=0,rr2,cc,k;
    for(rr2=0;rr2<ROWS;rr2++){
      cc=0;
      while(cc<COLS){
        if(s.grid[rr2][cc]&&s.grid[rr2][cc].b){
          k=cc;while(k<COLS&&s.grid[rr2][k]&&s.grid[rr2][k].b)k++;
          if(k-cc>=3){runs++;for(var j=cc;j<k;j++)mark[rr2*COLS+j]=1;}
          cc=k;
        }else cc++;
      }
    }
    for(cc=0;cc<COLS;cc++){
      rr2=0;
      while(rr2<ROWS){
        if(s.grid[rr2][cc]&&s.grid[rr2][cc].b){
          k=rr2;while(k<ROWS&&s.grid[k][cc]&&s.grid[k][cc].b)k++;
          if(k-rr2>=3){runs++;for(var j2=rr2;j2<k;j2++)mark[j2*COLS+cc]=1;}
          rr2=k;
        }else rr2++;
      }
    }
    var cells=Object.keys(mark).map(function(x){return +x;});
    return {cells:cells,runs:runs};
  }
  function fullRows(){
    var rows=[],rr2,cc;
    for(rr2=0;rr2<ROWS;rr2++){
      var f=true;for(cc=0;cc<COLS;cc++)if(!s.grid[rr2][cc]){f=false;break;}
      if(f)rows.push(rr2);
    }
    return rows;
  }
  function resolve(){
    var bn=findBunnies();
    if(bn.cells.length){s.flash={type:"bunny",cells:bn.cells,runs:bn.runs};s.flashT=0.45;s.mode="clear";draw();return;}
    var rows=fullRows();
    if(rows.length){s.flash={type:"rows",rows:rows};s.flashT=0.35;s.mode="clear";draw();return;}
    s.mode="play";spawn();draw();
  }
  function applyFlash(){
    var f=s.flash,rr2,cc;
    s.flash=null;
    if(f.type==="bunny"){
      var n=f.cells.length,cols={},sx=0,sy=0;
      f.cells.forEach(function(i){var r2=Math.floor(i/COLS),c2=i%COLS;s.grid[r2][c2]=null;cols[c2]=1;sx+=c2;sy+=r2;});
      Object.keys(cols).forEach(function(c2){
        var col=[];
        for(rr2=0;rr2<ROWS;rr2++)if(s.grid[rr2][c2])col.push(s.grid[rr2][c2]);
        for(rr2=ROWS-1;rr2>=0;rr2--)s.grid[rr2][c2]=col.length?col.pop():null;
      });
      var pts=(250*f.runs+150*Math.max(0,n-3*f.runs))*s.level;
      s.trios+=f.runs;
      pop("🐰 +"+pts,(sx/n+.5)*cell,(sy/n+.5)*cell,"#FFD6E6");
      addScore(pts);
    }else{
      var cnt=f.rows.length,bun=0;
      f.rows.forEach(function(r2){for(cc=0;cc<COLS;cc++)if(s.grid[r2][cc]&&s.grid[r2][cc].b)bun++;});
      var keep=s.grid.filter(function(_,i){return f.rows.indexOf(i)<0;});
      while(keep.length<ROWS){var e=[];for(cc=0;cc<COLS;cc++)e.push(null);keep.unshift(e);}
      s.grid=keep;s.lines+=cnt;
      var pts2=([0,100,300,500,800][Math.min(cnt,4)]+bun*50)*s.level;
      pop("+"+pts2,COLS*cell/2,(f.rows[0]+.5)*cell,"#fff");
      addScore(pts2);
    }
    resolve();
  }
  function gameOver(){
    s.mode="over";s.cur=null;draw();
    over.replaceChildren(el("div","font-size:48px","🥕"),el("div","font-size:34px;font-weight:800","⭐ "+s.score));
    over.style.display="flex";
    setTimeout(function(){
      if(stopped)return;
      if(opt.onEnd)opt.onEnd({score:s.score,level:s.level,lines:s.lines,trios:s.trios});
    },1400);
  }

  /* ---------- Zeichnen ---------- */
  function paintCell(g,x,y,sz,cellObj,alpha){
    var col=cellObj.b?BUNNYCOL:COLORS[cellObj.c%COLORS.length];
    g.globalAlpha=alpha==null?1:alpha;
    g.fillStyle=col;rr(g,x+1,y+1,sz-2,sz-2,Math.max(3,sz*.2));g.fill();
    g.fillStyle="rgba(255,255,255,.28)";rr(g,x+2,y+2,sz-4,(sz-4)*.42,Math.max(2,sz*.15));g.fill();
    if(cellObj.b){g.font=Math.round(sz*.74)+"px "+EMOJI;g.textAlign="center";g.textBaseline="middle";g.fillStyle="#000";g.fillText("🐰",x+sz/2,y+sz/2+sz*.04);}
    g.globalAlpha=1;
  }
  function ghostY(){var y=s.cur.y;while(fits(s.cur.cells,s.cur.x,y+1))y++;return y;}
  function draw(){
    var g=cv.getContext("2d"),i,j;
    g.setTransform(DPR,0,0,DPR,0,0);
    g.clearRect(0,0,COLS*cell,ROWS*cell);
    g.fillStyle="#1d1b2b";g.fillRect(0,0,COLS*cell,ROWS*cell);
    g.strokeStyle="rgba(255,255,255,.06)";g.lineWidth=1;
    for(i=1;i<COLS;i++){g.beginPath();g.moveTo(i*cell+.5,0);g.lineTo(i*cell+.5,ROWS*cell);g.stroke();}
    for(j=1;j<ROWS;j++){g.beginPath();g.moveTo(0,j*cell+.5);g.lineTo(COLS*cell,j*cell+.5);g.stroke();}
    var flashing={};
    if(s.flash){
      if(s.flash.type==="bunny")s.flash.cells.forEach(function(k){flashing[k]=1;});
      else s.flash.rows.forEach(function(r2){for(var c2=0;c2<COLS;c2++)flashing[r2*COLS+c2]=1;});
    }
    var blink=Math.floor(s.t*14)%2===0;
    for(j=0;j<ROWS;j++)for(i=0;i<COLS;i++){
      var o=s.grid[j][i];if(!o)continue;
      if(flashing[j*COLS+i]){
        if(blink)paintCell(g,i*cell,j*cell,cell,o,.35);else{g.fillStyle="#fff";rr(g,i*cell+1,j*cell+1,cell-2,cell-2,4);g.fill();}
      }else paintCell(g,i*cell,j*cell,cell,o);
    }
    if(s.cur&&s.mode!=="over"){
      var gy=ghostY(),p=s.cur;
      if(gy!==p.y)p.cells.forEach(function(q){
        g.strokeStyle="rgba(255,255,255,.45)";g.lineWidth=2;rr(g,(p.x+q[1])*cell+3,(gy+q[0])*cell+3,cell-6,cell-6,4);g.stroke();
      });
      p.cells.forEach(function(q){if(p.y+q[0]>=0)paintCell(g,(p.x+q[1])*cell,(p.y+q[0])*cell,cell,{c:p.k,b:p.type==="B"});});
    }
    s.pops.forEach(function(pp){
      g.globalAlpha=Math.min(1,pp.life);g.fillStyle=pp.col;g.font="800 "+Math.round(cell*.8)+"px sans-serif";g.textAlign="center";g.textBaseline="middle";
      g.strokeStyle="rgba(0,0,0,.6)";g.lineWidth=3;g.strokeText(pp.t,Math.max(70,Math.min(COLS*cell-70,pp.x)),pp.y-(1.3-pp.life)*cell*2);
      g.fillText(pp.t,Math.max(70,Math.min(COLS*cell-70,pp.x)),pp.y-(1.3-pp.life)*cell*2);g.globalAlpha=1;
    });
    if(s.banner){
      g.globalAlpha=Math.min(1,s.banner.life);
      g.fillStyle="rgba(139,111,196,.92)";rr(g,cell*1.5,cell*7.5,COLS*cell-cell*3,cell*2.6,14);g.fill();
      g.fillStyle="#fff";g.textAlign="center";g.textBaseline="middle";
      g.font="800 "+Math.round(cell*1.5)+"px "+EMOJI;g.fillText(s.banner.a,COLS*cell/2,cell*8.85);
      g.globalAlpha=1;
    }
  }
  function drawNext(){
    var g=nextCv.getContext("2d"),nc=16;
    g.setTransform(DPR,0,0,DPR,0,0);g.clearRect(0,0,nc*5,nc*4);
    if(!s.next)return;
    var w=widthOf(s.next.cells),h=heightOf(s.next.cells),ox=(5-w)/2*nc,oy=(4-h)/2*nc;
    s.next.cells.forEach(function(q){paintCell(g,ox+q[1]*nc,oy+q[0]*nc,nc,{c:s.next.k,b:s.next.type==="B"});});
  }

  /* ---------- Schleife ---------- */
  var raf=0,last=0,stopped=false;
  function frame(ts){
    if(stopped)return;
    var dt=Math.min(0.1,(ts-(last||ts))/1000);last=ts;
    s.t+=dt;
    if(s.mode==="play"&&s.cur){
      s.acc+=dt*1000;
      var iv=interval(),guard=0;
      while(s.acc>=iv&&s.cur&&guard++<5){s.acc-=iv;stepDown();}
    }else if(s.mode==="clear"){
      s.flashT-=dt;
      if(s.flashT<=0)applyFlash();
    }
    s.pops.forEach(function(p){p.life-=dt;});s.pops=s.pops.filter(function(p){return p.life>0;});
    if(s.banner){s.banner.life-=dt;if(s.banner.life<=0)s.banner=null;}
    if(s.mode==="play"||s.mode==="clear"||s.pops.length||s.banner)draw();
    raf=requestAnimationFrame(frame);
  }

  /* ---------- Start, Pause ---------- */
  function showReady(){
    var go=el("button","font:inherit;font-size:40px;width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:#8B6FC4;color:#fff;cursor:pointer;touch-action:manipulation;padding:0","▶");
    go.setAttribute("aria-label","Start");
    go.addEventListener("click",begin);
    var how=TOUCH?"👆 ⟳   👈👉   👇":"⬅ ➡   ␣ ⟳   ⬇";
    over.replaceChildren(el("div","font-size:56px","🐰🧱"),go,el("div","font-size:22px;opacity:.9",how));
    over.style.display="flex";
  }
  function begin(){
    if(s.mode!=="ready")return;
    over.style.display="none";s.mode="play";spawn();draw();
  }
  function setPause(on){
    if(on&&s.mode==="play"){
      s.mode="pause";
      var b=el("button","font:inherit;font-size:40px;width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:#8B6FC4;color:#fff;cursor:pointer;touch-action:manipulation;padding:0","▶");
      b.addEventListener("click",function(){setPause(false);});
      over.replaceChildren(el("div","font-size:48px","⏸"),b);over.style.display="flex";
    }else if(!on&&s.mode==="pause"){
      s.mode="play";over.style.display="none";last=0;
    }
  }
  pauseBtn.addEventListener("click",function(){if(s.mode==="play")setPause(true);else if(s.mode==="pause")setPause(false);});
  function onVis(){if(document.hidden)setPause(true);}
  document.addEventListener("visibilitychange",onVis);

  /* ---------- Eingaben ---------- */

  var gx=null;
  cv.addEventListener("pointerdown",function(e){
    if(e.cancelable)e.preventDefault();
    try{cv.setPointerCapture(e.pointerId);}catch(x){}
    gx={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),moved:false,dropped:false};
  });
  cv.addEventListener("pointermove",function(e){
    if(!gx||gx.dropped)return;
    var dx=e.clientX-gx.x;
    while(Math.abs(dx)>=cell*0.9){
      var dir=dx>0?1:-1;move(dir);gx.x+=dir*cell;dx=e.clientX-gx.x;gx.moved=true;
    }
    var tdy=e.clientY-gx.sy,tdx=e.clientX-gx.sx;
    if(tdy>cell*3&&tdy>Math.abs(tdx)*1.5&&performance.now()-gx.t<450){gx.dropped=true;gx.moved=true;hardDrop();}
    if(Math.abs(e.clientX-gx.sx)>10||Math.abs(e.clientY-gx.sy)>10)gx.moved=true;
  });
  cv.addEventListener("pointerup",function(){
    if(gx&&!gx.moved&&performance.now()-gx.t<350)turn();
    gx=null;
  });
  cv.addEventListener("pointercancel",function(){gx=null;});

  function onKey(e){
    var c=e.code;
    if(s.mode==="ready"){if(c==="Enter"||c==="Space"||c==="ArrowLeft"||c==="ArrowRight"){e.preventDefault();begin();}return;}
    if(c==="KeyP"){if(!e.repeat){if(s.mode==="play")setPause(true);else if(s.mode==="pause")setPause(false);}return;}
    if(s.mode!=="play")return;
    if(c==="ArrowLeft"||c==="KeyA"){e.preventDefault();move(-1);}
    else if(c==="ArrowRight"||c==="KeyD"){e.preventDefault();move(1);}
    else if(c==="ArrowUp"||c==="KeyW"||c==="Space"){e.preventDefault();if(!e.repeat)turn();}
    else if(c==="ArrowDown"||c==="KeyS"){e.preventDefault();s.soft=true;}
  }
  function onKeyUp(e){if(e.code==="ArrowDown"||e.code==="KeyS")s.soft=false;}
  document.addEventListener("keydown",onKey);document.addEventListener("keyup",onKeyUp);
  window.addEventListener("resize",layout);

  layout();showReady();
  if(window.__blockDebug)window.__blockState=s;
  raf=requestAnimationFrame(frame);
  return {stop:function(){
    stopped=true;cancelAnimationFrame(raf);
    document.removeEventListener("keydown",onKey);document.removeEventListener("keyup",onKeyUp);
    document.removeEventListener("visibilitychange",onVis);window.removeEventListener("resize",layout);
  }};
}
})();
