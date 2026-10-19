import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, User, LogOut, LayoutDashboard, Package } from "lucide-react";
import logo from "@/assets/logo.jpg.asset.json";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-plum text-plum-foreground shadow-elegant">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="Logo da loja" className="h-14 w-14 rounded-full object-cover" />
          <span className="hidden font-display text-2xl tracking-wide sm:block">
            Kamandica <span className="text-gradient-blush">Preciosa</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-plum-foreground/10">
              <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Painel</span>
            </Link>
          )}
          {user ? (
            <>
              <Link to="/pedidos" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-plum-foreground/10">
                <Package className="h-4 w-4" /> <span className="hidden sm:inline">Meus pedidos</span>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/", replace: true });
                }}
                className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-plum-foreground/10"
              >
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            <Link to="/auth" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-plum-foreground/10">
              <User className="h-4 w-4" /> <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
          <Link to="/carrinho" className="relative rounded-full p-2 hover:bg-plum-foreground/10" aria-label="Carrinho">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blush text-xs font-semibold text-plum">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
