import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import hero from "@/assets/hero.jpg";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, useLiveProducts } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kamandica Preciosa — Vestidos e Moda Evangélica" },
      { name: "description", content: "Vestidos, conjuntos e moda evangélica com elegância. Compre online." },
      { property: "og:title", content: "Kamandica Preciosa — Moda Evangélica" },
      { property: "og:description", content: "Vestidos, conjuntos e moda evangélica com elegância." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products, isLoading } = useLiveProducts();
  const [cat, setCat] = useState<string>("Todos");
  const list = (products ?? []).filter((p) => cat === "Todos" || p.category === cat);

  return (
    <div>
      <section className="bg-hero text-plum-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-blush">Moda evangélica</p>
            <h1 className="text-5xl leading-[1.05] md:text-7xl">
              Elegância que <em className="text-gradient-blush">reflete</em> quem você é
            </h1>
            <p className="max-w-md text-lg font-light text-plum-foreground/80">
              Vestidos e conjuntos pensados para a mulher preciosa — com delicadeza, conforto e modéstia.
            </p>
            <a
              href="#colecao"
              className="inline-block rounded-full bg-blush px-8 py-3 font-semibold text-plum transition hover:opacity-90"
            >
              Ver coleção
            </a>
          </div>
          <img
            src={hero}
            alt="Modelo com vestido longo floral"
            width={1280}
            height={1600}
            className="mx-auto max-h-[560px] w-auto rounded-[2rem] object-cover shadow-elegant"
          />
        </div>
      </section>

      <section id="colecao" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-4xl md:text-5xl">Nossa coleção</h2>
          <p className="mt-2 text-muted-foreground">Novidades aparecem aqui assim que chegam na loja.</p>
        </div>
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {["Todos", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-5 py-2 text-sm transition ${
                cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {isLoading ? (
          <p className="text-center text-muted-foreground">Carregando…</p>
        ) : list.length === 0 ? (
          <p className="rounded-2xl bg-secondary p-10 text-center text-muted-foreground">
            Em breve novas peças por aqui.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
