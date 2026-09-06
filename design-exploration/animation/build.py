"""Build a standalone motion comparison from the direction B design artifact."""
from pathlib import Path
import re

ROOT = Path(__file__).parent
html = (ROOT.parent / 'mockups/direction-b.html').read_text()
html = html.replace('B · Work comes first — Rizki portfolio', 'Motion lab — Rizki portfolio')
html = re.sub(r'<div class="more-work">.*?(?=<div class="latest">)', '', html, flags=re.S)
html = html.replace('<span class="count">3</span>', '<span class="count">1</span>')
html = re.sub(r'<details class="note".*?</details>', '', html, flags=re.S)

style = r'''
<style>
.lab {background:var(--paper);border-bottom:1px solid var(--line);padding:24px max(24px,calc((100% - 1280px)/2));}
.lab-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:18px}.lab-heading h1{font-size:24px;letter-spacing:-.04em;margin:0}.lab-heading p{margin:6px 0 0;font-size:13px;color:var(--muted)}.lab-heading>a{font-size:13px;min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;text-underline-offset:4px}
.presets{display:grid;grid-template-columns:.65fr 1fr 1fr 1fr;gap:10px}.preset{display:block;text-align:left;padding:14px 16px;background:var(--soft);border:1px solid var(--line);border-radius:9px;min-height:77px}.preset strong{display:block;font-size:14px}.preset small{display:block;color:var(--muted);font-size:12px;margin-top:5px}.preset[aria-pressed=true]{background:var(--blue);border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.lab-options{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:16px}.lab-tools{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.motion-toggle{display:flex;align-items:center;gap:9px;min-height:44px;font-size:13px;cursor:pointer}.motion-toggle input{width:18px;height:18px;accent-color:var(--accent)}.lab-status{font-size:12px;color:var(--muted);margin:0;max-width:400px}.lab-caption{display:flex;align-items:start;gap:32px;padding-top:16px;margin-top:16px;border-top:1px solid var(--line)}.lab-caption h2{font-size:16px;min-width:180px;margin:0}.lab-caption p{font-size:13px;color:var(--muted);margin:0;max-width:80ch}.lab-caption span{display:block;color:var(--ink);margin-top:5px}
.try-motion{border-top:1px solid var(--line);padding:10px 26px;display:flex;align-items:center;justify-content:space-between;gap:15px;background:var(--paper)}.try-motion small{font-size:12px;color:var(--muted)}.try-motion button{font-size:13px}.foot{padding-bottom:36px}.b .profile{position:static}.b .nav{position:relative}.nav button[aria-pressed=true]{border-bottom-color:transparent}.motion-line{position:absolute;bottom:-1px;left:0;width:1px;height:2px;background:var(--ink);transform-origin:left;pointer-events:none}
.btn,.text-btn,.icon{transition:background 160ms,color 160ms}.text-btn>span,.actions .btn>span{display:inline-block;transition:transform 160ms ease}.b .featured{transform-origin:50% 40%}.alias{will-change:auto}.alias b{transform-origin:center}.mail-art{position:relative;isolation:isolate;transform-style:preserve-3d}.mail-art>*{position:relative;z-index:1}.mail-art:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--pointer-x,50%) var(--pointer-y,50%),#ffffff38,transparent 60%);opacity:0;pointer-events:none;z-index:0}.b[data-motion=tactile] .mail-art:after{opacity:1}.flow-status{font-size:12px;color:var(--green);min-height:20px;text-align:center;padding-top:8px}.b .featured .mail-art{min-height:310px}.b .alias-stack{position:relative}.b .project-title-row{align-items:center}dialog{transform-origin:50% 35%}
@media(hover:hover) and (pointer:fine){
 [data-motion=quiet]:not([data-reduced=true]) .text-btn:hover>span{transform:translate(2px,-2px)}
 [data-motion=guided]:not([data-reduced=true]) .text-btn:hover>span,[data-motion=guided]:not([data-reduced=true]) .actions .btn:hover>span{transform:translate(3px,-3px)}
 [data-motion=tactile]:not([data-reduced=true]) .text-btn:hover>span,[data-motion=tactile]:not([data-reduced=true]) .actions .btn:hover>span{transform:translate(4px,-4px)}
 [data-motion=tactile]:not([data-reduced=true]) .actions .btn:hover{transform:translateY(-2px)}
}
[data-motion=tactile]:not([data-reduced=true]) .actions .btn{transition:transform 160ms,background 160ms}
[data-motion=tactile]:not([data-reduced=true]) .actions .btn:active{transform:scale(.98)}
[data-motion=still] *,[data-reduced=true] *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
[data-reduced=true] .mail-art{transform:none!important}[data-reduced=true] .mail-art:after,[data-motion=still] .mail-art:after{opacity:0}
@media(max-width:760px){.lab{padding:20px 18px}.lab-heading{align-items:start;gap:12px}.lab-heading h1{font-size:21px}.lab-heading>a{white-space:nowrap;font-size:12px}.presets{grid-template-columns:1fr 1fr}.preset{min-height:76px;padding:12px}.lab-caption{display:block}.lab-caption h2{margin-bottom:8px}.lab-options{align-items:start}.lab-status{max-width:none}.try-motion{padding:10px 20px;flex-wrap:wrap;gap:0}.b .featured .mail-art{min-height:260px}.lab-tools{gap:8px}.lab-tools .btn{font-size:13px;padding:8px 12px}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.mail-art{transform:none!important}.mail-art:after{opacity:0!important}}
</style>'''

