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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, CommentPin, DesignItem, OpenTab } from "@/lib/estudio-mock";
import {
  clonarDoc,
  docPadrao,
  ehDocHtml,
  ehDocCanvas,
  interpretarPedido,
  previewsHtml,
  type DesignDoc,
  type DocHtml,
  type DocCanvas,
  type ElId,
  type PresetNovo,
} from "@/lib/estudio-doc";
import { supabase } from "@/lib/supabase";
import { canvasAgrum, canvasBarretos } from "@/lib/estudio-canvas-seeds";
import {
  atualizarComentario,
  atualizarDesign,
  atualizarMensagem,
  carregarDesign,
  criarComentario,
  criarDesign,
  criarMensagem,
  criarResposta,
  criarVersaoDb,
  garantirProjeto,
  hora,
  listarComentarios,
  listarDesigns,
  listarMensagens,
  listarVersoes,
  nomeDoUsuario,
  paraItem,
  paraMensagem,
  removerComentario,
  removerDesign,
  removerMensagem,
  removerVersao,
  renomearProjeto,
  salvarDoc,
} from "@/lib/estudio-db";

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
  novoDesign: (preset?: PresetNovo) => void;
  docHtml: DocHtml | null;
  docCanvas: DocCanvas | null;
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
  apagarComentario: (id: string) => void;
  apagarMensagem: (id: string) => void;
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
  criarVersao: (rotulo: string, autor?: string) => string;
  restaurarVersao: (id: string) => void;
  duplicarVersao: (id: string) => void;
  excluirVersao: (id: string) => void;
  versaoA: string | null;
  versaoB: string | null;
  setVersaoA: (id: string) => void;
  setVersaoB: (id: string) => void;
  historico: EventoHistorico[];
  /* sessão */
  usuarioEmail: string | null;
  temSessao: boolean;
  carregandoSessao: boolean;
  pedirLogin: boolean;
  setPedirLogin: (v: boolean) => void;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  /* cromado */
  bibliotecaAberta: boolean;
  setBibliotecaAberta: (v: boolean) => void;
  conversaAberta: boolean;
  setConversaAberta: (v: boolean) => void;
}

const Ctx = createContext<EstudioState | null>(null);

let seq = 100;
const nextId = () => `x${seq++}`;

const agora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/* cromado (só interface) */
const CHROME = "estudio:cromado:v1";
interface Cromado {
  zoom: number;
  bibliotecaAberta: boolean;
  conversaAberta: boolean;
  abas: OpenTab[];
}

