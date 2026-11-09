// ============================================================
//  claudedita — funil interativo
//  Etapas: hero → perfil → trava → conta → demo → lead → oferta
// ============================================================

// (opcional) ID do seu Meta Pixel para rastrear Lead / InitiateCheckout / Purchase
const PIXEL_ID = "";

const STEPS = ["hero", "perfil", "trava", "conta", "demo", "lead", "oferta"];
const FALLBACK_CATALOG = {
  main: { id: "metodo", name: "Método claudedita", desc: "O passo a passo completo pra criar vídeos nesse nível só com IA.", price: 97, anchor: 297 },
  bumps: [], comboDiscount: 0,
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const brl = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- estado (fica salvo no navegador do visitante) ----------
const store = {
  get() { try { return JSON.parse(localStorage.getItem("ce_state") || "null"); } catch { return null; } },
  set(v) { try { localStorage.setItem("ce_state", JSON.stringify(v)); } catch {} },
};
const state = Object.assign({ step: 0, answers: {}, lead: null, bumps: [], idea: "", utm: {} }, store.get() || {});
const params = new URLSearchParams(location.search);
if (params.get("cupom")) state.coupon = params.get("cupom").trim().toUpperCase().slice(0, 30);
["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach((k) => { if (params.get(k)) state.utm[k] = params.get(k); });
const save = () => store.set(state);
let catalog = null;

// ---------- som 8-bit (WebAudio, sem arquivos) ----------
let ac = null;
let muted = (() => { try { return localStorage.getItem("ce_mute") === "1"; } catch { return false; } })();
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } return ac; }
function tone(freq, dur, when = 0, type = "square", vol = 0.06) {
  if (muted) return; const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  blip: () => tone(880, 0.06),
  click: () => tone(1400 + Math.random() * 400, 0.015, 0, "square", 0.02),
  coin: () => { tone(988, 0.07); tone(1319, 0.28, 0.07); },
  off: () => { tone(500, 0.06); tone(330, 0.12, 0.06); },
  level: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.09, i * 0.06)),
  error: () => { tone(120, 0.15, 0, "square", 0.08); tone(110, 0.2, 0.17, "square", 0.08); },
};
function setMuteIcon() { $("#mute").textContent = muted ? "🔇" : "🔊"; }
$("#mute").addEventListener("click", () => { muted = !muted; try { localStorage.setItem("ce_mute", muted ? "1" : "0"); } catch {} setMuteIcon(); sfx.blip(); });
setMuteIcon();

// ---------- pixel / analytics ----------
function fbq(...args) { if (window.fbq) window.fbq(...args); }
if (PIXEL_ID) {
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", PIXEL_ID); fbq("track", "PageView");
}

// ---------- HUD / XP ----------
function hud() {
  const pct = (state.step / (STEPS.length - 1)) * 100;
  $("#xpfill").style.width = pct + "%";
  $("#lvl").textContent = "LV " + (state.step + 1);
}
function xpFloat(el, text = "+10 XP") {
  const f = $("#xpfloat"); const r = (el || document.body).getBoundingClientRect();
  f.textContent = text; f.style.left = Math.min(window.innerWidth - 110, r.left + r.width / 2 - 40) + "px"; f.style.top = (r.top + 4) + "px";
  f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 3800); }

