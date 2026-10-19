import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentProps } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCep, maskCpf, registerSchema } from "@/lib/validation";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Kamandica Preciosa" },
      { name: "description", content: "Acesse sua conta ou cadastre-se para comprar." },
      { property: "og:title", content: "Entrar — Kamandica Preciosa" },
      { property: "og:description", content: "Acesse sua conta ou cadastre-se para comprar." },
    ],
  }),
  component: AuthPage,
});

const empty = {
  full_name: "", cpf: "", email: "", phone: "", password: "",
  cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
};

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex rounded-full bg-secondary p-1">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              mode === m ? "bg-primary text-primary-foreground" : "text-secondary-foreground"
            }`}
          >
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>
      <div className="rounded-2xl bg-card p-8 shadow-elegant">{mode === "login" ? <Login /> : <Register />}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        setBusy(false);
        if (error) toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
        else toast.success("Bem-vinda!");
      }}
    >
      <h1 className="text-3xl">Bem-vinda de volta</h1>
      <div className="space-y-1">
        <Label>E-mail</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Senha</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button className="w-full rounded-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
    </form>
  );
}

function Register() {
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof empty, v: string) => setF((p) => ({ ...p, [k]: v }));

  const lookupCep = async (cep: string) => {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`).then((x) => x.json());
      if (!r.erro)
        setF((p) => ({ ...p, street: r.logradouro || p.street, neighborhood: r.bairro || p.neighborhood, city: r.localidade || p.city, state: r.uf || p.state }));
    } catch {}
  };

  if (done)
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-3xl">Quase lá!</h1>
        <p className="text-muted-foreground">Enviamos um link de confirmação para <b>{f.email}</b>. Confirme seu e-mail para entrar.</p>
      </div>
    );

  const field = (k: keyof typeof empty, label: string, props: ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={f[k]} onChange={(e) => set(k, e.target.value)} {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = registerSchema.safeParse(f);
        if (!parsed.success) {
          const errs: Record<string, string> = {};
          parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
          setErrors(errs);
          return;
        }
        setErrors({});
        setBusy(true);
        const { password, email, ...meta } = parsed.data;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { ...meta, state: meta.state.toUpperCase() } },
        });
        setBusy(false);
        if (error) toast.error(error.message);
        else setDone(true);
      }}
    >
      <h1 className="text-3xl">Crie sua conta</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{field("full_name", "Nome completo")}</div>
        {field("cpf", "CPF", { value: f.cpf, onChange: (e) => set("cpf", maskCpf(e.target.value)), placeholder: "000.000.000-00" })}
        {field("phone", "Telefone / WhatsApp", { placeholder: "(00) 00000-0000" })}
        {field("email", "E-mail", { type: "email" })}
        {field("password", "Senha", { type: "password" })}
      </div>
      <p className="pt-2 font-display text-xl">Endereço</p>
      <div className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          {field("cep", "CEP", { onChange: (e) => { const v = maskCep(e.target.value); set("cep", v); lookupCep(v); }, placeholder: "00000-000" })}
        </div>
        <div className="sm:col-span-4">{field("street", "Rua")}</div>
        <div className="sm:col-span-2">{field("number", "Número")}</div>
        <div className="sm:col-span-4">{field("complement", "Complemento")}</div>
        <div className="sm:col-span-3">{field("neighborhood", "Bairro")}</div>
        <div className="sm:col-span-2">{field("city", "Cidade")}</div>
        <div className="sm:col-span-1">{field("state", "UF", { maxLength: 2 })}</div>
      </div>
      <Button className="w-full rounded-full" disabled={busy}>{busy ? "Criando…" : "Criar conta"}</Button>
    </form>
  );
}
