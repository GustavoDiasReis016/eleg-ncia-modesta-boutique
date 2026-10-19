import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Kamandica Preciosa" },
      { name: "description", content: "Revise suas peças e finalize seu pedido." },
      { property: "og:title", content: "Carrinho — Kamandica Preciosa" },
      { property: "og:description", content: "Revise suas peças e finalize seu pedido." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    if (!user) return navigate({ to: "/auth" });
    setBusy(true);
    const { data: p, error: pe } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (pe || !p) {
      setBusy(false);
      return toast.error("Não foi possível carregar seu cadastro.");
    }
    const address = `${p.street}, ${p.number}${p.complement ? " - " + p.complement : ""} — ${p.neighborhood}, ${p.city}/${p.state} — CEP ${p.cep}`;
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: p.full_name,
      customer_cpf: p.cpf,
      customer_phone: p.phone,
      customer_email: user.email ?? "",
      address,
      items: items as unknown as Json,
      total,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    clear();
    toast.success("Pedido enviado! A loja entrará em contato para o pagamento via PIX.");
    navigate({ to: "/pedidos" });
  };

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-4xl">Seu carrinho está vazio</h1>
        <Link to="/" className="mt-6 inline-block text-primary underline">Ver coleção</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="text-4xl">Carrinho</h1>
        {items.map((i) => (
          <div key={i.productId + i.size} className="flex gap-4 rounded-2xl bg-card p-4 shadow-elegant">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-display text-xl">{i.name}</p>
              <p className="text-sm text-muted-foreground">Tamanho: {i.size}</p>
              <p className="font-semibold text-primary">{brl(i.price)}</p>
              <div className="mt-2 flex items-center gap-2">
                <button className="rounded-full border p-1" onClick={() => setQty(i.productId, i.size, i.quantity - 1)} aria-label="Menos"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center">{i.quantity}</span>
                <button className="rounded-full border p-1" onClick={() => setQty(i.productId, i.size, i.quantity + 1)} aria-label="Mais"><Plus className="h-3 w-3" /></button>
              </div>
            </div>
            <button onClick={() => remove(i.productId, i.size)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Remover">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <aside className="h-fit space-y-4 rounded-2xl bg-plum p-6 text-plum-foreground shadow-elegant">
        <p className="font-display text-2xl">Resumo</p>
        <div className="flex justify-between text-lg"><span>Total</span><b>{brl(total)}</b></div>
        <p className="text-sm text-plum-foreground/80">
          O pedido será enviado para o endereço do seu cadastro. Após o pedido, a loja entra em contato para o pagamento via PIX.
        </p>
        <Button variant="secondary" className="w-full rounded-full" disabled={busy} onClick={checkout}>
          {user ? (busy ? "Enviando…" : "Finalizar pedido") : "Entrar para finalizar"}
        </Button>
      </aside>
    </div>
  );
}
