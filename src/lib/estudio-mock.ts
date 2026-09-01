export type DesignKind = "tela" | "deck" | "doc" | "protótipo";

export interface DesignItem {
  id: string;
  nome: string;
  tipo: DesignKind;
  atualizado: string;
  favorito: boolean;
  tom: string;
}

export interface OpenTab {
  id: string;
  nome: string;
  fixada: boolean;
}

export interface TaskItem {
  id: string;
  texto: string;
  estado: "feito" | "ativo" | "pendente";
}

export interface ChatMessage {
  id: string;
  autor: "voce" | "assistente";
  texto: string;
  tarefas?: TaskItem[] | undefined;
  pergunta?:
    | {
        titulo: string;
        opcoes: string[];
        sliderLabel: string;
      }
    | undefined;
  arquivo?: { nome: string; tipo: string; versao: string } | undefined;
}

export interface CommentPin {
  id: string;
  x: number;
  y: number;
  autor: string;
  texto: string;
  resolvido: boolean;
  respostas: { autor: string; texto: string }[];
}

export interface LayerNode {
  id: string;
  nome: string;
  tipo: string;
  filhos?: LayerNode[];
}

export const designs: DesignItem[] = [
  { id: "d1", nome: "Home — Aurora", tipo: "tela", atualizado: "há 4 min", favorito: true, tom: "oklch(0.86 0.06 40)" },
  { id: "d2", nome: "Checkout v3", tipo: "tela", atualizado: "há 1 h", favorito: false, tom: "oklch(0.87 0.05 200)" },
  { id: "d3", nome: "Deck investidores", tipo: "deck", atualizado: "ontem", favorito: true, tom: "oklch(0.88 0.05 145)" },
  { id: "d4", nome: "Onboarding mobile", tipo: "protótipo", atualizado: "ontem", favorito: false, tom: "oklch(0.86 0.06 300)" },
  { id: "d5", nome: "Guia de marca", tipo: "doc", atualizado: "2 dias", favorito: false, tom: "oklch(0.9 0.04 85)" },
  { id: "d6", nome: "Painel de métricas", tipo: "tela", atualizado: "3 dias", favorito: true, tom: "oklch(0.87 0.05 250)" },
];

export const abasIniciais: OpenTab[] = [
  { id: "d1", nome: "Home — Aurora", fixada: true },
  { id: "d2", nome: "Checkout v3", fixada: false },
];

export const conversaInicial: ChatMessage[] = [
  {
    id: "m1",
    autor: "voce",
    texto: "Refaça a home do Aurora com um herói mais calmo e prova social logo abaixo.",
  },
  {
    id: "m2",
    autor: "assistente",
    texto: "Reescrevi o herói e reorganizei a seção de prova social.",
    tarefas: [
      { id: "t1", texto: "Ler design system anexado", estado: "feito" },
      { id: "t2", texto: "Redesenhar herói", estado: "feito" },
      { id: "t3", texto: "Montar faixa de prova social", estado: "ativo" },
      { id: "t4", texto: "Revisar contraste e espaçamento", estado: "pendente" },
    ],
    pergunta: {
      titulo: "Qual peso o herói deve ter?",
      opcoes: ["Editorial calmo", "Produto em foco", "Decide você"],
      sliderLabel: "Densidade",
    },
    arquivo: { nome: "Home — Aurora", tipo: "tela", versao: "v7" },
  },
];

export const camadas: LayerNode[] = [
  {
    id: "l1",
    nome: "Herói",
    tipo: "seção",
    filhos: [
      { id: "l1a", nome: "Título", tipo: "texto" },
      { id: "l1b", nome: "Subtítulo", tipo: "texto" },
      { id: "l1c", nome: "Botão primário", tipo: "botão" },
    ],
  },
  {
    id: "l2",
    nome: "Prova social",
    tipo: "seção",
    filhos: [
      { id: "l2a", nome: "Logos", tipo: "lista" },
      { id: "l2b", nome: "Depoimento", tipo: "cartão" },
    ],
  },
  { id: "l3", nome: "Rodapé", tipo: "seção" },
];

export const versoes = [
  { id: "v7", rotulo: "v7 — atual", autor: "Assistente", quando: "há 4 min" },
  { id: "v6", rotulo: "v6", autor: "Marina", quando: "há 2 h" },
  { id: "v5", rotulo: "v5", autor: "Assistente", quando: "ontem" },
  { id: "v4", rotulo: "v4", autor: "Rafa", quando: "3 dias" },
];

export const historico = [
  { quem: "Assistente", o: "Reescreveu o herói", quando: "13:58" },
  { quem: "Marina", o: "Trocou a paleta para Aurora Quente", quando: "11:20" },
  { quem: "Rafa", o: "Duplicou a versão v4", quando: "ontem 18:02" },
  { quem: "Assistente", o: "Criou o arquivo", quando: "seg 09:14" },
];

export const arvoreProjeto = [
  { id: "p1", nome: "Telas", filhos: ["Home — Aurora", "Checkout v3", "Painel de métricas"] },
  { id: "p2", nome: "Documentos", filhos: ["Guia de marca", "Notas de pesquisa"] },
  { id: "p3", nome: "Protótipos", filhos: ["Onboarding mobile"] },
];

export const sistemas = [
  { id: "s1", nome: "Aurora Quente", origem: "meus sistemas", cores: ["oklch(0.58 0.15 40)", "oklch(0.88 0.05 85)", "oklch(0.25 0.01 70)"] },
  { id: "s2", nome: "Fria Editorial", origem: "biblioteca", cores: ["oklch(0.55 0.1 240)", "oklch(0.9 0.02 240)", "oklch(0.2 0.01 240)"] },
  { id: "s3", nome: "Do zero", origem: "criar", cores: ["oklch(0.9 0 0)", "oklch(0.7 0 0)", "oklch(0.3 0 0)"] },
];

export const mapaCodigo = [
  { tela: "Home — Aurora", arquivo: "src/routes/index.tsx", estado: "sincronizado" },
  { tela: "Checkout v3", arquivo: "src/routes/checkout.tsx", estado: "3 diferenças" },
  { tela: "Painel de métricas", arquivo: "src/routes/painel.tsx", estado: "só no design" },
];

export const comentariosIniciais: CommentPin[] = [
  {
    id: "c1",
    x: 32,
    y: 26,
    autor: "Marina",
    texto: "O título ainda está gritando. Dá para baixar dois pesos?",
    resolvido: false,
    respostas: [{ autor: "Rafa", texto: "Concordo, e o subtítulo pode encurtar." }],
  },
  {
    id: "c2",
    x: 68,
    y: 64,
    autor: "Rafa",
    texto: "Faltou espaçamento entre os logos.",
    resolvido: true,
    respostas: [],
  },
];
