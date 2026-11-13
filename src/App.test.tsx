// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { fallbackProducts } from "./lib/catalog";
vi.mock("./lib/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/catalog")>();
  return {
    ...actual,
    getCatalog: vi.fn(async () => actual.fallbackProducts),
    getAddress: vi.fn(async () => "São Paulo, SP"),
  };
});
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
it("adiciona um produto, altera a quantidade e persiste a sacola após remontar", async () => {
  const user = userEvent.setup();
  const view = render(<App />);
  const product = fallbackProducts[0];
  await user.click(
    await screen.findByRole("button", {
      name: `Adicionar ${product.title} à sacola`,
    }),
  );
  await user.click(
    screen.getByRole("button", { name: "Abrir sacola com 1 itens" }),
  );
  const modal = screen.getByRole("dialog", { name: "Sua sacola" });
  expect(within(modal).getByText(product.title)).toBeTruthy();
  await user.click(
    within(modal).getByRole("button", { name: `Aumentar ${product.title}` }),
  );
  expect(JSON.parse(localStorage.getItem("rafa:cart")!)[0].quantity).toBe(2);
  view.unmount();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Abrir sacola com 2 itens" }),
  );
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Remover" }),
  );
  expect(screen.getByText("Sua próxima descoberta vem aí.")).toBeTruthy();
});
it("salva favoritos e encontra um produto pela busca", async () => {
  const user = userEvent.setup();
  render(<App />);
  const product = fallbackProducts[0];
  await user.click(
    await screen.findByRole("button", {
      name: `Adicionar ${product.title} dos favoritos`,
    }),
  );
  await user.click(screen.getByRole("button", { name: "Ver favoritos" }));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  await user.type(
    screen.getByRole("textbox", { name: "Buscar produtos" }),
    "produto inexistente",
  );
  expect(screen.getByText("Nenhum produto por aqui.")).toBeTruthy();
  expect(JSON.parse(localStorage.getItem("rafa:favorites")!)).toContain(
    product.id,
  );
});
it("consulta CEP, atualiza localização e fecha modal com Escape", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /Entregar em/ }));
  await user.type(screen.getByLabelText("Seu CEP"), "01001-000");
  await user.click(
    screen.getByRole("button", { name: "Confirmar localização" }),
  );
  expect(
    await screen.findByRole("button", { name: /Entregar em São Paulo, SP/ }),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /Entregar em/ }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
});
