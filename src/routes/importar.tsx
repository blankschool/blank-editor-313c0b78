/**
 * /importar — PDF do Canva vira design editável.
 *
 * Por que PDF e não o link: a conversão lê o content stream do PDF, que é onde
 * o Canva entrega o texto vetorial, as fontes embutidas e a geometria exata. O
 * link sozinho não dá acesso a isso sem credencial do Canva; o PDF você exporta
 * com um clique (Compartilhar › Baixar › PDF Impressão) e não depende de mais
 * nada.
 *
 * O trabalho roda num serviço à parte (canva/servico.py, hoje em
 * canva-import.ickanz.easypanel.host) porque precisa de Python e fontTools —
 * não roda no browser nem numa Edge Function. O app só envia o arquivo e
 * mostra o resultado.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";

const SERVICO = "https://canva-import.ickanz.easypanel.host";
// Não é sigilo real (vai no bundle do browser) — só evita que bots
// genéricos varrendo a internet cheguem no /importar sem querer.
const SEGREDO_IMPORTACAO = "508d1916d338cd39cc89ab9800a31697c1f8907cf4a350ff";

type Estado =
  | { fase: "ocioso" }
  | { fase: "enviando" }
  | { fase: "erro"; msg: string; achatado?: boolean }
  | {
      fase: "pronto";
      designId: string;
      paginas: number;
      camadas: number;
      nome: string;
      achatadas: number[];
    };

/**
 * O PDF achatado (uma foto da tela, sem texto vetorial) é o que faz a
 * importação sair com uma camada só. Dá para descobrir sem serviço nenhum:
 * um PDF com texto embutido traz `/FontFile` no corpo. Sem isso, não há o que
 * separar — melhor avisar antes de gastar um minuto de conversão.
 */
async function pareceAchatado(f: File): Promise<boolean> {
  try {
    const txt = new TextDecoder("latin1").decode(await f.arrayBuffer());
    return !/\/FontFile\d?\b/.test(txt);
  } catch {
    return false;
  }
}

const RECEITA_ACHATADO =
  "No Canva: Compartilhar › Baixar › escolha PDF para impressão (não PDF Padrão) " +
  "e desmarque “Achatar PDF”. Se o design usa efeitos/filtros em texto, remova-os " +
  "antes de exportar — o Canva rasteriza a página quando não consegue manter o texto.";


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
  // que não diz a ninguém o que fazer. Repete enquanto não achar o serviço, já
  // que ele pode subir (launchd) depois desta página já ter carregado.
  useEffect(() => {
    let vivo = true;
    const checar = () => {
      fetch(`${SERVICO}/saude`)
        .then((r) => r.ok)
        .catch(() => false)
        .then((ok) => vivo && setServicoNoAr(ok));
    };
    checar();
    const id = window.setInterval(checar, 4000);
    return () => {
      vivo = false;
      window.clearInterval(id);
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
      const r = await fetch(`${SERVICO}/importar`, {
        method: "POST",
        headers: { "X-Import-Secret": SEGREDO_IMPORTACAO },
        body: fd,
      });
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
            <p className="font-medium">O serviço de importação está indisponível no momento.</p>
            <p className="mt-1 text-muted-foreground">
              Tente de novo em instantes. Se persistir, verifique o serviço na VPS.
            </p>
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
