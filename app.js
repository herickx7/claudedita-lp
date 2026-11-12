// ============================================================
//  claudedita — landing page longa + checkout em gaveta
//  Qualquer botão de compra abre a gaveta: nome, e-mail, WhatsApp,
//  extras opcionais e Pix (na própria página) ou cartão (Mercado Pago).
// ============================================================

const PIXEL_ID = "1441261254273109";
const V = 3;
const FALLBACK_CATALOG = {
  main: { id: "metodo", name: "Método claudedita", desc: "Skill de edição de vídeo com IA pro Claude.", price: 47, anchor: null, tag: "PREÇO DE LANÇAMENTO" },
  bumps: [], comboDiscount: 0,
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const brl = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n) => (Number(n) % 1 ? Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : String(Number(n)));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const isDesk = () => matchMedia("(min-width: 900px)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- estado salvo no navegador ----------
const store = {
  get() { try { return JSON.parse(localStorage.getItem("ce_state") || "null"); } catch { return null; } },
  set(v) { try { localStorage.setItem("ce_state", JSON.stringify(v)); } catch {} },
};
const params = new URLSearchParams(location.search);
if (params.get("reset")) { try { localStorage.removeItem("ce_state"); sessionStorage.clear(); } catch {} }
let saved = store.get();
if (saved && (saved.v !== V || !saved.ts || Date.now() - saved.ts > 12 * 3600 * 1000)) saved = { lead: saved.lead || null, utm: saved.utm || {} };
const state = Object.assign({ lead: null, bumps: [], utm: {}, method: "pix" }, saved || {});
if (params.get("cupom")) state.coupon = params.get("cupom").trim().toUpperCase().slice(0, 30);
["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach((k) => { if (params.get(k)) state.utm[k] = params.get(k); });
const save = () => { state.ts = Date.now(); state.v = V; store.set(state); };
save();
let catalog = FALLBACK_CATALOG;

// ---------- pixel / rastreio ----------
function fbq(...a) { if (window.fbq) window.fbq(...a); }
if (PIXEL_ID && !window.fbq) {
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", PIXEL_ID); fbq("track", "PageView");
}
// Cada marco vai UMA vez por visita: pro Pixel (Funil_<marco>) e pra planilha (aba Funil).
const sid = (() => { try { let s = sessionStorage.getItem("ce_sid"); if (!s) { s = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("ce_sid", s); } return s; } catch { return "x"; } })();
function track(step) {
  try { const k = "ce_t_" + step; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch {}
  fbq("trackCustom", "Funil_" + step);
  try {
    const body = JSON.stringify({ step, sid, origem: state.utm.utm_content || state.utm.utm_source || "" });
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/evento", new Blob([body], { type: "application/json" }))))
      fetch("/api/evento", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3800); }

// ============================================================
//  ANIMAÇÕES DA PÁGINA
// ============================================================

// revelar blocos ao rolar (com atraso em cascata entre irmãos)
const rvIO = new IntersectionObserver((ents) => {
  ents.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target, sibs = $$(":scope > .rv", el.parentElement);
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 4) * 0.08 + "s");
    el.classList.add("vis"); rvIO.unobserve(el);
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
$$(".rv").forEach((el) => rvIO.observe(el));

// marcos do funil por seção vista
const trIO = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { track(e.target.dataset.track); trIO.unobserve(e.target); } }), { threshold: 0.35 });
$$("[data-track]").forEach((el) => trIO.observe(el));
track("1_entrou");

// topo (aparece ao rolar pra cima) + barra fixa + linha do tempo + palavras finais
const topbar = $("#topbar"), sticky = $("#sticky");
let lastY = scrollY, heroCtaGone = false, offerVisible = false, finalVisible = false, sheetOpen = false;
new IntersectionObserver(([e]) => { if (!isDesk()) { heroCtaGone = !e.isIntersecting && e.boundingClientRect.top < 0; updSticky(); } }).observe($("#heroCta"));
new IntersectionObserver(([e]) => { if (isDesk()) { heroCtaGone = !e.isIntersecting && e.boundingClientRect.top < 0; updSticky(); } }).observe($(".hero-cta.only-desk"));
new IntersectionObserver(([e]) => { offerVisible = e.isIntersecting; updSticky(); }, { threshold: 0.25 }).observe($("#offer"));
new IntersectionObserver(([e]) => { finalVisible = e.isIntersecting; updSticky(); }, { threshold: 0.3 }).observe($(".final .btn"));
function updSticky() { sticky.classList.toggle("show", heroCtaGone && !offerVisible && !finalVisible && !sheetOpen); }

const tlItems = $$("#tl li");
const finalH = $("#finalH");
(function splitWords(el) { // separa o título final em palavras pra acender uma a uma
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((p) => { if (!p) return; if (/^\s+$/.test(p)) frag.append(p); else { const s = document.createElement("span"); s.className = "w"; s.textContent = p; frag.append(s); } });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
})(finalH);
const words = $$(".w", finalH);
let half = false;
function onScroll() {
  const y = scrollY, H = innerHeight;
  if (isDesk()) topbar.classList.toggle("show", y > 60);
  else if (y < 500) topbar.classList.remove("show");
  else if (y < lastY - 4) topbar.classList.add("show");
  else if (y > lastY + 4) topbar.classList.remove("show");
  lastY = y;
  tlItems.forEach((li) => li.classList.toggle("lit", li.getBoundingClientRect().top < H * 0.66));
  const r = finalH.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, (H * 0.9 - r.top) / (H * 0.45)));
  const n = reduced ? words.length : Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle("on", i < n));
  if (!half && y + H > document.body.scrollHeight * 0.5) { half = true; track("3b_rolou_metade"); }
}
let ticking = false;
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
addEventListener("resize", onScroll);
onScroll();

