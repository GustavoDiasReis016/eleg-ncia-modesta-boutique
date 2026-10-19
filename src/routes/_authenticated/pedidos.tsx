import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/cart";
import { OrderItems, StatusBadge } from "@/components/OrderBits";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — Kamandica Preciosa" },
      { name: "description", content: "Acompanhe seus pedidos." },
      { property: "og:title", content: "Meus pedidos — Kamandica Preciosa" },
      { property: "og:description", content: "Acompanhe seus pedidos." },
    ],
  }),
  component: MyOrders,
});

function MyOrders() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-4xl">Meus pedidos</h1>
      {isLoading ? <p>Carregando…</p> : !data?.length ? <p className="text-muted-foreground">Você ainda não fez pedidos.</p> : (
        <div className="space-y-4">
          {data.map((o) => (
            <div key={o.id} className="rounded-2xl bg-card p-5 shadow-elegant">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</span>
                <StatusBadge status={o.status} />
              </div>
              <OrderItems items={o.items} />
              <p className="mt-3 text-right font-semibold text-primary">Total: {brl(Number(o.total))}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
