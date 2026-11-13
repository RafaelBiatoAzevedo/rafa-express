import reserve from "./catalog-reserve.json";
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
  brand?: string;
}
export const groups = [
  { id: "all", label: "Todos os produtos", symbol: "✦" },
  { id: "tech", label: "Tecnologia", symbol: "⌘" },
  { id: "home", label: "Casa & decoração", symbol: "⌂" },
  { id: "beauty", label: "Beleza & cuidado", symbol: "✿" },
  { id: "fashion", label: "Moda & estilo", symbol: "♧" },
  { id: "sports", label: "Esporte & lazer", symbol: "↗" },
];
export function groupOf(category: string) {
  if (/laptops|smartphones|tablets|mobile|vehicle/.test(category))
    return "tech";
  if (/furniture|home|kitchen|groceries/.test(category)) return "home";
  if (/beauty|fragrances|skin/.test(category)) return "beauty";
  if (/sports|motorcycle/.test(category)) return "sports";
  return "fashion";
}
// DummyJSON is a demonstration catalog. Values are illustrative BRL prices, not live offers.
export const fallbackProducts: Product[] = reserve.map((p) => ({
  ...p,
  price: Math.round(p.price * 5 * 100) / 100,
}));
export async function getCatalog(signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch("https://dummyjson.com/products?limit=194", {
    signal,
  });
  if (!response.ok) throw new Error("Catálogo indisponível");
  const data = await response.json();
  if (!Array.isArray(data.products) || !data.products.length)
    throw new Error("Catálogo inválido");
  return data.products.map((p: Product) => ({
    ...p,
    price: Math.round(p.price * 5 * 100) / 100,
  }));
}
export const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export async function getAddress(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("Digite um CEP com 8 dígitos.");
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok)
    throw new Error("Não foi possível consultar o CEP. Tente novamente.");
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado. Confira os números.");
  return `${data.localidade}, ${data.uf}` as string;
}
