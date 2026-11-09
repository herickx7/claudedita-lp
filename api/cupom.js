import { couponPercent } from "../lib/catalog.js";

// Valida um cupom vindo do link (?cupom=CODIGO) e devolve só a porcentagem.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const pct = couponPercent(req.query && req.query.code);
  res.status(200).json({ valid: pct > 0, pct });
}
