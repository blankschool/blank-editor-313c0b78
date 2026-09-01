import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  Undo2,
  Redo2,
  Eye,
  Lock,
  GripVertical,
  Trash2,
  Image,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { camadas } from "@/lib/estudio-mock";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-3 py-2.5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{rotulo}</span>
      {children}
    </label>
  );
}

const inputCls =
  "h-6 w-24 rounded border border-border bg-card px-1.5 text-[11px] outline-none focus:ring-1 focus:ring-ring";

/* 1f — texto e tipografia */
export function TextPanel() {
  return (
    <>
      <Secao titulo="Edição no lugar">
        <textarea
          defaultValue="Desenhe, converse e publique no mesmo lugar"
          className="h-16 w-full resize-none rounded border border-border bg-card p-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-1">
          {[Bold, Italic, Link2, Undo2, Redo2].map((Icon, i) => (
            <button key={i} className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary">
              <Icon className="size-3" />
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Tipografia">
        <Campo rotulo="Fonte">
          <select className={inputCls}>
            <option>Söhne</option>
            <option>Inter</option>
            <option>Tiempos</option>
          </select>
        </Campo>
        <Campo rotulo="Peso">
          <select className={inputCls}>
            <option>Semibold</option>
            <option>Regular</option>
            <option>Bold</option>
          </select>
        </Campo>
        <Campo rotulo="Tamanho">
          <input className={inputCls} defaultValue="32 px" />
        </Campo>
        <Campo rotulo="Caixa">
          <select className={inputCls}>
            <option>Normal</option>
            <option>MAIÚSCULAS</option>
            <option>minúsculas</option>
          </select>
        </Campo>
        <div className="flex gap-1">
          {[AlignLeft, AlignCenter, AlignRight].map((Icon, i) => (
            <button key={i} className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary">
              <Icon className="size-3" />
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Ritmo">
        <Campo rotulo="Entrelinha">
          <input className={inputCls} defaultValue="1.15" />
        </Campo>
        <Campo rotulo="Entre letras">
          <input className={inputCls} defaultValue="-0.02 em" />
        </Campo>
        <Campo rotulo="Quebra">
          <select className={inputCls}>
            <option>Balanceada</option>
            <option>Automática</option>
            <option>Manual</option>
          </select>
        </Campo>
      </Secao>
    </>
  );
}

/* 1g — cor e preenchimento */
export function ColorPanel() {
  const [alvo, setAlvo] = useState("texto");
  const paleta = [
    "oklch(0.58 0.15 40)",
    "oklch(0.24 0.01 70)",
    "oklch(0.88 0.05 85)",
    "oklch(0.6 0.09 200)",
    "oklch(0.55 0.1 145)",
    "oklch(0.97 0.006 85)",
  ];
  return (
    <>
      <Secao titulo="Alvo">
        <div className="flex gap-1">
          {["texto", "fundo", "borda"].map((a) => (
            <button
              key={a}
              onClick={() => setAlvo(a)}
              className={cn(
                "flex-1 rounded border px-2 py-1 text-[11px] capitalize",
                alvo === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Paleta do projeto">
        <div className="grid grid-cols-6 gap-1.5">
          {paleta.map((c) => (
            <button key={c} className="size-7 rounded border border-border" style={{ background: c }} />
          ))}
        </div>
        <Campo rotulo="Amostra livre">
          <input className={inputCls} defaultValue="#C05621" />
        </Campo>
      </Secao>
      <Secao titulo="Opacidade">
        <Slider defaultValue={[100]} max={100} step={1} />
      </Secao>
      <Secao titulo="Gradiente e imagem">
        <div className="h-10 rounded border border-border bg-[linear-gradient(90deg,oklch(0.58_0.15_40),oklch(0.88_0.05_85))]" />
        <div className="flex gap-1">
          <button className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            <Image className="size-3" /> Trocar imagem
          </button>
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Enquadrar
          </button>
        </div>
      </Secao>
    </>
  );
}

/* 1h — layout e espaçamento */
export function LayoutPanel() {
  const [dir, setDir] = useState("coluna");
  return (
    <>
      <Secao titulo="Direção">
        <div className="grid grid-cols-4 gap-1">
          {["linha", "coluna", "grade", "livre"].map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className={cn(
                "rounded border px-1 py-1 text-[10px] capitalize",
                dir === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Alinhamento">
        <div className="flex items-center gap-3">
          <div className="grid size-16 grid-cols-3 grid-rows-3 gap-0.5 rounded border border-border bg-card p-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <button key={i} className="rounded-[2px] bg-muted hover:bg-accent" />
            ))}
          </div>
          <div className="flex-1">
            <Campo rotulo="Gap">
              <input className={inputCls} defaultValue="12 px" />
            </Campo>
          </div>
        </div>
      </Secao>
      <Secao titulo="Espaço e tamanho">
        <Campo rotulo="Margem">
          <input className={inputCls} defaultValue="0 · 0 · 24 · 0" />
        </Campo>
        <Campo rotulo="Padding">
          <input className={inputCls} defaultValue="32 px" />
        </Campo>
        <Campo rotulo="Largura">
          <select className={inputCls}>
            <option>Automática</option>
            <option>Fixa</option>
            <option>100%</option>
          </select>
        </Campo>
      </Secao>
      <Secao titulo="Aparência">
        <Campo rotulo="Borda">
          <input className={inputCls} defaultValue="1 px" />
        </Campo>
        <Campo rotulo="Raio">
          <input className={inputCls} defaultValue="8 px" />
        </Campo>
        <Campo rotulo="Sombra">
          <select className={inputCls}>
            <option>Suave</option>
            <option>Nenhuma</option>
            <option>Elevada</option>
          </select>
        </Campo>
      </Secao>
      <Secao titulo="Camada">
        <div className="flex gap-1">
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Trazer à frente
          </button>
          <button className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            Enviar para trás
          </button>
        </div>
      </Secao>
    </>
  );
}

/* 1i — estrutura e camadas */
export function LayersPanel() {
  const e = useEstudio();
  return (
    <>
      <Secao titulo="Árvore de camadas">
        <div className="space-y-0.5">
          {camadas.map((c) => (
            <div key={c.id}>
              <LinhaCamada nome={c.nome} tipo={c.tipo} onSelect={() => e.setSelecionado(c.nome)} />
              {c.filhos?.map((f) => (
                <div key={f.id} className="pl-4">
                  <LinhaCamada nome={f.nome} tipo={f.tipo} onSelect={() => e.setSelecionado(`${c.nome} › ${f.nome}`)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Secao>
      <Secao titulo="Reordenar">
        <div className="rounded border border-dashed border-border p-2 text-center text-[11px] text-muted-foreground">
          Solte aqui para duplicar o item ou inserir um novo bloco
        </div>
        <button className="flex h-6 w-full items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
          <Plus className="size-3" /> Inserir bloco
        </button>
      </Secao>
      <Secao titulo="Ações">
        <div className="flex gap-1">
          <button className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary">
            <Undo2 className="size-3" />
          </button>
          <button className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary">
            <Redo2 className="size-3" />
          </button>
          <button className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary">
            <Image className="size-3" />
          </button>
          <button className="grid h-6 flex-1 place-items-center rounded border border-border bg-card text-destructive hover:bg-secondary">
            <Trash2 className="size-3" />
          </button>
        </div>
      </Secao>
    </>
  );
}

function LinhaCamada({ nome, tipo, onSelect }: { nome: string; tipo: string; onSelect: () => void }) {
  return (
    <div className="group flex items-center gap-1 rounded px-1 py-0.5 text-[11px] hover:bg-secondary">
      <GripVertical className="size-3 cursor-grab text-muted-foreground" />
      <button onClick={onSelect} className="flex-1 truncate text-left">
        {nome}
      </button>
      <span className="text-[9px] text-muted-foreground">{tipo}</span>
      <button className="opacity-0 group-hover:opacity-100">
        <Eye className="size-3 text-muted-foreground" />
      </button>
      <button className="opacity-0 group-hover:opacity-100">
        <Lock className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}

/* 1j — painel de ajustes (props) */
export function PropsPanel() {
  const [variante, setVariante] = useState("Calmo");
  return (
    <>
      <Secao titulo="Conteúdo exposto">
        <Campo rotulo="Título">
          <input className={inputCls} defaultValue="Desenhe e publique" />
        </Campo>
        <Campo rotulo="CTA">
          <input className={inputCls} defaultValue="Começar" />
        </Campo>
        <Campo rotulo="Nº de logos">
          <input className={inputCls} defaultValue="4" />
        </Campo>
      </Secao>
      <Secao titulo="Comportamento">
        <Campo rotulo="Mostrar prova social">
          <Switch defaultChecked />
        </Campo>
        <Campo rotulo="Herói em tela cheia">
          <Switch />
        </Campo>
        <div>
          <p className="mb-1 text-[11px] text-muted-foreground">Densidade · 56%</p>
          <Slider defaultValue={[56]} max={100} step={1} />
        </div>
      </Secao>
      <Secao titulo="Variantes">
        <div className="flex rounded border border-border bg-card p-0.5">
          {["Calmo", "Produto", "Ousado"].map((v) => (
            <button
              key={v}
              onClick={() => setVariante(v)}
              className={cn(
                "flex-1 rounded-[3px] py-1 text-[11px]",
                variante === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {["Aurora", "Editorial", "Neutro"].map((p) => (
            <button key={p} className="rounded border border-border bg-card py-1 text-[10px] hover:bg-secondary">
              {p}
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Aplicar">
        <div className="flex gap-1">
          <button className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary">
            <RotateCcw className="size-3" /> Restaurar padrão
          </button>
          <button className="h-6 flex-1 rounded bg-primary text-[11px] text-primary-foreground">Aplicar a tudo</button>
        </div>
      </Secao>
    </>
  );
}
