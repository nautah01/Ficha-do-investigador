# Mudanças desta versão

## Estrutura do código
O script de ~1.100 linhas que ficava dentro do `index.html` foi dividido em arquivos:

| Arquivo | Conteúdo |
|---|---|
| `rules-data.js` | Dados das regras (perícias, ocupações, origens). Sem DOM. |
| `rules.js` | Lógica pura: cálculos, gerador, orçamento de pontos, validação, sanitização. Sem DOM. |
| `store.js` | Gravação em IndexedDB, migração, aviso de falha, sincronia entre abas. |
| `app.js` | Interface da ficha (renderização, eventos). |
| `combat.js` | Painel de Combate e painel de Recursos (Crédito). |
| `wizard.js` | Compra de pontos (460) e criação guiada. |
| `share.js` | Enviar/importar ficha (arquivo e link) e Mesa do Guardião. |
| `pdf.js` | Exportação em PDF. **Idêntico ao bloco original do `index.html`.** |
| `extras.css` | Estilos dos recursos novos. |
| `tests/` | Testes automatizados das regras (`npm test`, sem dependências). |

## Regras (CoC 7E)
- Atleta e Andarilho: pontos ocupacionais agora somam só o melhor atributo alternativo (antes somavam APA a mais).
- Consertos Mecânicos: base 10%.
- "Mythos de Cthulhu" → "Mitos de Cthulhu" (fichas antigas são migradas). Nova **SAN máx.** (99 − Mitos); a Sanidade nunca passa dela.
- Bônus de Dano e Corpo corretos acima de 204 (+2d6/Corpo 3 em 205–284, +3d6/Corpo 4 em 285–364…).
- Teto de 75% por perícia fechado: gerador (bases como 1% chegavam a 76%) e edição manual (antes aceitava até 999).
  O bônus de +10 da origem continua sendo regra da casa e pode passar de 75.
- Atributos validados (15–90 e 40–90, múltiplos de 5) e **compra de pontos (460)**.
- Corpo aceita valores negativos.
- Perícias novas: Lutar (Espada/Lança/Machado/Corrente/Garrote/Mangual/Motosserra/Chicote), Armas de Fogo (Submetralhadora/Metralhadoras/Arco/Lança-chamas/Armas Pesadas), com valor-base automático. Thompson usa Submetralhadora; S&W .38 causa 1D10.
- Corrigido: adicionar perícia na ficha com orçamento dava pontos de graça; perícias de "valor-base" (Arte/Ofício, Pilotar…) apareciam vazias.

## Fichas geradas
- Passam a usar o mesmo painel da ficha em branco (pontos ocupacionais + pessoais, perícias da ocupação em dourado). Fichas antigas continuam funcionando com o painel antigo até serem sorteadas de novo.
- Gerar agora **pergunta** antes de apagar fichas editadas sem "Manter".
- Vocabulário: "Fixar" → "Manter", "Rerolar atributos" → "Sortear atributos", "Perícias que não tenho" → "Perícias não treinadas".

## Dados
- Fichas e retratos migrados para **IndexedDB** (a cópia antiga do localStorage é removida após a primeira gravação bem-sucedida).
- Falha de gravação mostra aviso vermelho com "Baixar backup".
- Grava ao fechar/trocar de aba. Duas abas abertas: a que tentar salvar depois recebe aviso e escolhe qual versão manter.
- Importação (backup, arquivo, link) valida o formato e remove o que for perigoso; textos que iam sem escape em atributos HTML foram corrigidos.
- Backup passou a incluir as origens escolhidas (`cthulhu-bg`) e continua lendo backups antigos.

## Novas funções
- **Combate**: aba com armas do equipamento, Normal/Difícil/Extremo, dano com o Bônus de Dano, alcance, cadência, munição (−1/recarregar) e falha.
- **Recursos**: Gastos, Dinheiro e Bens pelo Nível de Crédito (anos 1920 ou ×20 para época atual).
- **Criação guiada**: atributos → ocupação → pontos ocupacionais → pessoais → backstory.
- **Enviar ficha**: arquivo `.json` (com retrato e equipamento) ou link. **Importar ficha** aceita arquivo ou link.
- **Mesa do Guardião**: guarda fichas recebidas, ajusta PV/SAN/PM/Sorte e rola testes de grupo.

## Interface
- Janelas da ficha sem teto de 1000 px de altura; largura mínima se adapta a telas estreitas.
- Só a ficha que mudou é redesenhada (foco, cursor e rolagem são preservados).
- Campos de atributo com `min`/`max`/`step` e `aria-label`.

## Imagens
- 14 SVG e 5 PNG sem uso removidos; as demais redimensionadas (máx. 384 px). Pasta de 17 MB → 4,4 MB.
- Cada item usa um único caminho de imagem (sem tentativas em pastas inexistentes). A busca na Wikipédia só ocorre para itens personalizados sem imagem e somente com internet.

## Não alterado
- `pdf.js` (layout do PDF) e o tema do PDF.
