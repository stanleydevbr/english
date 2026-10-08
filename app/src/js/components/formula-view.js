import { button, createSelect, element, emptyState, makePageHeading } from '../dom.js';

const MODES = ['Afirme', 'Negue', 'Pergunte'];

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase('en')
    .replace(/\.{3}|…/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function conjugationTable(verb, columns) {
  const wrapper = element('div', 'table-wrap');
  const table = element('table', 'conjugation-table');
  const caption = element('caption', 'sr-only', `Conjugação de ${verb.base}, ${verb.meaning}`);
  const head = element('thead');
  const headingRow = element('tr');
  headingRow.append(element('th', '', 'Modo'));
  columns.forEach((column) => headingRow.append(element('th', '', column)));
  head.append(headingRow);

  const body = element('tbody');
  verb.forms.forEach((forms, index) => {
    const row = element('tr');
    row.append(element('th', '', MODES[index]));
    forms.forEach((form) => row.append(element('td', '', form)));
    body.append(row);
  });
  table.append(caption, head, body);
  wrapper.append(table);
  return wrapper;
}

function quizTable(verb, columns) {
  const wrapper = element('div', 'table-wrap');
  const form = element('form', 'quiz-form');
  const table = element('table', 'conjugation-table quiz-table');
  const caption = element('caption', 'sr-only', `Quiz de conjugação do verbo ${verb.base}`);
  const head = element('thead');
  const headingRow = element('tr');
  headingRow.append(element('th', '', 'Modo'));
  columns.forEach((column) => headingRow.append(element('th', '', column)));
  head.append(headingRow);

  const inputs = [];
  const body = element('tbody');
  verb.forms.forEach((answers, modeIndex) => {
    const row = element('tr');
    row.append(element('th', '', MODES[modeIndex]));
    answers.forEach((answer, columnIndex) => {
      const cell = element('td');
      const fieldId = `quiz-${verb.id}-${modeIndex}-${columnIndex}`;
      const input = element('input', 'field quiz-input');
      input.type = 'text';
      input.id = fieldId;
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.setAttribute('aria-label', `${MODES[modeIndex]} · ${columns[columnIndex]}`);
      const feedback = element('span', 'quiz-feedback');
      feedback.id = `${fieldId}-feedback`;
      feedback.hidden = true;
      input.setAttribute('aria-describedby', feedback.id);
      cell.append(input, feedback);
      row.append(cell);
      inputs.push({ input, feedback, expected: answer });
    });
    body.append(row);
  });
  table.append(caption, head, body);

  const actions = element('div', 'toolbar quiz-actions');
  const check = button('Conferir respostas', 'button');
  check.type = 'submit';
  const clear = button('Limpar respostas', 'button button--secondary', () => {
    inputs.forEach(({ input, feedback }) => {
      input.value = '';
      input.disabled = false;
      input.classList.remove('is-correct', 'is-incorrect');
      input.removeAttribute('aria-invalid');
      feedback.hidden = true;
      feedback.textContent = '';
    });
    check.disabled = false;
    summary.textContent = 'Preencha os 15 campos e confira suas respostas.';
    inputs[0]?.input.focus();
  });
  actions.append(check, clear);
  const summary = element('p', 'quiz-summary');
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-live', 'polite');
  summary.textContent = 'Preencha os 15 campos e confira suas respostas.';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const correctCount = inputs.reduce((count, item) => {
      const correct = normalizeAnswer(item.input.value) === normalizeAnswer(item.expected);
      item.input.classList.toggle('is-correct', correct);
      item.input.classList.toggle('is-incorrect', !correct);
      item.input.setAttribute('aria-invalid', String(!correct));
      item.feedback.hidden = false;
      item.feedback.textContent = correct ? 'Correta' : `Resposta: ${item.expected}`;
      return count + Number(correct);
    }, 0);
    summary.textContent = `Resultado: ${correctCount} de ${inputs.length} respostas corretas. Confira as respostas exibidas e tente novamente.`;
  });

  form.append(table, actions, summary);
  wrapper.append(form);
  return wrapper;
}

export function formulaView({ data }) {
  const root = element('section');
  root.append(makePageHeading('FÓRMULA · 5 TEMPOS × 3 MODOS', 'Conjugação sem decorar frases', 'Consulte a fórmula ou pratique os 15 formatos com um quiz de conjugação.'));
  if (!data.verbs.length) {
    root.append(emptyState('Sem verbos disponíveis', 'Adicione verbos válidos em data/verbs.json para começar.'));
    return root;
  }

  const select = createSelect(data.verbs.map((verb) => ({ value: verb.id, label: `${verb.base} · ${verb.meaning}` })));
  select.setAttribute('aria-label', 'Escolha um verbo para conjugar ou praticar');
  const toolbar = element('div', 'toolbar');
  const modes = element('div', 'formula-modes');
  const referenceButton = button('Ver fórmula', 'button button--secondary');
  const quizButton = button('Praticar quiz', 'button button--quiet');
  referenceButton.setAttribute('aria-pressed', 'true');
  quizButton.setAttribute('aria-pressed', 'false');
  modes.append(referenceButton, quizButton);
  toolbar.append(select, modes);
  root.append(toolbar);
  const content = element('div');
  root.append(content);
  let activeMode = 'reference';

  const renderVerb = () => {
    const verb = data.verbs.find((item) => item.id === select.value);
    if (!verb) {
      content.replaceChildren(emptyState('Verbo indisponível', 'Escolha outro verbo da lista.'));
      return;
    }
    if (activeMode === 'quiz') {
      content.replaceChildren(
        element('p', 'formula-note', `Complete afirmações, negações e perguntas para “${verb.base}” (${verb.meaning}). As respostas corretas aparecem após a conferência.`),
        quizTable(verb, data.columns)
      );
    } else {
      content.replaceChildren(
        conjugationTable(verb, data.columns),
        element('p', 'formula-note', `${verb.type} · ${verb.base} = ${verb.meaning}. ${verb.note}`)
      );
    }
  };

  referenceButton.addEventListener('click', () => {
    activeMode = 'reference';
    referenceButton.className = 'button button--secondary';
    quizButton.className = 'button button--quiet';
    referenceButton.setAttribute('aria-pressed', 'true');
    quizButton.setAttribute('aria-pressed', 'false');
    renderVerb();
  });
  quizButton.addEventListener('click', () => {
    activeMode = 'quiz';
    referenceButton.className = 'button button--quiet';
    quizButton.className = 'button button--secondary';
    referenceButton.setAttribute('aria-pressed', 'false');
    quizButton.setAttribute('aria-pressed', 'true');
    renderVerb();
  });
  select.addEventListener('change', renderVerb);
  renderVerb();
  return root;
}
