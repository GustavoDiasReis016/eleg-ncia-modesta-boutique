import type { Json } from "@/integrations/supabase/types";
import { brl } from "@/lib/cart";

type Item = { name: string; size: string; quantity: number; price: number };

export const STATUSES = ["pendente", "pago", "enviado", "entregue", "cancelado"];

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "cancelado" ? "bg-destructive/15 text-destructive"
    : status === "pendente" ? "bg-accent text-accent-foreground"
    : "bg-primary text-primary-foreground";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{status}</span>;
}

export function OrderItems({ items }: { items: Json }) {
  const list = (Array.isArray(items) ? items : []) as unknown as Item[];
  return (
    <ul className="divide-y text-sm">
      {list.map((i, idx) => (
        <li key={idx} className="flex justify-between py-2">
          <span>{i.quantity}× {i.name} <span className="text-muted-foreground">(Tam. {i.size})</span></span>
          <span>{brl(Number(i.price) * i.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}
