import { useState } from "react";
import { Check, ChevronDown, Pencil, Share2, Download, User, FolderGit2 } from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { projeto, setProjeto, abaAtiva } = useEstudio();
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(projeto);

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
      <div className="flex items-center gap-1.5">
        <span className="grid size-5 place-items-center rounded-[5px] bg-primary text-[10px] font-bold text-primary-foreground">
          E
        </span>
        <span className="text-[13px] font-semibold tracking-tight">Estúdio</span>
      </div>
      <span className="text-border">/</span>
      {editando ? (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            setProjeto(rascunho.trim() || projeto);
            setEditando(false);
          }}
        >
          <Input
            autoFocus
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            className="h-7 w-52 text-[13px]"
          />
          <button type="submit" className="grid size-7 place-items-center rounded-md hover:bg-secondary">
            <Check className="size-3.5" />
          </button>
        </form>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium hover:bg-secondary">
            {projeto}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Trocar de projeto
            </DropdownMenuLabel>
            {["Aurora — produto", "Site institucional", "Cliente Marés"].map((p) => (
              <DropdownMenuItem key={p} onSelect={() => setProjeto(p)}>
                {p}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setRascunho(projeto);
                setEditando(true);
              }}
            >
              <Pencil className="size-3.5" /> Renomear projeto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="flex-1" />

      <button
        onClick={() => setPainelDireito("codigo")}
        className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
      >
        <FolderGit2 className="size-3.5" /> Código
      </button>
      <button
        onClick={onSistema}
        className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
      >
        Design system
      </button>
      <button
        onClick={onCompartilhar}
        className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
      >
        <Share2 className="size-3.5" /> Compartilhar
      </button>
      <button
        onClick={onExportar}
        className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground hover:opacity-90"
      >
        <Download className="size-3.5" /> Exportar
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="ml-1 grid size-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
          <User className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>marina@estudio.app</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Conta e plano</DropdownMenuItem>
          <DropdownMenuItem>Preferências</DropdownMenuItem>
          <DropdownMenuItem>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
