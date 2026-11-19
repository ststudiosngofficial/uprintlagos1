/* UPrintLagos — functional layer, zero dependencies */
(function(){
  'use strict';
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>[...c.querySelectorAll(s)];

  // Year + header shadow + to-top
  $('#year').textContent = new Date().getFullYear();
  const header = $('#header'), toTop = $('#toTop');
  const onScroll = ()=>{
    header.classList.toggle('scrolled', scrollY>8);
    toTop.classList.toggle('show', scrollY>700);
  };
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  toTop.addEventListener('click', ()=>scrollTo({top:0,behavior:'smooth'}));

  // Mobile menu
  const burger = $('#hamburger'), mMenu = $('#mobileMenu');
  burger.addEventListener('click', ()=>{
    const open = mMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#mobileMenu a, #mobileMenu button').forEach(a=>a.addEventListener('click',()=>mMenu.classList.remove('open')));

  // Dropdown nav (touch + keyboard)
  $$('.nav__item').forEach(item=>{
    const btn=$('.nav__parent',item);
    if(!btn) return;
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const was=item.classList.contains('open');
      $$('.nav__item.open').forEach(o=>{o.classList.remove('open');$('.nav__parent',o).setAttribute('aria-expanded','false');});
      if(!was){item.classList.add('open');btn.setAttribute('aria-expanded','true');}
    });
  });
  document.addEventListener('click',()=>$$('.nav__item.open').forEach(o=>{o.classList.remove('open');$('.nav__parent',o).setAttribute('aria-expanded','false');}));
  addEventListener('keydown',e=>{if(e.key==='Escape')$$('.nav__item.open').forEach(o=>o.classList.remove('open'));});

  // Reveal on scroll
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));

  // Counters
  const cio = new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return; cio.unobserve(e.target);
    const el=e.target, end=+el.dataset.count, t0=performance.now(), dur=1400;
    (function tick(t){ const p=Math.min((t-t0)/dur,1), v=Math.floor(end*(1-Math.pow(1-p,3)));
      el.textContent=v.toLocaleString(); if(p<1) requestAnimationFrame(tick); })(t0);
  }),{threshold:.5});
  $$('.count').forEach(el=>cio.observe(el));

  // Portfolio filter
  $$('.filter').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.filter').forEach(b=>b.classList.remove('is-active')); btn.classList.add('is-active');
    const f=btn.dataset.filter;
    $$('#workGrid .work').forEach(w=>{
      const show = f==='all' || w.dataset.cat===f;
      w.classList.toggle('hide', !show);
      if(show){ w.classList.remove('in'); requestAnimationFrame(()=>requestAnimationFrame(()=>w.classList.add('in'))); }
    });
  }));

  // Testimonial slider
  const track=$('#sliderTrack'), slides=$$('.slide',track), dotsWrap=$('#dots');
  let idx=0, timer;
  slides.forEach((_,i)=>{ const d=document.createElement('i'); if(i===0)d.classList.add('on'); d.addEventListener('click',()=>go(i,true)); dotsWrap.appendChild(d); });
  const dots=$$('i',dotsWrap);
  function go(i,manual){ idx=(i+slides.length)%slides.length; track.style.transform=`translateX(-${idx*100}%)`; dots.forEach((d,k)=>d.classList.toggle('on',k===idx)); if(manual) restart(); }
  function restart(){ clearInterval(timer); timer=setInterval(()=>go(idx+1),6000); }
  $('#prevBtn').addEventListener('click',()=>go(idx-1,true));
  $('#nextBtn').addEventListener('click',()=>go(idx+1,true));
  restart();
  // swipe
  let sx=null; track.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
  track.addEventListener('touchend',e=>{ if(sx===null)return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40) go(idx+(dx<0?1:-1),true); sx=null; },{passive:true});

  // Toast
  const toast=$('#toast'); let tt;
  function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(tt); tt=setTimeout(()=>toast.classList.remove('show'),3800); }

  // Quote form
  $('#quoteForm').addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.target;
    if(!f.name.value.trim()||!f.phone.value.trim()||!f.service.value||!f.message.value.trim()){ showToast('Please fill name, phone, service & details.'); return; }
    const lead={name:f.name.value.trim(),phone:f.phone.value.trim(),service:f.service.value,qty:f.qty.value.trim(),msg:f.message.value.trim(),at:new Date().toISOString()};
    try{ const arr=JSON.parse(localStorage.getItem('uprint_leads')||'[]'); arr.push(lead); localStorage.setItem('uprint_leads',JSON.stringify(arr)); }catch(_){}
    const wa=`https://wa.me/2348164920526?text=${encodeURIComponent(`Hello UPrintLagos! I'm ${lead.name} (${lead.phone}). Service: ${lead.service}. Qty: ${lead.qty||'-'}. Details: ${lead.msg}`)}`;
    showToast(`Thanks ${lead.name.split(' ')[0]}! Opening WhatsApp to confirm…`);
    f.reset(); setTimeout(()=>open(wa,'_blank'),900);
  });

  // Freebie form
  $('#freebieForm').addEventListener('submit',e=>{
    e.preventDefault();
    const em=$('#freebieEmail').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ showToast('Enter a valid email for the freebie.'); return; }
    showToast('Check your inbox — Brand Starter Checklist on its way! 🎁');
    e.target.reset();
  });

  // Service pre-select
  $$('[data-service]').forEach(a=>a.addEventListener('click',()=>{
    const s=$('#qService'); if(s) s.value=a.dataset.service;
    showToast(`${a.dataset.service} selected below — tell us qty.`);
  }));

  // Quote modal wizard
  const modal=$('#quoteModal'); let step=1; const pick={service:'',speed:'',plan:''};
  function openModal(plan){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; step=1; pick.plan=plan||''; render(); }
  function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function render(){
    $$('.qm-pane').forEach(p=>p.classList.toggle('is-active',+p.dataset.pane===step));
    $$('.qm-step').forEach(s=>s.classList.toggle('is-active',+s.dataset.s<=step));
    $('#qmBack').style.visibility=step===1?'hidden':'visible';
    $('#qmNext').textContent=step===3?'Finish':'Continue →';
    $('#qmSummary').textContent = pick.service||pick.speed ? `Choice: ${pick.service||'…'} • ${pick.speed||'…'}${pick.plan?' • '+pick.plan:''}` : '';
  }
  $$('[data-open-quote]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();closeMobile();openModal(b.dataset.plan||'');}));
  function closeMobile(){ mMenu.classList.remove('open'); }
  $('#qmClose').addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
  addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });
  $('#qmBack').addEventListener('click',()=>{ if(step>1){step--;render();} });
  $('#qmNext').addEventListener('click',()=>{
    if(step===1&&!pick.service){showToast('Pick a service first.');return;}
    if(step===2&&!pick.speed){showToast('Pick a timeline.');return;}
    if(step<3){step++;render();} else finish();
  });
  $$('.qm-pane[data-pane="1"] button').forEach(b=>b.addEventListener('click',()=>{pick.service=b.dataset.val;$$('.qm-pane[data-pane="1"] button').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');step=2;render();}));
  $$('.qm-pane[data-pane="2"] button').forEach(b=>b.addEventListener('click',()=>{pick.speed=b.dataset.val;$$('.qm-pane[data-pane="2"] button').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');step=3;render();}));
  function finish(){
    const ph=$('#qmPhone').value.trim();
    if(ph.length<7){showToast('Add your WhatsApp number so we can price you.');return;}
    open(`https://wa.me/2348164920526?text=${encodeURIComponent(`Hello UPrintLagos! I need ${pick.service} (${pick.speed}). ${pick.plan?'Plan: '+pick.plan+'. ':''}My number: ${ph}`)}`,'_blank');
    showToast('Opening WhatsApp with your choices…'); closeModal();
  }
  $('#qmDone').addEventListener('click',finish);

  /* AI autoresponder — free AI (Pollinations) with instant offline fallback */
  const chatFab=$('#chatFab'), chatBox=$('#chat'), chatMsgs=$('#chatMsgs'), chatForm=$('#chatForm'), chatInput=$('#chatInput');
  if(chatFab && chatBox){
    const SYS='You are UPrint AI, friendly assistant for UPrintLagos, a graphic design and print studio at 162B Obafemi Awolowo Way, Alausa, Ikeja, Lagos. Open Mon-Sat 8am-6pm. Services: logo and branding from 85000 naira, flyers and business cards, packaging and labels, large format banners and billboards, social media kits from 120000 naira, express 48-hour studio. WhatsApp +234 816 492 0526. Keep replies under 60 words, warm, plain text. Always end with a clear next step.';
    const store=(t,who)=>{try{const h=JSON.parse(localStorage.getItem('uprint_chat')||'[]');h.push({t,who});localStorage.setItem('uprint_chat',JSON.stringify(h.slice(-30)));}catch(_){}};
    const bubble=(t,who)=>{const d=document.createElement('div');d.className='msg msg--'+who;d.textContent=t;chatMsgs.appendChild(d);chatMsgs.scrollTop=chatMsgs.scrollHeight;return d;};
    const push=(t,who)=>{const d=bubble(t,who);store(t,who);return d;};
    const fallback=q=>{
      q=q.toLowerCase();
      if(/price|cost|charge|how much|naira|45k|185k/.test(q))return 'Starter jobs start at ₦45k, Brand + Print at ₦185k, and big jobs are custom — see the Pricing page. Tell me what you want to print and I will point you to the right package.';
      if(/service|offer|do you do|design|print|brand|packag|banner|logo|flyer/.test(q))return 'We do logos and branding, flyers and cards, packaging and labels, large-format banners and billboards, plus social media kits — with an express 48-hour option. Which one do you need?';
      if(/time|long|fast|deliver|when|express|48|day/.test(q))return 'Standard jobs take 3–5 working days, express takes 48 hours. We deliver across Lagos and nationwide with tracking. When do you need yours?';
      if(/where|address|location|locate|ikeja|shop|office|visit/.test(q))return 'We are at 162B Obafemi Awolowo Way, Alausa, Ikeja, Lagos. Open Mon–Sat, 8am–6pm. Want to start something on WhatsApp?';
      if(/human|person|agent|call|phone|whatsapp|contact|talk|number/.test(q))return 'You can reach a human right now on WhatsApp: +234 816 492 0526. Tap the green WhatsApp button and we reply same day.';
      if(/hello|hi|hey|good|morning|afternoon|evening|start/.test(q))return 'Hello! Welcome to UPrintLagos. Ask me about services, prices or delivery — or tap a shortcut below.';
      if(/thank|thanks/.test(q))return 'You are welcome! Anything else — a quote, a design idea, delivery? I am here.';
      return 'Got it! Tell me what you want to design or print and I will guide you — or tap WhatsApp below and a human will reply same day.';
    };
    async function aiReply(q,onToken){
      const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),25000);
      try{
        const r=await fetch('https://text.pollinations.ai/openai',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,body:JSON.stringify({model:'openai',messages:[{role:'system',content:SYS},{role:'user',content:q}],stream:true})});
        if(!r.ok||!r.body)throw 0;
        const rd=r.body.getReader();const dec=new TextDecoder();let buf='',out='';
        for(;;){const n=await rd.read();if(n.done)break;buf+=dec.decode(n.value,{stream:true});
          const parts=buf.split('\n\n');buf=parts.pop();
          for(const p of parts){const line=p.split('\n').map(s=>s.trim()).find(s=>s.indexOf('data:')===0);if(!line)continue;const d=line.slice(5).trim();if(!d||d==='[DONE]')continue;
            try{const tok=(JSON.parse(d).choices||[])[0];const t=tok&&(tok.delta||{}).content||'';if(t){out+=t;onToken(out);}}catch(_){}}}
        clearTimeout(to);return out.trim()||fallback(q);
      }catch(_){clearTimeout(to);
        try{
          const r2=await fetch('https://text.pollinations.ai/'+encodeURIComponent(q)+'?model=openai&system='+encodeURIComponent(SYS));
          if(!r2.ok)throw 0;const t=(await r2.text()).trim();return t||fallback(q);
        }catch(__){return null;}
      }
    }
    try{(JSON.parse(localStorage.getItem('uprint_chat')||'[]')).forEach(m=>bubble(m.t,m.who));}catch(_){}
    if(!chatMsgs.children.length)push('Hi! I am UPrint AI. Ask me about our services, prices or delivery times.','bot');
    const toggle=o=>{chatBox.classList.toggle('open',o);chatBox.setAttribute('aria-hidden',String(!o));};
    chatFab.addEventListener('click',()=>toggle(!chatBox.classList.contains('open')));
    $('#chatClose').addEventListener('click',()=>toggle(false));
    $$('#chatChips button').forEach(b=>b.addEventListener('click',()=>send(b.textContent.replace(/^[^\s]+\s/,''))));
    async function send(text){
      const q=(text||chatInput.value).trim();if(!q)return;chatInput.value='';
      push(q,'user');
      const ty=document.createElement('div');ty.className='msg msg--bot msg--typing';ty.innerHTML='<i></i><i></i><i></i>';chatMsgs.appendChild(ty);chatMsgs.scrollTop=chatMsgs.scrollHeight;
      let live=null;
      const a=await aiReply(q,partial=>{if(!live){ty.remove();live=bubble(partial,'bot');}else{live.textContent=partial;chatMsgs.scrollTop=chatMsgs.scrollHeight;}});
      if(a===null){if(live){live.remove();}else{ty.remove();}push(fallback(q),'bot');}
      else if(live){live.textContent=a;store(a,'bot');chatMsgs.scrollTop=chatMsgs.scrollHeight;}
      else{ty.remove();push(a,'bot');}
    }
    chatForm.addEventListener('submit',e=>{e.preventDefault();send();});
  }
})();
