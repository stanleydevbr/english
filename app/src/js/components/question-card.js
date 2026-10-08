import { button, element } from '../dom.js';

export function questionCard(question, progress, onSave) {
  const card = element('article', 'question-card');
  const meta = element('div', 'question-card__meta');
  meta.append(element('span', 'pill pill--accent', question.category), element('span', 'pill', question.level));
  const guide = element('p', 'question-card__hint', question.guide);
  const framework = element('p', 'question-card__hint', `Estrutura sugerida: ${question.framework}`);
  const answer = element('textarea', 'textarea');
  answer.setAttribute('aria-label', `Rascunho para: ${question.prompt}`);
  answer.placeholder = 'Escreva ou organize sua resposta em inglês...';
  answer.value = progress.getAnswer(question.id);

  const sample = element('p', 'exercise-feedback');
  sample.hidden = true;
  sample.textContent = `Exemplo: ${question.sample}`;
  const actions = element('div', 'flashcard-actions');
  actions.append(
    button('Salvar rascunho', 'button button--secondary', () => onSave(question.id, answer.value)),
    button('Ver exemplo', 'button button--quiet', (event) => {
      sample.hidden = !sample.hidden;
      event.currentTarget.textContent = sample.hidden ? 'Ver exemplo' : 'Ocultar exemplo';
    })
  );
  card.append(meta, element('h2', 'question-card__title', question.prompt), guide, framework, answer, actions, sample);
  return card;
}