// preço contando ao aparecer
new IntersectionObserver(([e], io) => {
  if (!e.isIntersecting) return; io.disconnect();
  const el = $("#bigPrice"), to = Math.floor(catalog.main.price); if (reduced) return;
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}, { threshold: 0.5 }).observe($("#offer"));

// ---------- celular do hero: troca os vídeos sozinho ----------
(function heroPhone() {
  const vids = $$("#heroPhone .pv"), bar = $("#heroBar"), cap = $("#heroCap"), snd = $("#heroSound");
  let i = 0, sound = false;
  const load = (v) => { if (!v.src) { v.src = v.dataset.src; v.load(); } };
  const play = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => { if (!v.muted) { v.muted = true; v.play().catch(() => {}); } }); };
  function show(k) {
    const prev = vids[i]; i = k; const v = vids[i];
    load(v); load(vids[(i + 1) % vids.length]);
    v.currentTime = 0; v.muted = !sound; play(v);
    vids.forEach((x) => x.classList.toggle("on", x === v));
    if (prev !== v) setTimeout(() => prev.pause(), 700);
    cap.style.opacity = 0; setTimeout(() => { cap.textContent = v.dataset.cap; cap.style.opacity = 1; }, 250);
  }
  vids.forEach((v, k) => {
    v.addEventListener("ended", () => { if (k === i) show((i + 1) % vids.length); });
    v.addEventListener("timeupdate", () => { if (k === i && v.duration) bar.style.width = (v.currentTime / v.duration) * 100 + "%"; });
  });
  load(vids[0]); show(0);
  document.addEventListener("touchstart", () => { if (vids[i].paused) play(vids[i]); }, { once: true, passive: true });
  snd.addEventListener("click", () => { sound = true; const v = vids[i]; v.muted = false; v.currentTime = 0; play(v); snd.classList.add("on"); track("1b_ligou_som"); });
  // pausa quando sai da tela (economiza bateria e dados)
  new IntersectionObserver(([e]) => { const v = vids[i]; if (e.isIntersecting) play(v); else v.pause(); }).observe($("#heroPhone"));
})();

