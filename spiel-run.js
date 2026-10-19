/* Hoppels Jump-and-Run – eigene Umsetzung ohne Bibliothek.
   Hoppel läuft von allein, das Spiel wird immer schneller, es gibt kein Ziel: es zählt, wie weit man kommt.
   Bewegungen:
     Tippen / Pfeil hoch               = springen (in der Luft noch einmal = Doppelsprung)
     Nach unten wischen / Pfeil runter = ducken (in der Luft: schneller fallen)
     Zweimal schnell nach oben wischen / zweimal Leertaste = Riesenmöhre aus dem Boden ziehen
   Hindernisse: Steine usw. (springen) · Hasentunnel (ducken) · Gruben (springen, lange Gruben: Doppelsprung) ·
   Riesenmöhre (ziehen oder per Doppelsprung überspringen). Nach 3 Leben ist die Runde zu Ende. */
(function(){
"use strict";
window.HoppelRun={start:start};

function rand(a,b){return a+Math.random()*(b-a);}
var EMOJI="\"Segoe UI Emoji\",\"Apple Color Emoji\",\"Noto Color Emoji\",sans-serif";
var TOUCH=(navigator.maxTouchPoints||0)>0;
var HINT=TOUCH?{jump:"Tippen = springen",duck:"Nach unten wischen = ducken",pit:"Tippen = über die Grube springen",carrot:"2× schnell nach oben wischen = Möhre ziehen",longpit:"2× tippen = Doppelsprung"}:{jump:"Pfeil hoch = springen",duck:"Pfeil runter = ducken",pit:"Pfeil hoch = über die Grube springen",carrot:"Leertaste 2× schnell = Möhre ziehen",longpit:"2× Pfeil hoch = Doppelsprung"};
var JUMPS=[{e:"🪨",w:34,h:30},{e:"🌵",w:28,h:46},{e:"🦔",w:36,h:28},{e:"🐌",w:30,h:24},{e:"🪵",w:44,h:26}];

function start(box,opt){
  opt=opt||{};
  var W=640,H=300,GROUND=244,DPR=2,PX=92;
  var cv=document.createElement("canvas");
  cv.width=W*DPR;cv.height=H*DPR;
  cv.style.cssText="width:100%;max-width:720px;height:auto;display:block;margin:0 auto;border-radius:16px;border:3px solid #DDD6C8;touch-action:none;background:#cfe6ff;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none";
  cv.setAttribute("aria-label","Spielfeld: tippen zum Springen, nach unten wischen zum Ducken");
  if(opt.fit){cv.style.cssText="display:block;touch-action:none;background:#cfe6ff;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none";}
  box.replaceChildren(cv);
  function fit(){var w=Math.min(window.innerWidth,window.innerHeight*W/H);cv.style.width=w+"px";cv.style.height=(w*H/W)+"px";}
  if(opt.fit){fit();window.addEventListener("resize",fit);}
  var g=cv.getContext("2d");g.setTransform(DPR,0,0,DPR,0,0);
  var hop=new Image();hop.src="bilder/kaninchen-winkt.webp";

  var hints={};try{hints=JSON.parse(localStorage.getItem("vt:runhints"))||{};}catch(e){}
  function saveHints(){try{localStorage.setItem("vt:runhints",JSON.stringify(hints));}catch(e){}}

  var s={mode:"ready",t:0,dist:0,carrots:0,pulls:0,bonus:0,lives:3,inv:0,speed:190,py:GROUND,vy:0,jumps:0,duck:0,
    obs:[],cars:[],clouds:[],pops:[],pull:[],nextObs:380,nextCar:220,hit:0};
  if(opt.startT)s.t=opt.startT;
  if(window.__runDebug){s.t=window.__runDebug.t||0;window.__runState=s;}
  var i;for(i=0;i<5;i++)s.clouds.push({x:rand(0,W),y:rand(18,110),k:rand(.6,1.2)});
  var raf=0,last=0,stopped=false,gx=null;

  /* ---------- Bewegungen ---------- */
  function tap(){
    if(s.mode==="ready"){s.mode="run";return;}
    if(s.mode!=="run")return;
    if(s.py>=GROUND-0.5){s.vy=-690;s.jumps=1;s.duck=0;}
    else if(s.jumps<2){s.vy=-720;s.jumps=2;}
    else s.buf=0.14;
  }
  function swipeDown(){
    if(s.mode!=="run")return;
    if(s.py<GROUND-0.5)s.vy=Math.max(s.vy,900);
    else s.duck=0.95;
  }
  function swipeUp(){
    if(s.mode!=="run")return;
    var now=s.t;s.pull.push(now);s.pull=s.pull.filter(function(x){return now-x<1.0;});
    if(s.pull.length>=2){
      var best=null;
      s.obs.forEach(function(o){if(o.kind==="carrot"&&!o.pulled&&o.x>PX+20&&o.x<W-8&&(!best||o.x<best.x))best=o;});
      if(best){best.pulled=true;best.vy=-420;best.fy=0;best.fade=1;s.pulls++;s.bonus+=30;s.pops.push({t:"+30",x:best.x+10,y:GROUND-110,life:1});hints.carrot=(hints.carrot||0)+1;saveHints();s.pull=[];}
    }
  }
  function onDown(e){if(e.cancelable)e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(x){}gx={x:e.clientX,y:e.clientY,t:performance.now(),done:false};}
  function onMove(e){
    if(!gx||gx.done)return;
    var dy=e.clientY-gx.y,dx=e.clientX-gx.x;
    if(Math.abs(dy)>28&&Math.abs(dy)>Math.abs(dx)*1.2){gx.done=true;if(dy<0)swipeUp();else swipeDown();}
  }
  function onUp(){if(gx&&!gx.done&&performance.now()-gx.t<500)tap();gx=null;}
  function onKey(e){
    var c=e.code;
    if(c==="ArrowUp"||c==="KeyW"){e.preventDefault();if(!e.repeat)tap();}
    else if(c==="ArrowDown"||c==="KeyS"){e.preventDefault();if(!e.repeat)swipeDown();}
    else if(c==="Space"){e.preventDefault();if(!e.repeat){if(s.mode==="ready")tap();else swipeUp();}}
  }
  cv.addEventListener("pointerdown",onDown);cv.addEventListener("pointermove",onMove);
  cv.addEventListener("pointerup",onUp);cv.addEventListener("pointercancel",function(){gx=null;});
  document.addEventListener("keydown",onKey);
  function stop(){
    stopped=true;cancelAnimationFrame(raf);
    cv.removeEventListener("pointerdown",onDown);cv.removeEventListener("pointermove",onMove);cv.removeEventListener("pointerup",onUp);
    document.removeEventListener("keydown",onKey);
    window.removeEventListener("resize",fit);
  }

  /* ---------- Spiellogik ---------- */
  function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
  function score(){return Math.floor(s.dist/15)+s.carrots*10+s.bonus;}
  function lose(){s.lives--;s.inv=1.4;s.hit=0.35;if(s.lives<=0)finish();}

  function spawn(){
    var kinds=[["jump",1]];
    if(s.t>12)kinds.push(["duck",s.t<30?3:1.5]);
    if(s.t>24)kinds.push(["pit",s.t<42?3:1.5]);
    if(s.t>36)kinds.push(["carrot",s.t<56?3:1.2]);
    if(s.t>52)kinds.push(["longpit",s.t<72?3:1.5]);
    var tot=0,k;kinds.forEach(function(x){tot+=x[1];});
    var r=Math.random()*tot,kind="jump";
    for(k=0;k<kinds.length;k++){r-=kinds[k][1];if(r<=0){kind=kinds[k][0];break;}}
    var single=s.speed*0.726,o;
    if(kind==="jump"){var t=JUMPS[Math.floor(Math.random()*JUMPS.length)];o={kind:"jump",x:W+40,w:t.w,h:t.h,e:t.e};}
    else if(kind==="duck")o={kind:"duck",x:W+40,w:80,h:66};
    else if(kind==="pit")o={kind:"pit",x:W+40,w:Math.round(single*0.45)};
    else if(kind==="longpit")o={kind:"longpit",x:W+40,w:Math.round(single*0.95)};
    else o={kind:"carrot",x:W+40,w:40,h:100};
    if((o.kind==="duck"||o.kind==="carrot")&&s.cars.some(function(c){return c.x>W+40-110&&c.x<W+40+o.w+110;})){s.nextObs=60;return;}
    s.obs.push(o);
    s.nextObs=Math.max(340,rand(1.25,2.0)*s.speed*0.9+o.w+(kind.indexOf("pit")>=0?140:kind==="carrot"?120:0));
  }

  function update(dt){
    s.t+=dt;
    s.speed=Math.min(470,190+s.t*5);
    var dx=s.speed*dt;s.dist+=dx;
    s.vy+=1900*dt;s.py+=s.vy*dt;
    if(s.buf>0)s.buf-=dt;
    if(s.py>=GROUND){s.py=GROUND;s.vy=0;s.jumps=0;if(s.buf>0){s.vy=-690;s.jumps=1;s.buf=0;}}
    if(s.inv>0)s.inv-=dt;if(s.hit>0)s.hit-=dt;if(s.duck>0)s.duck-=dt;
    s.clouds.forEach(function(c){c.x-=dx*0.15*c.k;if(c.x<-120){c.x=W+rand(0,160);c.y=rand(18,110);}});
    s.nextObs-=dx;s.nextCar-=dx;
    if(s.nextObs<=0)spawn();
    if(s.nextCar<=0){
      var blocked=s.obs.some(function(o){return (o.kind==="duck"||o.kind==="carrot")&&!o.pulled&&o.x<W+30+76+110&&o.x+o.w>W+30-110;});
      if(blocked)s.nextCar=50;
      else{var base=GROUND-rand(50,130);for(i=0;i<3;i++)s.cars.push({x:W+30+i*38,y:base+(i===1?-14:0),got:false});s.nextCar=rand(260,520);}
    }
    s.obs.forEach(function(o){o.x-=dx;});s.cars.forEach(function(c){c.x-=dx;});
    s.cars=s.cars.filter(function(c){return c.x>-40&&!c.got;});
    s.pops.forEach(function(p){p.y-=40*dt;p.life-=dt;p.x-=dx;});s.pops=s.pops.filter(function(p){return p.life>0;});
    var ducking=s.duck>0&&s.py>=GROUND-0.5,cx=PX+40;
    var me={x:PX+22,y:s.py-(ducking?34:62),w:38,h:ducking?30:58};
    s.cars.forEach(function(c){if(!c.got&&overlap(me,{x:c.x-12,y:c.y-12,w:26,h:26})){c.got=true;s.carrots++;}});
    for(i=s.obs.length-1;i>=0;i--){
      var o=s.obs[i];
      if(o.pulled){o.vy+=900*dt;o.fy+=o.vy*dt;o.fade-=dt*1.4;if(o.fade<=0)s.obs.splice(i,1);continue;}
      if(o.x+o.w<-60){s.obs.splice(i,1);continue;}
      var hr=null;
      if(o.kind==="jump")hr={x:o.x+5,y:GROUND-o.h+4,w:o.w-10,h:o.h-4};
      else if(o.kind==="duck")hr={x:o.x+6,y:GROUND-110,w:o.w-12,h:66};
      else if(o.kind==="carrot")hr={x:o.x+8,y:GROUND-o.h,w:o.w-16,h:o.h};
      if(hr&&s.inv<=0&&overlap(me,hr)){lose();s.obs.splice(i,1);if(s.mode==="over")return;continue;}
      if((o.kind==="pit"||o.kind==="longpit")&&s.inv<=0&&s.py>=GROUND-0.5&&cx>o.x+14&&cx<o.x+o.w-14){lose();s.obs.splice(i,1);if(s.mode==="over")return;continue;}
      if(!o.passed&&o.x+o.w<PX+10){o.passed=true;hints[o.kind]=(hints[o.kind]||0)+1;saveHints();}
    }
  }

  /* ---------- Zeichnen ---------- */
  function drawGround(){
    var pits=s.obs.filter(function(o){return o.kind==="pit"||o.kind==="longpit";}),segs=[[0,W]];
    pits.forEach(function(p){
      g.fillStyle="#6b5646";g.fillRect(p.x,GROUND,p.w,H-GROUND);
      g.fillStyle="#4a3a2e";g.fillRect(p.x,GROUND+10,p.w,H-GROUND);
      var ns=[];segs.forEach(function(sg){
        if(p.x+p.w<=sg[0]||p.x>=sg[1]){ns.push(sg);return;}
        if(p.x>sg[0])ns.push([sg[0],p.x]);if(p.x+p.w<sg[1])ns.push([p.x+p.w,sg[1]]);});
      segs=ns;
    });
    segs.forEach(function(sg){g.fillStyle="#8fd08f";g.fillRect(sg[0],GROUND,sg[1]-sg[0],H-GROUND);g.fillStyle="#6cb86c";g.fillRect(sg[0],GROUND,sg[1]-sg[0],6);});
    g.fillStyle="#7cc47c";var off=-(s.dist%60);
    for(i=0;i<12;i++){var xx=off+i*60;if(!pits.some(function(p){return xx+28>p.x&&xx<p.x+p.w;}))g.fillRect(xx,GROUND+22,28,5);}
  }
  function drawObstacle(o){
    if(o.kind==="jump"){g.font=Math.round(o.h+10)+"px "+EMOJI;g.textAlign="center";g.textBaseline="middle";g.fillText(o.e,o.x+o.w/2,GROUND-o.h/2+2);}
    else if(o.kind==="duck"){
      g.fillStyle="#7a5232";g.fillRect(o.x+2,GROUND-110,9,110);g.fillRect(o.x+o.w-11,GROUND-110,9,110);
      g.fillStyle="rgba(0,0,0,.16)";g.fillRect(o.x+11,GROUND-44,o.w-22,44);
      g.fillStyle="#a57246";g.fillRect(o.x,GROUND-110,o.w,66);
      g.fillStyle="#6cb86c";g.fillRect(o.x,GROUND-114,o.w,8);
      g.strokeStyle="#8a5c36";g.lineWidth=2;g.beginPath();g.moveTo(o.x+6,GROUND-92);g.lineTo(o.x+o.w-6,GROUND-92);g.moveTo(o.x+6,GROUND-70);g.lineTo(o.x+o.w-6,GROUND-70);g.stroke();
    }else if(o.kind==="carrot"){
      g.save();g.globalAlpha=o.pulled?Math.max(0,o.fade):1;g.translate(0,o.pulled?o.fy:0);
      var cx=o.x+o.w/2;
      g.fillStyle="#f08a24";g.beginPath();g.moveTo(cx-17,GROUND-74);g.lineTo(cx+17,GROUND-74);g.lineTo(cx+8,GROUND);g.lineTo(cx-8,GROUND);g.closePath();g.fill();
      g.strokeStyle="#c76d10";g.lineWidth=2;for(var k=0;k<3;k++){g.beginPath();g.moveTo(cx-12+k,GROUND-56+k*16);g.lineTo(cx+2,GROUND-52+k*16);g.stroke();}
      g.fillStyle="#3fa34d";[[-14,-86,12,26,-.5],[0,-92,12,30,0],[14,-86,12,26,.5]].forEach(function(l){g.beginPath();g.ellipse(cx+l[0],GROUND+l[1],l[2],l[3],l[4],0,7);g.fill();});
      g.restore();
    }
  }
  function drawHint(){
    var o=null;
    for(var k=0;k<s.obs.length;k++){var q=s.obs[k];if(!q.pulled&&!q.passed&&q.x>PX+50&&q.x<W-30&&(hints[q.kind]||0)<2){o=q;break;}}
    if(!o)return;
    var txt=HINT[o.kind],ty=o.kind==="duck"?GROUND-136:Math.max(22,GROUND-(o.h||60)-40);
    g.font="700 15px system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";
    var w=g.measureText(txt).width+18,x=Math.max(w/2+4,Math.min(W-w/2-4,o.x+o.w/2));
    g.fillStyle="rgba(255,255,255,.92)";g.beginPath();if(g.roundRect)g.roundRect(x-w/2,ty-13,w,26,13);else g.rect(x-w/2,ty-13,w,26);g.fill();
    g.fillStyle="#6B51A3";g.fillText(txt,x,ty);
  }
  function draw(){
    var sky=g.createLinearGradient(0,0,0,GROUND);sky.addColorStop(0,"#b9d9ff");sky.addColorStop(1,"#eaf3ff");
    g.fillStyle=sky;g.fillRect(0,0,W,H);
    g.fillStyle="rgba(255,255,255,.9)";
    s.clouds.forEach(function(c){g.beginPath();g.ellipse(c.x,c.y,38*c.k,14*c.k,0,0,7);g.ellipse(c.x+24*c.k,c.y-8*c.k,26*c.k,13*c.k,0,0,7);g.ellipse(c.x-24*c.k,c.y-4*c.k,22*c.k,11*c.k,0,0,7);g.fill();});
    drawGround();
    g.font="26px "+EMOJI;g.textAlign="center";g.textBaseline="middle";
    s.cars.forEach(function(c){g.fillText("🥕",c.x,c.y);});
    s.obs.forEach(drawObstacle);
    var blink=s.inv>0&&Math.floor(s.inv*12)%2===0;
    if(!blink){
      var air=s.py<GROUND-0.5,ducking=s.duck>0&&!air;
      g.save();g.translate(PX+40,s.py);
      if(ducking)g.scale(1.12,0.58);
      else{g.translate(0,air?0:Math.sin(s.t*16)*3);if(air)g.rotate(Math.max(-0.35,Math.min(0.35,s.vy/2400)));}
      if(hop.complete&&hop.naturalWidth)g.drawImage(hop,-44,-82,88,88);else{g.font="56px sans-serif";g.fillText("🐰",0,-34);}
      g.restore();
    }
    drawHint();
    s.pops.forEach(function(p){g.globalAlpha=Math.max(0,p.life);g.fillStyle="#E8A33D";g.font="800 22px system-ui,sans-serif";g.textAlign="center";g.fillText(p.t,p.x,p.y);g.globalAlpha=1;});
    g.textAlign="left";g.textBaseline="top";g.fillStyle="#1B1A1E";
    var hearts="";for(i=0;i<3;i++)hearts+=i<s.lives?"❤️":"🤍";
    g.font="22px "+EMOJI;g.fillText(hearts,12,10);
    g.textAlign="right";g.font="800 22px system-ui,sans-serif";g.fillText(score()+" Punkte",W-12,10);
    g.font="600 14px system-ui,sans-serif";g.fillStyle="#6E6A63";
    g.fillText(Math.floor(s.dist/50)+" m"+(opt.best?" · Rekord "+opt.best+" m":""),W-12,36);
    if(s.mode==="ready"){
      g.fillStyle="rgba(255,255,255,.86)";g.fillRect(0,44,W,166);
      g.fillStyle="#1B1A1E";g.textAlign="center";g.textBaseline="middle";
      g.font="800 26px system-ui,sans-serif";g.fillText("Tippe, um loszulaufen!",W/2,70);
      g.font="600 17px system-ui,sans-serif";
      g.fillText(TOUCH?"Tippen = springen · 2× tippen = Doppelsprung":"Pfeil hoch = springen · 2× Pfeil hoch = Doppelsprung",W/2,108);
      g.fillText(TOUCH?"Nach unten wischen = ducken":"Pfeil runter = ducken",W/2,134);
      g.fillText(TOUCH?"2× schnell nach oben wischen = Möhre ziehen":"Leertaste 2× schnell = Möhre ziehen",W/2,160);
      g.fillStyle="#6E6A63";g.font="600 14px system-ui,sans-serif";g.fillText(TOUCH?"Am Laptop: Pfeil hoch, Pfeil runter, Leertaste. Es wird immer schneller – wie weit kommst du?":"Zum Starten Pfeil hoch oder Leertaste drücken. Es wird immer schneller – wie weit kommst du?",W/2,190);
    }
    if(s.hit>0){g.fillStyle="rgba(255,80,80,"+(s.hit*0.5)+")";g.fillRect(0,0,W,H);}
  }

  function finish(){
    if(s.mode==="over")return;
    s.mode="over";
    var res={score:score(),meters:Math.floor(s.dist/50),carrots:s.carrots,pulls:s.pulls,newRecord:Math.floor(s.dist/50)>(opt.best||0)};
    setTimeout(function(){if(stopped)return;stop();if(opt.onEnd)opt.onEnd(res);},700);
  }
  function frame(ts){
    if(stopped)return;
    var dt=last?Math.min(0.05,(ts-last)/1000):0;last=ts;
    if(s.mode==="run")update(dt);
    else if(s.mode==="over"){s.vy+=1900*dt;s.py=Math.min(GROUND,s.py+s.vy*dt);}
    draw();
    raf=requestAnimationFrame(frame);
  }
  if(window.__runDebug){window.__runStep=function(dt){if(s.mode==="run")update(dt);draw();};}
  raf=requestAnimationFrame(frame);
  return {stop:stop};
}
})();
