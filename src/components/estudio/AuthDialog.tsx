import { useState } from "react";
import { toast } from "sonner";
import { useEstudio } from "./EstudioContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AuthDialog() {
  const e = useEstudio();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setOcupado(true);
    try {
      if (modo === "entrar") await e.entrar(email.trim(), senha);
      else await e.cadastrar(email.trim(), senha);
      toast.success(modo === "entrar" ? "Sessão aberta." : "Conta criada e sessão aberta.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não deu para autenticar.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialog open={e.pedirLogin} onOpenChange={e.setPedirLogin}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{modo === "entrar" ? "Entrar" : "Criar conta"}</DialogTitle>
          <DialogDescription>Os designs ficam na sua conta — nada é gravado sem sessão.</DialogDescription>
        </DialogHeader>
        <form className="space-y-2" onSubmit={enviar}>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
          <Input
            type="password"
            required
            minLength={6}
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            placeholder="senha"
            value={senha}
            onChange={(ev) => setSenha(ev.target.value)}
          />
          <button
            disabled={ocupado}
            className="h-8 w-full rounded-md bg-primary text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            {ocupado ? "Só um instante…" : modo === "entrar" ? "Entrar" : "Cadastrar e entrar"}
          </button>
        </form>
        <button
          onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}
          className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          {modo === "entrar" ? "Não tenho conta ainda" : "Já tenho conta"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
