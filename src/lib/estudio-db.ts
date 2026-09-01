import { supabase } from "@/lib/supabase";
import { docPadrao, type DesignDoc, type DocSalvo } from "@/lib/estudio-doc";
import type { ChatMessage, CommentPin, DesignItem, DesignKind } from "@/lib/estudio-mock";

export interface DesignRow {
  id: string;
  project_id: string;
  nome: string;
  tipo: string;
  favorito: boolean;
  tom: string;
  doc: DocSalvo;
  atualizado_em: string;
}

export interface VersionRow {
  id: string;
  design_id: string;
  rotulo: string;
  autor: string;
  doc: DesignDoc;
  criado_em: string;
}

export interface MessageRow {
  id: string;
  design_id: string;
  autor: string;
  payload: { texto: string; tarefas?: ChatMessage["tarefas"]; arquivo?: ChatMessage["arquivo"] };
  criado_em: string;
}

function relativo(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `${d} dias`;
}

export function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function paraItem(r: DesignRow): DesignItem {
  return {
    id: r.id,
    nome: r.nome,
    tipo: (r.tipo as DesignKind) ?? "tela",
    atualizado: relativo(r.atualizado_em),
    favorito: r.favorito,
    tom: r.tom,
  };
}

export function paraMensagem(r: MessageRow): ChatMessage {
  return {
    id: r.id,
    autor: r.autor === "assistente" ? "assistente" : "voce",
    texto: r.payload?.texto ?? "",
    tarefas: r.payload?.tarefas,
    arquivo: r.payload?.arquivo,
    pergunta: undefined,
  };
}

/* ---------------- sessão ---------------- */

export async function usuarioAtual() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function nomeDoUsuario(user: { email?: string | undefined } | null) {
  if (!user?.email) return "Você";
  return user.email.split("@")[0] ?? "Você";
}

/* ---------------- projeto ---------------- */

export async function garantirProjeto() {
  const user = await usuarioAtual();
  if (!user) return null;
  const { data, error } = await supabase
    .from("projects")
    .select("id, nome")
    .order("criado_em", { ascending: true })
    .limit(1);
  if (error) throw error;
  const existente = data?.[0];
  if (existente) return existente as { id: string; nome: string };
  const novo = await supabase
    .from("projects")
    .insert({ nome: "Meu projeto", owner: user.id })
    .select("id, nome")
    .single();
  if (novo.error) throw novo.error;
  return novo.data as { id: string; nome: string };
}

export async function renomearProjeto(id: string, nome: string) {
  const { error } = await supabase.from("projects").update({ nome }).eq("id", id);
  if (error) throw error;
}

/* ---------------- designs ---------------- */

export async function listarDesigns() {
  const { data, error } = await supabase
    .from("designs")
    .select("id, project_id, nome, tipo, favorito, tom, doc, atualizado_em")
    .order("atualizado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DesignRow[];
}

export async function carregarDesign(id: string) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("designs")
    .select("id, project_id, nome, tipo, favorito, tom, doc, atualizado_em")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as DesignRow | null) ?? null;
}

export async function criarDesign(projectId: string, nome = "Novo design", doc?: DocSalvo, tom?: string) {
  const user = await usuarioAtual();
  if (!user) throw new Error("Entre na sua conta para criar um design.");
  const { data, error } = await supabase
    .from("designs")
    .insert({
      project_id: projectId,
      owner: user.id,
      nome,
      tipo: "tela",
      tom: tom ?? "oklch(0.9 0.03 85)",
      doc: doc ?? docPadrao(nome),
    })
    .select("id, project_id, nome, tipo, favorito, tom, doc, atualizado_em")
    .single();
  if (error) throw error;
  return data as DesignRow;
}