// ---------- janela do Claude: demo animada ----------
(function demo() {
  const body = $("#winBody"), type = $("#winType"), send = $(".send"), steps = $$("#steps4 li"), pp = $("#winPP");
  let paused = false, visible = false, running = false;
  const hold = async () => { while (paused || !visible) await sleep(150); };
  const wait = async (ms) => { const end = Date.now() + ms; while (Date.now() < end) { await hold(); await sleep(Math.min(80, end - Date.now())); } };
  const add = (html, cls) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; body.appendChild(d); while (body.children.length > 7) body.firstChild.remove(); return d; };
  let barAnim = null;
  function setStep(k, dur) {
    steps.forEach((li, j) => { li.classList.toggle("done", j < k); li.classList.toggle("cur", j === k); const u = $(".bar u", li); if (j !== k) { u.style.transition = "none"; u.style.width = j < k ? "100%" : "0"; } });
    const u = $(".bar u", steps[k]); u.style.transition = "none"; u.style.width = "0"; void u.offsetWidth;
    clearTimeout(barAnim); u.style.transition = `width ${dur}ms linear`; u.style.width = "100%";
  }
  async function checklist(title, items, withBar) {
    const m = add(`${title}<ul class="chk">${items.map((t) => `<li><span class="s"></span>${t}</li>`).join("")}</ul>${withBar ? '<div class="prog"><i></i></div>' : ""}`, "msg bot");
    const lis = $$("li", m), pg = $(".prog i", m);
    for (let j = 0; j < lis.length; j++) {
      lis[j].classList.add("run"); await wait(750);
      lis[j].classList.remove("run"); lis[j].classList.add("ok");
      if (pg) pg.style.width = ((j + 1) / lis.length) * 100 + "%";
    }
  }
  async function typeIn(text) {
    type.classList.remove("ph"); type.classList.add("typing"); type.textContent = "";
    for (let j = 1; j <= text.length; j++) { type.textContent = text.slice(0, j); await wait(28 + Math.random() * 30); }
    send.classList.add("go"); await wait(450);
    type.classList.remove("typing"); type.classList.add("ph"); type.textContent = "Responder ao Claude…"; send.classList.remove("go");
    add(esc(text), "msg me");
  }
  const RUNS = [
    { install: true, ask: "Faz um vídeo sobre por que o Titanic afundou", vid: "titanic", title: "Titanic · curiosidade", meta: "pixel art, 9:16, narrado" },
    { install: false, ask: "Agora um pra lotar a agenda da minha barbearia", vid: "barbearia", title: "Barbearia · negócio local", meta: "pixel art, 9:16, com legenda" },
  ];
  async function loop() {
    running = true; let r = 0;
    for (;;) {
      const run = RUNS[r % RUNS.length];
      body.innerHTML = ""; await wait(500);
      if (run.install) {
        setStep(0, 4200);
        add(`<span class="z">ZIP</span><div><b>pixel-reel-editor.zip</b><small>Skill do Claude</small></div>`, "file"); await wait(500);
        add("Instala essa skill pra mim", "msg me"); await wait(600);
        await checklist("Instalando a skill:", ["Lendo as instruções", "Preparando fontes e efeitos sonoros", "Configurando o estilo"], false);
        await wait(300); add("Pronto. Pode pedir o primeiro vídeo.", "msg bot"); await wait(900);
      }
      setStep(1, run.ask.length * 45 + 700); await typeIn(run.ask); await wait(500);
      setStep(2, 3400); await checklist("Fazendo o seu vídeo:", ["Roteiro com gancho", "Cenas e personagem", "Legenda e efeitos sonoros", "Montagem em 9:16"], true);
      await wait(300);
      setStep(3, 4000);
      add(`<div class="ready"><video src="/assets/v/${run.vid}.mp4" poster="/assets/v/${run.vid}.jpg" muted loop playsinline autoplay></video><div><b>Vídeo pronto</b><small>${run.title}<br>${run.meta}</small><div class="tags"><i>MP4</i><i>Legenda</i><i>Efeitos</i></div></div></div>`, "msg bot");
      const v = $("video", body.lastChild); v.play().catch(() => {});
      await wait(4200); r++;
    }
  }
  pp.addEventListener("click", () => { paused = !paused; pp.innerHTML = `<svg><use href="#i-${paused ? "play" : "pause"}"/></svg>`; pp.setAttribute("aria-label", paused ? "Continuar" : "Pausar"); $$("video", body).forEach((v) => (paused ? v.pause() : v.play().catch(() => {}))); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !running) loop(); }, { threshold: 0.3 }).observe($("#win"));
})();

