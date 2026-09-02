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
  carregarTemplate,
  type DesignDoc,
  type DocHtml,
  type DocCanvas,
  type ElId,
  type PresetNovo,
} from "@/lib/estudio-doc";
import { supabase } from "@/lib/supabase";
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

import { slugPainel } from "@/lib/estudio-paineis";

export type Viewport = "mobile" | "tablet" | "desktop";
export type Ferramenta = "cursor" | "mao" | "regua" | "grade";
export type PainelDireito = "props" | "camadas" | "versoes" | "comentarios" | "codigo" | null;
export type PainelEdicao = "simples" | "pro" | null;
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
  paginaCanvas: string | null;
  setPaginaCanvas: (v: string | null) => void;
  camadaCanvas: string | null;
  setCamadaCanvas: (v: string | null) => void;
  atualizarDocCanvas: (fn: (d: DocCanvas) => DocCanvas, rotulo: string) => void;
  /* rascunho do inspector Editar */
  sujo: boolean;
  docSalvo: DesignDoc;
  canvasSalvo: DocCanvas | null;
  salvarRascunho: () => void;
  descartarRascunho: () => void;
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
  /* desfazer / refazer */
  desfazer: () => void;
  refazer: () => void;
  podeDesfazer: boolean;
  podeRefazer: boolean;
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

/** instantâneo do documento para desfazer/refazer */
interface Instantaneo {
  doc: DesignDoc | null;
  canvas: DocCanvas | null;
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
  const painelEdicao: PainelEdicao = modoEdicao ? (sub === "pro" ? "pro" : "simples") : null;
  const painelDireito: PainelDireito = painelPorSlug[secao] ?? null;
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

  const nomeAtivo =
    designQ.data?.nome ?? designs.find((d) => d.id === abaAtiva)?.nome ?? "Novo design";

  /* ---------- documento vivo (espelho local + gravação com debounce) ---------- */
  const [docLocal, setDocLocal] = useState<DesignDoc | null>(null);
  const [canvasLocal, setCanvasLocal] = useState<DocCanvas | null>(null);
  const [paginaCanvas, setPaginaCanvas] = useState<string | null>(null);
  const [camadaCanvas, setCamadaCanvas] = useState<string | null>(null);
  const [docId, setDocId] = useState("");
  const salvarTimer = useRef<number | null>(null);
  /* rascunho: enquanto o inspector Editar está aberto nada vai ao banco */
  const [baseDoc, setBaseDoc] = useState<DesignDoc | null>(null);
  const [baseCanvas, setBaseCanvas] = useState<DocCanvas | null>(null);
  const [sujo, setSujo] = useState(false);
  const modoEdicaoRef = useRef(modoEdicao);
  modoEdicaoRef.current = modoEdicao;

  /* pilhas de desfazer / refazer (documento inteiro, agrupado por rótulo + tempo) */
  const pilhaDesfazer = useRef<Instantaneo[]>([]);
  const pilhaRefazer = useRef<Instantaneo[]>([]);
  const ultimoPasso = useRef<{ rotulo: string; t: number }>({ rotulo: "", t: 0 });
  const [podeDesfazer, setPodeDesfazer] = useState(false);
  const [podeRefazer, setPodeRefazer] = useState(false);
  const sincronizarPilhas = useCallback(() => {
    setPodeDesfazer(pilhaDesfazer.current.length > 0);
    setPodeRefazer(pilhaRefazer.current.length > 0);
  }, []);
  const limparPilhas = useCallback(() => {
    pilhaDesfazer.current = [];
    pilhaRefazer.current = [];
    ultimoPasso.current = { rotulo: "", t: 0 };
    sincronizarPilhas();
  }, [sincronizarPilhas]);