function go(i, from) {
  if (from) { xpFloat(from); sfx.coin(); }
  state.step = Math.max(0, Math.min(STEPS.length - 1, i)); save();
  render(); window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

// ---------- componentes ----------
const coach = (pose, html) => `<div class="coach"><img src="/assets/avatar-${pose}.png" alt="" width="96" height="105"><div class="bubble" id="bubble">${html}</div></div>`;
const panel = (title, body, cls = "") => `<div class="panel ${cls}"><div class="panel-top"><i></i><i></i><i></i>${title}</div><div class="panel-body">${body}</div></div>`;
const caption = (l1, l2, tag = "h1") => `<${tag} class="cap1">${l1}</${tag}><div class="cap2">${l2}</div>`;
function sayBubble(html) { const b = $("#bubble"); if (!b) return; b.innerHTML = html; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; }

// ---------- telas ----------
const screens = {};

screens.hero = () => `
  <section class="screen">
    ${caption("Você viu o anúncio.", "AGORA OLHA ISSO")}
    ${panel("vitrine_3_nichos.mp4", `<div class="player" style="background-image:url(/assets/vitrine-capa.jpg)"><video id="vid" poster="/assets/vitrine-capa.jpg" autoplay muted loop playsinline webkit-playsinline preload="auto" width="540" height="960"><source src="/assets/vitrine-v3.mp4" type="video/mp4"></video><button class="unmute" id="unmute">🔊 TOQUE PRA OUVIR</button></div>`)}
    <p class="lead"><b>3 nichos diferentes</b>: curiosidade, negócio local e fitness. Todos com o mesmo método e <b>sem editar nada na mão</b>. Em 1 minuto eu te mostro como funciona, e você ainda <b>testa a IA aqui mesmo</b>.</p>
    <button class="btn pulse" data-next>QUERO VER COMO →</button>
    <div class="sub">4 fases · 60 segundos · grátis</div>
  </section>`;
screens.hero.mount = () => {
  const v = $("#vid"), u = $("#unmute");
  v.muted = true; // alguns navegadores só fazem autoplay se o muted vier pelo JS
  const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay(); document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
  const fail = () => { // se o vídeo não carregar, mostra a capa no lugar e o toque abre o vídeo direto
    if (v.dataset.failed) return; v.dataset.failed = "1";
    v.insertAdjacentHTML("afterend", `<img class="fallback" src="/assets/vitrine-capa.jpg" alt="Exemplos de vídeos">`);
    u.textContent = "▶ VER OS EXEMPLOS"; u.onclick = () => window.open("/assets/vitrine-v3.mp4", "_blank");
  };
  v.addEventListener("error", fail, true); v.querySelector("source").addEventListener("error", fail);
  u.addEventListener("click", () => { v.muted = false; v.currentTime = 0; v.play(); u.remove(); });
};

const Q_PERFIL = [
  ["negocio", "Tenho um negócio e quero vender mais com vídeo", "Perfeito. Vídeo nesse estilo <b>para o dedo do cliente</b> no feed, e você não vai depender de agência."],
  ["criador", "Quero crescer criando conteúdo", "Boa! Esse formato <b>retém muito</b> e dá pra postar todo dia sem passar a noite editando."],
  ["servico", "Quero vender edição como serviço", "Visão de dono. Empresa paga caro por vídeo assim, e você vai <b>produzir em minutos</b>."],
  ["curioso", "Só curiosidade (por enquanto)", "Justo! Fica até a fase 3: lá você <b>testa a IA ao vivo</b>."],
];
const Q_TRAVA = [
  ["naosei", "Nunca editei nada", "Melhor ainda: você não tem vício nenhum pra desaprender. <b>O método começa do zero absoluto.</b>"],
  ["demora", "Demoro horas pra editar um vídeo", "É exatamente isso que a IA mata. O trabalho braçal <b>sai das suas mãos</b>."],
  ["retencao", "Meus vídeos não prendem ninguém", "Isso é gancho e ritmo. Tem um módulo só sobre <b>segurar a pessoa até o fim</b>."],
  ["caro", "Editor bom é caro demais", "Faz a conta comigo na próxima fase. <b>Você vai levar um susto.</b>"],
];
function quiz(key, phase, l1, l2, pose, intro, list, next) {
  const s = () => `
    <section class="screen">
      <div class="phase">FASE ${phase} DE 4</div>
      ${caption(l1, l2)}
      ${coach(pose, intro)}
      <div class="opts">${list.map(([id, label], i) => `<button class="opt ${state.answers[key] === id ? "sel" : ""}" data-id="${id}"><span class="k">${String.fromCharCode(65 + i)}</span>${label}</button>`).join("")}</div>
    </section>`;
  s.mount = () => {
    let locked = false;
    $$(".opt").forEach((b) => b.addEventListener("click", async () => {
      if (locked) return; locked = true;
      $$(".opt").forEach((o) => o.classList.remove("sel")); b.classList.add("sel"); sfx.blip();
      state.answers[key] = b.dataset.id; save();
      const reply = list.find((x) => x[0] === b.dataset.id)[2];
      sayBubble(reply); xpFloat(b);
      await sleep(1900); go(next, null); sfx.coin();
    }));
  };
  return s;
}
screens.perfil = quiz("perfil", 1, "Primeiro, me diz:", "QUEM É VOCÊ?", "point", "Vou personalizar o resto pra você. <b>Escolhe a que mais combina:</b>", Q_PERFIL, 2);
screens.trava = quiz("trava", 1, "E hoje, qual é", "SUA MAIOR TRAVA?", "sad", "Sem vergonha, todo mundo começa com uma dessas:", Q_TRAVA, 3);

screens.conta = () => {
  const price = (catalog || FALLBACK_CATALOG).main.price;
  return `
  <section class="screen">
    <div class="phase">FASE 2 DE 4</div>
    ${caption("A conta que", "NINGUÉM FAZ")}
    ${coach("shock", "Mexe nas barras e vê <b>quanto custa</b> ter vídeo bom todo mês do jeito tradicional:")}
    ${panel("calculadora.exe", `
      <div class="calc">
        <label>Vídeos por mês <b id="vv">12</b></label>
        <input type="range" id="rv" min="4" max="60" step="1" value="12">
        <label>Quanto um editor cobra por vídeo <b id="vp">R$ 150</b></label>
        <input type="range" id="rp" min="50" max="500" step="10" value="150">
      </div>
      <div style="margin-top:14px;font-size:13px;color:var(--muted)">Com editor você pagaria por ano:</div>
      <div class="big" id="ano">R$ 21.600</div>
      <div class="vs">
        <div class="bad"><small>EDITANDO NA MÃO (est. 3h/vídeo)</small><strong id="horas">36h/mês</strong></div>
        <div class="good"><small>MÉTODO CLAUDEDITA</small><strong>${brl(price)}</strong><div style="font-size:11px;color:var(--muted)">pagamento único</div></div>
      </div>`)}
    <button class="btn" data-next>FAZ SENTIDO. E COMO FUNCIONA? →</button>
  </section>`;
};
screens.conta.mount = () => {
  const rv = $("#rv"), rp = $("#rp");
  let shown = 0, raf;
  const upd = () => {
    const v = +rv.value, p = +rp.value, target = v * p * 12;
    $("#vv").textContent = v; $("#vp").textContent = "R$ " + p; $("#horas").textContent = v * 3 + "h/mês";
    cancelAnimationFrame(raf);
    const step = () => { shown += (target - shown) * 0.25; if (Math.abs(target - shown) < 1) shown = target; $("#ano").textContent = brl(Math.round(shown)).replace(",00", ""); if (shown !== target) raf = requestAnimationFrame(step); };
    step(); sfx.click();
  };
  rv.addEventListener("input", upd); rp.addEventListener("input", upd); upd();
};

// ---- demo ao vivo ----
const IDEAS = ["Por que o Titanic afundou", "Como conseguir o 1º cliente", "A origem do café", "O segredo das pirâmides"];
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function low(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
function makeScript(idea) {
  const i = idea.replace(/[?.!]+$/, "").trim(); const l = low(i);
  return {
    scenes: [
      ["CENA 1 · GANCHO", `"Quase ninguém sabe a verdade sobre ${l}."`],
      ["CENA 2 · CONTEXTO", `O cenário: onde tudo começou e por que importa.`],
      ["CENA 3 · VIRADA", `O detalhe que muda tudo o que você achava.`],
      ["CENA 4 · PROVA", `Um dado ou exemplo real que prende até o fim.`],
      ["CENA 5 · FINAL", `Fecha o ciclo + chamada pra seguir o perfil.`],
    ],
    hooks: [
      `Ninguém te contou isso sobre ${l}.`,
      `${cap(i)}? Quase todo mundo erra essa parte.`,
      `Em 30 segundos você vai entender ${l} melhor que 99% das pessoas.`,
    ],
  };
}
function hash(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function rnd(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function drawScene(cv, seed, k) {
  const W = 64, H = 40, x = cv.getContext("2d"), r = rnd(seed);
  const pals = [["#6ec0f0", "#e6be6e", "#d2a050"], ["#f0aa5a", "#c8964f", "#a0784a"], ["#141846", "#5a4a3c", "#f0f0c8"], ["#5ad2a0", "#2a6a4a", "#ffc41a"], ["#c060f0", "#30205a", "#3de0ff"]];
  const p = pals[Math.floor(r() * pals.length)];
  const img = x.createImageData(W, H);
  const sx = Math.floor(r() * 30) + 17, sh = Math.floor(r() * 3);
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    let c = y < H * 0.68 ? p[0] : p[1];
    if (sh === 0 && y < H * 0.68 && Math.abs(xx - sx) * 1.3 < (y - H * 0.18) && y > H * 0.18) c = p[2];
    if (sh === 1 && y < H * 0.68 && y > H * 0.3 && Math.abs(xx - sx) < 7) c = p[2];
    if (sh === 2 && (xx - sx) ** 2 + (y - H * 0.4) ** 2 < 60) c = p[2];
    if (y < 10 && (xx * 7 + y * 13 + seed) % 97 === 0) c = "#ffffff";
    const n = parseInt(c.slice(1), 16), j = (y * W + xx) * 4;
    const show = ((xx * 31 + y * 17 + seed) % 100) / 100 < k;
    const g = Math.floor(r() * 255);
    img.data[j] = show ? n >> 16 : g; img.data[j + 1] = show ? (n >> 8) & 255 : g; img.data[j + 2] = show ? n & 255 : g; img.data[j + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}

screens.demo = () => `
  <section class="screen">
    <div class="phase">FASE 3 DE 4</div>
    ${caption("Agora é sua vez:", "TESTA A IA")}
    ${coach("ok", "Digita <b>qualquer ideia de vídeo</b>. Vou montar o roteiro, as cenas e os ganchos na sua frente.")}
    ${panel("+ nova ideia", `
      <input class="field" id="idea" maxlength="70" placeholder="Ex: Por que o Titanic afundou" value="${esc(state.idea)}" autocomplete="off">
      <div class="chips">${IDEAS.map((i) => `<button class="chip" data-idea="${esc(i)}">${esc(i)}</button>`).join("")}</div>
      <button class="btn" id="gen">⚡ GERAR ROTEIRO</button>
      <div id="out"></div>`, "")}
    <div id="after"></div>
  </section>`;
screens.demo.mount = () => {
  const input = $("#idea"), out = $("#out"), btn = $("#gen");
  $$(".chip").forEach((c) => c.addEventListener("click", () => { input.value = c.dataset.idea; sfx.blip(); }));
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); else sfx.click(); });
  let running = false;
  btn.addEventListener("click", async () => {
    const idea = input.value.trim();
    if (idea.length < 4) { input.classList.add("bad"); sfx.error(); input.focus(); setTimeout(() => input.classList.remove("bad"), 400); return; }
    if (running) return; running = true;
    state.idea = idea; save(); input.blur();
    btn.disabled = true; btn.textContent = "GERANDO...";
    const { scenes, hooks } = makeScript(idea);
    out.innerHTML = `<div class="progress"><div id="pg"></div></div><div class="gen mono" id="gen-txt"></div>`;
    for (let p = 0; p <= 100; p += 10) { $("#pg").style.width = p + "%"; sfx.click(); await sleep(70); }
    const gt = $("#gen-txt");
    for (const [h, t] of scenes) {
      const d = document.createElement("div"); d.className = "line";
      d.innerHTML = `<div class="sc">${h}</div><div class="cursor"></div>`; gt.appendChild(d);
      const body = d.lastElementChild;
      for (let i = 0; i <= t.length; i += 2) { body.textContent = t.slice(0, i); if (i % 6 === 0) sfx.click(); await sleep(12); }
      body.textContent = t; body.classList.remove("cursor"); await sleep(120);
    }
    sayBubble("Roteiro pronto. Agora as <b>cenas</b>…"); sfx.coin(); xpFloat(gt);
    const th = document.createElement("div"); th.className = "thumbs";
    const seed = hash(idea);
    th.innerHTML = [0, 1, 2, 3].map((i) => `<div><canvas width="64" height="40" data-i="${i}"></canvas><span id="lb${i}">cena 0${i + 1} · 0%</span></div>`).join("");
    out.appendChild(th);
    const cvs = $$("canvas", th);
    for (let f = 0; f <= 20; f++) {
      cvs.forEach((c, i) => { const k = Math.max(0, Math.min(1, (f - i * 3) / 10)); drawScene(c, hash(idea + '#' + i), k); $("#lb" + i).textContent = k >= 1 ? `cena 0${i + 1} · OK` : `cena 0${i + 1} · ${Math.round(k * 100)}%`; });
      if (f % 3 === 0) sfx.click(); await sleep(60);
    }
    sfx.level(); xpFloat(th, "+20 XP");
    const hk = document.createElement("div");
    hk.innerHTML = `<div class="phase" style="margin-top:16px">🎁 3 GANCHOS PRA VOCÊ USAR HOJE</div><div class="hooks">${hooks.map((h) => `<div class="hook"><span>${esc(h)}</span><button class="copy">COPIAR</button></div>`).join("")}</div>`;
    out.appendChild(hk);
    $$(".copy", hk).forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.previousElementSibling.textContent); } catch {}
      b.textContent = "COPIADO ✓"; sfx.coin();
    }));
    sayBubble("Isso foi <b>só a prévia</b> de 2 das 6 etapas. No método você faz o <b>vídeo inteiro</b>: personagem, voz, música, legenda e edição.");
    $("#after").innerHTML = `<button class="btn green pulse" data-next style="margin-top:16px">QUERO O MÉTODO COMPLETO →</button><div class="sub">quase lá · última fase</div>`;
    bindNext($("#after"));
    btn.disabled = false; btn.textContent = "⚡ GERAR OUTRO"; running = false;
  });
};