controls = '''<section class="lab" aria-label="Animation exploration controls">
<div class="lab-heading"><div><h1>A little motion, with a purpose.</h1><p>Animation exploration for direction B. Same layout, different feel.</p></div><a href="README.md">Design notes ↗</a></div>
<div class="presets" role="group" aria-label="Motion options">
<button class="preset" data-preset="still" aria-pressed="false"><strong>Still baseline</strong><small>No animation</small></button>
<button class="preset" data-preset="quiet" aria-pressed="false"><strong>1. Quiet polish</strong><small>Subtle feedback · 160–180 ms</small></button>
<button class="preset" data-preset="guided" aria-pressed="true"><strong>2. Guided flow</strong><small>Clear transitions · Recommended</small></button>
<button class="preset" data-preset="tactile" aria-pressed="false"><strong>3. Tactile studio</strong><small>Depth & spring · More expressive</small></button>
</div><div class="lab-options"><div class="lab-tools"><button class="btn" id="replay-motion">↻ Replay showcase</button><label class="motion-toggle"><input type="checkbox" id="reduce-motion">Reduce motion</label></div><p class="lab-status" id="motion-status" role="status">Guided flow selected. Try the categories, contact dialog, and Mailriz preview.</p></div>
<div class="lab-caption"><h2 id="motion-title">2. Guided flow</h2><p id="motion-description">A moving category indicator keeps your place. The content and dialogs settle in gently; Mailriz aliases arrive once, then point to the inbox.<span>240 ms content · 220 ms dialog · ~800 ms showcase sequence</span></p></div>
</section>'''

