/* Istante 2.0 - local-first screensaver, plain JavaScript. */
(function () {
'use strict';
const C = window.IstanteCore;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const KEY = 'istante.v2.';
const icons = {
 moon:'<path d="M20.5 13.2A8.5 8.5 0 0 1 10.8 3.5 8.5 8.5 0 1 0 20.5 13.2Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 sunrise:'<path d="M2 17h20M4 21h16M7 17a5 5 0 0 1 10 0M12 3v6M9 6l3-3 3 3M3 10l2 2m14 0 2-2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 heart:'<path d="m12 20-8.2-8.1A5 5 0 0 1 11 5l1 1 1-1a5 5 0 0 1 7.2 6.9Z"/>',
 shuffle:'<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3.4-1.8 4.6-4M13.4 10C14.8 7.7 16.2 6 18 6h3m-4-4 4 4-4 4"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 collapse:'<path d="M3 8h5V3m8 0v5h5M8 21v-5H3m13 5v-5h5"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--surface)"/><circle cx="16" cy="12" r="2" fill="var(--surface)"/><circle cx="10" cy="18" r="2" fill="var(--surface)"/>',
 collection:'<rect x="3" y="5" width="5" height="15" rx="1"/><rect x="10" y="5" width="5" height="15" rx="1"/><path d="m18 4 3 15"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18A9 9 0 0 0 12 3Z" fill="currentColor" stroke="none"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-6-6L3 21"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
 play:'<path d="m9 5 11 7-11 7Z"/>'
};
function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || icons.clock) + '</svg>'; }
$$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
let storageFailed = false;
const store = {
 read(key, fallback) { try { const v = localStorage.getItem(KEY + key); return v === null ? fallback : JSON.parse(v); } catch (_) { return fallback; } },
 write(key, value) { try { localStorage.setItem(KEY + key, JSON.stringify(value)); return true; } catch (_) { storageFailed = true; return false; } },
 remove(key) { try { localStorage.removeItem(KEY + key); } catch (_) {} }
};
let settings = C.cleanSettings(store.read('settings', {}));
let originalPayload = window.ISTANTE_PHRASES, customPayload = store.read('collection', null), phrases;
try { phrases = C.parsePhrases(customPayload || originalPayload); }
catch (_) { customPayload = null; store.remove('collection'); phrases = C.parsePhrases(originalPayload); }
let deck = C.buildDeck(phrases);
const savedFavorites = store.read('favorites', []);
const favorites = new Set(Array.isArray(savedFavorites) ? savedFavorites.filter(x => typeof x === 'string') : []);
let photo = store.read('photo', '');
if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo)) photo = '';
let current = null, slotKey = '', schedule = null, quoteTimer, toastTimer, idleTimer, clockTimer;
let favoriteOnly = false, visibleLimit = 40, searchTimer, previousFocus = null;
let wakeSentinel = null, acquiringWake = false, lastClock = '', lastDate = '', lastGoalMinute = '';
let draftPhoto = photo, lastActivity = 0;
const openingSession = Date.now() + ':' + Math.random().toString(36).slice(2);
const timeFormatter = new Intl.DateTimeFormat('it-IT', { hour:'2-digit', minute:'2-digit', hour12:false });
const dateFormatter = new Intl.DateTimeFormat('it-IT', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const goalDateFormatter = new Intl.DateTimeFormat('it-IT', { day:'numeric', month:'long', year:'numeric' });
const pad = n => String(n).padStart(2, '0');
const modeNames = { twice:'Mattina & sera', daily:'Una al giorno', opening:'A ogni apertura' };

function toast(message) {
 const el = $('#toast'); ($('dialog[open]') || document.body).append(el);
 el.textContent = message; el.hidden = false;
 clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4100);
}
function saveNotice(ok) { if (!ok) toast('Memoria del browser non disponibile o piena: le modifiche restano solo in questa sessione.'); }
function isPanelOpen() { return !!$('dialog[open]'); }
function activity() {
 document.body.classList.remove('is-idle');
 if (Date.now() - lastActivity < 250) return;
 lastActivity = Date.now(); clearTimeout(idleTimer);
 if (settings.hideControls && !isPanelOpen()) idleTimer = setTimeout(() => {
  if (!isPanelOpen() && settings.hideControls) document.body.classList.add('is-idle');
 }, 10000);
}
function randomIndex(length) {
 if (window.crypto && window.crypto.getRandomValues) {
  const a = new Uint32Array(1), limit = Math.floor(4294967296 / length) * length;
  do { window.crypto.getRandomValues(a); } while (a[0] >= limit);
  return a[0] % length;
 }
 return Math.floor(Math.random() * length);
}
function chooseOpening() {
 const last = store.read('lastPhrase', ''), group = typeof last === 'string' ? C.themeKey(last) : '';
 let candidates = deck.items.filter(p => p.group !== group);
 if (!candidates.length) candidates = deck.items.filter(p => p.text !== last);
 if (!candidates.length) candidates = deck.items;
 return candidates[randomIndex(candidates.length)];
}
function updateFavoriteButton() {
 if (!current) return;
 const saved = favorites.has(current.text), el = $('#favorite-current');
 el.setAttribute('aria-pressed', String(saved));
 el.setAttribute('aria-label', saved ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'); el.title = el.getAttribute('aria-label');
}
function renderPhrase(phrase, animate) {
 current = phrase; store.write('lastPhrase', phrase.text); updateFavoriteButton();
 const wrap = $('#quote-wrap'), split = C.splitPhrase(phrase.text); clearTimeout(quoteTimer);
 const apply = () => {
  $('#quote-intro').textContent = split.intro; $('#quote-intro').hidden = !split.intro;
  $('#quote-text').textContent = split.body; wrap.classList.remove('is-changing');
 };
 if (animate && settings.motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  wrap.classList.add('is-changing'); quoteTimer = setTimeout(apply, 240);
 } else apply();
}
function updatePhraseMeta(manual) {
 $('#thought-label').textContent = schedule.label;
 $('#phrase-meta').textContent = schedule.nextAt ? 'Prossimo pensiero alle ' + timeFormatter.format(schedule.nextAt) : 'Un nuovo pensiero alla prossima apertura';
 $('#manual-label').hidden = !manual;
}
function syncSchedule(now, force) {
 const next = C.getSchedule(now, settings);
 const key = deck.signature + ':' + next.key + (settings.mode === 'opening' ? ':' + openingSession : '');
 if (key === slotKey && !force) return;
 schedule = next; slotKey = key;
 const override = store.read('override', null);
 let phrase = override && override.key === slotKey ? phrases.find(p => p.id === override.id) : null;
 const manual = !!phrase;
 if (!phrase) phrase = settings.mode === 'opening' ? chooseOpening() : C.pickScheduled(deck.items, schedule.ordinal);
 renderPhrase(phrase, !!current); updatePhraseMeta(manual);
}
function chooseManual(phrase) {
 if (!phrase) return;
 syncSchedule(new Date()); saveNotice(store.write('override', { key:slotKey, id:phrase.id }));
 renderPhrase(phrase, true); updatePhraseMeta(true); activity();
}
function nextPhrase() {
 if (!current) return;
 const idx = deck.items.findIndex(p => p.id === current.id);
 let candidate = deck.items[(idx + 1) % deck.items.length];
 for (let i = 1; i < deck.items.length; i++) {
  const p = deck.items[(idx + i) % deck.items.length];
  if (p.group !== current.group) { candidate = p; break; }
 }
 chooseManual(candidate);
}
function applyAppearance(now) {
 const min = now.getHours() * 60 + now.getMinutes();
 const rawStart=C.minutes(settings.morning,360), rawEnd=C.minutes(settings.evening,1080);
 const start=rawStart<rawEnd?rawStart:360, end=rawStart<rawEnd?rawEnd:1080;
 const lightTime = min >= start && min < end;
 const usingPhoto = settings.background === 'photo' && !!photo;
 const theme = usingPhoto ? 'dark' : settings.theme === 'auto' ? (lightTime ? 'light' : 'dark') : settings.theme;
 document.documentElement.dataset.theme = theme;
 $('meta[name="theme-color"]').content = theme === 'light' ? '#f1eee7' : '#131615';
 document.body.dataset.background = usingPhoto ? 'photo' : settings.background === 'photo' ? 'ambient' : settings.background;
 document.body.classList.toggle('no-motion', !settings.motion); document.body.classList.toggle('no-clock', !settings.showClock);
 document.body.style.setProperty('--photo-dim', String(settings.photoDim / 100)); $('#clock-seconds').hidden = !settings.showSeconds;
 $('#mode-label').textContent = settings.mode === 'interval' ? 'Ogni ' + settings.interval + ' minuti' : modeNames[settings.mode];
 if (photo && $('#wallpaper').dataset.loaded !== photo) {
  $('#wallpaper').style.backgroundImage = 'url("' + photo + '")'; $('#wallpaper').dataset.loaded = photo;
 }
 let greeting = 'Buonasera', name = 'moon';
 if (min < start) greeting = 'Buonanotte';
 else if (min < 720) { greeting = 'Buongiorno'; name = 'sunrise'; }
 else if (lightTime) { greeting = 'Buon pomeriggio'; name = 'sun'; }
 if ($('#greeting').textContent !== greeting) { $('#greeting').textContent = greeting; $('.greeting .icon').innerHTML = icon(name); }
}
function syncGoal(now, force) {
 const stamp = now.getFullYear()+':'+now.getMonth()+':'+now.getDate()+':'+now.getHours()+':'+now.getMinutes();
 if (stamp === lastGoalMinute && !force) return; lastGoalMinute = stamp;
 const goal = C.getGoal(now,settings); $('#goal-strip').hidden = !goal; if (!goal) return;
 $('#goal-title').textContent = goal.title; $('#goal-days').textContent = pad(goal.days); $('#goal-hours').textContent = pad(goal.hours); $('#goal-minutes').textContent = pad(goal.minutes);
 $('#goal-label').textContent = goal.done ? 'Traguardo raggiunto' : goal.waiting ? 'Il percorso deve ancora iniziare' : 'Il prossimo capitolo';
 $('#progress-label').textContent = goal.done ? 'Hai raggiunto la tua data' : goal.waiting ? 'Inizia il '+goalDateFormatter.format(goal.start) : settings.goalMode === 'year' ? 'Il percorso di quest\'anno' : 'Il tuo percorso';
 const value = goal.progress.toLocaleString('it-IT',{minimumFractionDigits:1,maximumFractionDigits:1});
 $('#progress-value').textContent = value+'%'; $('#progress-fill').style.width = goal.progress.toFixed(3)+'%';
 $('#goal-progress').setAttribute('aria-valuenow',goal.progress.toFixed(1)); $('#goal-progress').setAttribute('aria-valuetext',value+' per cento');
 $('#goal-date').textContent = goalDateFormatter.format(goal.end)+' \u00b7 '+timeFormatter.format(goal.end);
}
function tick(force) {
 const now = new Date(), hhmm = pad(now.getHours())+':'+pad(now.getMinutes());
 if (hhmm !== lastClock) {
  lastClock = hhmm; $('#clock').innerHTML = pad(now.getHours())+'<span class="clock-colon">:</span>'+pad(now.getMinutes());
  $('#clock').setAttribute('datetime',hhmm); $('#clock').setAttribute('aria-label','Sono le '+hhmm); document.title = hhmm+' | Istante'; applyAppearance(now);
 }
 $('#clock-seconds').textContent = pad(now.getSeconds());
 const date = dateFormatter.format(now); if (date !== lastDate) { lastDate = date; $('#date-label').textContent = date; }
 syncSchedule(now,force); syncGoal(now,force);
}
function startClock() { clearTimeout(clockTimer); tick(false); if (!document.hidden) clockTimer = setTimeout(startClock,1000-Date.now()%1000+15); }
function updateLibraryCounts() {
 const count = phrases.filter(p=>favorites.has(p.text)).length;
 $('#collection-count').textContent = phrases.length; $('#all-count').textContent = phrases.length; $('#favorites-count').textContent = count;
 $('#library-subtitle').textContent = phrases.length+' piccoli promemoria. '+(customPayload ? 'La tua raccolta personale.' : 'La tua raccolta originale, sempre con te.');
 $('#restore-phrases').hidden = !customPayload;
}
function toggleFavorite(phrase) {
 if (favorites.has(phrase.text)) favorites.delete(phrase.text); else favorites.add(phrase.text);
 saveNotice(store.write('favorites',[...favorites])); updateFavoriteButton(); updateLibraryCounts();
 if ($('#library-dialog').open) renderLibrary();
}
function actionButton(name,label,callback,pressed) {
 const b = document.createElement('button'); b.type='button'; b.className='icon-button'; b.title=label; b.setAttribute('aria-label',label);
 if (typeof pressed === 'boolean') b.setAttribute('aria-pressed',String(pressed));
 const span=document.createElement('span'); span.className='icon'; span.innerHTML=icon(name); b.append(span); b.addEventListener('click',callback); return b;
}
function renderLibrary(reset) {
 if (reset) visibleLimit=40;
 const query=C.normalized($('#phrase-search').value), selected=phrases.filter(p=>(!favoriteOnly||favorites.has(p.text))&&(!query||p.search.includes(query)));
 const list=$('#phrase-list'), scroller=$('.library-list-wrap'), scrollTop=scroller.scrollTop;
 list.replaceChildren(); const fragment=document.createDocumentFragment();
 selected.slice(0,visibleLimit).forEach(p=>{
  const row=document.createElement('article'); row.className='phrase-row'+(current&&p.id===current.id?' is-current':'');
  const num=document.createElement('span'); num.className='phrase-number'; num.textContent=String(p.sourceIndex+1).padStart(3,'0');
  const text=document.createElement('p'); text.className='phrase-content'; text.textContent=p.text;
  const actions=document.createElement('div'); actions.className='phrase-actions'; const saved=favorites.has(p.text);
  actions.append(actionButton('heart',(saved?'Rimuovi dai preferiti: frase ':'Salva tra le preferite: frase ')+(p.sourceIndex+1),()=>toggleFavorite(p),saved));
  actions.append(actionButton('play','Mostra la frase '+(p.sourceIndex+1),()=>{chooseManual(p);closeDialog($('#library-dialog'));toast('Frase scelta per questo momento. Il cambio automatico resta attivo.');}));
  row.append(num,text,actions);fragment.append(row);
 });
 list.append(fragment); $('#library-empty').hidden=selected.length>0;
 $('#library-empty').textContent=favoriteOnly&&!query?'I pensieri da ritrovare iniziano con un cuore.':'Nessun pensiero trovato. Prova con un\'altra parola.';
 $('#load-more').hidden=selected.length<=visibleLimit; $('#result-count').textContent=selected.length+(selected.length===1?' frase':' frasi');
 $('#filter-all').classList.toggle('active',!favoriteOnly); $('#filter-all').setAttribute('aria-pressed',String(!favoriteOnly));
 $('#filter-favorites').classList.toggle('active',favoriteOnly); $('#filter-favorites').setAttribute('aria-pressed',String(favoriteOnly));
 scroller.scrollTop=reset?0:scrollTop; updateLibraryCounts();
}
function dateInput(date) { return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes()); }
function fillSettings() {
 const form=$('#settings-form');
 for (const [key,value] of Object.entries(settings)) {
  const el=form.elements.namedItem(key);if(!el)continue;
  if(el instanceof RadioNodeList)el.value=String(value);else if(el.type==='checkbox')el.checked=value;else el.value=String(value);
 }
 if(!form.elements.goalStart.value)form.elements.goalStart.value=dateInput(new Date());
 if(!form.elements.goalEnd.value)form.elements.goalEnd.value=dateInput(new Date(new Date().getFullYear()+1,0,1));
 draftPhoto=photo;$('#photo-input').value='';$('#photo-label').textContent=photo?'Sostituisci la fotografia':'Scegli una fotografia';$('#settings-error').hidden=true;
 $('#wake-support').textContent=('wakeLock' in navigator&&window.isSecureContext)?'La richiesta di schermo acceso dipende dalle autorizzazioni e dal risparmio energetico del dispositivo.':'Schermo sempre acceso non disponibile qui: serve un browser compatibile su HTTPS o localhost.';
 updateSettingsFields();
}
function updateSettingsFields() {
 const f=$('#settings-form').elements,mode=f.mode.value;
 f.morning.required=['twice','daily'].includes(mode);f.evening.required=mode==='twice';
 $('#schedule-times').hidden=!['twice','daily'].includes(mode);$('#evening-field').hidden=mode!=='twice';$('#interval-field').hidden=mode!=='interval';$('#goal-fields').hidden=f.goalMode.value!=='custom';$('#photo-fields').hidden=f.background.value!=='photo';
 const notes={twice:'La frase non cambia ricaricando la pagina. La sera continua anche dopo mezzanotte, fino al mattino.',daily:'Un pensiero dal cambio mattutino fino alla stessa ora del giorno dopo, anche ricaricando la pagina.',interval:'Il cambio segue intervalli regolari dell\'orologio, non il tempo trascorso dall\'apertura.',opening:'La frase cambia a ogni apertura o ricaricamento della pagina. Non cambia da sola mentre resti qui.'};
 $('#schedule-note').textContent=notes[mode];
}
function openDialog(which) {
 const dialog=$('#'+which+'-dialog');if(!dialog)return;previousFocus=document.activeElement;
 if(which==='settings')fillSettings();else renderLibrary(true);
 clearTimeout(idleTimer);document.body.classList.remove('is-idle');document.body.classList.add('has-panel');document.body.style.overflow='hidden';dialog.showModal();
 if(which==='library')$('#phrase-search').focus({preventScroll:true});else $('#settings-dialog .close-button').focus({preventScroll:true});
}
function closeDialog(dialog) { dialog.close(); }
$$('dialog').forEach(dialog=>{
 dialog.addEventListener('close',()=>{document.body.classList.remove('has-panel');document.body.style.overflow='';if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});lastActivity=0;activity();});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);});
});
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>openDialog(b.dataset.open)));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.closest('dialog'))));
$('#settings-form').addEventListener('change',updateSettingsFields);
$('#settings-form').addEventListener('submit',event=>{
 event.preventDefault();const f=event.currentTarget,values=Object.fromEntries(new FormData(f));
 for(const key of ['showClock','showSeconds','motion','hideControls','wakeLock'])values[key]=f.elements[key].checked;
 values.interval=Number(values.interval);values.photoDim=Number(values.photoDim);let error='';if(!f.reportValidity())return;
 if(values.mode==='twice'&&C.minutes(values.morning,-1)>=C.minutes(values.evening,-1))error='L\'inizio della sera deve essere successivo all\'inizio della mattina.';
 if(values.goalMode==='custom'&&(!values.goalStart||!values.goalEnd||new Date(values.goalEnd)<=new Date(values.goalStart)))error='Inserisci una data finale successiva alla data di inizio.';
 if(values.background==='photo'&&!draftPhoto)error='Scegli una fotografia oppure un altro tipo di sfondo.';
 if(error){$('#settings-error').textContent=error;$('#settings-error').hidden=false;return;}
 const scheduleChanged=['mode','morning','evening','interval'].some(k=>settings[k]!==values[k]);
 settings=C.cleanSettings(values);let ok=store.write('settings',settings);
 if(draftPhoto!==photo){photo=draftPhoto;ok=store.write('photo',photo)&&ok;}
 applyAppearance(new Date());syncGoal(new Date(),true);if(scheduleChanged)syncSchedule(new Date(),true);
 closeDialog($('#settings-dialog'));lastActivity=0;activity();
 toast(ok?'Tutto pronto. Questo momento \u00e8 tuo.':'Preferenze applicate solo per questa sessione: memoria del browser non disponibile.');updateWakeLock();
});
async function updateWakeLock(){
 if(!settings.wakeLock||document.hidden){if(wakeSentinel){const old=wakeSentinel;wakeSentinel=null;try{await old.release();}catch(_){}}return;}
 if(!navigator.wakeLock||!window.isSecureContext||wakeSentinel||acquiringWake)return;acquiringWake=true;
 try{const lock=await navigator.wakeLock.request('screen');if(!settings.wakeLock||document.hidden){await lock.release();return;}wakeSentinel=lock;lock.addEventListener('release',()=>{if(wakeSentinel===lock)wakeSentinel=null;});}catch(_){/* May be rejected by OS/browser energy policy. */}finally{acquiringWake=false;}
}
async function toggleFullscreen(){
 try{const full=document.fullscreenElement||document.webkitFullscreenElement;
 if(full){const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document);}
 else{const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;if(request)await request.call(document.documentElement);else toast('Lo schermo intero non \u00e8 disponibile in questo browser.');}}
 catch(_){toast('Il browser non ha consentito lo schermo intero.');}
}
function syncFullscreenButton(){const full=!!(document.fullscreenElement||document.webkitFullscreenElement);$('#fullscreen .icon').innerHTML=icon(full?'collapse':'expand');$('#fullscreen').setAttribute('aria-label',full?'Esci da schermo intero':'Schermo intero');$('#fullscreen').title=full?'Esci da schermo intero (F)':'Schermo intero (F)';}
$('#fullscreen').addEventListener('click',toggleFullscreen);document.addEventListener('fullscreenchange',syncFullscreenButton);document.addEventListener('webkitfullscreenchange',syncFullscreenButton);
$('#next-phrase').addEventListener('click',nextPhrase);
$('#favorite-current').addEventListener('click',()=>{if(current){toggleFavorite(current);toast(favorites.has(current.text)?'Un pensiero da ritrovare. Salvato nei preferiti.':'Frase rimossa dai preferiti.');}});
$('#copy-phrase').addEventListener('click',async()=>{
 if(!current)return;
 try{if(!navigator.clipboard||!window.isSecureContext)throw new Error('fallback');await navigator.clipboard.writeText(current.text);toast('Frase copiata.');}
 catch(_){const area=document.createElement('textarea');area.value=current.text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();let success=false;try{success=document.execCommand('copy');}catch(_){}area.remove();$('#copy-phrase').focus();toast(success?'Frase copiata.':'Copia non consentita. Puoi selezionare direttamente il testo della frase.');}
});
$('#filter-all').addEventListener('click',()=>{favoriteOnly=false;renderLibrary(true);});$('#filter-favorites').addEventListener('click',()=>{favoriteOnly=true;renderLibrary(true);});
$('#phrase-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>renderLibrary(true),100);});$('#load-more').addEventListener('click',()=>{visibleLimit+=40;renderLibrary();});
function activateCollection(payload){const parsed=C.parsePhrases(payload);phrases=parsed;deck=C.buildDeck(phrases);slotKey='';syncSchedule(new Date(),true);updateLibraryCounts();renderLibrary(true);}
$('#import-phrases').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{if(file.size>2*1024*1024)throw new Error('Il JSON deve essere inferiore a 2 MB.');const payload=JSON.parse(await file.text());C.parsePhrases(payload);
 if(!window.confirm('Sostituire la raccolta su questo browser? Il file originale resta intatto e potrai ripristinarlo.'))return;
 const ok=store.write('collection',payload);customPayload=payload;activateCollection(payload);toast(ok?'Raccolta importata: '+phrases.length+' frasi.':'Raccolta importata solo per questa sessione: memoria del browser non disponibile.');}
 catch(error){toast(error instanceof SyntaxError?'Il file non contiene un JSON valido.':error.message);}finally{event.target.value='';}
});
$('#export-phrases').addEventListener('click',()=>{
 const payload={version:'1.0',language:'it',count:phrases.length,phrases:phrases.map(p=>p.text)},blob=new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='istante-frasi.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
$('#restore-phrases').addEventListener('click',()=>{if(!window.confirm('Ripristinare la raccolta originale su questo browser? I preferiti non vengono eliminati.'))return;customPayload=null;store.remove('collection');activateCollection(originalPayload);toast('Raccolta originale ripristinata.');});
$('#photo-input').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Scegli una foto JPG, PNG o WebP.');if(file.size>15*1024*1024)throw new Error('La fotografia deve essere inferiore a 15 MB.');
 const objectUrl=URL.createObjectURL(file),image=new Image();
 try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Impossibile leggere questa fotografia.'));image.src=objectUrl;});}finally{URL.revokeObjectURL(objectUrl);}
 if(image.width*image.height>80000000)throw new Error('La fotografia ha una risoluzione troppo elevata.');
 const scale=Math.min(1,1920/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
 const ctx=canvas.getContext('2d');ctx.fillStyle='#131615';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);draftPhoto=canvas.toDataURL('image/jpeg',.83);
 $('#photo-label').textContent=file.name.length>32?file.name.slice(0,29)+'...':file.name;toast('Foto pronta. Salva le impostazioni per applicarla.');}
 catch(error){toast(error.message);}
});
document.addEventListener('keydown',event=>{
 activity();const target=event.target;
 if(event.ctrlKey||event.metaKey||event.altKey||event.repeat||target.closest('input,textarea,select,[contenteditable=true]')||isPanelOpen())return;
 const key=event.key.toLowerCase();if(['f','n','l','s'].includes(key))event.preventDefault();
 if(key==='f')toggleFullscreen();if(key==='n')nextPhrase();if(key==='l')openDialog('library');if(key==='s')openDialog('settings');
});
document.addEventListener('pointermove',activity,{passive:true});document.addEventListener('pointerdown',activity,{passive:true,capture:true});
document.addEventListener('visibilitychange',()=>{clearTimeout(clockTimer);if(!document.hidden){startClock();lastActivity=0;activity();}updateWakeLock();});
window.addEventListener('pageshow',()=>{startClock();});window.addEventListener('pagehide',()=>{clearTimeout(clockTimer);if(wakeSentinel)wakeSentinel.release().catch(()=>{});});
window.addEventListener('storage',event=>{if(event.key===KEY+'favorites'){const next=store.read('favorites',[]);favorites.clear();if(Array.isArray(next))next.filter(v=>typeof v==='string').forEach(v=>favorites.add(v));updateFavoriteButton();updateLibraryCounts();if($('#library-dialog').open)renderLibrary();}});
applyAppearance(new Date());updateLibraryCounts();startClock();activity();updateWakeLock();
if(storageFailed)toast('Il browser non consente il salvataggio locale. La pagina funziona comunque in questa sessione.');
// The JS copy supports file://. On a web server the JSON file is authoritative.
if(/^https?:$/.test(location.protocol)){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4000);
 fetch('./data/frasi_motivazionali_700.json',{cache:'no-store',signal:controller.signal})
 .then(response=>{if(!response.ok)throw new Error('HTTP '+response.status);return response.json();})
 .then(payload=>{const validated=C.parsePhrases(payload);originalPayload=payload;if(!customPayload&&C.buildDeck(validated).signature!==deck.signature)activateCollection(payload);})
 .catch(()=>{/* Complete bundled collection remains available. */}).finally(()=>clearTimeout(timeout));
 if('serviceWorker' in navigator&&window.isSecureContext)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
})();
