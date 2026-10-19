import { z } from "zod";

export function isValidCpf(raw: string) {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(c[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

export const maskCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export const registerSchema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo").max(120),
  cpf: z.string().refine(isValidCpf, "CPF inválido"),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72),
  cep: z.string().refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido"),
  street: z.string().trim().min(2, "Informe a rua").max(150),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().trim().max(100),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(100),
  city: z.string().trim().min(2, "Informe a cidade").max(100),
  state: z.string().trim().length(2, "UF com 2 letras"),
});
