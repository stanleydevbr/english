import { button, createSelect, element, emptyState, makePageHeading } from '../dom.js';
import { questionCard } from './question-card.js';
import { audioRecorder } from './audio-recorder.js';

function makeTimer() {
  const panel = element('section', 'panel timer-panel');
  const copy = element('div');
  copy.append(element('span', 'pill pill--accent', 'SPEAKING · 90 SEGUNDOS'), element('div', 'timer-display', '01:30'));
  const explanation = element('p', '', 'Escolha uma pergunta, responda em voz alta e depois anote um ponto que gostaria de melhorar. Você também pode gravar pelo celular.');
  const controls = element('div', 'flashcard-actions');
  const start = button('Começar', 'button', () => toggle());
  const reset = button('Reiniciar', 'button button--secondary', () => resetTimer());
  controls.append(start, reset);
  panel.append(copy, explanation, controls);
  let remaining = 90;
  let intervalId = null;
  const display = copy.querySelector('.timer-display');

  function draw() {
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    display.textContent = `${minutes}:${seconds}`;
  }

  function toggle() {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
      start.textContent = 'Continuar';
      return;
    }
    if (remaining === 0) remaining = 90;
    start.textContent = 'Pausar';
    intervalId = window.setInterval(() => {
      remaining -= 1;
      draw();
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        intervalId = null;
        start.textContent = 'Começar de novo';
      }
    }, 1000);
  }

  function resetTimer() {
    if (intervalId !== null) window.clearInterval(intervalId);
    intervalId = null;
    remaining = 90;
    start.textContent = 'Começar';
    draw();
  }

  return { element: panel, dispose: resetTimer };
}

function matches(question, query, category) {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const matchesQuery = !normalizedQuery || [question.prompt, question.guide, question.category]
    .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
  return matchesQuery && (!category || question.category === category);
}

export function interviewsView({ items, progress, notify }) {
  const root = element('section');
  root.append(makePageHeading('PREPARAÇÃO · SPEAKING', 'Entrevistas em inglês', 'Pratique sua resposta em voz alta. Use o modelo como referência, não como texto para decorar.'));
  const timer = makeTimer();
  const recorder = audioRecorder(notify);
  const speakingTools = element('div', 'speaking-tools');
  speakingTools.append(timer.element, recorder.element);
  root.append(speakingTools);

  if (!items.length) {
    root.append(emptyState('Nenhuma pergunta disponível', 'Adicione perguntas válidas em data/questions.json.'));
    return { element: root, dispose: () => { timer.dispose(); recorder.dispose(); } };
  }

  const categories = [...new Set(items.map((item) => item.category))].sort();
  const toolbar = element('div', 'toolbar');
  const search = element('input', 'field search-field');
  search.type = 'search';
  search.placeholder = 'Buscar pergunta ou tema...';
  search.setAttribute('aria-label', 'Buscar perguntas de entrevista');
  const category = createSelect([{ value: '', label: 'Todas as trilhas' }, ...categories.map((value) => ({ value, label: value }))]);
  category.setAttribute('aria-label', 'Filtrar por trilha');
  toolbar.append(search, category);
  const list = element('div', 'question-list');
  const count = element('p', 'list-summary');
  root.append(
    element('div', 'section-heading'),
    toolbar,
    list,
    count
  );
  root.querySelector('.section-heading').append(element('h2', '', 'Banco de perguntas'));

  function renderList() {
    const filtered = items.filter((item) => matches(item, search.value, category.value));
    count.textContent = `${filtered.length} de ${items.length} perguntas`;
    if (!filtered.length) {
      list.replaceChildren(emptyState('Nenhuma pergunta encontrada', 'Tente outro termo ou selecione todas as trilhas.'));
      return;
    }
    list.replaceChildren(...filtered.map((question) => questionCard(question, progress, (id, answer) => {
      try {
        progress.saveAnswer(id, answer);
        notify('Rascunho salvo neste navegador.');
      } catch (error) {
        notify(error.message);
      }
    })));
  }

  search.addEventListener('input', renderList);
  category.addEventListener('change', renderList);
  renderList();
  return { element: root, dispose: () => { timer.dispose(); recorder.dispose(); } };
}
