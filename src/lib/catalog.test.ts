import { afterEach, describe, expect, it, vi } from "vitest";
import { getAddress, getCatalog, groupOf } from "./catalog";
afterEach(() => vi.unstubAllGlobals());
describe("integrações de catálogo e CEP", () => {
  it("rejeita CEP inválido antes de chamar o serviço", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(getAddress("123")).rejects.toThrow("8 dígitos");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("normaliza o CEP e retorna cidade e UF", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ localidade: "São Paulo", uf: "SP" }),
    });
    vi.stubGlobal("fetch", fetch);
    await expect(getAddress("01001-000")).resolves.toBe("São Paulo, SP");
    expect(fetch.mock.calls[0][0]).toBe(
      "https://viacep.com.br/ws/01001000/json/",
    );
  });
  it("trata CEP inexistente", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ erro: true }) }),
    );
    await expect(getAddress("99999999")).rejects.toThrow("não encontrado");
  });
  it("não trata uma falha HTTP como catálogo vazio", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(getCatalog()).rejects.toThrow("indisponível");
  });
  it("rejeita resposta sem produtos", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ products: [] }) }),
    );
    await expect(getCatalog()).rejects.toThrow("inválido");
  });
  it("normaliza preços ilustrativos sem alterar os identificadores", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ products: [{ id: 101, price: 10.99 }] }),
      }),
    );
    expect(await getCatalog()).toEqual([{ id: 101, price: 54.95 }]);
  });
  it("agrupa categorias do fornecedor", () => {
    expect(groupOf("mobile-accessories")).toBe("tech");
    expect(groupOf("home-decoration")).toBe("home");
    expect(groupOf("skin-care")).toBe("beauty");
    expect(groupOf("sports-accessories")).toBe("sports");
    expect(groupOf("mens-shirts")).toBe("fashion");
  });
});