// ---------- carrossel de exemplos ----------
(function carousel() {
  const track = $("#carTrack"), cards = $$(".vcard", track), n = $("#carN"), pp = $("#carPP");
  let cur = -1, paused = false, visible = false, userHold = 0;
  function activate(k) {
    if (k === cur) return; cur = k;
    cards.forEach((c, j) => {
      c.classList.toggle("on", j === k);
      const box = $(".vthumb", c); let v = $("video", box);
      if (j === k && visible) {
        if (!v) { v = document.createElement("video"); Object.assign(v, { muted: true, loop: true, playsInline: true, preload: "auto" }); v.setAttribute("playsinline", ""); v.src = c.dataset.src; v.addEventListener("playing", () => v.classList.add("ready")); box.appendChild(v); }
        v.play().catch(() => {});
      } else if (v) v.remove();
    });
    n.textContent = `${k + 1} de ${cards.length}`;
  }
  const center = () => { const mid = track.scrollLeft + track.clientWidth / 2; let best = 0, d = 1e9; cards.forEach((c, j) => { const cd = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (cd < d) { d = cd; best = j; } }); return best; };
  const go = (k) => { const c = cards[(k + cards.length) % cards.length]; track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.clientWidth) / 2, behavior: "smooth" }); };
  let st; track.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => activate(center()), 60); }, { passive: true });
  ["touchstart", "pointerdown", "wheel"].forEach((ev) => track.addEventListener(ev, () => { userHold = Date.now() + 9000; }, { passive: true }));
  $("#carPrev").addEventListener("click", () => { userHold = Date.now() + 9000; go(cur - 1); });
  $("#carNext").addEventListener("click", () => { userHold = Date.now() + 9000; go(cur + 1); });
  pp.addEventListener("click", () => { paused = !paused; pp.innerHTML = `<svg><use href="#i-${paused ? "play" : "pause"}"/></svg>`; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; const k = cur; cur = -1; activate(k < 0 ? center() : k); }, { threshold: 0.3 }).observe(track);
  setInterval(() => { if (visible && !paused && Date.now() > userHold && !document.hidden) go(cur + 1); }, 5000);
  requestAnimationFrame(() => { track.scrollLeft = 0; activate(0); });
})();

// ============================================================
//  CHECKOUT (gaveta)
// ============================================================
const sheet = $("#sheet"), sbody = $("#sheetBody");
let lastPix = null, pixTimer = null;

function maskPhone(v) {
  let d = v.replace(/\D/g, ""); if (d.startsWith("55") && d.length > 11) d = d.slice(2); d = d.slice(0, 11);
  if (d.length <= 2) return d ? "(" + d : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}
function order() {
  const c = catalog, set = new Set(state.bumps);
  const chosen = c.bumps.filter((b) => set.has(b.id));
  const all = c.bumps.length > 0 && chosen.length === c.bumps.length;
  const disc = all ? c.comboDiscount : 0;
  let total = Math.round((c.main.price + chosen.reduce((s, b) => s + b.price, 0) - disc) * 100) / 100;
  const pct = state.couponPct || 0, couponOff = pct ? Math.round(total * pct) / 100 : 0;
  total = Math.max(1, Math.round((total - couponOff) * 100) / 100);
  return { chosen, disc, total, all, couponOff, pct };
}

function openSheet(src) {
  sheetOpen = true; updSticky();
  if (lastPix && lastPix.pending) renderPix(lastPix); else renderForm();
  sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";
  if (!history.state || !history.state.sheet) history.pushState({ sheet: 1 }, "");
  track("4a_abriu_checkout");
  if (!openSheet.fired) { openSheet.fired = true; fbq("track", "AddToCart", { value: catalog.main.price, currency: "BRL", content_name: catalog.main.name }); }
  openSheet.src = src;
}
function closeSheet(fromPop) {
  if (!sheet.classList.contains("open")) return;
  sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
  sheetOpen = false; updSticky();
  if (lastPix && lastPix.pending) track("5g_fechou_pix"); else track("4z_fechou_checkout");
  if (!fromPop && history.state && history.state.sheet) history.back();
}
$$("[data-close]", sheet).forEach((b) => b.addEventListener("click", () => closeSheet()));
addEventListener("popstate", () => closeSheet(true));
addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
document.addEventListener("click", (e) => { const b = e.target.closest("[data-buy]"); if (b) { e.preventDefault(); openSheet(b.dataset.buy); } });