// ---- captura do lead ----
function maskPhone(v) {
  let d = v.replace(/\D/g, ""); if (d.startsWith("55") && d.length > 11) d = d.slice(2); d = d.slice(0, 11);
  if (d.length <= 2) return d ? "(" + d : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}
screens.lead = () => {
  const L = state.lead || {};
  return `
  <section class="screen">
    <div class="phase">FASE 4 DE 4</div>
    ${caption("Última fase:", "LIBERE SUA OFERTA")}
    ${coach("thumb", "Montei uma oferta pensando no que você me respondeu. <b>Pra onde eu mando seu acesso?</b>")}
    ${panel("cadastro.exe", `
      <form class="form" id="lf" novalidate>
        <label>Seu nome<input class="field" name="name" autocomplete="name" placeholder="Como posso te chamar?" value="${esc(L.name || "")}"></label>
        <label>Seu melhor e-mail<input class="field" name="email" type="email" inputmode="email" autocomplete="email" placeholder="voce@email.com" value="${esc(L.email || "")}"></label>
        <label>Seu WhatsApp (com DDD)<input class="field" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="(84) 9 9999-9999" value="${esc(L.whatsapp ? maskPhone(L.whatsapp) : "")}"></label>
        <div class="wa"><span class="ico">📲</span><div><b>Atenção: é por esse WhatsApp que você recebe o acesso</b>, os bônus e o suporte. Confere se o número e o DDD estão certinhos.</div></div>
        <button class="btn pulse" type="submit">LIBERAR MINHA OFERTA →</button>
        <div class="lock">🔒 Seus dados ficam só com a gente. Zero spam.</div>
      </form>`)}
  </section>`;
};
screens.lead.mount = () => {
  const f = $("#lf"), wa = f.whatsapp;
  wa.addEventListener("input", () => { wa.value = maskPhone(wa.value); });
  $$(".field", f).forEach((i) => i.addEventListener("input", () => i.classList.remove("bad")));
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = f.name.value.trim().replace(/\s+/g, " "), email = f.email.value.trim().toLowerCase(), phone = wa.value.replace(/\D/g, "");
    const bad = [];
    if (name.split(" ")[0].length < 2) bad.push(f.name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push(f.email);
    if (!/^\d{10,11}$/.test(phone)) bad.push(wa);
    $$(".field", f).forEach((i) => i.classList.remove("bad"));
    if (bad.length) {
      bad.forEach((i) => i.classList.add("bad")); bad[0].focus(); sfx.error();
      toast(bad[0] === wa ? "Confere o WhatsApp com DDD 😉" : bad[0] === f.email ? "Esse e-mail parece errado" : "Coloca seu nome pra eu te chamar");
      return;
    }
    const btn = $("button[type=submit]", f); btn.disabled = true; btn.textContent = "LIBERANDO...";
    state.lead = { name, email, whatsapp: phone }; save();
    try {
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 5000);
      await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...state.lead, answers: { ...state.answers, ideia: state.idea }, utm: state.utm }), signal: ctl.signal });
    } catch {}
    fbq("track", "Lead");
    sfx.level(); go(6, btn);
  });
};

