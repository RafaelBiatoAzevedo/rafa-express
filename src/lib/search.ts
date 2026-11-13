import { groupOf, groups, type Product } from "./catalog";

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Portuguese discovery terms enrich the English supplier data without inventing products.
const concepts = [
  {
    aliases: ["som", "audio", "musica"],
    pattern:
      /headphon|earphon|earbud|airpod|speaker|homepod|echo plus|beats flex/,
  },
  {
    aliases: ["fone", "fones", "headset"],
    pattern: /headphon|earphon|earbud|airpod|beats flex/,
  },
  {
    aliases: ["caixa de som", "alto falante"],
    pattern: /speaker|homepod|echo plus/,
  },
  { aliases: ["celular", "celulares", "telefone"], pattern: /smartphones/ },
  {
    aliases: ["notebook", "notebooks", "computador", "computadores"],
    pattern: /laptops/,
  },
  { aliases: ["relogio", "relogios"], pattern: /watch/ },
  {
    aliases: ["carregador", "carregadores"],
    pattern: /charger|airpower|battery pack/,
  },
  { aliases: ["camera", "cameras"], pattern: /camera/ },
  { aliases: ["moveis", "movel"], pattern: /furniture/ },
  { aliases: ["sofa", "sofas"], pattern: /sofa/ },
  { aliases: ["cadeira", "cadeiras"], pattern: /chair/ },
  { aliases: ["cama", "camas"], pattern: /bed/ },
  { aliases: ["mesa", "mesas"], pattern: /table/ },
  { aliases: ["cozinha", "utensilios"], pattern: /kitchen/ },
  { aliases: ["perfume", "perfumes"], pattern: /fragrances/ },
  { aliases: ["maquiagem", "cosmeticos"], pattern: /beauty/ },
  { aliases: ["pele", "hidratante"], pattern: /skin care/ },
  {
    aliases: ["camisa", "camiseta", "camisas", "camisetas"],
    pattern: /shirts/,
  },
  { aliases: ["sapato", "sapatos", "tenis", "calcados"], pattern: /shoes/ },
  { aliases: ["bolsa", "bolsas"], pattern: /bags/ },
  { aliases: ["oculos"], pattern: /sunglasses/ },
  { aliases: ["esporte", "esportes"], pattern: /sports/ },
];
const stopWords = new Set(["de", "da", "do", "das", "dos", "e", "para", "com"]);

export function matchesSearch(product: Product, query: string): boolean {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  const identity = normalizeSearch(`${product.title} ${product.category} ${product.description}`);
  const aliases = concepts
    .filter((concept) => concept.pattern.test(identity))
    .flatMap((concept) => concept.aliases);
  const group =
    groups.find((g) => g.id === groupOf(product.category))?.label || "";
  const searchable = normalizeSearch(
    `${product.title} ${product.brand || ""} ${product.category} ${product.description} ${group} ${aliases.join(" ")}`,
  );
  const terms = normalized.split(" ").filter((term) => !stopWords.has(term));
  return terms.length > 0 && terms.every((term) => searchable.includes(term));
}
