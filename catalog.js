import { publicCatalog } from "../lib/catalog.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).json(publicCatalog());
}
