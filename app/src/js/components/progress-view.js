import { button, element, emptyState, makePageHeading } from '../dom.js';

function metric(label, value, caption, icon) {
  const card = element('article', 'stat-card');
  const top = element('div', 'stat-card__top');
  top.append(element('span', '', label), element('span', 'stat-card__icon', icon));
  card.append(top, element('strong', '', value), element('span', 'stat-card__foot', caption));
  return card;
}

export function progressView({ snapshot, questions, progress, notify, problems = [] }) {
  const root = element('section');
  root.append(makePageHeading('HISTÓRICO LOCAL · NESTE NAVEGADOR', 'Seu progresso', 'Seu histórico fica salvo somente neste navegador. Continue revisando os erros para fixar o que aprendeu.'));
  problems.forEach((message) => root.append(element('p', 'notice-banner', message)));
  const stats = element('section', 'stats-grid');
  stats.setAttribute('aria-label', 'Métricas de estudo');
  stats.append(
    metric('Palavras revisadas', snapshot.wordsReviewed, 'cartões estudados', 'Aa'),
    metric('Exercícios feitos', snapshot.exercisesCompleted, 'respostas registradas', '↗'),
    metric('Precisão', `${snapshot.accuracy}%`, 'acertos nos drills', '✓'),
    metric('Erros para rever', snapshot.cardsAgain + Object.values(progress.getExerciseProgress()).reduce((total, item) => total + item.errors, 0), 'flashcards e exercícios', '⟳')
  );
  root.append(stats);

  const activity = element('article', 'panel spacer-top');
  activity.append(element('h2', 'panel__title', 'Atividade nos últimos 7 dias'));
  const strip = element('div', 'week-strip');
  const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  snapshot.week.forEach((day) => {
    const weekday = element('span', `week-day${day.count ? ' is-done' : ''}${day.today ? ' is-today' : ''}`);
    weekday.setAttribute('aria-label', `${day.date}: ${day.count} atividades`);
    weekday.append(element('span', 'week-day__dot'), element('span', '', weekdayLabels[new Date(`${day.date}T12:00:00`).getDay()]));
    strip.append(weekday);
  });
  activity.append(strip, element('p', 'progress-note', `${snapshot.week.reduce((sum, day) => sum + day.count, 0)} atividades registradas nesta semana.`));
  root.append(activity);

  const heading = element('div', 'section-heading');
  heading.append(element('h2', '', 'Erros que merecem outra rodada'));
  root.append(heading);
  const errorItems = Object.entries(progress.getExerciseProgress())
    .filter(([, record]) => record.errors > 0)
    .sort((left, right) => right[1].errors - left[1].errors);
  const list = element('div', 'question-list');
  if (!errorItems.length) {
    list.append(emptyState('Ainda não há erros registrados', 'Faça um drill. Uma resposta errada é um ótimo sinal do que revisar em seguida.'));
  } else {
    errorItems.slice(0, 8).forEach(([id, record]) => {
      const question = questions.find((item) => item.id === id);
      const item = element('article', 'question-card');
      item.append(element('h3', 'question-card__title', question?.prompt ?? id.replaceAll('-', ' ')));
      item.append(element('p', 'question-card__hint', `${record.errors} ${record.errors === 1 ? 'erro' : 'erros'} · ${record.correct} ${record.correct === 1 ? 'acerto' : 'acertos'}`));
      list.append(item);
    });
  }
  root.append(list);

  const reset = button('Apagar meu progresso local', 'button button--danger spacer-top', () => {
    if (!window.confirm('Apagar o progresso e os rascunhos salvos neste navegador? Esta ação não pode ser desfeita.')) return;
    try {
      progress.clear();
      notify('Progresso apagado.');
      document.dispatchEvent(new CustomEvent('study-progress-reset'));
    } catch (error) {
      notify(error.message);
    }
  });
  root.append(reset);
  return root;
}
