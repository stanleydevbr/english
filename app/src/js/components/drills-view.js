import { button, createSelect, element, emptyState, makePageHeading } from '../dom.js';

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function drillsView({ items, progress, notify }) {
  const root = element('section');
  root.append(makePageHeading('PRÁTICA · RESPOSTA ATIVA', 'Drills rápidos', 'Traduza, forme perguntas e corrija frases. Tente responder antes de ver a explicação.'));
  if (!items.length) {
    root.append(emptyState('Nenhum exercício disponível', 'Adicione exercícios válidos em data/drills.json.'));
    return root;
  }

  const toolbar = element('div', 'toolbar');
  const kinds = [...new Set(items.map((item) => item.kind))];
  const filter = createSelect([
    { value: '', label: 'Todos os tipos de exercício' },
    ...kinds.map((kind) => ({ value: kind, label: kind }))
  ]);
  filter.setAttribute('aria-label', 'Filtrar tipo de exercício');
  toolbar.append(filter);

  const cardRegion = element('div');
  const summary = element('p', 'list-summary');
  root.append(toolbar, cardRegion, summary);
  let queue = [];
  let position = 0;
  let completed = false;

  function setupQueue() {
    queue = items.filter((item) => !filter.value || item.kind === filter.value);
    position = 0;
    completed = false;
    renderCurrent();
  }

  function renderCurrent() {
    completed = false;
    if (!queue.length) {
      cardRegion.replaceChildren(emptyState('Nenhum exercício neste filtro', 'Escolha outro tipo de exercício.'));
      summary.textContent = '';
      return;
    }
    if (position >= queue.length) {
      cardRegion.replaceChildren(emptyState('Rodada concluída', 'Bom trabalho. Você pode recomeçar a rodada ou trocar o filtro.'));
      cardRegion.append(button('Recomeçar rodada', 'button button--secondary spacer-top', () => {
        position = 0;
        renderCurrent();
      }));
      summary.textContent = `${queue.length} exercícios nesta rodada.`;
      return;
    }

    const item = queue[position];
    const card = element('article', 'exercise-card');
    const top = element('div', 'exercise-card__top');
    top.append(element('span', 'pill pill--accent', item.kind), element('span', 'pill', `${position + 1} / ${queue.length}`));
    const form = element('form');
    const label = element('label', 'eyebrow', item.instruction);
    const prompt = element('p', 'exercise-card__prompt', item.prompt);
    const answerLabel = element('label', 'sr-only', 'Sua resposta em inglês');
    answerLabel.htmlFor = 'drill-answer';
    const answer = element('input', 'field');
    answer.id = 'drill-answer';
    answer.type = 'text';
    answer.autocomplete = 'off';
    answer.placeholder = 'Digite sua resposta em inglês...';
    const submit = button('Conferir resposta', 'button');
    submit.type = 'submit';
    const row = element('div', 'answer-row');
    row.append(answerLabel, answer, submit);
    const feedback = element('p', 'exercise-feedback');
    feedback.hidden = true;
    form.append(label, prompt, row);
    card.append(top, form, feedback);
    cardRegion.replaceChildren(card);
    summary.textContent = `${items.length} exercícios para praticar · ${Object.values(progress.getExerciseProgress()).reduce((total, value) => total + value.attempts, 0)} respostas registradas`;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (completed) {
        position += 1;
        renderCurrent();
        return;
      }
      const answerValue = answer.value;
      if (!answerValue.trim()) {
        answer.focus();
        feedback.hidden = false;
        feedback.classList.add('is-wrong');
        feedback.textContent = 'Escreva uma resposta antes de conferir.';
        return;
      }
      const normalized = normalizeAnswer(answerValue);
      const correct = item.answers.some((accepted) => normalizeAnswer(accepted) === normalized);
      try {
        progress.recordExercise(item.id, correct);
        completed = true;
        answer.disabled = true;
        submit.textContent = 'Próximo exercício';
        feedback.hidden = false;
        feedback.classList.toggle('is-wrong', !correct);
        feedback.textContent = correct
          ? `Correto! ${item.explanation}`
          : `Quase. Uma resposta possível: ${item.answers[0]} ${item.explanation}`;
      } catch (error) {
        notify(error.message);
      }
    });
  }

  filter.addEventListener('change', setupQueue);
  setupQueue();
  return root;
}