export function EstudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const partes = pathname.split("/").filter(Boolean);
  const idRota = partes[0] === "d" ? (partes[1] ?? "") : "";
  const secao = partes[0] === "d" ? (partes[2] ?? "") : "";
  const sub = partes[0] === "d" ? (partes[3] ?? "") : "";

  const modoEdicao = secao === "editar";
  const painelEdicao = (modoEdicao ? ((sub || "texto") as PainelEdicao) : null) as PainelEdicao;
  const painelDireito: PainelDireito = modoEdicao ? "props" : (painelPorSlug[secao] ?? null);
  const apresentando = secao === "apresentar";

  /* ---------- sessão ---------- */
  const sessao = useQuery({
    queryKey: ["sessao"],
    queryFn: async () => (await supabase.auth.getUser()).data.user ?? null,
    staleTime: 30_000,
  });
  const user = sessao.data ?? null;
  const temSessao = !!user;
  const autor = nomeDoUsuario(user);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento !== "SIGNED_IN" && evento !== "SIGNED_OUT" && evento !== "USER_UPDATED") return;
      void qc.invalidateQueries({ queryKey: ["sessao"] });
      if (evento === "SIGNED_OUT") qc.clear();
      else void qc.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  const projetoQ = useQuery({
    queryKey: ["projeto", user?.id],
    queryFn: garantirProjeto,
    enabled: temSessao,
  });
  const projectId = projetoQ.data?.id ?? "";

  /* ---------- dados ---------- */
  const designsQ = useQuery({
    queryKey: ["designs", user?.id],
    queryFn: listarDesigns,
    enabled: temSessao,
  });
  const designs = useMemo(() => (designsQ.data ?? []).map(paraItem), [designsQ.data]);

  const abaAtiva = idRota;

  const designQ = useQuery({
    queryKey: ["design", abaAtiva],
    queryFn: () => carregarDesign(abaAtiva),
    enabled: temSessao && !!abaAtiva,
  });

  const versoesQ = useQuery({
    queryKey: ["versions", abaAtiva],
    queryFn: () => listarVersoes(abaAtiva),
    enabled: temSessao && !!abaAtiva,
  });

  const mensagensQ = useQuery({
    queryKey: ["messages", abaAtiva],
    queryFn: () => listarMensagens(abaAtiva),
    enabled: temSessao && !!abaAtiva,
  });

  const comentariosQ = useQuery({
    queryKey: ["comments", abaAtiva],
    queryFn: () => listarComentarios(abaAtiva),
    enabled: temSessao && !!abaAtiva,
  });

  const nomeAtivo = designQ.data?.nome ?? designs.find((d) => d.id === abaAtiva)?.nome ?? "Novo design";

  /* ---------- documento vivo (espelho local + gravação com debounce) ---------- */
  const [docLocal, setDocLocal] = useState<DesignDoc | null>(null);
  const [docId, setDocId] = useState("");
  const salvarTimer = useRef<number | null>(null);

  useEffect(() => {
    const remoto = designQ.data;
    if (!remoto) {
      if (!abaAtiva) setDocLocal(null);
      return;
    }
    if (remoto.id !== docId) {
      setDocId(remoto.id);
      setDocLocal(
        remoto.doc && !ehDocHtml(remoto.doc) && !ehDocCanvas(remoto.doc) && Object.keys(remoto.doc).length
          ? (remoto.doc as DesignDoc)
          : docPadrao(remoto.nome),
      );
    }
  }, [designQ.data, docId, abaAtiva]);

  const docRemoto = designQ.data?.doc;
  const docHtml = ehDocHtml(docRemoto) ? docRemoto : null;
  const docCanvas = ehDocCanvas(docRemoto) ? docRemoto : null;
  const doc = docLocal ?? docPadrao(nomeAtivo);
  const docRef = useRef(doc);
  docRef.current = doc;

  const agendarSalvar = useCallback(
    (id: string, novo: DesignDoc) => {
      if (salvarTimer.current) window.clearTimeout(salvarTimer.current);
      salvarTimer.current = window.setTimeout(() => {
        void salvarDoc(id, novo)
          .then(() => qc.invalidateQueries({ queryKey: ["designs", user?.id] }))
          .catch(() => undefined);
      }, 500);
    },
    [qc, user?.id],
  );

  const versoes = useMemo<VersaoDoc[]>(
    () =>
      (versoesQ.data ?? []).map((v) => ({
        id: v.id,
        rotulo: v.rotulo,
        autor: v.autor,
        quando: hora(v.criado_em),
        doc: v.doc,
      })),
    [versoesQ.data],
  );

  const conversaRemota = useMemo(() => (mensagensQ.data ?? []).map(paraMensagem), [mensagensQ.data]);
  const [conversaLocal, setConversaLocal] = useState<ChatMessage[] | null>(null);
  const conversa = conversaLocal ?? conversaRemota;
  useEffect(() => {
    setConversaLocal(null);
  }, [abaAtiva]);

  const comentarios = comentariosQ.data ?? [];

  /* ---------- estado de interface ---------- */
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroBiblioteca>("recentes");
  const [abas, setAbas] = useState<OpenTab[]>([]);
  const [zoom, setZoom] = useState(100);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [ferramenta, setFerramenta] = useState<Ferramenta>("cursor");
  const [selecionado, setSelecionado] = useState<ElId | null>("titulo");
  const [modoComentario, setModoComentario] = useState(false);
  const [filtroComentarios, setFiltroComentarios] = useState<"abertos" | "resolvidos">("abertos");
  const [comentarioAtivo, setComentarioAtivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [contexto, setContexto] = useState<{ id: string; rotulo: string; tipo: string }[]>([]);
  const [sistemaAtivo, setSistemaAtivo] = useState("s1");
  const [historico, setHistorico] = useState<EventoHistorico[]>([]);
  const [versaoA, setVersaoA] = useState<string | null>(null);
  const [versaoB, setVersaoB] = useState<string | null>(null);
  const [pedirLogin, setPedirLogin] = useState(false);
  const [bibliotecaAberta, setBibliotecaAberta] = useState(false);
  const [conversaAberta, setConversaAberta] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  /* cromado no localStorage */
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHROME);
      if (bruto) {
        const c = JSON.parse(bruto) as Partial<Cromado>;
        if (typeof c.zoom === "number") setZoom(c.zoom);
        if (typeof c.bibliotecaAberta === "boolean") setBibliotecaAberta(c.bibliotecaAberta);
        if (typeof c.conversaAberta === "boolean") setConversaAberta(c.conversaAberta);
        if (c.abas?.length) setAbas(c.abas);
      }
    } catch {
      /* ignora */
    }
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    const payload: Cromado = { zoom, bibliotecaAberta, conversaAberta, abas };
    try {
      localStorage.setItem(CHROME, JSON.stringify(payload));
    } catch {
      /* ignora */
    }
  }, [hidratado, zoom, bibliotecaAberta, conversaAberta, abas]);

  /* aba do design aberto */
  useEffect(() => {
    if (!abaAtiva || !designQ.data) return;
    setAbas((as) =>
      as.some((a) => a.id === abaAtiva)
        ? as.map((a) => (a.id === abaAtiva ? { ...a, nome: designQ.data!.nome } : a))
        : [...as, { id: abaAtiva, nome: designQ.data!.nome, fixada: false }],
    );
  }, [abaAtiva, designQ.data]);

  /* chip de contexto do arquivo aberto */
  useEffect(() => {
    if (!designQ.data) return;
    setContexto([{ id: "arquivo", rotulo: designQ.data.nome, tipo: "arquivo" }]);
  }, [designQ.data]);

  const registrar = useCallback((quem: string, o: string) => {
    setHistorico((h) => [{ id: nextId(), quem, o, quando: agora() }, ...h].slice(0, 40));
  }, []);

  /* ---------- sessão: ações ---------- */
  const entrar = useCallback(
    async (email: string, senha: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      setPedirLogin(false);
      await qc.invalidateQueries();
    },
    [qc],
  );

  const cadastrar = useCallback(
    async (email: string, senha: string) => {
      const { error } = await supabase.auth.signUp({ email, password: senha });
      if (error) throw error;
      const login = await supabase.auth.signInWithPassword({ email, password: senha });
      if (login.error) throw login.error;
      setPedirLogin(false);
      await qc.invalidateQueries();
    },
    [qc],
  );

  const sair = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    setAbas([]);
    void navigate({ to: "/biblioteca" });
  }, [qc, navigate]);

  /* ---------- projeto ---------- */
  const projeto = projetoQ.data?.nome ?? (temSessao ? "Meu projeto" : "Estúdio");
  const setProjeto = useCallback(
    (v: string) => {
      if (!projectId) return;
      void renomearProjeto(projectId, v).then(() => qc.invalidateQueries({ queryKey: ["projeto", user?.id] }));
    },
    [projectId, qc, user?.id],
  );

  /* ---------- documento ---------- */
  const atualizarDoc = useCallback(
    (fn: (d: DesignDoc) => DesignDoc, rotulo: string) => {
      if (!abaAtiva) return;
      const novo = fn(clonarDoc(docRef.current));
      setDocLocal(novo);
      docRef.current = novo;
      agendarSalvar(abaAtiva, novo);
      if (rotulo) registrar(autor, rotulo);
    },
    [abaAtiva, agendarSalvar, registrar, autor],
  );

  const recarregarDoc = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["design", abaAtiva] });
    void carregarDesign(abaAtiva).then((r) => {
      if (r) setDocLocal(r.doc && !ehDocHtml(r.doc) && !ehDocCanvas(r.doc) && Object.keys(r.doc).length ? (r.doc as DesignDoc) : docPadrao(r.nome));
    });
  }, [abaAtiva, qc]);

  const criarVersao = useCallback(
    (rotulo: string, quem = autor) => {
      const label = rotulo || `v${versoes.length + 1}`;
      if (!abaAtiva) return label;
      void criarVersaoDb(abaAtiva, label, quem, clonarDoc(docRef.current))
        .then((v) => {
          setVersaoA(v.id);
          registrar(quem, `Criou ${label}`);
          return qc.invalidateQueries({ queryKey: ["versions", abaAtiva] });
        })
        .catch(() => undefined);
      return label;
    },
    [abaAtiva, versoes.length, registrar, qc, autor],
  );

  const restaurarVersao = useCallback(
    (id: string) => {
      const v = versoes.find((x) => x.id === id);
      if (!v || !abaAtiva) return;
      const copia = clonarDoc(v.doc);
      setDocLocal(copia);
      docRef.current = copia;
      void salvarDoc(abaAtiva, copia).then(() => qc.invalidateQueries({ queryKey: ["design", abaAtiva] }));
      registrar(autor, `Restaurou ${v.rotulo}`);
    },
    [versoes, abaAtiva, registrar, qc, autor],
  );

  const duplicarVersao = useCallback(
    (id: string) => {
      const v = versoes.find((x) => x.id === id);
      if (!v || !abaAtiva) return;
      void criarVersaoDb(abaAtiva, `${v.rotulo} (cópia)`, autor, clonarDoc(v.doc)).then(() =>
        qc.invalidateQueries({ queryKey: ["versions", abaAtiva] }),
      );
    },
    [versoes, abaAtiva, qc, autor],
  );

  const excluirVersao = useCallback(
    (id: string) => {
      void removerVersao(id).then(() => qc.invalidateQueries({ queryKey: ["versions", abaAtiva] }));
      setVersaoA((a) => (a === id ? null : a));
      setVersaoB((b) => (b === id ? null : b));
    },
    [qc, abaAtiva],
  );

  /* ---------- navegação ---------- */
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
  const abrirDesign = irParaDesign;

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

  /* ---------- designs ---------- */
  const novoDesign = useCallback(
    (preset?: PresetNovo) => {
    if (!temSessao || !projectId) {
      setPedirLogin(true);
      return;
    }
    const modelo = preset && preset !== "branco" ? previewsHtml[preset] : null;
    const docModelo = preset === "agrum" ? canvasAgrum : preset === "barretos" ? canvasBarretos : null;
    void criarDesign(
      projectId,
      modelo ? modelo.nome : undefined,
      docModelo ?? (modelo ? { kind: "html" as const, src: modelo.src } : undefined),
    ).then(async (row) => {
      await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
      irParaDesign(row.id);
    });
    },
    [temSessao, projectId, qc, user?.id, irParaDesign],
  );

  const duplicarDesign = useCallback(
    (id: string) => {
      if (!temSessao || !projectId) {
        setPedirLogin(true);
        return;
      }
      void carregarDesign(id).then(async (r) => {
        if (!r) return;
        const row = await criarDesign(projectId, `${r.nome} (cópia)`, clonarDoc(r.doc), r.tom);
        await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
        registrar(autor, `Duplicou ${r.nome}`);
        irParaDesign(row.id);
      });
    },
    [temSessao, projectId, qc, user?.id, irParaDesign, registrar, autor],
  );

  const excluirDesign = useCallback(
    (id: string) => {
      const restantes = abas.filter((a) => a.id !== id);
      void removerDesign(id).then(async () => {
        setAbas(restantes);
        await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
        if (abaAtiva === id) irParaDesign(restantes[0]?.id ?? "");
      });
    },
    [abas, abaAtiva, qc, user?.id, irParaDesign],
  );

  const renomearDesign = useCallback(
    (id: string, nome: string) => {
      setAbas((as) => as.map((a) => (a.id === id ? { ...a, nome } : a)));
      void atualizarDesign(id, { nome }).then(() => {
        void qc.invalidateQueries({ queryKey: ["designs", user?.id] });
        void qc.invalidateQueries({ queryKey: ["design", id] });
      });
    },
    [qc, user?.id],
  );

  const favoritar = useCallback(
    (id: string) => {
      const atual = designs.find((d) => d.id === id);
      void atualizarDesign(id, { favorito: !atual?.favorito }).then(() =>
        qc.invalidateQueries({ queryKey: ["designs", user?.id] }),
      );
    },
    [designs, qc, user?.id],
  );

  /* ---------- painéis ---------- */
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

  /* ---------- comentários ---------- */
  const invalidarComentarios = useCallback(
    () => qc.invalidateQueries({ queryKey: ["comments", abaAtiva] }),
    [qc, abaAtiva],
  );

  const addComentario = useCallback(
    (x: number, y: number) => {
      if (!temSessao || !abaAtiva) {
        setPedirLogin(true);
        return;
      }
      void criarComentario(abaAtiva, x, y, autor).then(async (c) => {
        await invalidarComentarios();
        setComentarioAtivo(c.id);
        setFiltroComentarios("abertos");
      });
    },
    [temSessao, abaAtiva, autor, invalidarComentarios],
  );

  const resolverComentario = useCallback(
    (id: string) => {
      const c = comentarios.find((x) => x.id === id);
      void atualizarComentario(id, { resolvido: !c?.resolvido }).then(invalidarComentarios);
    },
    [comentarios, invalidarComentarios],
  );

  const responderComentario = useCallback(
    (id: string, texto: string) => {
      void criarResposta(id, texto, autor).then(invalidarComentarios);
    },
    [autor, invalidarComentarios],
  );

  const apagarComentario = useCallback(
    (id: string) => {
      void removerComentario(id).then(async () => {
        setComentarioAtivo((a) => (a === id ? null : a));
        await invalidarComentarios();
      });
    },
    [invalidarComentarios],
  );

  const apagarMensagem = useCallback(
    (id: string) => {
      setConversaLocal((c) => (c ?? []).filter((m) => m.id !== id));
      void removerMensagem(id).then(() => {
        setConversaLocal(null);
        void qc.invalidateQueries({ queryKey: ["messages", abaAtiva] });
      });
    },
    [qc, abaAtiva],
  );

  const editarComentario = useCallback(
    (id: string, texto: string) => {
      qc.setQueryData<CommentPin[]>(["comments", abaAtiva], (antigo) =>
        (antigo ?? []).map((c) => (c.id === id ? { ...c, texto } : c)),
      );
      void atualizarComentario(id, { texto });
    },
    [qc, abaAtiva],
  );

  /* ---------- conversa que altera o documento ---------- */
  const timers = useRef<number[]>([]);
  const limparTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => limparTimers, []);

  const executarPedido = useCallback(
    (texto: string) => {
      if (!abaAtiva || !temSessao) {
        setPedirLogin(true);
        return;
      }
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
      setConversaLocal((c) => [
        ...(c ?? conversaRemota),
        { id: idBot, autor: "assistente", texto: "Trabalhando no arquivo…", tarefas },
      ]);
      setEnviando(true);

      const proximaVersao = `v${versoes.length + 1}`;

      plano.passos.forEach((passo, i) => {
        const t = window.setTimeout(
          () => {
            setConversaLocal((c) =>
              (c ?? []).map((m) =>
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
            const novo = passo.aplicar(clonarDoc(docRef.current));
            docRef.current = novo;
            setDocLocal(novo);

            if (i === plano.passos.length - 1) {
              const fim = window.setTimeout(() => {
                const tarefasFeitas = tarefas.map((tar) => ({ ...tar, estado: "feito" as const }));
                const arquivo = { nome: nomeAtivo, tipo: "tela", versao: proximaVersao };
                setConversaLocal((c) =>
                  (c ?? []).map((m) =>
                    m.id !== idBot ? m : { ...m, texto: plano.resumo, tarefas: tarefasFeitas, arquivo },
                  ),
                );
                void (async () => {
                  await salvarDoc(abaAtiva, docRef.current);
                  await criarVersaoDb(abaAtiva, proximaVersao, "Assistente", clonarDoc(docRef.current));
                  await criarMensagem(abaAtiva, "assistente", {
                    texto: plano.resumo,
                    tarefas: tarefasFeitas,
                    arquivo,
                  });
                  setConversaLocal(null);
                  await qc.invalidateQueries({ queryKey: ["messages", abaAtiva] });
                  await qc.invalidateQueries({ queryKey: ["versions", abaAtiva] });
                  await qc.invalidateQueries({ queryKey: ["design", abaAtiva] });
                  await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
                })().catch(() => undefined);
                registrar("Assistente", plano.resumo);
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
    [
      abaAtiva,
      temSessao,
      sistemaAtivo,
      contexto,
      selecionado,
      versoes.length,
      nomeAtivo,
      registrar,
      qc,
      user?.id,
      conversaRemota,
    ],
  );

  const enviarPedido = useCallback(
    (texto: string) => {
      if (!abaAtiva || !temSessao) {
        setPedirLogin(true);
        return;
      }
      setConversaLocal((c) => [...(c ?? conversaRemota), { id: nextId(), autor: "voce", texto }]);
      void criarMensagem(abaAtiva, "voce", { texto }).catch(() => undefined);
      executarPedido(texto);
    },
    [abaAtiva, temSessao, conversaRemota, executarPedido],
  );

  const reenviarMensagem = useCallback(
    (id: string) => {
      const m = conversa.find((x) => x.id === id);
      if (m) enviarPedido(m.texto);
    },
    [conversa, enviarPedido],
  );

  const editarMensagem = useCallback(
    (id: string, texto: string) => {
      setConversaLocal((c) => (c ?? conversaRemota).map((m) => (m.id === id ? { ...m, texto } : m)));
      void atualizarMensagem(id, { texto }).then(() => qc.invalidateQueries({ queryKey: ["messages", abaAtiva] }));
      executarPedido(texto);
    },
    [conversaRemota, executarPedido, qc, abaAtiva],
  );

  const ramificar = useCallback(
    (id: string) => {
      if (!temSessao || !projectId || !abaAtiva) {
        setPedirLogin(true);
        return;
      }
      const idx = conversa.findIndex((m) => m.id === id);
      if (idx < 0) return;
      const nome = `${nomeAtivo} — ramo`;
      void criarDesign(projectId, nome, clonarDoc(docRef.current)).then(async (row) => {
        for (const m of conversa.slice(0, idx + 1)) {
          await criarMensagem(row.id, m.autor, { texto: m.texto, tarefas: m.tarefas, arquivo: m.arquivo });
        }
        await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
        registrar(autor, `Ramificou em ${nome}`);
        irParaDesign(row.id);
      });
    },
    [temSessao, projectId, abaAtiva, conversa, nomeAtivo, qc, user?.id, registrar, irParaDesign, autor],
  );

  const pararGeracao = useCallback(() => {
    limparTimers();
    setEnviando(false);
    setConversaLocal((c) =>
      (c ?? []).map((m, i) =>
        i === c!.length - 1 && m.autor === "assistente"
          ? {
              ...m,
              texto: "Parei aqui. O que já apliquei ficou no palco.",
              tarefas: m.tarefas?.map((t) => (t.estado === "ativo" ? { ...t, estado: "pendente" as const } : t)),
            }
          : m,
      ),
    );
    if (abaAtiva) void salvarDoc(abaAtiva, docRef.current).catch(() => undefined);
  }, [abaAtiva]);

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
      apagarComentario,
      apagarMensagem,
      docHtml,
      docCanvas,
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
      usuarioEmail: user?.email ?? null,
      temSessao,
      carregandoSessao: sessao.isLoading,
      pedirLogin,
      setPedirLogin,
      entrar,
      cadastrar,
      sair,
      bibliotecaAberta,
      setBibliotecaAberta,
      conversaAberta,
      setConversaAberta,
    }),
    [
      projeto,
      setProjeto,
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
      apagarComentario,
      apagarMensagem,
      docHtml,
      docCanvas,
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
      user?.email,
      temSessao,
      sessao.isLoading,
      pedirLogin,
      entrar,
      cadastrar,
      sair,
      bibliotecaAberta,
      conversaAberta,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEstudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEstudio precisa estar dentro de EstudioProvider");
  return ctx;
}
