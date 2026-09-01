import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  abasIniciais,
  comentariosIniciais,
  conversaInicial,
  designs as designsMock,
  type ChatMessage,
  type CommentPin,
  type DesignItem,
  type OpenTab,
} from "@/lib/estudio-mock";

export type Viewport = "mobile" | "tablet" | "desktop";
export type Ferramenta = "cursor" | "mao" | "regua" | "grade";
export type PainelDireito = "props" | "camadas" | "versoes" | "comentarios" | "codigo" | null;
export type PainelEdicao = "texto" | "cor" | "layout" | "estrutura" | null;
export type FiltroBiblioteca = "recentes" | "favoritos" | "tipo";

interface EstudioState {
  projeto: string;
  setProjeto: (v: string) => void;
  designs: DesignItem[];
  busca: string;
  setBusca: (v: string) => void;
  filtro: FiltroBiblioteca;
  setFiltro: (v: FiltroBiblioteca) => void;
  abas: OpenTab[];
  abaAtiva: string;
  abrirDesign: (id: string) => void;
  fecharAba: (id: string) => void;
  fixarAba: (id: string) => void;
  moverAba: (id: string, dir: -1 | 1) => void;
  setAbaAtiva: (id: string) => void;
  duplicarDesign: (id: string) => void;
  novoDesign: () => void;
  favoritar: (id: string) => void;
  zoom: number;
  setZoom: (v: number) => void;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  ferramenta: Ferramenta;
  setFerramenta: (v: Ferramenta) => void;
  apresentando: boolean;
  setApresentando: (v: boolean) => void;
  modoEdicao: boolean;
  setModoEdicao: (v: boolean) => void;
  selecionado: string | null;
  setSelecionado: (v: string | null) => void;
  painelEdicao: PainelEdicao;
  setPainelEdicao: (v: PainelEdicao) => void;
  painelDireito: PainelDireito;
  setPainelDireito: (v: PainelDireito) => void;
  modoComentario: boolean;
  setModoComentario: (v: boolean) => void;
  comentarios: CommentPin[];
  addComentario: (x: number, y: number) => void;
  resolverComentario: (id: string) => void;
  responderComentario: (id: string, texto: string) => void;
  filtroComentarios: "abertos" | "resolvidos";
  setFiltroComentarios: (v: "abertos" | "resolvidos") => void;
  comentarioAtivo: string | null;
  setComentarioAtivo: (v: string | null) => void;
  conversa: ChatMessage[];
  enviando: boolean;
  enviarPedido: (texto: string) => void;
  pararGeracao: () => void;
  contexto: { id: string; rotulo: string; tipo: string }[];
  removerContexto: (id: string) => void;
  adicionarContexto: (rotulo: string, tipo: string) => void;
  sistemaAtivo: string;
  setSistemaAtivo: (v: string) => void;
}

const Ctx = createContext<EstudioState | null>(null);

let seq = 100;
const nextId = () => `x${seq++}`;

