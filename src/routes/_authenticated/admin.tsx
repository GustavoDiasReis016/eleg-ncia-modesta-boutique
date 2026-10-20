import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/cart";
import { CATEGORIES, useLiveProducts } from "@/lib/products";
import { OrderItems, STATUSES, StatusBadge } from "@/components/OrderBits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel admin — Kamandica Preciosa" },
      { name: "description", content: "Gerencie produtos e pedidos." },
      { property: "og:title", content: "Painel admin — Kamandica Preciosa" },
      { property: "og:description", content: "Gerencie produtos e pedidos." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<"pedidos" | "produtos">("pedidos");
  if (loading) return <p className="p-10 text-center">Carregando…</p>;
  if (!isAdmin) return <p className="p-10 text-center">Acesso restrito ao dono da loja.</p>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-4xl">Painel da loja</h1>
      <div className="mb-8 flex gap-2">
        {(["pedidos", "produtos"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} className="rounded-full capitalize" onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>
      {tab === "pedidos" ? <Orders /> : <Products />}
    </div>
  );
}

function Orders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase.channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => qc.invalidateQueries({ queryKey: ["admin-orders"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  if (!data?.length) return <p className="text-muted-foreground">Nenhum pedido ainda.</p>;
  return (
    <div className="space-y-4">
      {data.map((o) => (
        <div key={o.id} className="rounded-2xl bg-card p-5 shadow-elegant">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="text-sm">
              <p className="font-display text-xl">{o.customer_name}</p>
              <p>CPF: {o.customer_cpf} · Tel: {o.customer_phone} · {o.customer_email}</p>
              <p className="mt-1"><b>Endereço:</b> {o.address}</p>
              <p className="text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={o.status} />
              <select
                className="rounded-md border bg-background px-2 py-1 text-sm"
                value={o.status}
                onChange={async (e) => {
                  const { error } = await supabase.from("orders").update({ status: e.target.value }).eq("id", o.id);
                  if (error) toast.error(error.message);
                }}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3"><OrderItems items={o.items} /></div>
          <p className="mt-2 text-right font-semibold text-primary">Total: {brl(Number(o.total))}</p>
        </div>
      ))}
    </div>
  );
}

function Products() {
  const { data } = useLiveProducts(true);
  const [f, setF] = useState({ name: "", description: "", category: "Vestidos", price: "", sizes: "P, M, G" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent): Promise<unknown> => {
    e.preventDefault();
    const price = Number(f.price.replace(",", "."));
    if (!f.name.trim() || !(price >= 0)) return toast.error("Preencha nome e preço");
    setBusy(true);
    let image_url: string | null = null;
    if (file) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
      const up = await supabase.storage.from("products").upload(path, file);
      if (up.error) { setBusy(false); return toast.error(up.error.message); }
      const s = await supabase.storage.from("products").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      image_url = s.data?.signedUrl ?? null;
    }
    const { error } = await supabase.from("products").insert({
      name: f.name.trim(), description: f.description.trim(), category: f.category, price,
      sizes: f.sizes.split(",").map((s) => s.trim()).filter(Boolean), image_url,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Produto publicado na loja!");
    setF({ ...f, name: "", description: "", price: "" });
    setFile(null);
  };

  return (
    <div className="grid gap-8 md:grid-cols-[360px_1fr]">
      <form onSubmit={save} className="h-fit space-y-3 rounded-2xl bg-card p-6 shadow-elegant">
        <p className="font-display text-2xl">Novo produto</p>
        <div><Label>Nome</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><Label>Categoria</Label>
          <select className="w-full rounded-md border bg-background px-3 py-2" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>Preço (R$)</Label><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
        <div><Label>Tamanhos (separados por vírgula)</Label><Input value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} /></div>
        <div><Label>Foto</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
        <Button className="w-full rounded-full" disabled={busy}>{busy ? "Salvando…" : "Publicar"}</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-elegant">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-display text-lg">{p.name}</p>
              <p className="text-primary">{brl(Number(p.price))}</p>
              <p className="text-muted-foreground">{p.sizes.join(", ")}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => supabase.from("products").update({ active: !p.active }).eq("id", p.id)}>
                  {p.active ? "Ocultar" : "Mostrar"}
                </Button>
                <Button size="sm" variant="destructive" onClick={async () => {
                  if (confirm("Excluir produto?")) await supabase.from("products").delete().eq("id", p.id);
                }}>Excluir</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
