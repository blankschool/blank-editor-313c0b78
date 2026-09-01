import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
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
import {
  clonarDoc,
  docPadrao,
  interpretarPedido,
  type DesignDoc,
  type ElId,
} from "@/lib/estudio-doc";

export type Viewport = "mobile" | "tablet" | "desktop";
export type Ferramenta = "cursor" | "mao" | "regua" | "grade";
export type PainelDireito = "props" | "camadas" | "versoes" | "comentarios" | "codigo" | null;
export type PainelEdicao = "texto" | "cor" | "layout" | "estrutura" | null;
export type FiltroBiblioteca = "recentes" | "favoritos" | "tipo";

export interface VersaoDoc {
  id: string;
  rotulo: string;
  autor: string;
  quando: string;
  doc: DesignDoc;
}

export interface EventoHistorico {
  id: string;
  quem: string;
  o: string;
  quando: string;
}

export const slugPainel: Record<Exclude<PainelDireito, null>, string> = {
  props: "ajustes",
  camadas: "camadas",
  versoes: "versoes",
  comentarios: "comentarios",
  codigo: "codigo",
};

const painelPorSlug: Record<string, Exclude<PainelDireito, null>> = {
  ajustes: "props",
  camadas: "camadas",
  versoes: "versoes",
  comentarios: "comentarios",
  codigo: "codigo",
};

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
  nomeAtivo: string;
  abrirDesign: (id: string) => void;
  fecharAba: (id: string) => void;
  fixarAba: (id: string) => void;
  moverAba: (id: string, dir: -1 | 1) => void;
  setAbaAtiva: (id: string) => void;
  duplicarDesign: (id: string) => void;
  excluirDesign: (id: string) => void;
  renomearDesign: (id: string, nome: string) => void;
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
  selecionado: ElId | null;
  setSelecionado: (v: ElId | null) => void;
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
  editarComentario: (id: string, texto: string) => void;
  filtroComentarios: "abertos" | "resolvidos";
  setFiltroComentarios: (v: "abertos" | "resolvidos") => void;
  comentarioAtivo: string | null;
  setComentarioAtivo: (v: string | null) => void;
  conversa: ChatMessage[];
  enviando: boolean;
  enviarPedido: (texto: string) => void;
  reenviarMensagem: (id: string) => void;
  editarMensagem: (id: string, texto: string) => void;
  ramificar: (id: string) => void;
  pararGeracao: () => void;
  contexto: { id: string; rotulo: string; tipo: string }[];
  removerContexto: (id: string) => void;
  adicionarContexto: (rotulo: string, tipo: string) => void;
  sistemaAtivo: string;
  setSistemaAtivo: (v: string) => void;
  /* documento vivo */
  doc: DesignDoc;
  atualizarDoc: (fn: (d: DesignDoc) => DesignDoc, rotulo: string) => void;
  recarregarDoc: () => void;
  versoes: VersaoDoc[];
  criarVersao: (rotulo: string, autor?: string) => VersaoDoc;
  restaurarVersao: (id: string) => void;
  duplicarVersao: (id: string) => void;
  excluirVersao: (id: string) => void;
  versaoA: string | null;
  versaoB: string | null;
  setVersaoA: (id: string) => void;
  setVersaoB: (id: string) => void;
  historico: EventoHistorico[];
}

const Ctx = createContext<EstudioState | null>(null);

let seq = 100;
const nextId = () => `x${seq++}`;

const agora = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const CHAVE = "estudio:v1";

interface Persistido {
  docs: Record<string, DesignDoc>;
  versoes: Record<string, VersaoDoc[]>;
  designs: DesignItem[];
  abas: OpenTab[];
  projeto: string;
  historico: EventoHistorico[];
}