js = r'''
<script>
(() => {
 const root=document.documentElement, systemReduce=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 const status=document.querySelector('#motion-status'),reduce=document.querySelector('#reduce-motion'),art=document.querySelector('.featured .mail-art'),nav=document.querySelector('.b .nav');
 const running=new Set();let mode='guided',closing=false,frame=0,pointer=null,manualReduction=false;
 const descriptions={
  still:['Still baseline','Everything updates immediately. Use this to judge whether the motion actually helps.','No motion; content and actions remain available.'],
  quiet:['1. Quiet polish','Gentle color feedback and a small link-arrow movement. Categories and dialogs use short fades. The layout stays still.','160 ms category · 180 ms dialog · 180 ms showcase fade'],
  guided:['2. Guided flow','A moving category indicator keeps your place. The content and dialogs settle in gently; Mailriz aliases arrive once, then point to the inbox.','240 ms content · 220 ms dialog · ~800 ms showcase sequence'],
  tactile:['3. Tactile studio','The illustration follows your pointer with a slight tilt. Buttons press in, aliases settle with a spring, and the dialog opens with more depth.','280 ms content · 300 ms dialog · ~1 second showcase; pointer tilt only on a mouse']
 };
 const muted=()=>systemReduce.matches||manualReduction;
 const enabled=()=>mode!=='still'&&!muted();
 function stop(){running.forEach(a=>a.cancel());running.clear();cancelAnimationFrame(frame);frame=0;pointer=null;art.style.transform='';art.style.removeProperty('--pointer-x');art.style.removeProperty('--pointer-y')}
 function animate(el,keys,options){if(!enabled()||!el?.animate)return null;const a=el.animate(keys,{duration:220,easing:'cubic-bezier(.22,1,.36,1)',...options});running.add(a);a.finished.then(()=>running.delete(a),()=>running.delete(a));return a}
 function label(text){status.textContent=text}
 const line=document.createElement('span');line.className='motion-line';line.setAttribute('aria-hidden','true');nav.append(line);
 function linePosition(){const b=nav.querySelector('[aria-pressed=true]');const r=b.getBoundingClientRect(),n=nav.getBoundingClientRect();return `translateX(${r.left-n.left}px) scaleX(${r.width})`}
 function placeLine(previous){const next=linePosition();line.style.transform=next;if(previous&&enabled()&&mode!=='quiet')animate(line,[{transform:previous},{transform:next}],{duration:mode==='tactile'?330:240,easing:mode==='tactile'?'cubic-bezier(.2,1.25,.35,1)':'cubic-bezier(.22,1,.36,1)'})}
 new ResizeObserver(()=>placeLine()).observe(nav);
 function switchWithMotion(tab){const before=line.style.transform;line.getAnimations().forEach(a=>a.cancel());switchTab(tab);placeLine(before);const panel=document.querySelector(`[data-panel="${tab}"]`);panel?.getAnimations().forEach(a=>a.cancel());if(mode==='quiet')animate(panel,[{opacity:.65},{opacity:1}],{duration:160});else animate(panel,[{opacity:.3,transform:`translateY(${mode==='tactile'?12:8}px)`},{opacity:1,transform:'translateY(0)'}],{duration:mode==='tactile'?280:240})}
 document.querySelectorAll('[data-tab],[data-switch]').forEach(b=>b.onclick=()=>switchWithMotion(b.dataset.tab||b.dataset.switch));
 const baseOpen=openDialog;
 openDialog=(title,content)=>{closing=false;dialog.getAnimations().forEach(a=>a.cancel());baseOpen(title,content);if(mode==='quiet')animate(dialog,[{opacity:0},{opacity:1}],{duration:180});else animate(dialog,[{opacity:0,transform:mode==='tactile'?'translateY(14px) scale(.96)':'translateY(8px)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:mode==='tactile'?300:220,easing:mode==='tactile'?'cubic-bezier(.2,1.2,.35,1)':'cubic-bezier(.22,1,.36,1)'})};
 function closeWithMotion(){if(closing)return;closing=true;dialog.getAnimations().forEach(a=>a.cancel());const a=animate(dialog,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:mode==='quiet'?'none':'translateY(6px)'}],{duration:140});if(a)a.finished.then(()=>{dialog.close();closing=false},()=>{dialog.close();closing=false});else{dialog.close();closing=false}}
 document.querySelector('#close-dialog').onclick=closeWithMotion;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeWithMotion()});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){e.stopImmediatePropagation();closeWithMotion()}},true);
 function replay(){stop();if(dialog.open)dialog.close();if(nav.querySelector('[aria-pressed=true]').dataset.tab!=='projects')switchWithMotion('projects');const flow=document.querySelector('.flow-status');flow.textContent='One inbox for all three aliases.';if(!enabled()){label(muted()?'Reduced motion: all states update immediately.':'Still baseline: no movement. Try a category or open a dialog.');return}label(mode==='quiet'?'Playing a short fade. No movement of the illustration.':mode==='guided'?'Playing: aliases arrive, then the inbox responds.':'Playing: spring settling. Move a mouse over the illustration to feel the depth.');if(mode==='quiet'){const fade=animate(art,[{opacity:.6},{opacity:1}],{duration:180});fade?.finished.then(()=>label('Ready. Try the categories or open the contact dialog.'),()=>{});return}const spring=mode==='tactile';const chips=art.querySelectorAll('.alias');chips.forEach((chip,i)=>{animate(chip,spring?[{opacity:0,transform:'translateY(18px) scale(.96)'},{opacity:1,transform:'translateY(-3px) scale(1.015)',offset:.7},{opacity:1,transform:'translateY(0) scale(1)'}]:[{opacity:0,transform:'translateX(16px)'},{opacity:1,transform:'translateX(0)'}],{duration:spring?500:360,delay:i*75,fill:'backwards'});animate(chip.querySelector('b'),[{opacity:0,transform:'scale(.6)'},{opacity:1,transform:'scale(1)'}],{duration:180,delay:240+i*75,fill:'backwards'})});const finish=animate(art.querySelector('.inbox-label'),[{opacity:.4,transform:'translateY(-4px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1.04)',offset:.6},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:300,delay:spring?650:500});finish?.finished.then(()=>label('Ready. Try the categories, contact dialog, or replay again.'),()=>{});}
 function syncReduce(){stop();root.dataset.reduced=String(muted());reduce.checked=muted();reduce.disabled=systemReduce.matches;if(systemReduce.matches)label('Your system requests reduced motion. All states update immediately.');else label(muted()?'Reduced motion preview: all movement is stopped.':'Motion enabled. Replay the showcase or try an interaction.');placeLine()}
 function choose(next){stop();mode=next;root.dataset.motion=mode;const d=descriptions[mode];document.querySelector('#motion-title').textContent=d[0];const p=document.querySelector('#motion-description');p.replaceChildren(document.createTextNode(d[1]));const span=document.createElement('span');span.textContent=d[2];p.append(span);document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===mode)));label(d[0]+' selected. Try a category, open a dialog, or replay the showcase.');placeLine();}
 document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{choose(b.dataset.preset);replay()});
 document.querySelector('#replay-motion').onclick=replay;document.querySelector('#art-replay').onclick=replay;
 reduce.onchange=()=>{manualReduction=reduce.checked;syncReduce()};systemReduce.addEventListener('change',syncReduce);
 function resetTilt(){cancelAnimationFrame(frame);frame=0;pointer=null;const from=art.style.transform;art.style.transform='';if(from)animate(art,[{transform:from},{transform:'perspective(900px) rotateX(0deg) rotateY(0deg)'}],{duration:200})}
 art.addEventListener('pointermove',e=>{if(mode!=='tactile'||!enabled()||!finePointer.matches||e.pointerType==='touch')return;pointer={x:e.clientX,y:e.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!pointer||!enabled()||mode!=='tactile')return;const r=art.getBoundingClientRect(),x=Math.max(0,Math.min(1,(pointer.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(pointer.y-r.top)/r.height));art.style.transform=`perspective(900px) rotateX(${(0.5-y)*3}deg) rotateY(${(x-0.5)*4}deg)`;art.style.setProperty('--pointer-x',x*100+'%');art.style.setProperty('--pointer-y',y*100+'%')})});
 art.addEventListener('pointerleave',resetTilt);finePointer.addEventListener('change',resetTilt);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 root.dataset.motion=mode;syncReduce();placeLine();
 const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();replay()}},{threshold:.4});observer.observe(art);
})();
</script>'''

html=html.replace('</head>',style+'</head>')
html=html.replace('<body>', '<body>'+controls)
html=html.replace('<div class="inbox-label">↓ One inbox. Yours.</div>', '<div class="inbox-label">↓ One inbox. Yours.</div><div class="flow-status" aria-live="off">One inbox for all three aliases.</div>')
html=html.replace('<div class="role-line">Custom-domain email · Application & cloud infrastructure</div>', '<div class="role-line">Custom-domain email · Application & cloud infrastructure</div>')
html=html.replace('<div class="project-info"><div class="project-meta">Featured project', '<div class="try-motion"><small>Three aliases. One destination.</small><button class="text-btn" id="art-replay">↻ Replay this idea</button></div><div class="project-info"><div class="project-meta">Featured project',1)
html=html.replace('</body>',js+'</body>')
(ROOT/'index.html').write_text(html)
print('Built animation/index.html')
