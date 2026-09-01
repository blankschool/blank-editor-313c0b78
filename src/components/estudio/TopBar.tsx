import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  Pencil,
  Share2,
  Download,
  User,
  FolderGit2,
  Library,
  MoreHorizontal,
  Undo2,
  Redo2,
} from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { AuthDialog } from "./AuthDialog";
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
  const {
    projeto,
    setProjeto,
    abaAtiva,
    temSessao,
    usuarioEmail,
    sair,
    setPedirLogin,
    desfazer,
    refazer,
    podeDesfazer,
    podeRefazer,
  } = useEstudio();
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(projeto);
  const [extras, setExtras] = useState(false);


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
              Projeto
            </DropdownMenuLabel>
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

      {abaAtiva && (
        <div className="mr-1 flex items-center gap-0.5">
          <button
            title="Desfazer (Cmd/Ctrl+Z)"
            disabled={!podeDesfazer}
            onClick={desfazer}
            className="grid size-7 place-items-center rounded-md hover:bg-secondary disabled:opacity-35"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            title="Refazer (Cmd/Ctrl+Shift+Z)"
            disabled={!podeRefazer}
            onClick={refazer}
            className="grid size-7 place-items-center rounded-md hover:bg-secondary disabled:opacity-35"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>
      )}

      {extras && (
        <>
          <Link
            to="/biblioteca"
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
          >
            <Library className="size-3.5" /> Biblioteca
          </Link>
          {abaAtiva && (
            <Link
              to="/d/$designId/$painel"
              params={{ designId: abaAtiva, painel: "codigo" }}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
            >
              <FolderGit2 className="size-3.5" /> Código
            </Link>
          )}
          <Link
            to="/design-system"
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
          >
            Design system
          </Link>
          {abaAtiva && (
            <Link
              to="/d/$designId/compartilhar"
              params={{ designId: abaAtiva }}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
            >
              <Share2 className="size-3.5" /> Compartilhar
            </Link>
          )}
        </>
      )}
      <button
        onClick={() => setExtras((v) => !v)}
        title="Mais ações"
        className="grid size-7 place-items-center rounded-md border border-border bg-card hover:bg-secondary"
      >
        <MoreHorizontal className="size-3.5" />
      </button>
      {abaAtiva && (
        <Link
          to="/d/$designId/exportar"
          params={{ designId: abaAtiva }}
          className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground hover:opacity-90"
        >
          <Download className="size-3.5" /> Exportar
        </Link>
      )}
      {temSessao ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 grid size-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
            <User className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{usuarioEmail}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void sair()}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          onClick={() => setPedirLogin(true)}
          className="ml-1 flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[12px] font-medium hover:bg-secondary"
        >
          <User className="size-3.5" /> Entrar
        </button>
      )}
      <AuthDialog />
    </header>
  );
}

