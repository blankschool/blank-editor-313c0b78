import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  FilePlus2,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";
import { useEstudio } from "./EstudioContext";
import { TopBar } from "./TopBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DesignItem } from "@/lib/estudio-mock";

/* ---------- entrada (sem sessão) ---------- */

function HomeAuth() {
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
    <main className="grid min-h-screen place-items-center bg-canvas px-6 py-16 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <h1 className="text-[15px] font-semibold tracking-tight">Estúdio</h1>
        </div>

        <h2 className="text-2xl font-semibold leading-tight tracking-tight">
          Seu material de campanha, editável de verdade.
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Abra um template, troque textos e fotos no palco e exporte em PNG. Entre para começar —
          os designs ficam na sua conta.
        </p>

        <form className="mt-7 space-y-2" onSubmit={enviar}>
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
            className="h-9 w-full rounded-md bg-primary text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            {ocupado ? "Só um instante…" : modo === "entrar" ? "Entrar" : "Cadastrar e entrar"}
          </button>
        </form>

        <button
          onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}
          className="mt-3 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
        >
          {modo === "entrar" ? "Não tenho conta ainda" : "Já tenho conta"}
        </button>
      </div>
    </main>
  );
}

/* ---------- painel do projeto (com sessão) ---------- */

function CartaoDesign({ d, onFavoritar }: { d: DesignItem; onFavoritar: (id: string) => void }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-[var(--shadow-panel)]">
      <Link to="/d/$designId" params={{ designId: d.id }} className="block">
        <div className="h-32 w-full" style={{ background: d.tom }} />
        <div className="p-3">
          <p className="truncate text-[12px] font-medium">{d.nome}</p>
          <p className="text-[11px] text-muted-foreground">
            {d.tipo} · {d.atualizado}
          </p>
        </div>
      </Link>
      <button
        title={d.favorito ? "Remover dos favoritos" : "Favoritar"}
        onClick={() => onFavoritar(d.id)}
        className={cn(
          "absolute right-2 top-2 grid size-7 place-items-center rounded-md border border-border bg-card/85 backdrop-blur transition-opacity",
          d.favorito ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {d.favorito ? (
          <Star className="size-3.5 fill-current text-[hsl(var(--accent))]" />
        ) : (
          <StarOff className="size-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function CartaoInicio({
  titulo,
  descricao,
  icone,
  onClick,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-[var(--shadow-panel)]"
    >
      <span className="grid size-8 place-items-center rounded-lg bg-secondary text-foreground">
        {icone}
      </span>
      <span className="text-[12px] font-semibold">{titulo}</span>
      <span className="text-[11px] leading-snug text-muted-foreground">{descricao}</span>
    </button>
  );
}

function Grade({
  designs,
  onFavoritar,
}: {
  designs: DesignItem[];
  onFavoritar: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {designs.map((d) => (
        <CartaoDesign key={d.id} d={d} onFavoritar={onFavoritar} />
      ))}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h3>
  );
}

function PainelProjeto() {
  const e = useEstudio();
  const termo = e.busca.trim().toLowerCase();
  const filtrados = termo
    ? e.designs.filter((d) => d.nome.toLowerCase().includes(termo))
    : e.designs;
  const favoritos = filtrados.filter((d) => d.favorito);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <ScrollArea className="min-h-0 flex-1 bg-canvas">
        <div className="mx-auto w-full max-w-5xl px-8 py-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{e.projeto}</h1>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {e.designs.length} {e.designs.length === 1 ? "design" : "designs"} no projeto.
              </p>
            </div>
            <button
              onClick={() => e.novoDesign()}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[12px] font-semibold text-primary-foreground"
            >
              <Plus className="size-3.5" /> Novo design
            </button>
          </div>

          <section className="mb-10">
            <Titulo>Começar</Titulo>
            <div className="flex flex-wrap gap-3">
              <CartaoInicio
                titulo="Canvas em branco"
                descricao="Página 1080×1440 vazia para montar do zero."
                icone={<FilePlus2 className="size-4" />}
                onClick={() => e.novoDesign("branco")}
              />
              {e.catalogoTemplates.map((t) => (
                <CartaoInicio
                  key={t.slug}
                  titulo={t.nome}
                  descricao="Template pronto — troque textos e fotos."
                  icone={<LayoutTemplate className="size-4" />}
                  onClick={() => e.novoDesign(t.slug)}
                />
              ))}
            </div>
          </section>

          {e.designs.length > 0 && (
            <div className="mb-6 flex items-center gap-2 rounded-md border border-border bg-card px-2.5">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                value={e.busca}
                onChange={(ev) => e.setBusca(ev.target.value)}
                placeholder="Buscar nos designs…"
                aria-label="Buscar nos designs"
                className="h-9 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
              />
            </div>
          )}

          {favoritos.length > 0 && (
            <section className="mb-10">
              <Titulo>Favoritos</Titulo>
              <Grade designs={favoritos} onFavoritar={e.favoritar} />
            </section>
          )}

          <section>
            <Titulo>Recentes</Titulo>
            {filtrados.length ? (
              <Grade designs={filtrados} onFavoritar={e.favoritar} />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <p className="text-[13px] font-medium">
                  {e.designs.length ? "Nada com esse nome." : "Nenhum design ainda."}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {e.designs.length
                    ? "Tente outro termo de busca."
                    : "Escolha um dos cartões acima para criar o primeiro."}
                </p>
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </main>
  );
}

export function HomePanel() {
  const e = useEstudio();
  if (e.carregandoSessao)
    return (
      <main className="grid min-h-screen place-items-center bg-canvas">
        <div className="w-full max-w-sm space-y-3 px-6">
          <div className="h-7 w-40 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-full animate-pulse rounded bg-secondary" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
        </div>
      </main>
    );
  return e.temSessao ? <PainelProjeto /> : <HomeAuth />;
}