export async function salvarDoc(id: string, doc: DesignDoc) {
  const { error } = await supabase
    .from("designs")
    .update({ doc, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarDesign(id: string, patch: Partial<Pick<DesignRow, "nome" | "favorito" | "tom">>) {
  const { error } = await supabase
    .from("designs")
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function removerDesign(id: string) {
  const { error } = await supabase.from("designs").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- versões ---------------- */

export async function listarVersoes(designId: string) {
  if (!designId) return [];
  const { data, error } = await supabase
    .from("versions")
    .select("id, design_id, rotulo, autor, doc, criado_em")
    .eq("design_id", designId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VersionRow[];
}

export async function criarVersaoDb(designId: string, rotulo: string, autor: string, doc: DesignDoc) {
  const user = await usuarioAtual();
  if (!user) throw new Error("Sem sessão.");
  const { data, error } = await supabase
    .from("versions")
    .insert({ design_id: designId, owner: user.id, rotulo, autor, doc })
    .select("id, design_id, rotulo, autor, doc, criado_em")
    .single();
  if (error) throw error;
  return data as VersionRow;
}

export async function removerVersao(id: string) {
  const { error } = await supabase.from("versions").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- mensagens ---------------- */

export async function listarMensagens(designId: string) {
  if (!designId) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("id, design_id, autor, payload, criado_em")
    .eq("design_id", designId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function criarMensagem(
  designId: string,
  autor: "voce" | "assistente",
  payload: MessageRow["payload"],
) {
  const user = await usuarioAtual();
  if (!user) throw new Error("Sem sessão.");
  const { data, error } = await supabase
    .from("messages")
    .insert({ design_id: designId, owner: user.id, autor, payload })
    .select("id, design_id, autor, payload, criado_em")
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function atualizarMensagem(id: string, payload: MessageRow["payload"]) {
  const { error } = await supabase.from("messages").update({ payload }).eq("id", id);
  if (error) throw error;
}

/* ---------------- comentários ---------------- */

export async function listarComentarios(designId: string): Promise<CommentPin[]> {
  if (!designId) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("id, autor, x, y, texto, resolvido, criado_em, replies(id, autor, texto, criado_em)")
    .eq("design_id", designId)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c['id'] as string,
    x: Number(c['x']),
    y: Number(c['y']),
    autor: (c['autor'] as string) || "Você",
    texto: (c['texto'] as string) ?? "",
    resolvido: Boolean(c['resolvido']),
    respostas: ((c['replies'] as { autor: string; texto: string }[] | null) ?? []).map((r) => ({
      autor: r.autor,
      texto: r.texto,
    })),
  }));
}

export async function criarComentario(designId: string, x: number, y: number, autor: string) {
  const user = await usuarioAtual();
  if (!user) throw new Error("Sem sessão.");
  const { data, error } = await supabase
    .from("comments")
    .insert({ design_id: designId, owner: user.id, x, y, autor, texto: "Novo comentário" })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function removerComentario(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export async function removerMensagem(id: string) {
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) throw error;
}

export async function atualizarComentario(id: string, patch: { texto?: string; resolvido?: boolean }) {
  const { error } = await supabase.from("comments").update(patch).eq("id", id);
  if (error) throw error;
}

export async function criarResposta(commentId: string, texto: string, autor: string) {
  const user = await usuarioAtual();
  if (!user) throw new Error("Sem sessão.");
  const { error } = await supabase
    .from("replies")
    .insert({ comment_id: commentId, owner: user.id, texto, autor });
  if (error) throw error;
}

/* ---------------- storage ---------------- */

export async function enviarArquivoPrivado(file: File) {
  const user = await usuarioAtual();
  if (!user) throw new Error("Usuário não autenticado");
  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { data, error } = await supabase.storage.from("uploads").upload(path, file);
  if (error) throw error;
  return data;
}

export async function enviarImagemCanvas(file: File): Promise<string> {
  const user = await usuarioAtual();
  if (!user) throw new Error("Entre na sua conta para enviar imagens.");
  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("uploads").upload(path, file, {
    ...(file.type ? { contentType: file.type } : {}),
    upsert: false,
  });
  if (error) throw error;
  const publica = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
  const { data: assinada } = await supabase.storage.from("uploads").createSignedUrl(path, 60 * 60 * 24 * 365);
  return assinada?.signedUrl ?? publica;
}
