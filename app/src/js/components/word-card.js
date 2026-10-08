import { button, element } from '../dom.js';

export function wordCard(word, { onReview }) {
  const card = element('article', 'flashcard');
  const answer = element('div', 'flashcard__answer');
  answer.hidden = true;

  const example = element('p', 'flashcard__example');
  example.append(document.createTextNode(`${word.example} `), element('em', '', `— ${word.translation}`));
  answer.append(element('p', 'flashcard__meaning', word.meaning), example);

  const reveal = button('Ver resposta', 'button button--secondary', () => {
    answer.hidden = !answer.hidden;
    reveal.textContent = answer.hidden ? 'Ver resposta' : 'Ocultar resposta';
    if (!answer.hidden) actions.hidden = false;
  });
  const actions = element('div', 'flashcard-actions');
  actions.hidden = true;
  actions.append(
    button('Ainda não', 'button button--quiet', () => onReview(false)),
    button('Lembrei', 'button', () => onReview(true))
  );

  card.append(
    element('span', 'flashcard__label', 'LEMBRE ANTES DE REVELAR'),
    element('h2', 'flashcard__term', word.term),
    element('p', 'flashcard__hint', 'Tente lembrar do significado e use a palavra em uma frase.'),
    answer,
    reveal,
    actions
  );
  const meta = element('div', 'card-meta');
  meta.append(element('span', 'pill pill--accent', `TIER ${word.tier}`), element('span', 'pill', word.category));
  card.append(meta);
  return card;
}