export function EstudioProvider({ children }: { children: ReactNode }) {
  const [projeto, setProjeto] = useState("Aurora — produto");
  const [designs, setDesigns] = useState<DesignItem[]>(designsMock);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroBiblioteca>("recentes");
  const [abas, setAbas] = useState<OpenTab[]>(abasIniciais);
  const [abaAtiva, setAbaAtiva] = useState("d1");
  const [zoom, setZoom] = useState(100);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [ferramenta, setFerramenta] = useState<Ferramenta>("cursor");
  const [apresentando, setApresentando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [painelEdicao, setPainelEdicao] = useState<PainelEdicao>(null);
  const [painelDireito, setPainelDireito] = useState<PainelDireito>("props");
  const [modoComentario, setModoComentario] = useState(false);
  const [comentarios, setComentarios] = useState<CommentPin[]>(comentariosIniciais);
  const [filtroComentarios, setFiltroComentarios] = useState<"abertos" | "resolvidos">("abertos");
  const [comentarioAtivo, setComentarioAtivo] = useState<string | null>("c1");
  const [conversa, setConversa] = useState<ChatMessage[]>(conversaInicial);
  const [enviando, setEnviando] = useState(false);
  const [contexto, setContexto] = useState([
    { id: "k1", rotulo: "Home — Aurora", tipo: "arquivo" },
    { id: "k2", rotulo: "Aurora Quente", tipo: "design system" },
  ]);
  const [sistemaAtivo, setSistemaAtivo] = useState("s1");

  const abrirDesign = useCallback((id: string) => {
    setDesigns((ds) => {
      const d = ds.find((x) => x.id === id);
      if (d) setAbas((as) => (as.some((a) => a.id === id) ? as : [...as, { id, nome: d.nome, fixada: false }]));
      return ds;
    });
    setAbaAtiva(id);
  }, []);

  const fecharAba = useCallback(
    (id: string) => {
      setAbas((as) => {
        const restantes = as.filter((a) => a.id !== id);
        setAbaAtiva((atual) => (atual === id ? (restantes[0]?.id ?? "") : atual));
        return restantes;
      });
    },
    [],
  );

  const fixarAba = useCallback((id: string) => {
    setAbas((as) => as.map((a) => (a.id === id ? { ...a, fixada: !a.fixada } : a)));
  }, []);

  const moverAba = useCallback((id: string, dir: -1 | 1) => {
    setAbas((as) => {
      const i = as.findIndex((a) => a.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= as.length) return as;
      const copia = [...as];
      const [item] = copia.splice(i, 1);
      copia.splice(j, 0, item);
      return copia;
    });
  }, []);

  const duplicarDesign = useCallback((id: string) => {
    setDesigns((ds) => {
      const d = ds.find((x) => x.id === id);
      if (!d) return ds;
      return [{ ...d, id: nextId(), nome: `${d.nome} (cópia)`, atualizado: "agora", favorito: false }, ...ds];
    });
  }, []);

  const novoDesign = useCallback(() => {
    const id = nextId();
    setDesigns((ds) => [
      { id, nome: "Novo design", tipo: "tela", atualizado: "agora", favorito: false, tom: "oklch(0.9 0.03 85)" },
      ...ds,
    ]);
    setAbas((as) => [...as, { id, nome: "Novo design", fixada: false }]);
    setAbaAtiva(id);
  }, []);

  const favoritar = useCallback((id: string) => {
    setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, favorito: !d.favorito } : d)));
  }, []);

  const addComentario = useCallback((x: number, y: number) => {
    const id = nextId();
    setComentarios((cs) => [
      ...cs,
      { id, x, y, autor: "Você", texto: "Novo comentário", resolvido: false, respostas: [] },
    ]);
    setComentarioAtivo(id);
    setFiltroComentarios("abertos");
  }, []);

  const resolverComentario = useCallback((id: string) => {
    setComentarios((cs) => cs.map((c) => (c.id === id ? { ...c, resolvido: !c.resolvido } : c)));
  }, []);

  const responderComentario = useCallback((id: string, texto: string) => {
    setComentarios((cs) =>
      cs.map((c) => (c.id === id ? { ...c, respostas: [...c.respostas, { autor: "Você", texto }] } : c)),
    );
  }, []);

  const enviarPedido = useCallback((texto: string) => {
    const idUser = nextId();
    setConversa((c) => [...c, { id: idUser, autor: "voce", texto }]);
    setEnviando(true);
    const idBot = nextId();
    window.setTimeout(() => {
      setConversa((c) => [
        ...c,
        {
          id: idBot,
          autor: "assistente",
          texto: "Aplicado no arquivo em foco. Gerei uma nova versão para comparar.",
          tarefas: [
            { id: nextId(), texto: "Interpretar o pedido", estado: "feito" },
            { id: nextId(), texto: "Ajustar composição", estado: "feito" },
            { id: nextId(), texto: "Gerar versão", estado: "ativo" },
          ],
          arquivo: { nome: "Home — Aurora", tipo: "tela", versao: "v8" },
        },
      ]);
      setEnviando(false);
    }, 1200);
  }, []);

  const pararGeracao = useCallback(() => setEnviando(false), []);

  const removerContexto = useCallback((id: string) => {
    setContexto((cs) => cs.filter((c) => c.id !== id));
  }, []);

  const adicionarContexto = useCallback((rotulo: string, tipo: string) => {
    setContexto((cs) => [...cs, { id: nextId(), rotulo, tipo }]);
  }, []);

  const value = useMemo<EstudioState>(
    () => ({
      projeto,
      setProjeto,
      designs,
      busca,
      setBusca,
      filtro,
      setFiltro,
      abas,
      abaAtiva,
      abrirDesign,
      fecharAba,
      fixarAba,
      moverAba,
      setAbaAtiva,
      duplicarDesign,
      novoDesign,
      favoritar,
      zoom,
      setZoom,
      viewport,
      setViewport,
      ferramenta,
      setFerramenta,
      apresentando,
      setApresentando,
      modoEdicao,
      setModoEdicao,
      selecionado,
      setSelecionado,
      painelEdicao,
      setPainelEdicao,
      painelDireito,
      setPainelDireito,
      modoComentario,
      setModoComentario,
      comentarios,
      addComentario,
      resolverComentario,
      responderComentario,
      filtroComentarios,
      setFiltroComentarios,
      comentarioAtivo,
      setComentarioAtivo,
      conversa,
      enviando,
      enviarPedido,
      pararGeracao,
      contexto,
      removerContexto,
      adicionarContexto,
      sistemaAtivo,
      setSistemaAtivo,
    }),
    [
      projeto,
      designs,
      busca,
      filtro,
      abas,
      abaAtiva,
      abrirDesign,
      fecharAba,
      fixarAba,
      moverAba,
      duplicarDesign,
      novoDesign,
      favoritar,
      zoom,
      viewport,
      ferramenta,
      apresentando,
      modoEdicao,
      selecionado,
      painelEdicao,
      painelDireito,
      modoComentario,
      comentarios,
      addComentario,
      resolverComentario,
      responderComentario,
      filtroComentarios,
      comentarioAtivo,
      conversa,
      enviando,
      enviarPedido,
      pararGeracao,
      contexto,
      removerContexto,
      adicionarContexto,
      sistemaAtivo,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEstudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEstudio precisa estar dentro de EstudioProvider");
  return ctx;
}
