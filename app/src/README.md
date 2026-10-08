# English Lab

Aplicação estática de prática de inglês para entrevistas e trabalho em tecnologia. Foi construída com HTML semântico, CSS responsivo, JavaScript vanilla e conteúdo em arquivos JSON; não requer backend nem dependências de build.

## Executar localmente

Abra um terminal na pasta `app/src` e execute:

```sh
python -m http.server 8000
```

Acesse `http://localhost:8000`. Use um servidor local: `fetch()` não carrega os arquivos JSON quando a página é aberta com `file://`.

## Conteúdo

- **Vocabulário:** flashcards com contexto, filtros por tema/prioridade e revisão espaçada.
- **Fórmula verbal:** grade de cinco tempos por três modos para verbos essenciais, com quiz de 15 campos e conferência das respostas.
- **Drills:** tradução, wh-questions e correção de frases com feedback.
- **Entrevistas:** perguntas organizadas por trilha, rascunhos locais, modelos STAR, timer de speaking e gravação opcional pelo microfone.
- **Progresso:** métricas, atividade semanal e erros recorrentes.

Os dados estão em `data/`. O progresso e rascunhos ficam em `localStorage` no navegador atual; não há sincronização entre dispositivos. Todos os caminhos de assets e dados são relativos para permitir publicação na raiz ou em uma página de projeto do GitHub Pages.

## Publicar no GitHub Pages

O workflow [deploy-pages.yml](../../.github/workflows/deploy-pages.yml) publica automaticamente o conteúdo de `app/src` quando há push para `main` ou `master`. Também pode ser iniciado manualmente em **Actions → Deploy English Lab to GitHub Pages → Run workflow**.

Na primeira publicação, abra **Settings → Pages** do repositório e defina **GitHub Actions** como origem em **Build and deployment**. O workflow envia os arquivos estáticos diretamente, incluindo `.nojekyll` e `404.html`.

O endereço será `https://stanleydevbr.github.io/<nome-do-repositorio>/`. Para publicar em `https://stanleydevbr.github.io/` (sem o sufixo do repositório), o nome do repositório precisa ser `stanleydevbr.github.io`.
