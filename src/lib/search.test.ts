import { describe, expect, it } from "vitest";
import { fallbackProducts, type Product } from "./catalog";
import { matchesSearch } from "./search";
const audio = fallbackProducts.filter((p) => [99, 100, 101].includes(p.id));
describe("busca em português", () => {
  it("encontra os produtos de áudio ao procurar som", () => {
    expect(audio.length).toBe(3);
    expect(audio.every((p) => matchesSearch(p, "som"))).toBe(true);
  });
  it("aceita acentos, espaços extras e termos em qualquer ordem", () => {
    const p = fallbackProducts.find((p) => p.id === 101)!;
    expect(matchesSearch(p, "  FÓNE   apple ")).toBe(true);
    expect(matchesSearch(p, "silver airpods")).toBe(true);
  });
  it("não inclui produtos sem relação com áudio", () => {
    expect(
      matchesSearch(
        fallbackProducts.find((p) => p.id === 78)!,
        "som",
      ),
    ).toBe(false);
  });
  it("busca descrição e não exige correspondência literal da frase", () => {
    const p = {
      title: "Studio One",
      category: "mobile-accessories",
      description: "Wireless headphones",
      brand: "Studio",
    } as Product;
    expect(matchesSearch(p, "fone de som")).toBe(true);
  });
  it("mantém a busca vazia e rejeita termos desconhecidos", () => {
    expect(matchesSearch(audio[0], "  ")).toBe(true);
    expect(matchesSearch(audio[0], "produto inexistente")).toBe(false);
  });
});