  useEffect(() => {
    const remoto = designQ.data;
    if (!remoto) {
      if (!abaAtiva) setDocLocal(null);
      return;
    }
    if (remoto.id !== docId) {
      setDocId(remoto.id);
      setCanvasLocal(ehDocCanvas(remoto.doc) ? (remoto.doc as DocCanvas) : null);
      setPaginaCanvas(null);
      setCamadaCanvas(null);
      setBaseDoc(null);
      setBaseCanvas(null);
      setSujo(false);
      limparPilhas();
      setDocLocal(
        remoto.doc &&
          !ehDocHtml(remoto.doc) &&
          !ehDocCanvas(remoto.doc) &&
          Object.keys(remoto.doc).length
          ? (remoto.doc as DesignDoc)
          : docPadrao(remoto.nome),
      );
    }
  }, [designQ.data, docId, abaAtiva, limparPilhas]);

  const docRemoto = designQ.data?.doc;
  const docHtml = ehDocHtml(docRemoto) ? docRemoto : null;
  const docCanvas = canvasLocal ?? (ehDocCanvas(docRemoto) ? docRemoto : null);
  const canvasRef = useRef<DocCanvas | null>(docCanvas);
  canvasRef.current = docCanvas;
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

  const conversaRemota = useMemo(
    () => (mensagensQ.data ?? []).map(paraMensagem),
    [mensagensQ.data],
  );
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
      void renomearProjeto(projectId, v).then(() =>
        qc.invalidateQueries({ queryKey: ["projeto", user?.id] }),
      );
    },
    [projectId, qc, user?.id],
  );

  /* ---------- documento ---------- */
  const empilharDesfazer = useCallback(
    (anterior: Instantaneo, rotulo: string) => {
      const t = Date.now();
      const agrupa =
        pilhaDesfazer.current.length > 0 &&
        ultimoPasso.current.rotulo === rotulo &&
        t - ultimoPasso.current.t < 400;
      ultimoPasso.current = { rotulo, t };
      if (agrupa) return;
      pilhaDesfazer.current = [...pilhaDesfazer.current, anterior].slice(-50);
      pilhaRefazer.current = [];
      sincronizarPilhas();
    },
    [sincronizarPilhas],
  );

  const atualizarDoc = useCallback(
    (fn: (d: DesignDoc) => DesignDoc, rotulo: string) => {
      if (!abaAtiva) return;
      const anterior = docRef.current;
      const novo = fn(clonarDoc(anterior));
      empilharDesfazer({ doc: clonarDoc(anterior), canvas: null }, rotulo);
      setDocLocal(novo);
      docRef.current = novo;
      if (modoEdicaoRef.current) {
        setBaseDoc((b) => b ?? clonarDoc(anterior));
        setSujo(true);
      } else {
        agendarSalvar(abaAtiva, novo);
      }
      if (rotulo) registrar(autor, rotulo);
    },
    [abaAtiva, agendarSalvar, registrar, autor, empilharDesfazer],
  );

  const atualizarDocCanvas = useCallback(
    (fn: (d: DocCanvas) => DocCanvas, rotulo: string) => {
      const atual = canvasRef.current;
      if (!abaAtiva || !atual) return;
      const novo = fn(JSON.parse(JSON.stringify(atual)) as DocCanvas);
      empilharDesfazer(
        { doc: null, canvas: JSON.parse(JSON.stringify(atual)) as DocCanvas },
        rotulo,
      );
      setCanvasLocal(novo);
      canvasRef.current = novo;
      if (modoEdicaoRef.current) {
        setBaseCanvas((b) => b ?? (JSON.parse(JSON.stringify(atual)) as DocCanvas));
        setSujo(true);
      } else {
        agendarSalvar(abaAtiva, novo as unknown as DesignDoc);
      }
      if (rotulo) registrar(autor, rotulo);
    },
    [abaAtiva, agendarSalvar, registrar, autor, empilharDesfazer],
  );

  /* aplica um instantâneo: mesma regra de gravação do rascunho */
  const aplicarInstantaneo = useCallback(
    (snap: Instantaneo) => {
      if (snap.canvas) {
        const copia = JSON.parse(JSON.stringify(snap.canvas)) as DocCanvas;
        setCanvasLocal(copia);
        canvasRef.current = copia;
        if (modoEdicaoRef.current) setSujo(true);
        else if (abaAtiva) agendarSalvar(abaAtiva, copia as unknown as DesignDoc);
      }
      if (snap.doc) {
        const copia = clonarDoc(snap.doc);
        setDocLocal(copia);
        docRef.current = copia;
        if (modoEdicaoRef.current) setSujo(true);
        else if (abaAtiva) agendarSalvar(abaAtiva, copia);
      }
    },
    [abaAtiva, agendarSalvar],
  );

  const instantaneoAtual = useCallback(
    (comoCanvas: boolean): Instantaneo =>
      comoCanvas
        ? { doc: null, canvas: JSON.parse(JSON.stringify(canvasRef.current)) as DocCanvas }
        : { doc: clonarDoc(docRef.current), canvas: null },
    [],
  );

  const desfazer = useCallback(() => {
    const pilha = pilhaDesfazer.current;
    const alvo = pilha[pilha.length - 1];
    if (!alvo) return;
    pilhaDesfazer.current = pilha.slice(0, -1);
    pilhaRefazer.current = [...pilhaRefazer.current, instantaneoAtual(!!alvo.canvas)].slice(-50);
    ultimoPasso.current = { rotulo: "", t: 0 };
    aplicarInstantaneo(alvo);
    sincronizarPilhas();
    registrar(autor, "Desfez");
  }, [aplicarInstantaneo, instantaneoAtual, sincronizarPilhas, registrar, autor]);

  const refazer = useCallback(() => {
    const pilha = pilhaRefazer.current;
    const alvo = pilha[pilha.length - 1];
    if (!alvo) return;
    pilhaRefazer.current = pilha.slice(0, -1);
    pilhaDesfazer.current = [...pilhaDesfazer.current, instantaneoAtual(!!alvo.canvas)].slice(-50);
    ultimoPasso.current = { rotulo: "", t: 0 };
    aplicarInstantaneo(alvo);
    sincronizarPilhas();
    registrar(autor, "Refez");
  }, [aplicarInstantaneo, instantaneoAtual, sincronizarPilhas, registrar, autor]);

  /* atalhos globais de teclado */
  useEffect(() => {
    const emCampo = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };
    const onKey = (ev: KeyboardEvent) => {
      if (!(ev.metaKey || ev.ctrlKey) || emCampo(ev.target)) return;
      const k = ev.key.toLowerCase();
      if (k === "z" && !ev.shiftKey) {
        ev.preventDefault();
        desfazer();
      } else if ((k === "z" && ev.shiftKey) || k === "y") {
        ev.preventDefault();
        refazer();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desfazer, refazer]);

  const salvarRascunho = useCallback(() => {
    if (!abaAtiva) return;
    const atual = (canvasRef.current ?? docRef.current) as unknown as DesignDoc;
    void salvarDoc(abaAtiva, atual)
      .then(() => qc.invalidateQueries({ queryKey: ["designs", user?.id] }))
      .catch(() => undefined);
    setBaseDoc(null);
    setBaseCanvas(null);
    setSujo(false);
    registrar(autor, "Salvou a edição");
  }, [abaAtiva, qc, user?.id, registrar, autor]);

  const descartarRascunho = useCallback(() => {
    if (baseCanvas) {
      const copia = JSON.parse(JSON.stringify(baseCanvas)) as DocCanvas;
      setCanvasLocal(copia);
      canvasRef.current = copia;
    }
    if (baseDoc) {
      const copia = clonarDoc(baseDoc);
      setDocLocal(copia);
      docRef.current = copia;
    }
    setBaseDoc(null);
    setBaseCanvas(null);
    setSujo(false);
    registrar(autor, "Descartou a edição");
  }, [baseCanvas, baseDoc, registrar, autor]);

  const recarregarDoc = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["design", abaAtiva] });
    void carregarDesign(abaAtiva).then((r) => {
      if (r)
        setDocLocal(
          r.doc && !ehDocHtml(r.doc) && !ehDocCanvas(r.doc) && Object.keys(r.doc).length
            ? (r.doc as DesignDoc)
            : docPadrao(r.nome),
        );
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
      void salvarDoc(abaAtiva, copia).then(() =>
        qc.invalidateQueries({ queryKey: ["design", abaAtiva] }),
      );
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
      setBibliotecaAberta(false);
      setConversaAberta(false);
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
      void (async () => {
        // O documento do template vem do bucket. Se a busca falhar, ainda se
        // cria o design com o preview HTML — melhor abrir algo do que travar o
        // botão por causa da rede.
        const docModelo =
          preset && preset !== "branco" ? await carregarTemplate(preset) : null;
        const row = await criarDesign(
          projectId,
          modelo ? modelo.nome : undefined,
          docModelo ?? (modelo ? { kind: "html" as const, src: modelo.src } : undefined),
        );
        await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
        irParaDesign(row.id);
      })();
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
      void navigate({
        to: "/d/$designId/$painel",
        params: { designId: abaAtiva, painel: slugPainel[v] },
      });
    },
    [abaAtiva, navigate],
  );

  const setPainelEdicao = useCallback(
    (v: PainelEdicao) => {
      if (!abaAtiva) return;
      void navigate({
        to: "/d/$designId/editar/$painel",
        params: { designId: abaAtiva, painel: v ?? "simples" },
      });
    },
    [abaAtiva, navigate],
  );

  const setModoEdicao = useCallback(
    (v: boolean) => {
      if (!abaAtiva) return;
      if (v) {
        void navigate({
          to: "/d/$designId/editar/$painel",
          params: { designId: abaAtiva, painel: "simples" },
        });
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
                    m.id !== idBot
                      ? m
                      : { ...m, texto: plano.resumo, tarefas: tarefasFeitas, arquivo },
                  ),
                );
                void (async () => {
                  await salvarDoc(abaAtiva, docRef.current);
                  await criarVersaoDb(
                    abaAtiva,
                    proximaVersao,
                    "Assistente",
                    clonarDoc(docRef.current),
                  );
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
      setConversaLocal((c) =>
        (c ?? conversaRemota).map((m) => (m.id === id ? { ...m, texto } : m)),
      );
      void atualizarMensagem(id, { texto }).then(() =>
        qc.invalidateQueries({ queryKey: ["messages", abaAtiva] }),
      );
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
          await criarMensagem(row.id, m.autor, {
            texto: m.texto,
            tarefas: m.tarefas,
            arquivo: m.arquivo,
          });
        }
        await qc.invalidateQueries({ queryKey: ["designs", user?.id] });
        registrar(autor, `Ramificou em ${nome}`);
        irParaDesign(row.id);
      });
    },
    [
      temSessao,
      projectId,
      abaAtiva,
      conversa,
      nomeAtivo,
      qc,
      user?.id,
      registrar,
      irParaDesign,
      autor,
    ],
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
              tarefas: m.tarefas?.map((t) =>
                t.estado === "ativo" ? { ...t, estado: "pendente" as const } : t,
              ),
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
      paginaCanvas,
      setPaginaCanvas,
      camadaCanvas,
      setCamadaCanvas,
      atualizarDocCanvas,
      sujo,
      docSalvo: baseDoc ?? doc,
      canvasSalvo: baseCanvas ?? docCanvas,
      salvarRascunho,
      descartarRascunho,
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
      desfazer,
      refazer,
      podeDesfazer,
      podeRefazer,
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
      paginaCanvas,
      setPaginaCanvas,
      camadaCanvas,
      setCamadaCanvas,
      atualizarDocCanvas,
      sujo,
      baseDoc,
      baseCanvas,
      salvarRascunho,
      descartarRascunho,
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
      desfazer,
      refazer,
      podeDesfazer,
      podeRefazer,
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