export function EstudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const partes = pathname.split("/").filter(Boolean);
  const idRota = partes[0] === "d" ? (partes[1] ?? "") : "";
  const secao = partes[0] === "d" ? (partes[2] ?? "") : "";
  const sub = partes[0] === "d" ? (partes[3] ?? "") : "";

  const modoEdicao = secao === "editar";
  const painelEdicao = (modoEdicao ? ((sub || "texto") as PainelEdicao) : null) as PainelEdicao;
  const painelDireito: PainelDireito = modoEdicao ? "props" : (painelPorSlug[secao] ?? null);
  const apresentando = secao === "apresentar";

  const [projeto, setProjeto] = useState("Aurora — produto");
  const [designs, setDesigns] = useState<DesignItem[]>(designsMock);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroBiblioteca>("recentes");
  const [abas, setAbas] = useState<OpenTab[]>(abasIniciais);
  const [zoom, setZoom] = useState(100);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [ferramenta, setFerramenta] = useState<Ferramenta>("cursor");
  const [selecionado, setSelecionado] = useState<ElId | null>("titulo");
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
  const [docs, setDocs] = useState<Record<string, DesignDoc>>({});
  const [versoesPorId, setVersoesPorId] = useState<Record<string, VersaoDoc[]>>({});
  const [historico, setHistorico] = useState<EventoHistorico[]>([]);
  const [versaoA, setVersaoA] = useState<string | null>(null);
  const [versaoB, setVersaoB] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  const abaAtiva = idRota;
  const nomeAtivo = designs.find((d) => d.id === abaAtiva)?.nome ?? "Novo design";

  /* ---------- persistência ---------- */
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        const p = JSON.parse(bruto) as Partial<Persistido>;
        if (p.docs) setDocs(p.docs);
        if (p.versoes) setVersoesPorId(p.versoes);
        if (p.designs?.length) setDesigns(p.designs);
        if (p.abas?.length) setAbas(p.abas);
        if (p.projeto) setProjeto(p.projeto);
        if (p.historico) setHistorico(p.historico);
      }
    } catch {
      /* estado corrompido: segue com o padrão */
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    const payload: Persistido = { docs, versoes: versoesPorId, designs, abas, projeto, historico };
    try {
      localStorage.setItem(CHAVE, JSON.stringify(payload));
    } catch {
      /* cota cheia: ignora */
    }
  }, [hidratado, docs, versoesPorId, designs, abas, projeto, historico]);

  const docsRef = useRef(docs);
  docsRef.current = docs;

  const doc = useMemo(() => docs[abaAtiva] ?? docPadrao(nomeAtivo), [docs, abaAtiva, nomeAtivo]);
  const versoes = useMemo(() => versoesPorId[abaAtiva] ?? [], [versoesPorId, abaAtiva]);

  const registrar = useCallback((quem: string, o: string) => {
    setHistorico((h) => [{ id: nextId(), quem, o, quando: agora() }, ...h].slice(0, 40));
  }, []);

  const marcarAtualizado = useCallback((id: string) => {
    setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, atualizado: "agora" } : d)));
  }, []);

  const atualizarDoc = useCallback(
    (fn: (d: DesignDoc) => DesignDoc, rotulo: string) => {
      if (!abaAtiva) return;
      setDocs((ds) => {
        const atual = ds[abaAtiva] ?? docPadrao(nomeAtivo);
        return { ...ds, [abaAtiva]: fn(clonarDoc(atual)) };
      });
      marcarAtualizado(abaAtiva);
      if (rotulo) registrar("Você", rotulo);
    },
    [abaAtiva, nomeAtivo, marcarAtualizado, registrar],
  );

  const recarregarDoc = useCallback(() => {
    if (!abaAtiva) return;
    setDocs((ds) => ({ ...ds, [abaAtiva]: docPadrao(nomeAtivo) }));
    registrar("Você", "Recarregou o arquivo do zero");
  }, [abaAtiva, nomeAtivo, registrar]);

  const criarVersao = useCallback(
    (rotulo: string, autor = "Você") => {
      const atual = docs[abaAtiva] ?? docPadrao(nomeAtivo);
      const lista = versoesPorId[abaAtiva] ?? [];
      const v: VersaoDoc = {
        id: nextId(),
        rotulo: rotulo || `v${lista.length + 1}`,
        autor,
        quando: agora(),
        doc: clonarDoc(atual),
      };
      setVersoesPorId((vs) => ({ ...vs, [abaAtiva]: [v, ...(vs[abaAtiva] ?? [])] }));
      setVersaoA(v.id);
      registrar(autor, `Criou ${v.rotulo}`);
      return v;
    },
    [docs, versoesPorId, abaAtiva, nomeAtivo, registrar],
  );

  const restaurarVersao = useCallback(
    (id: string) => {
      const v = (versoesPorId[abaAtiva] ?? []).find((x) => x.id === id);
      if (!v) return;
      setDocs((ds) => ({ ...ds, [abaAtiva]: clonarDoc(v.doc) }));
      registrar("Você", `Restaurou ${v.rotulo}`);
    },
    [versoesPorId, abaAtiva, registrar],
  );

  const duplicarVersao = useCallback(
    (id: string) => {
      const v = (versoesPorId[abaAtiva] ?? []).find((x) => x.id === id);
      if (!v) return;
      const nova: VersaoDoc = { ...v, id: nextId(), rotulo: `${v.rotulo} (cópia)`, quando: agora(), doc: clonarDoc(v.doc) };
      setVersoesPorId((vs) => ({ ...vs, [abaAtiva]: [nova, ...(vs[abaAtiva] ?? [])] }));
      registrar("Você", `Duplicou ${v.rotulo}`);
    },
    [versoesPorId, abaAtiva, registrar],
  );

  const excluirVersao = useCallback(
    (id: string) => {
      setVersoesPorId((vs) => ({ ...vs, [abaAtiva]: (vs[abaAtiva] ?? []).filter((v) => v.id !== id) }));
      setVersaoA((a) => (a === id ? null : a));
      setVersaoB((b) => (b === id ? null : b));
    },
    [abaAtiva],
  );

  const irParaDesign = useCallback(
    (id: string) => {
      if (!id) {
        void navigate({ to: "/biblioteca" });
        return;
      }
      void navigate({ to: "/d/$designId", params: { designId: id } });
    },
    [navigate],
  );

  const setAbaAtiva = irParaDesign;

  const abrirDesign = useCallback(
    (id: string) => {
      const d = designs.find((x) => x.id === id);
      if (d) setAbas((as) => (as.some((a) => a.id === id) ? as : [...as, { id, nome: d.nome, fixada: false }]));
      irParaDesign(id);
    },
    [designs, irParaDesign],
  );

  const fecharAba = useCallback(
    (id: string) => {
      const restantes = abas.filter((a) => a.id !== id);
      setAbas(restantes);
      if (abaAtiva === id) irParaDesign(restantes[0]?.id ?? "");
    },
    [abas, abaAtiva, irParaDesign],
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
      const item = copia.splice(i, 1)[0]!;
      copia.splice(j, 0, item);
      return copia;
    });
  }, []);

  const duplicarDesign = useCallback(
    (id: string) => {
      const d = designs.find((x) => x.id === id);
      if (!d) return;
      const novo = nextId();
      const base = docs[id] ?? docPadrao(d.nome);
      setDesigns((ds) => [{ ...d, id: novo, nome: `${d.nome} (cópia)`, atualizado: "agora", favorito: false }, ...ds]);
      setDocs((ds) => ({ ...ds, [novo]: clonarDoc(base) }));
      setAbas((as) => [...as, { id: novo, nome: `${d.nome} (cópia)`, fixada: false }]);
      registrar("Você", `Duplicou ${d.nome}`);
      irParaDesign(novo);
    },
    [designs, docs, registrar, irParaDesign],
  );

  const excluirDesign = useCallback(
    (id: string) => {
      const restantesAbas = abas.filter((a) => a.id !== id);
      setDesigns((ds) => ds.filter((d) => d.id !== id));
      setAbas(restantesAbas);
      setDocs((ds) => {
        const c = { ...ds };
        delete c[id];
        return c;
      });
      registrar("Você", "Excluiu um arquivo");
      if (abaAtiva === id) irParaDesign(restantesAbas[0]?.id ?? "");
    },
    [abas, abaAtiva, registrar, irParaDesign],
  );

  const renomearDesign = useCallback((id: string, nome: string) => {
    setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, nome } : d)));
    setAbas((as) => as.map((a) => (a.id === id ? { ...a, nome } : a)));
  }, []);

  const novoDesign = useCallback(() => {
    const id = nextId();
    setDesigns((ds) => [
      { id, nome: "Novo design", tipo: "tela", atualizado: "agora", favorito: false, tom: "oklch(0.9 0.03 85)" },
      ...ds,
    ]);
    setDocs((ds) => ({ ...ds, [id]: docPadrao("Novo design") }));
    setAbas((as) => [...as, { id, nome: "Novo design", fixada: false }]);
    irParaDesign(id);
  }, [irParaDesign]);

  const favoritar = useCallback((id: string) => {
    setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, favorito: !d.favorito } : d)));
  }, []);

  const setPainelDireito = useCallback(
    (v: PainelDireito) => {
      if (!abaAtiva) return;
      if (!v) {
        void navigate({ to: "/d/$designId", params: { designId: abaAtiva } });
        return;
      }
      void navigate({ to: "/d/$designId/$painel", params: { designId: abaAtiva, painel: slugPainel[v] } });
    },
    [abaAtiva, navigate],
  );

  const setPainelEdicao = useCallback(
    (v: PainelEdicao) => {
      if (!abaAtiva) return;
      void navigate({
        to: "/d/$designId/editar/$painel",
        params: { designId: abaAtiva, painel: v ?? "texto" },
      });
    },
    [abaAtiva, navigate],
  );

  const setModoEdicao = useCallback(
    (v: boolean) => {
      if (!abaAtiva) return;
      if (v) {
        void navigate({ to: "/d/$designId/editar/$painel", params: { designId: abaAtiva, painel: "texto" } });
      } else {
        void navigate({ to: "/d/$designId", params: { designId: abaAtiva } });
      }
    },
    [abaAtiva, navigate],
  );

  const setApresentando = useCallback(
    (v: boolean) => {
      if (!abaAtiva) return;
      if (v) void navigate({ to: "/d/$designId/apresentar", params: { designId: abaAtiva } });
      else void navigate({ to: "/d/$designId", params: { designId: abaAtiva } });
    },
    [abaAtiva, navigate],
  );

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

  const editarComentario = useCallback((id: string, texto: string) => {
    setComentarios((cs) => cs.map((c) => (c.id === id ? { ...c, texto } : c)));
  }, []);

  /* ---------- conversa que altera o documento ---------- */
  const timers = useRef<number[]>([]);
  const limparTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => limparTimers, []);

  const executarPedido = useCallback(
    (texto: string) => {
      if (!abaAtiva) return;
      limparTimers();
      const plano = interpretarPedido(texto, {
        sistemaAtivo,
        temChipArquivo: contexto.some((c) => c.tipo === "arquivo"),
        temChipSistema: contexto.some((c) => c.tipo === "design system"),
        selecionado,
      });
      const idBot = nextId();
      const tarefas = plano.passos.map((p) => ({
        id: nextId(),
        texto: p.texto,
        estado: "pendente" as const,
      }));
      setConversa((c) => [...c, { id: idBot, autor: "assistente", texto: "Trabalhando no arquivo…", tarefas }]);
      setEnviando(true);

      const proximaVersao = `v${(versoesPorId[abaAtiva] ?? []).length + 1}`;

      plano.passos.forEach((passo, i) => {
        const t = window.setTimeout(
          () => {
            setConversa((c) =>
              c.map((m) =>
                m.id !== idBot
                  ? m
                  : {
                      ...m,
                      tarefas: m.tarefas?.map((tar, j) => ({
                        ...tar,
                        estado: j < i ? "feito" : j === i ? "ativo" : "pendente",
                      })),
                    },
              ),
            );
            setDocs((ds) => {
              const atual = ds[abaAtiva] ?? docPadrao(nomeAtivo);
              return { ...ds, [abaAtiva]: passo.aplicar(clonarDoc(atual)) };
            });

            if (i === plano.passos.length - 1) {
              const fim = window.setTimeout(() => {
                setConversa((c) =>
                  c.map((m) =>
                    m.id !== idBot
                      ? m
                      : {
                          ...m,
                          texto: plano.resumo,
                          tarefas: m.tarefas?.map((tar) => ({ ...tar, estado: "feito" as const })),
                          arquivo: { nome: nomeAtivo, tipo: "tela", versao: proximaVersao },
                        },
                  ),
                );
                const v: VersaoDoc = {
                  id: nextId(),
                  rotulo: proximaVersao,
                  autor: "Assistente",
                  quando: agora(),
                  doc: clonarDoc(docsRef.current[abaAtiva] ?? docPadrao(nomeAtivo)),
                };
                setVersoesPorId((vs) => ({ ...vs, [abaAtiva]: [v, ...(vs[abaAtiva] ?? [])] }));
                setVersaoA(v.id);
                registrar("Assistente", plano.resumo);
                marcarAtualizado(abaAtiva);
                setEnviando(false);
              }, 320);
              timers.current.push(fim);
            }
          },
          420 * (i + 1),
        );
        timers.current.push(t);
      });
    },
    [abaAtiva, nomeAtivo, sistemaAtivo, contexto, selecionado, versoesPorId, registrar, marcarAtualizado],
  );

  const enviarPedido = useCallback(
    (texto: string) => {
      setConversa((c) => [...c, { id: nextId(), autor: "voce", texto }]);
      executarPedido(texto);
    },
    [executarPedido],
  );

  const reenviarMensagem = useCallback(
    (id: string) => {
      const m = conversa.find((x) => x.id === id);
      if (m) executarPedido(m.texto);
    },
    [conversa, executarPedido],
  );

  const editarMensagem = useCallback(
    (id: string, texto: string) => {
      setConversa((c) => c.map((m) => (m.id === id ? { ...m, texto } : m)));
      executarPedido(texto);
    },
    [executarPedido],
  );

  const ramificar = useCallback(
    (id: string) => {
      const idx = conversa.findIndex((m) => m.id === id);
      if (idx < 0 || !abaAtiva) return;
      const base = designs.find((d) => d.id === abaAtiva);
      const novo = nextId();
      const nome = `${base?.nome ?? "Design"} — ramo`;
      setDesigns((ds) => [
        {
          id: novo,
          nome,
          tipo: base?.tipo ?? "tela",
          atualizado: "agora",
          favorito: false,
          tom: base?.tom ?? "oklch(0.9 0.03 85)",
        },
        ...ds,
      ]);
      setDocs((ds) => ({ ...ds, [novo]: clonarDoc(ds[abaAtiva] ?? docPadrao(nomeAtivo)) }));
      setAbas((as) => [...as, { id: novo, nome, fixada: false }]);
      setConversa(conversa.slice(0, idx + 1));
      registrar("Você", `Ramificou em ${nome}`);
      irParaDesign(novo);
    },
    [conversa, abaAtiva, designs, nomeAtivo, registrar, irParaDesign],
  );

  const pararGeracao = useCallback(() => {
    limparTimers();
    setEnviando(false);
    setConversa((c) =>
      c.map((m, i) =>
        i === c.length - 1 && m.autor === "assistente"
          ? {
              ...m,
              texto: "Parei aqui. O que já apliquei ficou no palco.",
              tarefas: m.tarefas?.map((t) => (t.estado === "ativo" ? { ...t, estado: "pendente" as const } : t)),
            }
          : m,
      ),
    );
  }, []);

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
      nomeAtivo,
      abrirDesign,
      fecharAba,
      fixarAba,
      moverAba,
      setAbaAtiva,
      duplicarDesign,
      excluirDesign,
      renomearDesign,
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
      editarComentario,
      filtroComentarios,
      setFiltroComentarios,
      comentarioAtivo,
      setComentarioAtivo,
      conversa,
      enviando,
      enviarPedido,
      reenviarMensagem,
      editarMensagem,
      ramificar,
      pararGeracao,
      contexto,
      removerContexto,
      adicionarContexto,
      sistemaAtivo,
      setSistemaAtivo,
      doc,
      atualizarDoc,
      recarregarDoc,
      versoes,
      criarVersao,
      restaurarVersao,
      duplicarVersao,
      excluirVersao,
      versaoA,
      versaoB,
      setVersaoA,
      setVersaoB,
      historico,
    }),
    [
      projeto,
      designs,
      busca,
      filtro,
      abas,
      abaAtiva,
      nomeAtivo,
      abrirDesign,
      fecharAba,
      fixarAba,
      moverAba,
      setAbaAtiva,
      duplicarDesign,
      excluirDesign,
      renomearDesign,
      novoDesign,
      favoritar,
      zoom,
      viewport,
      ferramenta,
      apresentando,
      setApresentando,
      modoEdicao,
      setModoEdicao,
      selecionado,
      painelEdicao,
      setPainelEdicao,
      painelDireito,
      setPainelDireito,
      modoComentario,
      comentarios,
      addComentario,
      resolverComentario,
      responderComentario,
      editarComentario,
      filtroComentarios,
      comentarioAtivo,
      conversa,
      enviando,
      enviarPedido,
      reenviarMensagem,
      editarMensagem,
      ramificar,
      pararGeracao,
      contexto,
      removerContexto,
      adicionarContexto,
      sistemaAtivo,
      doc,
      atualizarDoc,
      recarregarDoc,
      versoes,
      criarVersao,
      restaurarVersao,
      duplicarVersao,
      excluirVersao,
      versaoA,
      versaoB,
      historico,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEstudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEstudio precisa estar dentro de EstudioProvider");
  return ctx;
}
