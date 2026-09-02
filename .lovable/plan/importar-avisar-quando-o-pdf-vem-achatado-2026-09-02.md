# Importar: avisar quando o PDF vem achatado

## O que os arquivos mostram

Inspecionei o PDF enviado (`Cópia de Design sem nome.pdf`):

- 1 página, **nenhuma fonte embutida**, **nenhum texto extraível**
- 1 único objeto de imagem: `1296x1620`, objeto **16** — exatamente o `img16.png` que apareceu no painel Camadas

Ou seja: o extrator não errou. O PDF que saiu do Canva já é uma foto da
página inteira, sem texto vetorial nem camadas. Não há nada para separar.
Isso acontece quando o design é exportado como **PDF Padrão** (ou quando o
Canva achata a página por causa de efeitos/filtros aplicados). O caminho que
preserva camadas é **Compartilhar › Baixar › PDF para impressão**.

## O que fazer

O produto hoje aceita o PDF achatado em silêncio e entrega um design de uma
camada só — parece bug. Vai passar a detectar e explicar.

1. **Detecção no serviço de importação** (`canva-import/`): depois da
   extração, se uma página não tiver nenhuma camada de texto e for coberta por
   uma única imagem do tamanho da página, ela é marcada como achatada.
   - Todas as páginas achatadas → o serviço recusa com um erro claro em vez de
     gravar o design.
   - Algumas achatadas → importa e devolve a lista de páginas afetadas.
2. **Mensagem na tela `/importar`**: o erro vira um bloco explicativo — "este
   PDF foi exportado achatado; refaça em Compartilhar › Baixar › **PDF para
   impressão**" — com o passo a passo, em vez do texto cru do servidor. Quando
   só algumas páginas vierem achatadas, mostra um aviso junto do resultado.
3. **Checagem antes do envio, no browser**: a página lê os primeiros bytes do
   PDF e, se não houver nenhuma fonte embutida (`/FontFile`), avisa antes de
   gastar um minuto de conversão.

## Correções de bastidor encontradas no caminho

O serviço HTTP faz menos que o importador de linha de comando; nos dois casos
o resultado é um design pior sem ninguém perceber:

- `servico.py` chama `para_doccanvas(model, slug, nome)` **sem as métricas de
  fonte**, então roda `mergefonts.py` e joga o resultado fora: o design fica
  sem `fontes`, e o texto cai numa fonte de fallback com o topo da caixa
  errado. Passa a ler `fonts.json` como o CLI já faz.
- O serviço não sobe `doc.json` nem atualiza `manifest.json`, então o design
  importado nunca aparece no menu "Novo design". Passa a subir os dois.

## Detalhes técnicos

- Arquivos tocados: `canva-import/pipeline/extract.py` (marca `flat: true` na
  página), `canva-import/servico.py` (recusa/avisa, métricas, `doc.json` +
  manifesto), `src/routes/importar.tsx` (mensagens e pré-checagem).
- O contrato HTTP ganha `paginas_achatadas: number[]` na resposta e um erro
  `{"erro": "...", "codigo": "achatado"}`; nada existente muda de forma.
- Nada muda no editor, no modelo `DocCanvas`, nem nos tipos `fluxo`/`html`.