// ---- oferta / montagem do pedido ----
const RECO = { naosei: "templates", demora: "prompts", retencao: "sfx", caro: "prompts" };
const DOR = { naosei: "nunca editou nada", demora: "demora horas pra editar", retencao: "seus vídeos não prendem", caro: "editor bom é caro demais" };
const MODS = [
  ["🧠", "Roteiro com IA", "Ganchos que seguram nos 3 primeiros segundos"],
  ["🧍", "Personagem fixo", "Seu avatar igual em todos os vídeos"],
  ["🎬", "Cenas geradas por IA", "Do texto pra imagem em minutos"],
  ["🎙️", "Voz e trilha", "Narração, música e efeitos sonoros"],
  ["💬", "Legenda e ritmo", "Legendas animadas que prendem"],
  ["🚀", "Edição que converte", "Montagem final, exportação e postagem"],
];
function order() {
  const c = catalog || FALLBACK_CATALOG; const set = new Set(state.bumps);
  const chosen = c.bumps.filter((b) => set.has(b.id));
  const all = c.bumps.length > 0 && chosen.length === c.bumps.length;
  const disc = all ? c.comboDiscount : 0;
  let total = Math.round((c.main.price + chosen.reduce((s, b) => s + b.price, 0) - disc) * 100) / 100;
  const pct = state.couponPct || 0;
  const couponOff = pct ? Math.round(total * pct) / 100 : 0;
  total = Math.max(1, Math.round((total - couponOff) * 100) / 100);
  return { chosen, disc, total, all, couponOff, pct };
}
screens.oferta = () => {
  const c = catalog || FALLBACK_CATALOG; const L = state.lead || {};
  const first = esc((L.name || "").split(" ")[0] || "Ei");
  const reco = RECO[state.answers.trava];
  const recoB = c.bumps.find((b) => b.id === reco);
  const msg = recoB ? `Como você disse que <b>${esc(DOR[state.answers.trava] || "")}</b>, eu recomendo adicionar o <b>${esc(recoB.name)}</b>. Monta do seu jeito:` : "Monta seu kit do seu jeito. Marca o que quiser levar junto:";
  return `
  <section class="screen">
    <div class="phase">🏆 OFERTA LIBERADA</div>
    ${caption(`${first}, monta`, "SEU KIT")}
    ${coach("down", msg)}
    ${panel("o_que_tem_no_metodo.txt", `<div class="mods">${MODS.map(([i, t, s]) => `<div class="mod"><span class="ico">${i}</span><div><b>${t}</b><small>${s}</small></div></div>`).join("")}</div>`)}
    <div class="item main">
      <div class="box">✓</div>
      <div><h3>${esc(c.main.name)}</h3><p>${esc(c.main.desc)}</p>
      <div class="price"><s>${brl(c.main.anchor)}</s><strong>${brl(c.main.price)}</strong></div>
      <div class="add">INCLUÍDO NO SEU PEDIDO</div></div>
    </div>
    ${c.bumps.length ? `<div class="phase" style="margin-top:18px">➕ TURBINE SEU PEDIDO (OPCIONAL)</div>` : ""}
    ${c.bumps.map((b) => `
      <div class="item ${state.bumps.includes(b.id) ? "on" : ""}" data-bump="${b.id}" role="checkbox" aria-checked="${state.bumps.includes(b.id)}" tabindex="0">
        ${b.id === reco ? `<span class="tag" style="background:var(--purple)">RECOMENDADO PRA VOCÊ</span>` : b.tag ? `<span class="tag">${esc(b.tag)}</span>` : ""}
        <div class="box">${state.bumps.includes(b.id) ? "✓" : ""}</div>
        <div><h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p>
        <div class="price"><s>${brl(b.anchor)}</s>só <strong>+${brl(b.price)}</strong></div>
        <div class="add">${state.bumps.includes(b.id) ? "ADICIONADO ✓" : "TOQUE PARA ADICIONAR"}</div></div>
      </div>`).join("")}
    ${c.bumps.length && c.comboDiscount ? `<div class="combo" id="combo"></div>` : ""}
    ${panel("seu_pedido.txt", `<div class="summary" id="sum"></div>
      <button class="btn green pulse" id="pay" style="margin-top:14px">IR PRO PAGAMENTO →</button>
      <div class="pay"><span>PIX</span><span>CARTÃO ATÉ 12X</span><span>MERCADO PAGO</span></div>`)}
    <div class="guarantee"><div class="seal">7<br>DIAS</div><div><b>Garantia de 7 dias.</b> Entrou e não curtiu? Pede o reembolso em até 7 dias e devolvemos 100% do valor. Sem pergunta.</div></div>
    <div class="who">📲 Acesso vai para <b>${esc(maskPhone(L.whatsapp || ""))}</b> e <b>${esc(L.email || "")}</b> · <a href="#" id="edit">corrigir</a></div>
    <div class="phase" style="margin-top:20px">PERGUNTAS RÁPIDAS</div>
    <details><summary>Preciso saber editar?</summary><p>Não. O método começa do zero e a IA faz a parte pesada. Você aprende a dar as instruções certas e montar o vídeo.</p></details>
    <details><summary>Dá pra fazer só pelo celular?</summary><p>Sim. Dá pra seguir tudo no celular; no computador fica mais confortável, mas não é obrigatório.</p></details>
    <details><summary>Como eu recebo o acesso?</summary><p>Assim que o pagamento é aprovado, você recebe o acesso no WhatsApp e no e-mail que cadastrou. No Pix a aprovação costuma ser imediata.</p></details>
    <details><summary>E se eu não gostar?</summary><p>Você tem 7 dias de garantia. É só pedir e devolvemos todo o valor.</p></details>
  </section>`;
};
function updateOrder(flash) {
  const c = catalog || FALLBACK_CATALOG; const o = order();
  const sum = $("#sum"); if (!sum) return;
  sum.innerHTML = `
    <div class="row"><span>${esc(c.main.name)}</span><span>${brl(c.main.price)}</span></div>
    ${o.chosen.map((b) => `<div class="row"><span>${esc(b.name)}</span><span>${brl(b.price)}</span></div>`).join("")}
    ${o.disc ? `<div class="row disc"><span>Desconto combo completo</span><span>−${brl(o.disc)}</span></div>` : ""}
    ${o.couponOff ? `<div class="row disc"><span>Cupom ${esc(state.coupon)} (−${o.pct}%)</span><span>−${brl(o.couponOff)}</span></div>` : ""}
    <div class="tot"><span>Total</span><strong>${brl(o.total)}</strong></div>`;
  const combo = $("#combo");
  if (combo) {
    const n = o.chosen.length, N = c.bumps.length;
    combo.innerHTML = o.all
      ? `🔓 <b>COMBO COMPLETO!</b> Você ganhou <b style="color:var(--green)">${brl(c.comboDiscount)} de desconto</b>.`
      : `🎯 Leve <b>todos os ${N} extras</b> e ganhe <b style="color:var(--yel)">${brl(c.comboDiscount)} de desconto</b>. Faltam ${N - n}.<div class="progress"><div style="width:${(n / N) * 100}%"></div></div>`;
  }
  $("#stotal") && ($("#stotal").textContent = brl(o.total));
  if (flash) { sum.classList.remove("flash"); void sum.offsetWidth; sum.classList.add("flash"); }
}
screens.oferta.mount = () => {
  // revela os módulos um a um
  $$(".mod").forEach((m, i) => setTimeout(() => { m.classList.add("on"); tone(600 + i * 90, 0.05); }, 250 + i * 220));
  $$("[data-bump]").forEach((el) => {
    const toggle = () => {
      const id = el.dataset.bump, on = !state.bumps.includes(id);
      state.bumps = on ? [...state.bumps, id] : state.bumps.filter((x) => x !== id); save();
      el.classList.toggle("on", on); el.setAttribute("aria-checked", on);
      $(".box", el).textContent = on ? "✓" : ""; $(".add", el).textContent = on ? "ADICIONADO ✓" : "TOQUE PARA ADICIONAR";
      if (on) { sfx.coin(); xpFloat(el, "+" + brl((catalog || FALLBACK_CATALOG).bumps.find((b) => b.id === id).price)); } else sfx.off();
      const was = updateOrder.all; updateOrder(true);
      if (order().all && !was) sfx.level();
      updateOrder.all = order().all;
    };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });
  });
  updateOrder.all = order().all; updateOrder();
  $("#pay").addEventListener("click", checkout);
  $("#edit").addEventListener("click", (e) => { e.preventDefault(); go(5); });
  // barra fixa com total
  const st = document.createElement("div"); st.className = "sticky"; st.id = "sticky";
  st.innerHTML = `<div class="in"><div class="t"><small>TOTAL</small><strong id="stotal">${brl(order().total)}</strong></div><button class="btn green" id="pay2">PAGAR AGORA →</button></div>`;
  document.body.appendChild(st);
  $("#pay2").addEventListener("click", checkout);
  const payBtn = $("#pay");
  const io = new IntersectionObserver(([e]) => st.classList.toggle("show", !e.isIntersecting && window.scrollY > 300));
  io.observe(payBtn);
  window.addEventListener("scroll", () => { if (window.scrollY < 300) st.classList.remove("show"); }, { passive: true });
  if (params.get("pagamento") === "falhou") { toast("O pagamento não foi concluído. Tenta de novo — no Pix é na hora."); history.replaceState(null, "", location.pathname); }
};

