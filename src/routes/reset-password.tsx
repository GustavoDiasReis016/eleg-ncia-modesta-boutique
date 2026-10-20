import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Kamandica Preciosa" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha — Kamandica Preciosa" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form
        className="space-y-4 rounded-2xl bg-card p-8 shadow-elegant"
        onSubmit={async (e) => {
          e.preventDefault();
          if (password.length < 6) return void toast.error("A senha precisa ter pelo menos 6 caracteres");
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password });
          setBusy(false);
          if (error) return void toast.error(error.message);
          toast.success("Senha alterada!");
          navigate({ to: "/" });
        }}
      >
        <h1 className="text-3xl">Nova senha</h1>
        <div className="space-y-1">
          <Label>Nova senha</Label>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full rounded-full" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</Button>
      </form>
    </div>
  );
}