function renderForm() {
  const c = catalog, L = state.lead || {};
  sbody.innerHTML = `
    <div class="ck-h">Finalize seu pedido</div>
    <div class="ck-prod"><img src="/assets/logo.png" alt="" width="40" height="40"><div><b>${esc(c.main.name)}</b><small>Pagamento único · acesso na hora</small></div><span class="pr">${brl(c.main.price)}</span></div>
    <form class="ck-form" id="lf" novalidate>
      <div class="fld"><input name="name" id="f-name" autocomplete="name" placeholder=" " value="${esc(L.name || "")}"><label for="f-name">Seu nome</label></div>
      <div class="fld"><input name="email" id="f-email" type="email" inputmode="email" autocomplete="email" placeholder=" " value="${esc(L.email || "")}"><label for="f-email">Seu melhor e-mail</label><small class="hint">O acesso chega aqui.</small></div>
      <div class="fld"><input name="whatsapp" id="f-wa" type="tel" inputmode="tel" autocomplete="tel" placeholder=" " value="${esc(L.whatsapp ? maskPhone(L.whatsapp) : "")}"><label for="f-wa">WhatsApp com DDD</label><small class="hint">Só pro suporte, se você precisar.</small></div>
    </form>
    ${c.bumps.length ? `<div class="ck-sec">APROVEITE TAMBÉM (OPCIONAL)</div>
      ${c.bumps.map((b) => `<div class="bump ${state.bumps.includes(b.id) ? "on" : ""}" data-bump="${b.id}" role="checkbox" aria-checked="${state.bumps.includes(b.id)}" tabindex="0"><span class="arr">➜</span><span class="bx">${state.bumps.includes(b.id) ? "✓" : ""}</span><div><b>${esc(b.name)} <em>+ ${brl(b.price)}</em></b><p>${esc(b.desc)}</p></div></div>`).join("")}
      ${c.comboDiscount ? `<div class="combo" id="combo"></div>` : ""}` : ""}
    <div class="sum" id="sum"></div>
    <div class="ck-sec">PAGAMENTO</div>
    <div class="pm"><button type="button" data-m="pix" class="${state.method !== "card" ? "on" : ""}"><svg><use href="#i-pix"/></svg>Pix</button><button type="button" data-m="card" class="${state.method === "card" ? "on" : ""}"><svg><use href="#i-card"/></svg>Cartão</button></div>
    <div class="pm-note" id="pmNote"></div>
    <button class="btn lg block" id="ckPay" type="button"></button>
    <div class="ck-trust"><span><svg><use href="#i-lock"/></svg>Pagamento processado pelo Mercado Pago</span><span><svg><use href="#i-shield"/></svg>Garantia de 7 dias, reembolso integral</span><p class="terms">Ao pagar você concorda com os <a href="/termos" target="_blank">Termos</a> e a <a href="/privacidade" target="_blank">Privacidade</a>.</p></div>`;
  const f = $("#lf"); let tmr;
  f.whatsapp.addEventListener("input", () => { f.whatsapp.value = maskPhone(f.whatsapp.value); });
  $$("input", f).forEach((i) => {
    i.addEventListener("focus", () => track("4c_comecou_dados"), { once: true });
    i.addEventListener("input", () => { i.classList.remove("bad"); clearTimeout(tmr); tmr = setTimeout(() => { const r = readForm(); if (r && !r.bad.length) sendLead(r.lead); }, 700); });
  });
  f.addEventListener("submit", (e) => { e.preventDefault(); checkout(); });
  $$("[data-bump]", sbody).forEach((el) => {
    const toggle = () => {
      const id = el.dataset.bump, on = !state.bumps.includes(id);
      state.bumps = on ? [...state.bumps, id] : state.bumps.filter((x) => x !== id); save();
      el.classList.toggle("on", on); el.setAttribute("aria-checked", on); $(".bx", el).textContent = on ? "✓" : "";
      if (on) track("4e_adicionou_extra");
      updateOrder(true);
    };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });
  });
  $$(".pm button", sbody).forEach((b) => b.addEventListener("click", () => { state.method = b.dataset.m; save(); $$(".pm button", sbody).forEach((x) => x.classList.toggle("on", x === b)); updateOrder(); }));
  $("#ckPay").addEventListener("click", checkout);
  updateOrder();
}
function updateOrder(flash) {
  const c = catalog, o = order(), sum = $("#sum"); if (!sum) return;
  sum.innerHTML = `
    <div class="row"><span>${esc(c.main.name)}</span><span>${brl(c.main.price)}</span></div>
    ${o.chosen.map((b) => `<div class="row"><span>${esc(b.name)}</span><span>${brl(b.price)}</span></div>`).join("")}
    ${o.disc ? `<div class="row disc"><span>Desconto levando tudo</span><span>−${brl(o.disc)}</span></div>` : ""}
    ${o.couponOff ? `<div class="row disc"><span>Cupom ${esc(state.coupon)} (−${o.pct}%)</span><span>−${brl(o.couponOff)}</span></div>` : ""}
    <div class="tot"><span>Total</span><strong>${brl(o.total)}</strong></div>`;
  const combo = $("#combo");
  if (combo) {
    const k = o.chosen.length, N = c.bumps.length;
    combo.innerHTML = o.all ? `Você levou tudo e ganhou <b style="color:var(--green)">${brl(c.comboDiscount)} de desconto</b>.`
      : `Leve <b>os ${N} extras</b> e ganhe <b>${brl(c.comboDiscount)} de desconto</b>. Faltam ${N - k}.<div class="prog"><i style="width:${(k / N) * 100}%"></i></div>`;
  }
  const card = state.method === "card";
  $("#pmNote").textContent = card ? "Você vai pra página segura do Mercado Pago pra pagar no cartão, em até 12x." : "O código Pix aparece aqui mesmo e o acesso libera sozinho quando o pagamento cair.";
  const pay = $("#ckPay"); if (!pay.disabled) pay.textContent = (card ? "Pagar no cartão · " : "Gerar Pix · ") + brl(o.total);
  if (flash) { sum.classList.remove("flash"); void sum.offsetWidth; sum.classList.add("flash"); }
}
function readForm() {
  const f = $("#lf"); if (!f) return null;
  const name = f.name.value.trim().replace(/\s+/g, " "), email = f.email.value.trim().toLowerCase(), phone = f.whatsapp.value.replace(/\D/g, "");
  const bad = [];
  if (name.split(" ")[0].length < 2) bad.push(f.name);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push(f.email);
  if (!/^\d{10,11}$/.test(phone)) bad.push(f.whatsapp);
  return { f, lead: { name, email, whatsapp: phone }, bad };
}
// O lead vai pra planilha assim que os 3 campos ficam válidos, pra dar pra recuperar quem não pagou.
function sendLead(lead) {
  const key = JSON.stringify(lead); if (state.leadSent === key) return;
  state.lead = lead; state.leadSent = key; save();
  fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ ...lead, answers: { perfil: "lp-v3 · botão " + (openSheet.src || "") }, utm: state.utm }) }).catch(() => {});
  fbq("track", "Lead"); track("4d_preencheu_dados");
}
function badForm(r) {
  $$("input", r.f).forEach((i) => i.classList.remove("bad"));
  r.bad.forEach((i) => i.classList.add("bad")); track("5a_erro_nos_dados");
  r.bad[0].focus({ preventScroll: true }); r.bad[0].scrollIntoView({ behavior: "smooth", block: "center" });
  toast(r.bad[0] === r.f.whatsapp ? "Confere o WhatsApp com DDD" : r.bad[0] === r.f.email ? "Coloca um e-mail válido: o acesso chega nele" : "Coloca seu nome");
}
async function checkout() {
  const r = readForm(); if (!r) return;
  const method = state.method === "card" ? "card" : "pix";
  track("5_clicou_pagar");
  if (r.bad.length) return badForm(r);
  sendLead(r.lead);
  const btn = $("#ckPay"); btn.disabled = true; btn.textContent = method === "card" ? "Abrindo o Mercado Pago…" : "Gerando seu Pix…";
  const restore = () => { btn.disabled = false; updateOrder(); };
  const o = order();
  fbq("track", "InitiateCheckout", { value: o.total, currency: "BRL" });
  try { sessionStorage.setItem("ce_total", String(o.total)); } catch {}
  const body = JSON.stringify({ ...r.lead, items: state.bumps, coupon: state.couponPct ? state.coupon : "" });
  const fieldErr = (data) => { if (!data.fields) return false; const map = { name: r.f.name, email: r.f.email, whatsapp: r.f.whatsapp }; r.bad = data.fields.map((k) => map[k]).filter(Boolean); if (r.bad.length) { restore(); badForm(r); return true; } return false; };
  try {
    if (method === "pix") {
      const res = await fetch("/api/pix", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.qr) { track("5b_gerou_pix"); lastPix = { ...data, pending: true }; startPoll(lastPix); return renderPix(lastPix); }
      if (fieldErr(data)) return;
      track("5d_erro_ao_gerar_pix"); // se o Pix direto falhar, cai no Mercado Pago (que também tem Pix)
    }
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) { if (fieldErr(data)) return; throw new Error(data.error || "erro"); }
    track(method === "card" ? "5h_foi_pro_cartao" : "5b_foi_pro_mercado_pago");
    location.href = data.url;
  } catch {
    track("5d_erro_ao_abrir_pagamento"); toast("Não consegui abrir o pagamento agora. Tenta de novo em alguns segundos."); restore();
  }
}

