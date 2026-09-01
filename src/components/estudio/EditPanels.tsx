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
  EyeOff,
  Lock,
  LockOpen,
  GripVertical,
  Trash2,
  Image,
  Plus,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Type,
  Square,
  Underline,
  Strikethrough,
} from "lucide-react";
import { useEstudio } from "./EstudioContext";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  acharCamadaCanvas,
  aplicarVariante,
  camadasDoDoc,
  adicionarCamadaCanvas,
  camadasDaPaginaCanvas,
  comCamadaCanvas,
  novaCamadaForma,
  novaCamadaImagem,
  novaCamadaTexto,
  removerCamadaCanvas,
  moverCamadaCanvas,
  camadaParaPng,
  baixarArquivo,
  comEstilo,
  paletaPorSistema,
  paletaProjeto,
  rotuloEl,
  textoDaCamadaCanvas,
  type CanvasCamada,
  type CanvasCamadaForma,
  type CanvasCamadaImagem,
  type CanvasCamadaTexto,
  type CanvasSombra,
  type ElId,
  type Variante,
} from "@/lib/estudio-doc";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { enviarImagemCanvas } from "@/lib/estudio-db";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
        {acao}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Campo({ rotulo, sujo, children }: { rotulo: string; sujo?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px]">
      <span className="flex items-center gap-1 text-muted-foreground">
        {sujo && <span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" title="Diferente do salvo" />}
        {rotulo}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "h-6 w-24 rounded border border-border bg-card px-1.5 text-[11px] outline-none focus:ring-1 focus:ring-ring";


function useAlvo(): ElId {
  const e = useEstudio();
  return e.selecionado ?? "titulo";
}

/* texto e tipografia */
export function TextPanel() {
  const e = useEstudio();
  if (e.docCanvas) return <TextPanelCanvas />;
  if (e.docHtml)
    return (
      <Secao titulo="Texto">
        <p className="text-[11px] text-muted-foreground">Preview em HTML, somente leitura.</p>
      </Secao>
    );
  return <TextPanelFluxo />;
}

function TextPanelCanvas() {
  const e = useEstudio();
  const achado = acharCamadaCanvas(e.docCanvas, e.paginaCanvas, e.camadaCanvas);

  if (!achado)
    return (
      <Secao titulo="Texto">
        <p className="text-[11px] text-muted-foreground">Selecione uma camada de texto no palco ou em Camadas.</p>
      </Secao>
    );

  const { camada } = achado;
  const nome = camada.nome ?? camada.tipo;

  if (camada.tipo === "imagem")
    return (
      <Secao titulo={`Imagem · ${nome}`}>
        <p className="text-[11px] text-muted-foreground">Camada de imagem — sem texto.</p>
        <input readOnly value={camada.src} className="h-6 w-full rounded border border-border bg-secondary px-1.5 text-[11px] text-muted-foreground" />
      </Secao>
    );

  if (camada.tipo === "forma")
    return (
      <Secao titulo={`Forma · ${nome}`}>
        <p className="text-[11px] text-muted-foreground">Camada de forma — sem texto. Use o painel Cor.</p>
      </Secao>
    );

  const id = e.camadaCanvas!;
  const patch = (fn: (c: CanvasCamadaTexto) => void, rotulo: string) =>
    e.atualizarDocCanvas(
      (d) => comCamadaCanvas(d, e.paginaCanvas, id, (c) => fn(c as CanvasCamadaTexto)),
      rotulo,
    );

  return (
    <>
      <Secao titulo={`Texto · ${nome}`}>
        <textarea
          value={textoDaCamadaCanvas(camada)}
          onChange={(ev) => {
            const v = ev.target.value;
            patch((c) => {
              c.texto = v;
              delete c.partes;
            }, "");
          }}
          className="h-24 w-full resize-none rounded border border-border bg-card p-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-1">
          {(
            [
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ] as const
          ).map(([a, Icon]) => (
            <button
              key={a}
              onClick={() => patch((c) => void (c.alinhamento = a), "Alinhou o texto")}
              className={cn(
                "grid size-6 place-items-center rounded border border-border hover:bg-secondary",
                camada.alinhamento === a ? "bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              <Icon className="size-3" />
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Tipografia">
        <Campo rotulo="Fonte">
          <input
            className={inputCls}
            value={camada.fonte ?? ""}
            placeholder="herdada"
            onChange={(ev) => {
              const v = ev.target.value;
              patch((c) => {
                if (v) c.fonte = v;
                else delete c.fonte;
              }, "");
            }}
          />
        </Campo>
        <Campo rotulo="Peso">
          <input
            type="number"
            step={100}
            min={100}
            max={900}
            className={inputCls}
            value={camada.peso ?? 400}
            onChange={(ev) => patch((c) => void (c.peso = Number(ev.target.value)), "")}
          />
        </Campo>
        <Campo rotulo="Tamanho">
          <input
            type="number"
            className={inputCls}
            value={camada.tamanho ?? 16}
            onChange={(ev) => patch((c) => void (c.tamanho = Number(ev.target.value)), "")}
          />
        </Campo>
        <Campo rotulo="Entrelinha (px)">
          <input
            type="number"
            className={inputCls}
            value={camada.entrelinha ?? camada.tamanho ?? 16}
            onChange={(ev) => patch((c) => void (c.entrelinha = Number(ev.target.value)), "")}
          />
        </Campo>
        <Campo rotulo="Entre letras (px)">
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={camada.entreLetras ?? 0}
            onChange={(ev) => patch((c) => void (c.entreLetras = Number(ev.target.value)), "")}
          />
        </Campo>
      </Secao>
    </>
  );
}

function TextPanelFluxo() {
  const e = useEstudio();
  const alvo = useAlvo();
  const s = e.doc.estilos[alvo] ?? {};
  const texto = e.doc.textos[alvo] ?? "";

  const setEstilo = (patch: Parameters<typeof comEstilo>[2], rotulo: string) =>
    e.atualizarDoc((d) => comEstilo(d, alvo, patch), rotulo);

  return (
    <>
      <Secao titulo={`Edição no lugar · ${rotuloEl[alvo]}`}>
        <textarea
          value={texto}
          onChange={(ev) =>
            e.atualizarDoc((d) => ({ ...d, textos: { ...d.textos, [alvo]: ev.target.value } }), "")
          }
          className="h-16 w-full resize-none rounded border border-border bg-card p-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-1">
          <button
            title="Negrito"
            onClick={() => setEstilo({ peso: s.peso === "700" ? "400" : "700" }, "Alternou negrito")}
            className={cn(
              "grid size-6 place-items-center rounded border border-border hover:bg-secondary",
              s.peso === "700" ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            <Bold className="size-3" />
          </button>
          <button
            title="Itálico"
            onClick={() =>
              e.atualizarDoc(
                (d) => ({ ...d, textos: { ...d.textos, [alvo]: `“${d.textos[alvo]}”` } }),
                "Destacou o texto",
              )
            }
            className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Italic className="size-3" />
          </button>
          <button
            title="Transformar em link"
            onClick={() => setEstilo({ cor: "oklch(0.55 0.13 245)" }, "Aplicou aparência de link")}
            className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Link2 className="size-3" />
          </button>
          <button
            title="Reduzir"
            onClick={() => setEstilo({ tamanho: Math.max(10, (s.tamanho ?? 16) - 2) }, "Reduziu o texto")}
            className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Undo2 className="size-3" />
          </button>
          <button
            title="Aumentar"
            onClick={() => setEstilo({ tamanho: Math.min(80, (s.tamanho ?? 16) + 2) }, "Aumentou o texto")}
            className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Redo2 className="size-3" />
          </button>
        </div>
      </Secao>
      <Secao titulo="Tipografia">
        <Campo rotulo="Fonte">
          <select
            className={inputCls}
            value={s.fonte ?? "ui-sans-serif"}
            onChange={(ev) => setEstilo({ fonte: ev.target.value }, "Trocou a fonte")}
          >
            <option value="ui-sans-serif">Söhne</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="Georgia, serif">Tiempos</option>
            <option value="ui-monospace, monospace">Mono</option>
          </select>
        </Campo>
        <Campo rotulo="Peso">
          <select
            className={inputCls}
            value={s.peso ?? "400"}
            onChange={(ev) => setEstilo({ peso: ev.target.value }, "Trocou o peso")}
          >
            <option value="400">Regular</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </Campo>
        <Campo rotulo="Tamanho">
          <input
            type="number"
            className={inputCls}
            value={s.tamanho ?? 16}
            onChange={(ev) => setEstilo({ tamanho: Number(ev.target.value) }, "")}
          />
        </Campo>
        <Campo rotulo="Caixa">
          <select
            className={inputCls}
            value={s.caixa ?? "normal"}
            onChange={(ev) => setEstilo({ caixa: ev.target.value as "normal" }, "Trocou a caixa")}
          >
            <option value="normal">Normal</option>
            <option value="uppercase">MAIÚSCULAS</option>
            <option value="lowercase">minúsculas</option>
          </select>
        </Campo>
        <div className="flex gap-1">
          {(
            [
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ] as const
          ).map(([a, Icon]) => (
            <button
              key={a}
              onClick={() => setEstilo({ alinhamento: a }, "Alinhou o texto")}
              className={cn(
                "grid size-6 place-items-center rounded border border-border hover:bg-secondary",
                s.alinhamento === a ? "bg-primary text-primary-foreground" : "bg-card",
              )}
            >
              <Icon className="size-3" />
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Ritmo">
        <Campo rotulo="Entrelinha">
          <input
            type="number"
            step="0.05"
            className={inputCls}
            value={s.entrelinha ?? 1.4}
            onChange={(ev) => setEstilo({ entrelinha: Number(ev.target.value) }, "")}
          />
        </Campo>
        <Campo rotulo="Entre letras (em)">
          <input
            type="number"
            step="0.01"
            className={inputCls}
            value={s.entreLetras ?? 0}
            onChange={(ev) => setEstilo({ entreLetras: Number(ev.target.value) }, "")}
          />
        </Campo>
      </Secao>
    </>
  );
}

/* cor e preenchimento */
export function ColorPanel() {
  const e = useEstudio();
  if (e.docCanvas) return <ColorPanelCanvas />;
  if (e.docHtml)
    return (
      <Secao titulo="Cor">
        <p className="text-[11px] text-muted-foreground">Preview em HTML, somente leitura.</p>
      </Secao>
    );
  return <ColorPanelFluxo />;
}

function ColorPanelCanvas() {
  const e = useEstudio();
  const paleta = paletaPorSistema[e.sistemaAtivo] ?? paletaProjeto;
  const achado = acharCamadaCanvas(e.docCanvas, e.paginaCanvas, e.camadaCanvas);

  if (!achado || achado.camada.tipo === "imagem")
    return (
      <Secao titulo="Cor">
        <p className="text-[11px] text-muted-foreground">
          {achado ? "Camada de imagem — sem cor nesta etapa." : "Selecione uma camada de texto ou forma."}
        </p>
      </Secao>
    );

  const camada = achado.camada as CanvasCamadaTexto | CanvasCamadaForma;
  const id = e.camadaCanvas!;
  const patch = (fn: (c: CanvasCamadaTexto | CanvasCamadaForma) => void, rotulo: string) =>
    e.atualizarDocCanvas(
      (d) => comCamadaCanvas(d, e.paginaCanvas, id, (c) => fn(c as CanvasCamadaTexto | CanvasCamadaForma)),
      rotulo,
    );
  const pintar = (c: string) => patch((x) => void (x.cor = c), `Pintou ${camada.nome ?? camada.tipo}`);

  return (
    <>
      <Secao titulo={`${camada.tipo === "texto" ? "Cor do texto" : "Preenchimento"} · ${camada.nome ?? camada.tipo}`}>
        <div className="grid grid-cols-6 gap-1.5">
          {[...paleta, ...paletaProjeto].slice(0, 12).map((c, i) => (
            <button
              key={`${c}-${i}`}
              onClick={() => pintar(c)}
              className="size-7 rounded border border-border"
              style={{ background: c }}
            />
          ))}
        </div>
        <Campo rotulo="Amostra livre">
          <input
            type="color"
            className={cn(inputCls, "p-0")}
            value={/^#/.test(camada.cor ?? "") ? (camada.cor as string) : "#000000"}
            onChange={(ev) => pintar(ev.target.value)}
          />
        </Campo>
        <button
          onClick={() => patch((c) => void delete c.cor, "Limpou a cor")}
          className="h-6 w-full rounded border border-border bg-card text-[11px] hover:bg-secondary"
        >
          Limpar cor
        </button>
      </Secao>
      <Secao titulo={`Opacidade · ${Math.round((camada.opacidade ?? 1) * 100)}%`}>
        <Slider
          value={[Math.round((camada.opacidade ?? 1) * 100)]}
          max={100}
          step={1}
          onValueChange={(v) => patch((c) => void (c.opacidade = (v[0] ?? 100) / 100), "")}
        />
      </Secao>
    </>
  );
}

function ColorPanelFluxo() {
  const e = useEstudio();
  const alvo = useAlvo();
  const s = e.doc.estilos[alvo] ?? {};
  const [campo, setCampo] = useState<"cor" | "fundo" | "borda">("cor");
  const paleta = paletaPorSistema[e.sistemaAtivo] ?? paletaProjeto;

  const pintar = (c: string) =>
    e.atualizarDoc((d) => comEstilo(d, alvo, { [campo]: c }), `Pintou ${rotuloEl[alvo]} (${campo})`);

  return (
    <>
      <Secao titulo={`Alvo · ${rotuloEl[alvo]}`}>
        <div className="flex gap-1">
          {(["cor", "fundo", "borda"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setCampo(a)}
              className={cn(
                "flex-1 rounded border px-2 py-1 text-[11px] capitalize",
                campo === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {a === "cor" ? "texto" : a}
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Paleta do sistema">
        <div className="grid grid-cols-6 gap-1.5">
          {[...paleta, ...paletaProjeto].slice(0, 12).map((c, i) => (
            <button
              key={`${c}-${i}`}
              onClick={() => pintar(c)}
              className="size-7 rounded border border-border"
              style={{ background: c }}
            />
          ))}
        </div>
        <Campo rotulo="Amostra livre">
          <input
            type="color"
            className={cn(inputCls, "p-0")}
            value={/^#/.test(s[campo] ?? "") ? (s[campo] as string) : "#c05621"}
            onChange={(ev) => pintar(ev.target.value)}
          />
        </Campo>
        <button
          onClick={() => e.atualizarDoc((d) => comEstilo(d, alvo, { [campo]: undefined }), "Limpou a cor")}
          className="h-6 w-full rounded border border-border bg-card text-[11px] hover:bg-secondary"
        >
          Limpar {campo}
        </button>
      </Secao>
      <Secao titulo={`Opacidade · ${s.opacidade ?? 100}%`}>
        <Slider
          value={[s.opacidade ?? 100]}
          max={100}
          step={1}
          onValueChange={(v) => e.atualizarDoc((d) => comEstilo(d, alvo, { opacidade: v[0] }), "")}
        />
      </Secao>
      <Secao titulo="Fundo do artboard">
        <div className="flex gap-1.5">
          {["var(--card)", "oklch(0.97 0.006 85)", "oklch(0.24 0.01 70)", "oklch(0.88 0.05 85)"].map((c) => (
            <button
              key={c}
              onClick={() => e.atualizarDoc((d) => ({ ...d, fundo: c }), "Trocou o fundo do artboard")}
              className="h-8 flex-1 rounded border border-border"
              style={{ background: c }}
            />
          ))}
        </div>
        <button
          onClick={() =>
            e.atualizarDoc((d) => comEstilo(d, "midia", { fundo: "linear-gradient(90deg,oklch(0.58 0.15 40),oklch(0.88 0.05 85))" }), "Aplicou gradiente na mídia")
          }
          className="flex h-6 w-full items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary"
        >
          <Image className="size-3" /> Gradiente na mídia
        </button>
      </Secao>
    </>
  );
}

/* layout e espaçamento */
export function LayoutPanel() {
  const e = useEstudio();
  const l = e.doc.layout;
  const alvo = useAlvo();
  const setL = (patch: Partial<typeof l>, rotulo: string) =>
    e.atualizarDoc((d) => ({ ...d, layout: { ...d.layout, ...patch } }), rotulo);

  return (
    <>
      <Secao titulo="Direção">
        <div className="grid grid-cols-4 gap-1">
          {(["linha", "coluna", "grade", "livre"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setL({ direcao: d }, `Direção ${d}`)}
              className={cn(
                "rounded border px-1 py-1 text-[10px] capitalize",
                l.direcao === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo={`Gap · ${l.gap} px`}>
        <Slider value={[l.gap]} max={64} step={1} onValueChange={(v) => setL({ gap: v[0]! }, "")} />
      </Secao>
      <Secao titulo="Espaço e tamanho">
        <Campo rotulo="Padding">
          <input
            type="number"
            className={inputCls}
            value={l.padding}
            onChange={(ev) => setL({ padding: Number(ev.target.value) }, "")}
          />
        </Campo>
        <Campo rotulo="Largura">
          <select
            className={inputCls}
            value={l.largura}
            onChange={(ev) => setL({ largura: ev.target.value as typeof l.largura }, "Trocou a largura")}
          >
            <option value="auto">Automática</option>
            <option value="fixa">Fixa</option>
            <option value="cheia">100%</option>
          </select>
        </Campo>
      </Secao>
      <Secao titulo="Aparência">
        <Campo rotulo="Borda">
          <input
            type="number"
            className={inputCls}
            value={l.borda}
            onChange={(ev) => setL({ borda: Number(ev.target.value) }, "")}
          />
        </Campo>
        <Campo rotulo="Raio">
          <input
            type="number"
            className={inputCls}
            value={l.raio}
            onChange={(ev) => setL({ raio: Number(ev.target.value) }, "")}
          />
        </Campo>
        <Campo rotulo="Sombra">
          <select
            className={inputCls}
            value={l.sombra}
            onChange={(ev) => setL({ sombra: ev.target.value as typeof l.sombra }, "Trocou a sombra")}
          >
            <option value="suave">Suave</option>
            <option value="nenhuma">Nenhuma</option>
            <option value="elevada">Elevada</option>
          </select>
        </Campo>
      </Secao>
      <Secao titulo={`Camada · ${rotuloEl[alvo]}`}>
        <div className="flex gap-1">
          <button
            onClick={() => e.atualizarDoc((d) => mover(d, alvo, -1), "Trouxe à frente")}
            className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary"
          >
            Trazer à frente
          </button>
          <button
            onClick={() => e.atualizarDoc((d) => mover(d, alvo, 1), "Enviou para trás")}
            className="h-6 flex-1 rounded border border-border bg-card text-[11px] hover:bg-secondary"
          >
            Enviar para trás
          </button>
        </div>
      </Secao>
    </>
  );
}

function mover<T extends { ordem: ElId[] }>(d: T, alvo: ElId, dir: -1 | 1): T {
  const i = d.ordem.indexOf(alvo);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= d.ordem.length) return d;
  const ordem = [...d.ordem];
  const item = ordem.splice(i, 1)[0]!;
  ordem.splice(j, 0, item);
  return { ...d, ordem };
}

/* estrutura e camadas */
function CamadasCanvasPanel() {
  const e = useEstudio();
  const doc = e.docCanvas!;
  const paginas = Array.isArray(doc.paginas) ? doc.paginas : [];
  const paginaAtual = paginas.find((p) => p.id === e.paginaCanvas) ?? paginas[0];
  const camadas = camadasDaPaginaCanvas(paginaAtual);
  const refArquivo = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [apagar, setApagar] = useState<string | null>(null);
  const icone = (t: string) => (t === "texto" ? Type : t === "imagem" ? Image : Square);

  if (!paginaAtual) {
    return (
      <Secao titulo="Camadas">
        <p className="text-[11px] text-muted-foreground">Canvas sem páginas.</p>
      </Secao>
    );
  }

  return (
    <>
      {paginas.length > 1 && (
        <Secao titulo="Página">
          <div className="flex flex-wrap gap-1">
            {paginas.map((p, i) => (
              <button
                key={p.id ?? i}
                onClick={() => {
                  e.setPaginaCanvas(p.id ?? null);
                  e.setCamadaCanvas(null);
                }}
                className={cn(
                  "h-6 min-w-6 rounded border px-1.5 text-[10px]",
                  paginaAtual === p ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Secao>
      )}
      <Secao titulo="Adicionar">
        <div className="flex gap-1">
          <button
            onClick={() => {
              const nova = novaCamadaTexto(paginaAtual);
              e.atualizarDocCanvas((d) => adicionarCamadaCanvas(d, paginaAtual.id ?? null, nova), "Nova camada de texto");
              e.setPaginaCanvas(paginaAtual.id ?? null);
              e.setCamadaCanvas(nova.id!);
            }}
            className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border bg-card text-[10px] hover:bg-secondary"
          >
            <Type className="size-3" /> Texto
          </button>
          <button
            onClick={() => {
              const nova = novaCamadaForma(paginaAtual);
              e.atualizarDocCanvas((d) => adicionarCamadaCanvas(d, paginaAtual.id ?? null, nova), "Nova forma");
              e.setPaginaCanvas(paginaAtual.id ?? null);
              e.setCamadaCanvas(nova.id!);
            }}
            className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border bg-card text-[10px] hover:bg-secondary"
          >
            <Square className="size-3" /> Forma
          </button>
          <button
            onClick={() => refArquivo.current?.click()}
            disabled={enviando}
            className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border bg-card text-[10px] hover:bg-secondary disabled:opacity-50"
          >
            <Image className="size-3" /> {enviando ? "Enviando…" : "Imagem"}
          </button>
          <input
            ref={refArquivo}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (ev) => {
              const file = ev.target.files?.[0];
              ev.target.value = "";
              if (!file) return;
              setEnviando(true);
              try {
                const url = await enviarImagemCanvas(file);
                const nova = novaCamadaImagem(paginaAtual, url, file.name);
                e.atualizarDocCanvas((d) => adicionarCamadaCanvas(d, paginaAtual.id ?? null, nova), "Nova imagem");
                e.setPaginaCanvas(paginaAtual.id ?? null);
                e.setCamadaCanvas(nova.id!);
                toast.success("Imagem enviada.");
              } catch (err) {
                toast.error(`Falha no upload: ${(err as Error).message}`);
              } finally {
                setEnviando(false);
              }
            }}
          />
        </div>
      </Secao>
      <Secao titulo={`Camadas · ${paginaAtual.nome ?? "página"}`}>
        <div className="space-y-0.5">
          {camadas.map((c) => {
            const Icone = icone(c.tipo);
            return (
              <div
                key={c.id}
                className={cn(
                  "flex items-center gap-1 rounded px-1 py-0.5 text-[11px] hover:bg-secondary",
                  e.camadaCanvas === c.id && "bg-secondary",
                )}
              >
                <Icone className="size-3 shrink-0 text-muted-foreground" />
                <button
                  onClick={() => {
                    e.setPaginaCanvas(paginaAtual.id ?? null);
                    e.setCamadaCanvas(c.id);
                  }}
                  className={cn("flex-1 truncate text-left", c.oculto && "text-muted-foreground line-through")}
                  title={c.nome}
                >
                  {c.nome}
                </button>
                <span className="text-[9px] text-muted-foreground">{c.tipo}</span>
                <button
                  title="Mostrar/ocultar"
                  onClick={() =>
                    e.atualizarDocCanvas((d) => {
                      const pg = d.paginas.find((p) => (p.id ?? "") === (paginaAtual.id ?? ""));
                      const alvo = pg?.camadas[c.indice];
                      if (alvo) alvo.oculto = !alvo.oculto;
                      return d;
                    }, `Alternou ${c.nome}`)
                  }
                >
                  {c.oculto ? (
                    <EyeOff className="size-3 text-muted-foreground" />
                  ) : (
                    <Eye className="size-3 text-muted-foreground" />
                  )}
                </button>
                {e.camadaCanvas === c.id && (
                  <button title="Apagar camada" onClick={() => setApagar(c.id)}>
                    <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Secao>

      <AlertDialog open={!!apagar} onOpenChange={(o) => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar camada?</AlertDialogTitle>
            <AlertDialogDescription>A camada sai desta página do canvas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = apagar!;
                e.atualizarDocCanvas((d) => removerCamadaCanvas(d, paginaAtual.id ?? null, id), "Apagou camada");
                if (e.camadaCanvas === id) e.setCamadaCanvas(null);
                setApagar(null);
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function LayersPanel() {
  const e = useEstudio();
  if (e.docCanvas) return <CamadasCanvasPanel />;
  if (e.docHtml)
    return (
      <Secao titulo="Camadas">
        <p className="text-[11px] text-muted-foreground">Preview, sem camadas.</p>
      </Secao>
    );
  return <CamadasFluxoPanel />;
}

function CamadasFluxoPanel() {
  const e = useEstudio();
  const camadas = camadasDoDoc(e.doc);
  const alvo = e.selecionado;

  return (
    <>
      <Secao titulo="Árvore de camadas">
        <div className="space-y-0.5">
          {camadas.map((c) => {
            const s = e.doc.estilos[c.id] ?? {};
            return (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-1 rounded px-1 py-0.5 text-[11px] hover:bg-secondary",
                  alvo === c.id && "bg-secondary",
                )}
              >
                <GripVertical className="size-3 cursor-grab text-muted-foreground" />
                <button onClick={() => e.setSelecionado(c.id)} className="flex-1 truncate text-left">
                  <span className="text-muted-foreground">{c.grupo} › </span>
                  {c.nome}
                </button>
                <span className="text-[9px] text-muted-foreground">{c.tipo}</span>
                <button
                  title="Mostrar/ocultar"
                  onClick={() => e.atualizarDoc((d) => comEstilo(d, c.id, { oculto: !s.oculto }), `Alternou ${c.nome}`)}
                >
                  {s.oculto ? (
                    <EyeOff className="size-3 text-muted-foreground" />
                  ) : (
                    <Eye className="size-3 text-muted-foreground" />
                  )}
                </button>
                <button
                  title="Travar"
                  onClick={() => e.atualizarDoc((d) => comEstilo(d, c.id, { travado: !s.travado }), `Travou ${c.nome}`)}
                >
                  {s.travado ? (
                    <Lock className="size-3 text-accent" />
                  ) : (
                    <LockOpen className="size-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </Secao>
      <Secao titulo="Reordenar">
        <div className="flex gap-1">
          <button
            disabled={!alvo}
            onClick={() => alvo && e.atualizarDoc((d) => mover(d, alvo, -1), "Subiu a camada")}
            className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary disabled:opacity-40"
          >
            <ArrowUp className="size-3" />
          </button>
          <button
            disabled={!alvo}
            onClick={() => alvo && e.atualizarDoc((d) => mover(d, alvo, 1), "Desceu a camada")}
            className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary disabled:opacity-40"
          >
            <ArrowDown className="size-3" />
          </button>
        </div>
        <button
          onClick={() =>
            e.atualizarDoc(
              (d) => (d.ordem.includes("midia") ? d : { ...d, ordem: [...d.ordem, "midia"] }),
              "Inseriu bloco de mídia",
            )
          }
          className="flex h-6 w-full items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary"
        >
          <Plus className="size-3" /> Inserir bloco de mídia
        </button>
      </Secao>
      <Secao titulo="Ações">
        <div className="flex gap-1">
          <button
            title="Adicionar logo"
            onClick={() => e.atualizarDoc((d) => ({ ...d, logos: [...d.logos, "Novo"] }), "Adicionou um logo")}
            className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Plus className="size-3" />
          </button>
          <button
            title="Remover último logo"
            onClick={() => e.atualizarDoc((d) => ({ ...d, logos: d.logos.slice(0, -1) }), "Removeu um logo")}
            className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Undo2 className="size-3" />
          </button>
          <button
            title="Inserir mídia"
            onClick={() =>
              e.atualizarDoc(
                (d) => (d.ordem.includes("midia") ? d : { ...d, ordem: [...d.ordem, "midia"] }),
                "Inseriu mídia",
              )
            }
            className="grid h-6 flex-1 place-items-center rounded border border-border bg-card hover:bg-secondary"
          >
            <Image className="size-3" />
          </button>
          <button
            title="Ocultar camada selecionada"
            disabled={!alvo}
            onClick={() => {
              if (!alvo) return;
              e.atualizarDoc(
                (d) => ({ ...d, estilos: { ...d.estilos, [alvo]: { ...(d.estilos[alvo] ?? {}), oculto: true } } }),
                `Ocultou ${rotuloEl[alvo]}`,
              );
            }}
            className="grid h-6 flex-1 place-items-center rounded border border-border bg-card text-destructive hover:bg-secondary disabled:opacity-40"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
        <button
          disabled={!alvo}
          onClick={() => {
            if (!alvo) return;
            e.atualizarDoc((d) => ({ ...d, ordem: d.ordem.filter((x) => x !== alvo) }), `Removeu ${rotuloEl[alvo]}`);
            e.setSelecionado(null);
          }}
          className="mt-1.5 h-7 w-full rounded border border-border bg-card text-[11px] font-medium text-destructive hover:bg-secondary disabled:opacity-40"
        >
          Remover bloco
        </button>
      </Secao>
    </>
  );
}

/* painel de ajustes (props) */
export function PropsPanel() {
  const e = useEstudio();
  if (e.docCanvas) return <SelecaoCanvasPanel />;
  if (e.docHtml)
    return (
      <Secao titulo="Ajustes">
        <p className="text-[11px] text-muted-foreground">Preview em HTML, somente leitura.</p>
      </Secao>
    );
  return <PropsPanelFluxo />;
}

/* inspector simples da camada selecionada (canvas) */
function SelecaoCanvasPanel({ modo = "simples" }: { modo?: "simples" | "pro" }) {
  const e = useEstudio();
  const achado = acharCamadaCanvas(e.docCanvas, e.paginaCanvas, e.camadaCanvas);
  const salvaAchada = acharCamadaCanvas(e.canvasSalvo, e.paginaCanvas, e.camadaCanvas);

  if (!achado)
    return (
      <Secao titulo="Camada">
        <p className="text-[11px] text-muted-foreground">Selecione uma camada.</p>
      </Secao>
    );

  const camada = achado.camada;
  const id = e.camadaCanvas!;
  const patch = (fn: (c: CanvasCamada) => void, rotulo: string) =>
    e.atualizarDocCanvas((d) => comCamadaCanvas(d, e.paginaCanvas, id, (c) => fn(c as CanvasCamada)), rotulo);
  const num = (v: number | undefined, fn: (c: CanvasCamada, n: number) => void) => (
    <input
      type="number"
      className={inputCls}
      value={v ?? 0}
      onChange={(ev) => {
        const n = Number(ev.target.value);
        patch((c) => fn(c, n), "");
      }}
    />
  );
  const sombra = (camada as { sombra?: CanvasSombra }).sombra;
  const salva = salvaAchada?.camada as Record<string, unknown> | undefined;
  const dif = (k: string) =>
    JSON.stringify((camada as unknown as Record<string, unknown>)[k]) !== JSON.stringify(salva?.[k]);
  const redefinir = (ks: string[]) =>
    patch((c) => {
      const alvo = c as unknown as Record<string, unknown>;
      ks.forEach((k) => {
        const v = salva?.[k];
        if (v === undefined) delete alvo[k];
        else alvo[k] = JSON.parse(JSON.stringify(v));
      });
    }, "Redefiniu valores");
  const botaoRedefinir = (ks: string[]) =>
    ks.some(dif) ? (
      <button
        onClick={() => redefinir(ks)}
        className="flex items-center gap-1 rounded px-1 text-[10px] text-muted-foreground hover:bg-secondary"
      >
        <RotateCcw className="size-3" /> Redefinir
      </button>
    ) : null;

  return (
    <>
      <Secao titulo={`Camada · ${camada.nome ?? camada.tipo}`}>
        <Campo rotulo="Tipo">
          <span className="text-[11px]">{camada.tipo}</span>
        </Campo>
      </Secao>

      {camada.tipo === "texto" && (
        <>
          <Secao titulo="Conteúdo" acao={botaoRedefinir(["texto", "partes"])}>
            <textarea
              value={textoDaCamadaCanvas(camada)}
              onChange={(ev) => {
                const v = ev.target.value;
                patch((c) => {
                  const t = c as CanvasCamadaTexto;
                  t.texto = v;
                  delete t.partes;
                }, "");
              }}
              className="h-20 w-full resize-none rounded border border-border bg-card p-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
            />
          </Secao>
          <Secao
            titulo="Tipografia"
            acao={botaoRedefinir([
              "fonte", "tamanho", "peso", "entrelinha", "entreLetras", "cor", "alinhamento",
              "italico", "sublinhado", "riscado", "caixa", "fundo",
            ])}
          >
            <Campo rotulo="Fonte">
              <input
                className={inputCls}
                value={camada.fonte ?? ""}
                placeholder="herdada"
                onChange={(ev) => {
                  const v = ev.target.value;
                  patch((c) => {
                    const t = c as CanvasCamadaTexto;
                    if (v) t.fonte = v;
                    else delete t.fonte;
                  }, "");
                }}
              />
            </Campo>
            <Campo rotulo="Tamanho">{num(camada.tamanho, (c, n) => void ((c as CanvasCamadaTexto).tamanho = n))}</Campo>
            <Campo rotulo="Peso">{num(camada.peso, (c, n) => void ((c as CanvasCamadaTexto).peso = n))}</Campo>
            <Campo rotulo="Entrelinha">
              {num(camada.entrelinha ?? camada.tamanho, (c, n) => void ((c as CanvasCamadaTexto).entrelinha = n))}
            </Campo>
            <Campo rotulo="Entre letras">
              {num(camada.entreLetras, (c, n) => void ((c as CanvasCamadaTexto).entreLetras = n))}
            </Campo>
            <Campo rotulo="Cor">
              <input
                type="color"
                className={cn(inputCls, "p-0")}
                value={/^#/.test(camada.cor ?? "") ? camada.cor! : "#000000"}
                onChange={(ev) => patch((c) => void ((c as CanvasCamadaTexto).cor = ev.target.value), "")}
              />
            </Campo>
            <div className="flex gap-1">
              {(
                [
                  ["left", AlignLeft],
                  ["center", AlignCenter],
                  ["right", AlignRight],
                ] as const
              ).map(([a, Icon]) => (
                <button
                  key={a}
                  onClick={() => patch((c) => void ((c as CanvasCamadaTexto).alinhamento = a), "Alinhou o texto")}
                  className={cn(
                    "grid size-6 place-items-center rounded border border-border hover:bg-secondary",
                    camada.alinhamento === a ? "bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  <Icon className="size-3" />
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(
                [
                  ["italico", Italic, "Itálico"],
                  ["sublinhado", Underline, "Sublinhado"],
                  ["riscado", Strikethrough, "Riscado"],
                ] as const
              ).map(([k, Icon, titulo]) => (
                <button
                  key={k}
                  title={titulo}
                  onClick={() =>
                    patch((c) => {
                      const t = c as CanvasCamadaTexto;
                      if (t[k]) delete t[k];
                      else t[k] = true;
                    }, titulo)
                  }
                  className={cn(
                    "grid size-6 place-items-center rounded border border-border hover:bg-secondary",
                    camada[k] ? "bg-primary text-primary-foreground" : "bg-card",
                  )}
                >
                  <Icon className="size-3" />
                </button>
              ))}
            </div>
            <Campo rotulo="Caixa" sujo={dif("caixa")}>
              <select
                className={inputCls}
                value={camada.caixa ?? "normal"}
                onChange={(ev) => {
                  const v = ev.target.value as "normal" | "uppercase" | "lowercase";
                  patch((c) => {
                    const t = c as CanvasCamadaTexto;
                    if (v === "normal") delete t.caixa;
                    else t.caixa = v;
                  }, "");
                }}
              >
                <option value="normal">normal</option>
                <option value="uppercase">MAIÚSCULAS</option>
                <option value="lowercase">minúsculas</option>
              </select>
            </Campo>
            <Campo rotulo="Fundo" sujo={dif("fundo")}>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  className={cn(inputCls, "w-14 p-0")}
                  value={/^#[0-9a-f]{6}$/i.test(camada.fundo ?? "") ? camada.fundo! : "#ffffff"}
                  onChange={(ev) => patch((c) => void ((c as CanvasCamadaTexto).fundo = ev.target.value), "")}
                />
                {camada.fundo && (
                  <button
                    title="Sem fundo"
                    onClick={() => patch((c) => void delete (c as CanvasCamadaTexto).fundo, "Removeu o fundo")}
                    className="grid size-6 place-items-center rounded border border-border bg-card hover:bg-secondary"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            </Campo>
          </Secao>

        </>
      )}

      {camada.tipo === "forma" && (
        <Secao titulo="Forma">
          <Campo rotulo="Preenchimento">
            <input
              type="color"
              className={cn(inputCls, "p-0")}
              value={/^#/.test(camada.cor ?? "") ? camada.cor! : "#000000"}
              onChange={(ev) => patch((c) => void ((c as CanvasCamadaForma).cor = ev.target.value), "")}
            />
          </Campo>
          <Campo rotulo="Raio">{num(camada.raio, (c, n) => void ((c as CanvasCamadaForma).raio = n))}</Campo>
          <Campo rotulo="Borda (px)">
            {num(camada.borda?.largura, (c, n) => {
              const f = c as CanvasCamadaForma;
              f.borda = { largura: n, cor: f.borda?.cor ?? "#000000", ...(f.borda?.estilo ? { estilo: f.borda.estilo } : {}) };
            })}
          </Campo>
          <Campo rotulo="Cor da borda">
            <input
              type="color"
              className={cn(inputCls, "p-0")}
              value={/^#/.test(camada.borda?.cor ?? "") ? camada.borda!.cor : "#000000"}
              onChange={(ev) => {
                const v = ev.target.value;
                patch((c) => {
                  const f = c as CanvasCamadaForma;
                  f.borda = { largura: f.borda?.largura ?? 1, cor: v, ...(f.borda?.estilo ? { estilo: f.borda.estilo } : {}) };
                }, "");
              }}
            />
          </Campo>
          <Campo rotulo="Estilo da borda">
            <select
              className={inputCls}
              value={camada.borda?.estilo ?? "solid"}
              onChange={(ev) => {
                const v = ev.target.value as "solid" | "dashed" | "dotted";
                patch((c) => {
                  const f = c as CanvasCamadaForma;
                  f.borda = { largura: f.borda?.largura ?? 1, cor: f.borda?.cor ?? "#000000", estilo: v };
                }, "");
              }}
            >
              <option value="solid">sólida</option>
              <option value="dashed">tracejada</option>
              <option value="dotted">pontilhada</option>
            </select>
          </Campo>
        </Secao>
      )}

      {camada.tipo === "imagem" && (
        <Secao titulo="Imagem">
          <Campo rotulo="Raio">{num(camada.raio, (c, n) => void ((c as CanvasCamadaImagem).raio = n))}</Campo>
          <input
            readOnly
            value={camada.src}
            className="h-6 w-full rounded border border-border bg-secondary px-1.5 text-[11px] text-muted-foreground"
          />
        </Secao>
      )}

      <Secao titulo={`Opacidade · ${Math.round((camada.opacidade ?? 1) * 100)}%`}>
        <Slider
          value={[Math.round((camada.opacidade ?? 1) * 100)]}
          max={100}
          step={1}
          onValueChange={(v) => patch((c) => void (c.opacidade = (v[0] ?? 100) / 100), "")}
        />
      </Secao>

      {modo === "pro" && (
        <>
          <Secao titulo="Posição" acao={botaoRedefinir(["x", "y", "w", "h"])}>
            <Campo rotulo="X" sujo={dif("x")}>
              {num(camada.x, (c, n) => void (c.x = n))}
            </Campo>
            <Campo rotulo="Y" sujo={dif("y")}>
              {num(camada.y, (c, n) => void (c.y = n))}
            </Campo>
            {camada.tipo !== "texto" && (
              <>
                <Campo rotulo="Largura" sujo={dif("w")}>
                  {num(camada.w, (c, n) => void (c.w = n))}
                </Campo>
                <Campo rotulo="Altura" sujo={dif("h")}>
                  {num(camada.h, (c, n) => void (c.h = n))}
                </Campo>
              </>
            )}
          </Secao>

          <Secao titulo="Ordem (z)">
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ["topo", "Trazer para frente"],
                  [1, "Avançar"],
                  [-1, "Recuar"],
                  ["fundo", "Enviar para trás"],
                ] as const
              ).map(([d, titulo]) => (
                <button
                  key={String(d)}
                  onClick={() =>
                    e.atualizarDocCanvas((doc) => moverCamadaCanvas(doc, e.paginaCanvas, id, d), titulo)
                  }
                  className="h-6 rounded border border-border bg-card text-[11px] hover:bg-secondary"
                >
                  {titulo}
                </button>
              ))}
            </div>
          </Secao>
        </>
      )}


      <Secao titulo="Sombra">
        {!sombra ? (
          <button
            onClick={() =>
              patch(
                (c) => void ((c as { sombra?: CanvasSombra }).sombra = { x: 0, y: 4, blur: 12, cor: "#00000040" }),
                "Adicionou sombra",
              )
            }
            className="flex h-6 w-full items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary"
          >
            <Plus className="size-3" /> Add: shadow
          </button>
        ) : (
          <>
            <Campo rotulo="Deslocamento X">
              {num(sombra.x, (c, n) => void ((c as { sombra?: CanvasSombra }).sombra!.x = n))}
            </Campo>
            <Campo rotulo="Deslocamento Y">
              {num(sombra.y, (c, n) => void ((c as { sombra?: CanvasSombra }).sombra!.y = n))}
            </Campo>
            <Campo rotulo="Desfoque">
              {num(sombra.blur, (c, n) => void ((c as { sombra?: CanvasSombra }).sombra!.blur = n))}
            </Campo>
            <Campo rotulo="Cor">
              <input
                type="color"
                className={cn(inputCls, "p-0")}
                value={/^#[0-9a-f]{6}$/i.test(sombra.cor) ? sombra.cor : "#000000"}
                onChange={(ev) =>
                  patch((c) => void ((c as { sombra?: CanvasSombra }).sombra!.cor = ev.target.value), "")
                }
              />
            </Campo>
            <button
              onClick={() => patch((c) => void delete (c as { sombra?: CanvasSombra }).sombra, "Removeu sombra")}
              className="h-6 w-full rounded border border-border bg-card text-[11px] hover:bg-secondary"
            >
              Remover sombra
            </button>
          </>
        )}
      </Secao>

      {modo === "simples" && <ExportarSelecao camadaId={id} nome={camada.nome ?? camada.tipo} />}
      {modo === "pro" && <CamadasCanvasPanel />}
    </>
  );
}

function ExportarSelecao({ camadaId, nome }: { camadaId: string; nome: string }) {
  const [ocupado, setOcupado] = useState(false);
  const exportar = async (escala: 1 | 2) => {
    setOcupado(true);
    try {
      const blob = await camadaParaPng(camadaId, escala);
      if (!blob) {
        toast.error("Não consegui rasterizar essa camada.");
        return;
      }
      baixarArquivo(`${nome.replace(/\s+/g, "-").toLowerCase()}@${escala}x.png`, blob, "image/png");
      toast.success(`PNG ${escala}× exportado`);
    } finally {
      setOcupado(false);
    }
  };
  return (
    <Secao titulo="Exportar seleção">
      <div
        className="grid h-16 place-items-center rounded border border-border text-[10px] text-muted-foreground"
        style={{
          backgroundImage:
            "linear-gradient(45deg,hsl(var(--muted)) 25%,transparent 25%),linear-gradient(-45deg,hsl(var(--muted)) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,hsl(var(--muted)) 75%),linear-gradient(-45deg,transparent 75%,hsl(var(--muted)) 75%)",
          backgroundSize: "12px 12px",
          backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
        }}
      >
        fundo transparente
      </div>
      <div className="grid grid-cols-2 gap-1">
        {([1, 2] as const).map((s) => (
          <button
            key={s}
            disabled={ocupado}
            onClick={() => void exportar(s)}
            className="h-6 rounded border border-border bg-card text-[11px] hover:bg-secondary disabled:opacity-50"
          >
            PNG {s}×
          </button>
        ))}
      </div>
    </Secao>
  );
}

/* ============ Inspector unificado (Simples / Pro) ============ */

export function InspectorPanel({ aba }: { aba: "simples" | "pro" }) {
  const e = useEstudio();
  const saida = useRef({ sujo: false, descartar: e.descartarRascunho });
  saida.current = { sujo: e.sujo, descartar: e.descartarRascunho };
  useEffect(
    () => () => {
      // fechar a rota com rascunho sujo descarta as mudanças
      if (saida.current.sujo) saida.current.descartar();
    },
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex rounded-md border border-border p-0.5">
          {(
            [
              ["simples", "Simples"],
              ["pro", "Pro"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              onClick={() => e.setPainelEdicao(id)}
              className={cn(
                "h-6 rounded px-2 text-[11px]",
                aba === id ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {e.sujo && <span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" title="Alterações não salvas" />}
          <button
            disabled={!e.sujo}
            onClick={() => e.descartarRascunho()}
            className="h-6 rounded border border-border px-2 text-[11px] hover:bg-secondary disabled:opacity-40"
          >
            Descartar
          </button>
          <button
            disabled={!e.sujo}
            onClick={() => e.salvarRascunho()}
            className="h-6 rounded bg-primary px-2 text-[11px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {e.docHtml ? (
          <Secao titulo="Documento">
            <p className="text-[11px] text-muted-foreground">Preview em HTML: somente leitura.</p>
          </Secao>
        ) : e.docCanvas ? (
          <SelecaoCanvasPanel modo={aba} />
        ) : aba === "simples" ? (
          <>
            <TextPanelFluxo />
            <ColorPanelFluxo />
          </>
        ) : (
          <>
            <LayoutPanel />
            <CamadasFluxoPanel />
          </>
        )}
      </div>
    </div>
  );
}


function PropsPanelFluxo() {
  const e = useEstudio();
  const d = e.doc;

  return (
    <>
      <Secao titulo="Conteúdo exposto">
        <Campo rotulo="Título">
          <input
            className={inputCls}
            value={d.textos.titulo}
            onChange={(ev) => e.atualizarDoc((x) => ({ ...x, textos: { ...x.textos, titulo: ev.target.value } }), "")}
          />
        </Campo>
        <Campo rotulo="CTA">
          <input
            className={inputCls}
            value={d.textos.cta}
            onChange={(ev) => e.atualizarDoc((x) => ({ ...x, textos: { ...x.textos, cta: ev.target.value } }), "")}
          />
        </Campo>
        <Campo rotulo="Nº de logos">
          <input
            type="number"
            min={0}
            max={8}
            className={inputCls}
            value={d.logos.length}
            onChange={(ev) => {
              const n = Math.max(0, Math.min(8, Number(ev.target.value)));
              e.atualizarDoc((x) => {
                const base = ["Marés", "Fluxo", "Norte", "Cardume", "Vento", "Duna", "Píer", "Ilha"];
                return { ...x, logos: base.slice(0, n) };
              }, "");
            }}
          />
        </Campo>
      </Secao>
      <Secao titulo="Comportamento">
        <Campo rotulo="Mostrar prova social">
          <Switch
            checked={d.provaSocial}
            onCheckedChange={(v) => e.atualizarDoc((x) => ({ ...x, provaSocial: v }), "Alternou prova social")}
          />
        </Campo>
        <Campo rotulo="Herói em tela cheia">
          <Switch
            checked={d.heroiCheio}
            onCheckedChange={(v) => e.atualizarDoc((x) => ({ ...x, heroiCheio: v }), "Alternou herói cheio")}
          />
        </Campo>
        <div>
          <p className="mb-1 text-[11px] text-muted-foreground">Densidade · {d.densidade}%</p>
          <Slider
            value={[d.densidade]}
            max={100}
            step={1}
            onValueChange={(v) => e.atualizarDoc((x) => ({ ...x, densidade: v[0]! }), "")}
          />
        </div>
      </Secao>
      <Secao titulo="Variantes">
        <div className="flex rounded border border-border bg-card p-0.5">
          {(["Calmo", "Produto", "Ousado"] as Variante[]).map((v) => (
            <button
              key={v}
              onClick={() => e.atualizarDoc((x) => aplicarVariante(x, v), `Variante ${v}`)}
              className={cn(
                "flex-1 rounded-[3px] py-1 text-[11px]",
                d.variante === v ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["Aurora", "s1"],
              ["Editorial", "s2"],
              ["Neutro", "s3"],
            ] as const
          ).map(([p, sid]) => (
            <button
              key={p}
              onClick={() => {
                e.setSistemaAtivo(sid);
                const cores = paletaPorSistema[sid]!;
                e.atualizarDoc(
                  (x) => comEstilo(comEstilo(x, "cta", { fundo: cores[0] }), "titulo", { cor: cores[2] }),
                  `Aplicou a paleta ${p}`,
                );
              }}
              className="rounded border border-border bg-card py-1 text-[10px] hover:bg-secondary"
            >
              {p}
            </button>
          ))}
        </div>
      </Secao>
      <Secao titulo="Aplicar">
        <div className="flex gap-1">
          <button
            onClick={() => {
              e.recarregarDoc();
              toast.success("Padrão restaurado.");
            }}
            className="flex h-6 flex-1 items-center justify-center gap-1 rounded border border-border bg-card text-[11px] hover:bg-secondary"
          >
            <RotateCcw className="size-3" /> Restaurar padrão
          </button>
          <button
            onClick={() => {
              const v = e.criarVersao("");
              toast.success(`Versão ${v} salva.`);
            }}
            className="h-6 flex-1 rounded bg-primary text-[11px] text-primary-foreground"
          >
            Salvar versão
          </button>
        </div>
      </Secao>
    </>
  );
}
