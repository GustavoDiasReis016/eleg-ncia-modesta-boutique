import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

export function useLiveProducts(includeInactive = false) {
  const qc = useQueryClient();
  const key = ["products", includeInactive];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      let req = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!includeInactive) req = req.eq("active", true);
      const { data, error } = await req;
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel(`products-${includeInactive}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () =>
        qc.invalidateQueries({ queryKey: ["products"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc, includeInactive]);
  return q;
}

export const CATEGORIES = ["Vestidos", "Conjuntos", "Saias", "Blusas", "Acessórios"];