// ---------- Pix na própria gaveta ----------
function renderPix(d) {
  $("#toast").classList.remove("show");
  sbody.innerHTML = `
    <div class="pix">
      <div class="lbl"><svg><use href="#i-pix"/></svg>PAGUE COM PIX</div>
      <div class="tot">${brl(d.total)}</div>
      <ol><li>Toca em <b>Copiar código Pix</b></li><li>Abre o app do seu banco e escolhe <b>Pix Copia e Cola</b></li><li>Cola, confirma e pronto: o acesso libera aqui na hora</li></ol>
      <button class="btn green lg block" id="pixcopy">Copiar código Pix</button>
      <textarea id="pixcode" readonly rows="3">${esc(d.qr)}</textarea>
      ${d.qr64 ? `<div class="qr"><img src="data:image/png;base64,${d.qr64}" alt="QR code do Pix" width="190" height="190"></div><small class="qrn">No computador? Escaneia com o celular.</small>` : ""}
      <div class="wait"><i class="dot"></i>Aguardando pagamento…</div>
      <span class="st" id="pixstatus"></span>
      <button class="paid" id="pixpaid">Já paguei</button>
      <button class="back" id="pixback">Voltar e mudar o pedido</button>
      <div class="ck-trust"><span><svg><use href="#i-lock"/></svg>Pix gerado pelo Mercado Pago · pedido ${esc(d.ref)}</span></div>
    </div>`;
  $("#pixcopy").addEventListener("click", async () => {
    const t = $("#pixcode"); let ok = false;
    try { await navigator.clipboard.writeText(d.qr); ok = true; } catch { t.select(); try { ok = document.execCommand("copy"); } catch {} }
    $("#pixcopy").textContent = ok ? "Código copiado ✓" : "Selecione e copie o código abaixo";
    if (ok) track("5e_copiou_pix");
  });
  $("#pixpaid").addEventListener("click", () => check(d, true));
  $("#pixback").addEventListener("click", () => { d.pending = false; clearTimeout(pixTimer); renderForm(); });
}
async function check(d, manual) {
  try {
    const r = await fetch("/api/acesso?payment_id=" + d.id); const s = await r.json();
    if (s.status === "approved") {
      d.pending = false; clearTimeout(pixTimer); track("5f_pix_pago");
      location.href = `/obrigado.html?status=aprovado&payment_id=${encodeURIComponent(d.id)}&ref=${encodeURIComponent(d.ref)}`; return true;
    }
    if (manual && $("#pixstatus")) $("#pixstatus").textContent = "Ainda não caiu. Pode levar alguns segundos.";
  } catch {}
  return false;
}
function startPoll(d) {
  clearTimeout(pixTimer); let tries = 0;
  const tick = async () => { if (!d.pending) return; if (await check(d, false)) return; if (++tries < 300) pixTimer = setTimeout(tick, 4000); }; // ~20 min
  pixTimer = setTimeout(tick, 4000);
}

// ============================================================
(async function init() {
  try { const r = await fetch("/api/catalog"); if (r.ok) catalog = await r.json(); } catch {}
  state.couponPct = 0;
  if (state.coupon) {
    try { const r = await fetch("/api/cupom?code=" + encodeURIComponent(state.coupon)); const d = await r.json(); state.couponPct = d.valid ? d.pct : 0; } catch {}
    if (!state.couponPct) state.coupon = "";
  }
  const ids = new Set(catalog.bumps.map((b) => b.id)); state.bumps = state.bumps.filter((id) => ids.has(id)); save();
  $$("[data-price]").forEach((el) => (el.textContent = num(catalog.main.price)));
  $("#bigPrice").textContent = Math.floor(catalog.main.price);
  if (catalog.main.tag) $("#oTag").textContent = catalog.main.tag; else $("#oTag").remove();
  if (params.get("pagamento") === "falhou") {
    track("5c_voltou_sem_pagar"); history.replaceState(null, "", location.pathname);
    openSheet("voltou"); toast("O pagamento não foi concluído. Tenta de novo: no Pix é na hora.");
  }
})();
