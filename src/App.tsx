import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  X,
  Minus,
  Plus,
  Check,
  ChevronDown,
  Zap,
  Headphones,
  Laptop,
  Home,
  Sparkles,
  Shirt,
  Bike,
  SlidersHorizontal,
} from "lucide-react";
import {
  fallbackProducts,
  getAddress,
  getCatalog,
  groupOf,
  groups,
  money,
  type Product,
} from "./lib/catalog";
type CartItem = { product: Product; quantity: number };
function read<T>(key: string, initial: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? initial;
  } catch {
    return initial;
  }
}
function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
const icons = [Laptop, Laptop, Home, Sparkles, Shirt, Bike];
export default function App() {
  const modalRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [offers, setOffers] = useState(false);
  const [favorites, setFavorites] = useStored<number[]>("rafa:favorites", []);
  const [cart, setCart] = useStored<CartItem[]>("rafa:cart", []);
  const [panel, setPanel] = useState<"cart" | "cep" | "card" | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useStored("rafa:address", "");
  const [cepError, setCepError] = useState("");
  const [checking, setChecking] = useState(false);
  const [limit, setLimit] = useState(12);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    getCatalog(controller.signal)
      .then((data) => {
        setProducts(data);
        setOffline(false);
      })
      .catch(() => {
        if (!disposed) setOffline(true);
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    let disposed = false;
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    setLimit(12);
  }, [query, category, sort, onlyFavorites, offers]);
  useEffect(() => {
    const open = !!panel || !!selected;
    document.body.style.overflow = open ? "hidden" : "";
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPanel(null);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [panel, selected]);
  useEffect(() => {
    if (!panel && !selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = modalRef.current;
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, [tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [panel, selected]);
  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        (category === "all" || groupOf(p.category) === category) &&
        (!onlyFavorites || favorites.includes(p.id)) &&
        (!offers || p.discountPercentage >= 15) &&
        `${p.title} ${p.brand || ""} ${p.category} ${groups.find((g) => g.id === groupOf(p.category))?.label}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    if (sort === "price-up") list.sort((a, b) => a.price - b.price);
    if (sort === "price-down") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "featured")
      list.sort(
        (a, b) =>
          Number(groupOf(b.category) === "tech") -
          Number(groupOf(a.category) === "tech"),
      );
    return list;
  }, [products, category, query, onlyFavorites, favorites, offers, sort]);
  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  function favorite(id: number) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function add(product: Product) {
    const existing = cart.find((item) => item.product.id === product.id);
    if (product.stock < 1 || (existing && existing.quantity >= product.stock)) {
      setToast("Você atingiu o estoque disponível.");
      return;
    }
    setCart((prev) => {
      const item = prev.find((i) => i.product.id === product.id);
      return item
        ? prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) }
              : i,
          )
        : [...prev, { product, quantity: 1 }];
    });
    setToast("Produto adicionado à sua sacola");
  }
  function explore(id = "all") {
    setCategory(id);
    setOnlyFavorites(false);
    setOffers(false);
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  }
  function reset() {
    setQuery("");
    setCategory("all");
    setOffers(false);
    setOnlyFavorites(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function lookup() {
    setChecking(true);
    setCepError("");
    try {
      const result = await getAddress(cep);
      setAddress(result);
      setPanel(null);
      setToast("Local de entrega atualizado");
    } catch (e) {
      setCepError(
        e instanceof Error ? e.message : "Falha na consulta. Tente novamente.",
      );
    } finally {
      setChecking(false);
    }
  }
  return (
    <>
      <div className="announcement">
        <span>Uma boa escolha muda o seu dia.</span>
        <span>
          Explore. Descubra. RafaExpress. <ArrowUpRight size={13} />
        </span>
      </div>
      <header>
        <div className="header-main wrap">
          <button
            className="brand"
            onClick={reset}
            aria-label="RafaExpress início"
          >
            rafa<span>express</span>
            <i>↗</i>
          </button>
          <div className="search">
            <Search size={19} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              placeholder="O que você está procurando hoje?"
              aria-label="Buscar produtos"
            />
            <kbd>⌕</kbd>
          </div>
          <button
            className="location"
            aria-label={`Entregar em ${address || "Informe seu CEP"}`}
            onClick={() => setPanel("cep")}
          >
            <MapPin size={20} />
            <span>
              Entregar em
              <strong>
                {address || "Informe seu CEP"} <ChevronDown size={12} />
              </strong>
            </span>
          </button>
          <div className="header-actions">
            <button
              aria-label="Ver favoritos"
              className={onlyFavorites ? "active" : ""}
              onClick={() => {
                setOnlyFavorites(!onlyFavorites);
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Heart size={23} />
            </button>
            <button
              aria-label={`Abrir sacola com ${count} itens`}
              onClick={() => setPanel("cart")}
            >
              <ShoppingBag size={23} />
              <b>{count}</b>
            </button>
          </div>
        </div>
        <nav className="wrap">
          <button onClick={() => explore()}>
            <SlidersHorizontal size={16} /> Todas as categorias
          </button>
          <button
            onClick={() => {
              explore();
              setOffers(true);
            }}
          >
            <Zap size={15} /> Ofertas do dia
          </button>
          <button onClick={() => explore("tech")}>Tecnologia</button>
          <button onClick={() => explore("home")}>Casa & decoração</button>
          <button onClick={() => explore("fashion")}>Moda & estilo</button>
          <button className="nav-card" onClick={() => setPanel("card")}>
            <CreditCard size={16} /> Cartão RafaExpress{" "}
            <ArrowUpRight size={13} />
          </button>
        </nav>
      </header>
      <main className="wrap">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> NOVAS POSSIBILIDADES, TODOS OS DIAS
            </div>
            <h1>
              Seu próximo
              <br />
              favorito está <em>aqui.</em>
            </h1>
            <p>
              Tecnologia, estilo e tudo o que combina com você.
              <br />
              Encontre sua próxima boa escolha.
            </p>
            <button className="white-button" onClick={() => explore("tech")}>
              Explore as novidades <ArrowRight size={18} />
            </button>
            <div className="hero-bottom">
              <span>BOAS ESCOLHAS. GRANDES DESCOBERTAS.</span>
              <div className="dots">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-label">
              SINTA CADA
              <br />
              <b>DETALHE.</b>
            </span>
            <img
              src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=85"
              alt="Fone de ouvido premium preto"
            />
            <div className="floating-label">
              <span>O som da sua próxima fase</span>
              <strong>
                Conecte-se ao que importa <ArrowUpRight size={15} />
              </strong>
            </div>
            <span className="hero-number">01 / 03</span>
          </div>
        </section>
        <section className="benefits" aria-label="Benefícios">
          <div>
            <Truck />
            <span>
              <strong>Mais perto de você</strong>
              <small>Consulte seu endereço pelo CEP</small>
            </span>
          </div>
          <div>
            <CreditCard />
            <span>
              <strong>Seu jeito de escolher</strong>
              <small>Compare preços e possibilidades</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Uma experiência simples</strong>
              <small>Seus favoritos sempre por aqui</small>
            </span>
          </div>
          <div>
            <Headphones />
            <span>
              <strong>Feito para o seu dia</strong>
              <small>Descubra algo novo a cada visita</small>
            </span>
          </div>
        </section>
        <section className="categories">
          <div className="section-title">
            <div>
              <span className="eyebrow blue">UM MUNDO DE POSSIBILIDADES</span>
              <h2>Encontre o que é a sua cara.</h2>
            </div>
            <button className="text-button" onClick={() => explore()}>
              Ver tudo <ArrowRight size={16} />
            </button>
          </div>
          <div className="category-grid">
            {groups.slice(1).map((g, index) => {
              const Icon = icons[index + 1];
              return (
                <button
                  key={g.id}
                  className={category === g.id ? "selected" : ""}
                  onClick={() => explore(g.id)}
                >
                  <span className={`category-icon icon-${index}`}>
                    <Icon size={30} strokeWidth={1.5} />
                  </span>
                  <strong>{g.label}</strong>
                  <ArrowUpRight size={15} />
                </button>
              );
            })}
          </div>
        </section>
        <section id="catalogo" className="catalog">
          <div className="section-title">
            <div>
              <span className="eyebrow blue">SUA PRÓXIMA DESCOBERTA</span>
              <h2>
                {onlyFavorites
                  ? "Seus favoritos."
                  : offers
                    ? "Boas ofertas, grandes achados."
                    : query
                      ? `Resultados para “${query}”`
                      : "Escolhidos para você."}
              </h2>
            </div>
            <span className="catalog-note">Catálogo demonstrativo</span>
          </div>
          <div className="filters">
            <div className="tabs">
              {groups.map((g) => (
                <button
                  key={g.id}
                  className={category === g.id ? "selected" : ""}
                  onClick={() => setCategory(g.id)}
                >
                  {g.id === "all" ? "Tudo" : g.label.split(" &")[0]}
                </button>
              ))}
            </div>
            <label className="sort">
              Ordenar por{" "}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Ordenar produtos"
              >
                <option value="featured">Destaques</option>
                <option value="price-up">Menor preço</option>
                <option value="price-down">Maior preço</option>
                <option value="rating">Melhor avaliação</option>
              </select>
            </label>
          </div>
          <div className="data-notice">
            {loading
              ? "Buscando novidades…"
              : offline
                ? "Você está vendo o catálogo de reserva. A API está temporariamente indisponível."
                : "Produtos de demonstração via DummyJSON · preços ilustrativos em reais · sem venda ou cobrança."}
            {(offers || onlyFavorites) && (
              <button
                onClick={() => {
                  setOffers(false);
                  setOnlyFavorites(false);
                }}
              >
                Limpar filtro <X size={12} />
              </button>
            )}
          </div>
          <div className="product-grid">
            {filtered.slice(0, limit).map((p, index) => (
              <article className="product" key={p.id}>
                <div className="product-image">
                  <button
                    className={`favorite ${favorites.includes(p.id) ? "is-favorite" : ""}`}
                    aria-label={`${favorites.includes(p.id) ? "Remover" : "Adicionar"} ${p.title} dos favoritos`}
                    onClick={() => favorite(p.id)}
                  >
                    <Heart
                      size={18}
                      fill={favorites.includes(p.id) ? "currentColor" : "none"}
                    />
                  </button>
                  {p.discountPercentage >= 15 && (
                    <span className="discount">
                      −{Math.round(p.discountPercentage)}%
                    </span>
                  )}
                  <button
                    className="image-button"
                    onClick={() => setSelected(p)}
                    aria-label={`Ver detalhes de ${p.title}`}
                  >
                    <img
                      loading="lazy"
                      src={p.thumbnail}
                      alt={p.title}
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  </button>
                </div>
                <div className="product-info">
                  <span className="product-category">
                    {groups.find((g) => g.id === groupOf(p.category))?.label}
                  </span>
                  <button
                    className="product-title"
                    onClick={() => setSelected(p)}
                  >
                    {p.title}
                  </button>
                  <div className="rating">
                    <span>★</span> {p.rating.toFixed(1)}{" "}
                    <small>· {p.stock} disponíveis</small>
                  </div>
                  <del>{money(p.price / (1 - p.discountPercentage / 100))}</del>
                  <strong className="price">{money(p.price)}</strong>
                  <p className="installment">
                    ou 10x de {money(p.price / 10)} <span>sem juros*</span>
                  </p>
                  <div className="product-bottom">
                    <span>
                      {index % 3 === 0
                        ? "✦ Vale a descoberta"
                        : "Uma boa escolha"}
                    </span>
                    <button
                      onClick={() => add(p)}
                      aria-label={`Adicionar ${p.title} à sacola`}
                    >
                      <Plus size={19} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!filtered.length && !loading && (
            <div className="empty">
              <Search size={32} />
              <h3>Nenhum produto por aqui.</h3>
              <p>Experimente outra busca ou explore todas as categorias.</p>
              <button
                className="primary"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setOnlyFavorites(false);
                  setOffers(false);
                }}
              >
                Explorar produtos
              </button>
            </div>
          )}
          {filtered.length > limit && (
            <button className="load-more" onClick={() => setLimit(limit + 12)}>
              Descobrir mais produtos <Plus size={16} />
            </button>
          )}
        </section>
        <section className="card-banner">
          <div>
            <span className="eyebrow">UM CARTÃO. NOVAS POSSIBILIDADES.</span>
            <h2>
              Combina com você.
              <br />E com seus planos.
            </h2>
            <p>
              O cartão RafaExpress está de cara nova.
              <br />
              Um conceito pensado para acompanhar suas escolhas.
            </p>
            <button className="white-button" onClick={() => setPanel("card")}>
              Conheça o cartão <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="credit-card">
            <div>
              <strong>
                rafa<span>express</span> ↗
              </strong>
              <span>platinum</span>
            </div>
            <div className="chip">▥</div>
            <span className="card-digits">
              •••• &nbsp; •••• &nbsp; •••• &nbsp; 2026
            </span>
            <div>
              <small>SEU PRÓXIMO CAPÍTULO</small>
              <b>visa</b>
            </div>
          </div>
          <span className="card-circle" />
        </section>
        <section className="closing">
          <Zap size={26} />
          <div>
            <h3>Tem muita coisa boa esperando por você.</h3>
            <p>Salve seus favoritos e volte para continuar de onde parou.</p>
          </div>
          <button
            className="text-button"
            onClick={() => {
              setOnlyFavorites(true);
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Meus favoritos <Heart size={18} />
          </button>
        </section>
      </main>
      <footer>
        <div className="wrap footer-main">
          <div>
            <button className="brand" onClick={reset}>
              rafa<span>express</span>
              <i>↗</i>
            </button>
            <p>Boas escolhas começam aqui.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <button onClick={() => explore()}>Todos os produtos</button>
            <button onClick={() => explore("tech")}>Tecnologia</button>
            <button onClick={() => setPanel("card")}>Cartão RafaExpress</button>
          </div>
          <div>
            <strong>Do seu jeito</strong>
            <button onClick={() => setPanel("cart")}>Minha sacola</button>
            <button
              onClick={() => {
                setOnlyFavorites(true);
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Meus favoritos
            </button>
            <button onClick={() => setPanel("cep")}>Consultar CEP</button>
          </div>
          <div className="footer-message">
            <ShieldCheck size={22} />
            <strong>Uma nova RafaExpress.</strong>
            <p>A mesma essência. Mais possibilidades.</p>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>
            © {new Date().getFullYear()} RafaExpress. Projeto demonstrativo.
          </span>
          <span>
            * Parcelamento ilustrativo. Não realizamos transações financeiras.
          </span>
          <span>Feito para descobrir ↗</span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {(panel || selected) && (
        <div
          className="overlay"
          onClick={() => {
            setPanel(null);
            setSelected(null);
          }}
        >
          <section
            ref={modalRef}
            className={`modal ${panel === "cart" ? "cart-modal" : ""} ${selected ? "detail-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={
              selected?.title ||
              (panel === "cart"
                ? "Sua sacola"
                : panel === "cep"
                  ? "Local de entrega"
                  : "Cartão RafaExpress")
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Fechar"
              onClick={() => {
                setPanel(null);
                setSelected(null);
              }}
            >
              <X />
            </button>
            {panel === "cep" && (
              <>
                <MapPin className="modal-icon" size={32} />
                <h2>Para onde vamos?</h2>
                <p>Informe seu CEP para consultar a cidade de entrega.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void lookup();
                  }}
                >
                  <label className="field">
                    Seu CEP
                    <input
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                      maxLength={9}
                      value={cep}
                      onChange={(e) =>
                        setCep(e.target.value.replace(/[^\d-]/g, ""))
                      }
                    />
                  </label>
                  {cepError && (
                    <p role="alert" className="error">
                      {cepError}
                    </p>
                  )}
                  <button className="primary" disabled={checking}>
                    {checking ? "Consultando…" : "Confirmar localização"}
                  </button>
                </form>
                <small>
                  Consulta de endereço pelo ViaCEP. Não calcula frete ou prazo.
                </small>
              </>
            )}
            {panel === "card" && (
              <>
                <CreditCard className="modal-icon" size={32} />
                <h2>Seu cartão. Sua próxima fase.</h2>
                <p>
                  Preservamos o cartão que faz parte da identidade RafaExpress,
                  com um novo design azul.
                </p>
                <img
                  className="original-card"
                  src={`${import.meta.env.BASE_URL}creditCard.jpeg`}
                  alt="Cartão original RafaExpress"
                />
                <p>
                  Este é um conceito visual do projeto. Não há emissão de
                  cartão, análise de crédito ou contratação de serviços
                  financeiros.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    setPanel(null);
                    explore();
                  }}
                >
                  Descobrir produtos <ArrowRight size={17} />
                </button>
              </>
            )}
            {panel === "cart" && (
              <>
                <span className="eyebrow blue">SUAS BOAS ESCOLHAS</span>
                <h2>
                  Minha sacola <small>({count})</small>
                </h2>
                {!cart.length ? (
                  <div className="empty">
                    <ShoppingBag size={44} />
                    <h3>Sua próxima descoberta vem aí.</h3>
                    <p>
                      Explore o catálogo e adicione seus favoritos à sacola.
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        setPanel(null);
                        explore();
                      }}
                    >
                      Começar a explorar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cart-items">
                      {cart.map(({ product: p, quantity }) => (
                        <div className="cart-item" key={p.id}>
                          <img src={p.thumbnail} alt={p.title} />
                          <div>
                            <strong>{p.title}</strong>
                            <span>{money(p.price)}</span>
                            <div className="quantity">
                              <button
                                aria-label={`Diminuir ${p.title}`}
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.flatMap((i) =>
                                      i.product.id === p.id
                                        ? i.quantity === 1
                                          ? []
                                          : [{ ...i, quantity: i.quantity - 1 }]
                                        : [i],
                                    ),
                                  )
                                }
                              >
                                <Minus size={14} />
                              </button>
                              <span>{quantity}</span>
                              <button
                                disabled={quantity >= p.stock}
                                aria-label={`Aumentar ${p.title}`}
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.map((i) =>
                                      i.product.id === p.id
                                        ? { ...i, quantity: i.quantity + 1 }
                                        : i,
                                    ),
                                  )
                                }
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                className="remove"
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.filter((i) => i.product.id !== p.id),
                                  )
                                }
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="cart-summary">
                      <p>
                        Subtotal <strong>{money(total)}</strong>
                      </p>
                      <p>
                        Entrega <span>Não calculada</span>
                      </p>
                      <h3>
                        Total dos produtos <span>{money(total)}</span>
                      </h3>
                      <button
                        className="primary"
                        onClick={() =>
                          setToast(
                            "Sacola salva! Este projeto não realiza compras ou cobranças.",
                          )
                        }
                      >
                        <Check size={18} /> Salvar minha seleção
                      </button>
                      <small>
                        Experiência demonstrativa. Sem pagamento ou pedido real.
                      </small>
                    </div>
                  </>
                )}
              </>
            )}
            {selected && (
              <>
                <div className="detail-image">
                  <img
                    src={selected.images[0] || selected.thumbnail}
                    alt={selected.title}
                  />
                </div>
                <div>
                  <span className="eyebrow blue">
                    {selected.brand || "SUA PRÓXIMA DESCOBERTA"}
                  </span>
                  <h2>{selected.title}</h2>
                  <span className="rating">
                    ★ {selected.rating.toFixed(1)} · {selected.stock}{" "}
                    disponíveis
                  </span>
                  <p>{selected.description}</p>
                  <strong className="detail-price">
                    {money(selected.price)}
                  </strong>
                  <p>
                    10x de {money(selected.price / 10)} sem juros (ilustrativo)
                  </p>
                  <button className="primary" onClick={() => add(selected)}>
                    <ShoppingBag size={18} /> Adicionar à sacola
                  </button>
                  <button
                    className="load-more"
                    onClick={() => favorite(selected.id)}
                  >
                    <Heart size={17} />
                    {favorites.includes(selected.id)
                      ? "Remover dos favoritos"
                      : "Salvar nos favoritos"}
                  </button>
                  <small>
                    Produto demonstrativo. Não é uma oferta do Mercado Livre.
                  </small>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
