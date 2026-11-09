// ============================================================
//  CATÁLOGO — fonte única de preços (o servidor SEMPRE recalcula
//  o total a partir daqui; o valor enviado pelo navegador é ignorado).
//  Edite nomes, descrições e preços à vontade.
// ============================================================

export const MAIN = {
  id: "metodo",
  name: "Método claudedita",
  desc: "O passo a passo completo pra criar vídeos nesse nível só com IA: roteiro com ganchos, personagem fixo, cenas, voz, música, legenda e edição que retém.",
  price: 97.0,
  anchor: 297.0, // preço "de" (riscado)
  required: true,
};

export const BUMPS = [
  {
    id: "prompts",
    name: "Pack 300 prompts prontos",
    desc: "Prompts testados de roteiro, gancho, personagem e cena. É copiar, colar e gerar.",
    price: 27.0,
    anchor: 67.0,
    tag: "MAIS ESCOLHIDO",
  },
  {
    id: "sfx",
    name: "Banco de efeitos sonoros 8-bit + trilhas",
    desc: "Os mesmos tipos de som do anúncio (hit, coin, whoosh, level up) e trilhas chiptune pra usar sem medo.",
    price: 19.0,
    anchor: 47.0,
  },
  {
    id: "templates",
    name: "Templates de personagem e cenas",
    desc: "Modelos prontos de avatar pixel art, telas de interface e transições pra você só trocar o texto.",
    price: 24.0,
    anchor: 57.0,
  },
  {
    id: "vip",
    name: "Grupo VIP no Discord + correção dos seus vídeos",
    desc: "Mande seus vídeos no Discord e receba correção direta. Dúvidas respondidas pela comunidade e por mim.",
    price: 47.0,
    anchor: 147.0,
    tag: "VAGAS LIMITADAS",
  },
];

// Desconto aplicado quando o cliente leva TODOS os bumps (0 para desligar)
export const COMBO_DISCOUNT = 20.0;

// Cupons ficam na variável de ambiente COUPONS da Vercel, no formato JSON:
//   {"TESTE99": 99, "AMIGO20": 20}   (código: % de desconto)
// Eles nunca aparecem no site: só funcionam por link (?cupom=CODIGO).
export function couponPercent(code) {
  if (!code) return 0;
  try {
    const map = JSON.parse(process.env.COUPONS || "{}");
    const key = Object.keys(map).find((k) => k.toUpperCase() === String(code).trim().toUpperCase());
    const p = key ? Number(map[key]) : 0;
    return p > 0 && p < 100 ? p : 0;
  } catch { return 0; }
}

export function computeOrder(ids = [], coupon = "") {
  const set = new Set(Array.isArray(ids) ? ids.map(String) : []);
  const items = [MAIN, ...BUMPS.filter((b) => set.has(b.id))];
  let total = items.reduce((s, i) => s + i.price, 0);
  const allBumps = BUMPS.length > 0 && BUMPS.every((b) => set.has(b.id));
  const discount = allBumps ? COMBO_DISCOUNT : 0;
  total = Math.round((total - discount) * 100) / 100;
  const pct = couponPercent(coupon);
  const couponOff = pct ? Math.round(total * pct) / 100 : 0;
  total = Math.max(1, Math.round((total - couponOff) * 100) / 100); // mínimo R$ 1,00
  return { items, discount, coupon: pct ? String(coupon).toUpperCase() : "", couponPct: pct, couponOff, total };
}

export function publicCatalog() {
  return { main: MAIN, bumps: BUMPS, comboDiscount: COMBO_DISCOUNT };
}
