/**
 * /importar — PDF do Canva vira design editável.
 *
 * Por que PDF e não o link: a conversão lê o content stream do PDF, que é onde
 * o Canva entrega o texto vetorial, as fontes embutidas e a geometria exata. O
 * link sozinho não dá acesso a isso sem credencial do Canva; o PDF você exporta
 * com um clique (Compartilhar › Baixar › PDF Impressão) e não depende de mais
 * nada.
 *
 * O trabalho roda num serviço à parte (canva/servico.py) porque precisa de
 * Python, fontTools e Chromium — não roda no browser nem numa Edge Function. O
 * app só envia o arquivo e mostra o resultado.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";

const SERVICO = "http://localhost:8790";

type Estado =
  | { fase: "ocioso" }
  | { fase: "enviando" }
  | { fase: "erro"; msg: string }
  | { fase: "pronto"; designId: string; paginas: number; camadas: number; nome: string };

export const Route = createFileRoute("/importar")({
  head: () => ({ meta: [{ title: "Importar do Canva — Estúdio" }] }),
  component: Importar,
});

function Importar() {
  const navigate = useNavigate();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [estado, setEstado] = useState<Estado>({ fase: "ocioso" });
  const [servicoNoAr, setServicoNoAr] = useState<boolean | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Vale checar antes: sem o serviço no ar o envio falha com "Failed to fetch",
  // que não diz a ninguém o que fazer.
  useEffect(() => {
    let vivo = true;
    fetch(`${SERVICO}/saude`)
      .then((r) => r.ok)
      .catch(() => false)
      .then((ok) => vivo && setServicoNoAr(ok));
    return () => {
      vivo = false;
    };
  }, []);

  const receber = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setEstado({ fase: "erro", msg: "Envie o PDF exportado do Canva." });
      return;
    }
    setArquivo(f);
    setEstado({ fase: "ocioso" });
    if (!nome) setNome(f.name.replace(/\.pdf$/i, ""));
  };

  const enviar = async () => {
    if (!arquivo) return;
    setEstado({ fase: "enviando" });
    const fd = new FormData();
    fd.append("pdf", arquivo);
    fd.append("nome", nome || arquivo.name.replace(/\.pdf$/i, ""));
    try {
      const r = await fetch(`${SERVICO}/importar`, { method: "POST", body: fd });
      const j = (await r.json()) as Record<string, unknown>;
      if (!r.ok) throw new Error(String(j["erro"] ?? `HTTP ${r.status}`));
      setEstado({
        fase: "pronto",
        designId: String(j["design_id"]),
        paginas: Number(j["paginas"]),
        camadas: Number(j["camadas"]),
        nome: String(j["nome"]),
      });
    } catch (e) {
      setEstado({
        fase: "erro",
        msg: e instanceof Error ? e.message : "Falha ao importar.",
      });
    }
  };

  const enviando = estado.fase === "enviando";

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-lg font-semibold">Importar do Canva</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          No Canva: <strong>Compartilhar › Baixar › PDF Impressão</strong>. Solte o arquivo aqui e
          ele vira um design editável, com as fontes e as imagens originais.
        </p>
      </header>

      {servicoNoAr === false && (
        <div className="flex gap-2 rounded-md border border-border bg-muted/40 p-3 text-[12px]">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">O serviço de importação não está rodando.</p>
            <p className="mt-1 text-muted-foreground">
              A conversão precisa de Python e fontes, então roda fora do app. Inicie com:
            </p>
            <code className="mt-1.5 block rounded bg-background px-2 py-1 font-mono text-[11px]">
              cd ~/Downloads/canva &amp;&amp; python3 servico.py
            </code>
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          receber(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`grid cursor-pointer place-items-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          arrastando ? "border-accent bg-accent/5" : "border-border hover:border-accent"
        }`}
      >
        <FileUp className="size-7 text-muted-foreground" />
        {arquivo ? (
          <>
            <p className="text-[13px] font-medium">{arquivo.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {(arquivo.size / 1e6).toFixed(1)} MB · clique para trocar
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium">Solte o PDF aqui</p>
            <p className="text-[11px] text-muted-foreground">ou clique para escolher</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => receber(e.target.files?.[0])}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium">Nome do design</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como vai aparecer na biblioteca"
          className="h-9 rounded-md border border-border bg-background px-3 text-[13px] outline-none focus:border-accent"
        />
      </label>

      <button
        onClick={() => void enviar()}
        disabled={!arquivo || enviando || servicoNoAr === false}
        className="flex h-10 items-center justify-center gap-2 rounded-md bg-accent text-[13px] font-semibold text-accent-foreground disabled:opacity-40"
      >
        {enviando && <Loader2 className="size-4 animate-spin" />}
        {enviando ? "Convertendo…" : "Importar"}
      </button>

      {enviando && (
        <p className="text-center text-[12px] text-muted-foreground">
          Extraindo camadas, fontes e imagens. Um carrossel de 12 telas leva cerca de um minuto.
        </p>
      )}

      {estado.fase === "erro" && (
        <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-[12px]">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>{estado.msg}</p>
        </div>
      )}

      {estado.fase === "pronto" && (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="text-[13px]">
              <p className="font-medium">{estado.nome}</p>
              <p className="text-[12px] text-muted-foreground">
                {estado.paginas} {estado.paginas === 1 ? "página" : "páginas"} · {estado.camadas}{" "}
                camadas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                void navigate({
                  to: "/d/$designId/editar",
                  params: { designId: estado.designId },
                })
              }
              className="h-9 flex-1 rounded-md bg-accent text-[12px] font-semibold text-accent-foreground"
            >
              Abrir no editor
            </button>
            <a
              href={`/t/${estado.designId}`}
              className="grid h-9 flex-1 place-items-center rounded-md border border-border text-[12px] font-semibold"
            >
              Ver como HTML
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
