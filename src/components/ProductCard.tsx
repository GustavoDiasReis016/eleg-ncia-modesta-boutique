import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { brl, useCart } from "@/lib/cart";
import type { Product } from "@/lib/products";

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const [size, setSize] = useState<string>(p.sizes[0] ?? "Único");

  return (
    <article className="group overflow-hidden rounded-2xl bg-card shadow-elegant">
      <div className="aspect-[4/5] overflow-hidden bg-secondary">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-primary/40">K</div>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.category}</p>
          <h3 className="text-2xl leading-tight">{p.name}</h3>
          {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
        </div>
        <p className="text-xl font-semibold text-primary">{brl(Number(p.price))}</p>
        {p.sizes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`min-w-10 rounded-full border px-3 py-1 text-sm transition ${
                  size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <Button
          className="w-full rounded-full"
          onClick={() => {
            add({ productId: p.id, name: p.name, price: Number(p.price), size, quantity: 1, image_url: p.image_url });
            toast.success(`${p.name} (${size}) adicionado ao carrinho`);
          }}
        >
          Adicionar ao carrinho
        </Button>
      </div>
    </article>
  );
}