async function checkout() {
  if (!state.lead) return go(5);
  const btns = [$("#pay"), $("#pay2")].filter(Boolean);
  btns.forEach((b) => { b.disabled = true; b.dataset.t = b.textContent; b.textContent = "CRIANDO PAGAMENTO..."; });
  sfx.blip();
  const o = order();
  fbq("track", "InitiateCheckout", { value: o.total, currency: "BRL" });
  try { sessionStorage.setItem("ce_total", String(o.total)); } catch {}
  try {
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...state.lead, items: state.bumps, coupon: state.couponPct ? state.coupon : "" }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.url) {
      if (data.fields) { toast("Confere seus dados antes de pagar."); return go(5); }
      throw new Error(data.error || "erro");
    }
    sfx.level();
    location.href = data.url;
  } catch (e) {
    sfx.error(); toast("Não consegui abrir o pagamento agora. Tenta de novo em alguns segundos.");
    btns.forEach((b) => { b.disabled = false; b.textContent = b.dataset.t; });
  }
}

// ---------- render ----------
function bindNext(root = document) { $$("[data-next]", root).forEach((b) => b.addEventListener("click", () => go(state.step + 1, b))); }
function render() {
  $("#sticky")?.remove();
  const name = STEPS[state.step];
  if ((name === "oferta") && !state.lead) { state.step = 5; return render(); }
  const s = screens[name];
  $("#stage").innerHTML = s();
  bindNext($("#stage"));
  s.mount && s.mount();
  hud();
}

(async function init() {
  if (params.get("pagamento") === "falhou" && state.lead) state.step = 6;
  else if (state.step > 0 && state.step < 6 && !params.get("continuar")) state.step = state.step; // retoma onde parou
  try { const r = await fetch("/api/catalog"); if (r.ok) catalog = await r.json(); } catch {}
  state.couponPct = 0;
  if (state.coupon) {
    try { const r = await fetch("/api/cupom?code=" + encodeURIComponent(state.coupon)); const d = await r.json(); state.couponPct = d.valid ? d.pct : 0; } catch {}
    if (!state.couponPct) state.coupon = "";
    save();
  }
  render();
})();
