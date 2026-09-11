let selected=null;

const $=id=>document.getElementById(id);

async function api(path,options={}){
  const r=await fetch(path,{...options,credentials:'include',headers:{'content-type':'application/json',...(options.headers||{})}});
  const text=await r.text();
  let data={};
  try{data=JSON.parse(text)}catch{}
  if(r.status===401)throw new Error('authentication_required');
  if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);
  return data;
}

function showLogin(){
  const app=$('appView');
  const login=$('loginView');
  if(app)app.hidden=true;
  if(login)login.hidden=false;
}

function showApp(){
  const app=$('appView');
  const login=$('loginView');
  if(login)login.hidden=true;
  if(app)app.hidden=false;
}

function money(v){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0));
}

function escapeHtml(s){
  return String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function boot(){
  try{
    const me=await api('/api/auth/me');
    showApp();
    $('identity').textContent=`${me.user.name||me.user.email} · ${me.user.role}`;
    $('roleBadge').textContent=String(me.user.role||'').toUpperCase();
    $('workspaceInfo').textContent=`Workspace: ${me.user.organization_id}`;
    await loadOverview();
    $('status').textContent='● secure session';
  }catch{
    showLogin();
  }
}

async function loadOverview(){
  const x=await api('/api/dashboard/overview');
  $('health').textContent='ONLINE';
  $('mAccounts').textContent=x.metrics.accounts;
  $('mSignals').textContent=x.metrics.signals;
  $('mCampaigns').textContent=x.metrics.campaigns;
  $('mTouchpoints').textContent=x.metrics.touchpoints;
  $('mSpend').textContent=money(x.metrics.touchpoint_spend);
  $('accountList').innerHTML=(x.accounts||[]).map(a=>`<button type="button" class="account-row ${selected?.account?.id===a.id?'selected':''}" data-id="${escapeHtml(a.id)}"><span><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.industry||'')} · ACV ${money(a.acv)}</small></span><span class="scores"><strong>${Math.round(a.intent_score||0)}</strong><small>intent</small><strong>${Math.round(a.physical_intervention_score||0)}</strong><small>physical</small></span></button>`).join('')||'<p class="muted">No accounts in this workspace.</p>';
  document.querySelectorAll('.account-row').forEach(b=>b.addEventListener('click',()=>selectAccount(b.dataset.id)));
  if(!selected&&x.accounts?.[0])await selectAccount(x.accounts[0].id);
}

async function selectAccount(id){
  try{
    selected=await api('/api/dashboard/account/'+encodeURIComponent(id));
    $('evaluate').disabled=false;
    const a=selected.account,c=selected.contacts?.[0];
    $('selectedAccount').innerHTML=`<div class="account-title"><div><h3>${escapeHtml(a.name)}</h3><p>${escapeHtml(a.domain||'')} · ${escapeHtml(a.industry||'')}</p></div><div class="score-box"><b>${Math.round(a.intent_score||0)}</b><span>intent</span><b>${Math.round(a.physical_intervention_score||0)}</b><span>physical</span></div></div><div class="contact"><b>${escapeHtml(c?.name||'No contact')}</b><span>${escapeHtml(c?.title||'')}</span><span>Address: ${escapeHtml(c?.address_status||'unknown')}</span></div>`;
    renderSignals();
    renderGraph();
    document.querySelectorAll('.account-row').forEach(b=>b.classList.toggle('selected',b.dataset.id===id));
  }catch(e){
    $('selectedAccount').innerHTML=`<div class="error">${escapeHtml(e.message)}</div>`;
  }
}

function renderSignals(){
  $('signalTimeline').innerHTML=selected?.signals?.length?selected.signals.map(s=>`<div class="signal"><span class="signal-score">${Math.round(s.strength||0)}</span><div><b>${escapeHtml(s.signal_name)}</b><small>${escapeHtml(s.signal_type||'signal')} · ${new Date(s.occurred_at).toLocaleString()}</small></div></div>`).join(''):'<p class="muted">No signals recorded.</p>';
}

function renderGraph(){
  const a=selected.account;
  const nodes=[{label:a.name,type:'ACCOUNT'},...(selected.contacts||[]).slice(0,3).map(c=>({label:c.name,type:'CONTACT'})),...(selected.signals||[]).slice(0,5).map(s=>({label:s.signal_name,type:'SIGNAL'}))];
  $('graph').innerHTML=nodes.map(n=>`<div class="node"><b>${escapeHtml(n.label).slice(0,28)}</b><small>${n.type}</small></div>`).join('<div class="edge">→</div>');
}

async function evaluate(){
  if(!selected)return;
  const btn=$('evaluate');
  btn.disabled=true;
  btn.textContent='Evaluating…';
  $('decision').innerHTML='<div class="loading">Running policy + decision engine…</div>';
  try{
    const x=await api('/api/ai/evaluate',{method:'POST',body:JSON.stringify({accountId:selected.account.id,contactId:selected.contacts?.[0]?.id,campaignId:'camp_demo',cost:12})});
    $('decision').innerHTML=`<div class="decision-card"><div class="decision-main"><span class="decision-pill">${escapeHtml(x.decision||'ERROR')}</span><b>${escapeHtml(x.experience||'NONE')}</b><span>${money(x.recommended_spend||0)} recommended spend</span></div><p>${escapeHtml(x.reasoning_summary||x.error||'No reasoning returned.')}</p><div class="decision-meta">Intent ${Math.round(x.intent_score||0)} · Physical ${Math.round(x.physical_intervention_score||0)} · Confidence ${Math.round((x.confidence||0)*100)}%</div></div>`;
  }catch(e){
    $('decision').innerHTML=`<div class="error">${escapeHtml(e.message)}</div>`;
  }finally{
    btn.disabled=false;
    btn.textContent='Evaluate selected';
  }
}

function init(){
  const loginForm=$('loginForm');
  const logout=$('logout');
  const evaluateButton=$('evaluate');

  if(!loginForm){
    console.error('IntentPost: loginForm not found');
    return;
  }

  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();
    e.stopPropagation();
    const btn=loginForm.querySelector('button[type="submit"]');
    $('loginError').textContent='';
    btn.disabled=true;
    btn.textContent='Signing in…';
    try{
      const result=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});
      if(!result.user)throw new Error('login_failed');
      await boot();
    }catch(err){
      console.error('IntentPost login error:',err);
      $('loginError').textContent=err.message==='authentication_required'?'Session error. Please try again.':'Invalid email or password.';
    }finally{
      btn.disabled=false;
      btn.textContent='Sign in';
    }
  });

  if(logout)logout.addEventListener('click',async()=>{
    try{await api('/api/auth/logout',{method:'POST'})}catch{}
    selected=null;
    $('password').value='';
    showLogin();
  });

  if(evaluateButton)evaluateButton.addEventListener('click',evaluate);
  boot();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
