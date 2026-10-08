import { button, createSelect, element, emptyState, makePageHeading } from '../dom.js';
import { wordCard } from './word-card.js';

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function orderedForReview(items, progress, sortBy) {
  if (sortBy === 'tier') {
    return [...items].sort((left, right) => left.tier - right.tier
      || (progress.getCardProgress(left.id)?.nextReviewAt ?? '0000-00-00')
        .localeCompare(progress.getCardProgress(right.id)?.nextReviewAt ?? '0000-00-00'));
  }
  const due = progress.getDueItems(items);
  const dueIds = new Set(due.map((item) => item.id));
  return [...due, ...items.filter((item) => !dueIds.has(item.id)).sort((left, right) => {
    const leftDate = progress.getCardProgress(left.id)?.nextReviewAt ?? '9999-99-99';
    const rightDate = progress.getCardProgress(right.id)?.nextReviewAt ?? '9999-99-99';
    return leftDate.localeCompare(rightDate);
  })];
}

export function vocabularyView({ items, progress, notify, onDueCount }) {
  const root = element('section');
  root.append(makePageHeading('BIBLIOTECA · ACTIVE RECALL', 'Vocabulário', 'Lembre primeiro. Revele depois. Cada cartão traz uma frase no contexto de trabalho.'));
  const toolbar = element('div', 'toolbar');
  const searchLabel = element('label', 'sr-only', 'Buscar palavra ou expressão');
  searchLabel.htmlFor = 'vocabulary-search';
  const search = element('input', 'field search-field');
  search.id = 'vocabulary-search';
  search.type = 'search';
  search.placeholder = 'Buscar palavra, tradução ou tema...';
  const tier = createSelect([
    { value: '', label: 'Todas as prioridades' },
    { value: '1', label: 'Tier 1 · Essencial' },
    { value: '2', label: 'Tier 2 · Frequente' },
    { value: '3', label: 'Tier 3 · Específico' }
  ]);
  tier.setAttribute('aria-label', 'Filtrar por prioridade');
  const topics = [...new Set(items.map((item) => item.topic))].sort();
  const topic = createSelect([{ value: '', label: 'Todos os temas' }, ...topics.map((value) => ({ value, label: value }))]);
  topic.setAttribute('aria-label', 'Filtrar por tema');
  const categories = [...new Set(items.map((item) => item.category))].sort();
  const category = createSelect([{ value: '', label: 'Todas as categorias' }, ...categories.map((value) => ({ value, label: value }))]);
  category.setAttribute('aria-label', 'Filtrar por categoria');
  const order = createSelect([
    { value: 'review', label: 'Revisão recomendada' },
    { value: 'tier', label: 'Ordenar por prioridade' }
  ]);
  order.setAttribute('aria-label', 'Ordenar cartões');
  toolbar.append(searchLabel, search, tier, topic, category, order);
  root.append(toolbar);

  const summary = element('p', 'list-summary');
  const cardRegion = element('div');
  root.append(cardRegion, summary);
  let queue = [];
  let position = 0;
  let currentItems = [];

  function filteredItems() {
    const query = search.value.trim().toLocaleLowerCase('pt-BR');
    return items.filter((item) => {
      const matchesQuery = !query || [item.term, item.meaning, item.example, item.translation, item.topic, item.category]
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(query));
      return matchesQuery
        && (!tier.value || String(item.tier) === tier.value)
        && (!topic.value || item.topic === topic.value)
        && (!category.value || item.category === category.value);
    });
  }

  function showCurrent() {
    if (!currentItems.length) {
      cardRegion.replaceChildren(emptyState('Nenhum cartão encontrado', 'Ajuste a busca ou os filtros para ver palavras.'));
      summary.textContent = '0 cartões nesta seleção.';
      return;
    }
    if (position >= queue.length) {
      cardRegion.replaceChildren(emptyState('Sessão concluída', 'Você chegou ao fim dos cartões deste filtro.'));
      cardRegion.append(button('Recomeçar sessão', 'button button--secondary spacer-top', () => {
        position = 0;
        showCurrent();
      }));
      summary.textContent = `${currentItems.length} cartões nesta seleção.`;
      return;
    }

    const item = queue[position];
    const card = wordCard(item, {
      onReview: (remembered) => {
        try {
          progress.recordCardReview(item.id, remembered);
          onDueCount(progress.getSnapshot(items).dueCount);
          if (!remembered && queue.length > 1) {
            queue.splice(position, 1);
            queue.push(item);
          } else {
            position += 1;
          }
          showCurrent();
        } catch (error) {
          notify(error.message);
        }
      }
    });
    cardRegion.replaceChildren(card);
    const cardProgress = progress.getCardProgress(item.id);
    const dueLabel = !cardProgress || cardProgress.nextReviewAt <= today()
      ? 'PARA REVISAR'
      : `PRÓXIMA REVISÃO ${cardProgress.nextReviewAt}`;
    summary.textContent = `Cartão ${position + 1} de ${queue.length} · ${dueLabel} · ${currentItems.length} resultados`;
  }

  function resetQueue() {
    currentItems = filteredItems();
    queue = orderedForReview(currentItems, progress, order.value);
    position = 0;
    showCurrent();
  }

  search.addEventListener('input', resetQueue);
  tier.addEventListener('change', resetQueue);
  topic.addEventListener('change', resetQueue);
  category.addEventListener('change', resetQueue);
  order.addEventListener('change', resetQueue);
  resetQueue();
  return root;
}
