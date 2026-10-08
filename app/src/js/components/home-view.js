import { button, element, makePageHeading } from '../dom.js';

function metric(label, value, caption, icon) {
  const card = element('article', 'stat-card');
  const top = element('div', 'stat-card__top');
  top.append(element('span', '', label), element('span', 'stat-card__icon', icon));
  card.append(top, element('strong', '', value), element('span', 'stat-card__foot', caption));
  return card;
}

function moduleCard(icon, title, description, view) {
  const card = button('', 'module-card', undefined, { 'data-view': view });
  card.append(element('span', 'module-card__icon', icon), element('h3', '', title), element('p', '', description), element('span', 'module-card__arrow', '↗'));
  return card;
}

function planRow(time, title, detail) {
  const row = element('div', 'plan-row');
  row.append(element('span', 'plan-row__time', time), element('span', 'plan-row__bar'), element('p'));
  const copy = row.querySelector('p');
  copy.append(element('strong', '', title), element('span', '', detail));
  return row;
}

export function homeView({ snapshot, vocabularyCount, drillCount, problems = [] }) {
  const root = element('section');
  root.append(makePageHeading('SEU ESPAÇO DE ESTUDO', 'Olá, vamos praticar?', 'Um pouco de prática ativa hoje já faz diferença.', new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())));
  problems.forEach((message) => {
    const warning = element('p', 'notice-banner', message);
    warning.setAttribute('role', 'status');
    root.append(warning);
  });

  const hero = element('section', 'hero');
  const content = element('div', 'hero__content');
  content.append(
    element('p', 'eyebrow', 'SEU TREINO DE HOJE'),
    element('h2', '', 'Fluência se constrói frase por frase.'),
    element('p', '', 'Revise o que errou, pratique uma resposta em voz alta e leve seu inglês para situações reais de tecnologia.')
  );
  content.append(button('Começar a estudar', 'button button--hero', undefined, { 'data-view': 'vocabulary' }));
  const visual = element('div', 'hero__visual');
  const ring = element('div', 'daily-ring');
  const inner = element('div', 'daily-ring__inner');
  inner.append(element('strong', '', `${snapshot.todayCount}`), element('span', '', 'hoje'));
  ring.append(inner);
  visual.append(ring, element('p', 'hero__visual-caption', 'AÇÕES DE ESTUDO'));
  hero.append(content, visual);
  root.append(hero);

  const stats = element('section', 'stats-grid spacer-top');
  stats.setAttribute('aria-label', 'Resumo do progresso');
  stats.append(
    metric('Vocabulário revisado', snapshot.wordsReviewed, `de ${vocabularyCount ?? '—'} cartões`, 'Aa'),
    metric('Drills concluídos', snapshot.exercisesCompleted, drillCount === null ? 'dados indisponíveis' : 'respostas enviadas', '↗'),
    metric('Precisão nos drills', `${snapshot.accuracy}%`, 'acertos acumulados', '✓'),
    metric('Para revisar hoje', snapshot.dueCount, 'cartões disponíveis', '⟳')
  );
  root.append(stats);

  const moduleHeading = element('div', 'section-heading');
  moduleHeading.append(element('h2', '', 'Continue de onde parou'), button('Ver progresso →', 'text-link', undefined, { 'data-view': 'progress' }));
  root.append(moduleHeading);
  const modules = element('section', 'module-grid');
  modules.append(
    moduleCard('Aa', 'Vocabulário', 'Flashcards com contexto e revisão espaçada.', 'vocabulary'),
    moduleCard('ƒx', 'Fórmula verbal', 'Pratique 5 tempos, 3 modos e verbos essenciais.', 'formula'),
    moduleCard('↗', 'Drills', 'Tradução, wh-questions e correção de frases.', 'drills'),
    moduleCard('◎', 'Entrevistas', 'Perguntas por tema, respostas STAR e speaking.', 'interviews'),
    moduleCard('▥', 'Progresso', 'Acompanhe sua rotina e revise erros recorrentes.', 'progress')
  );
  root.append(modules);

  const routineHeading = element('div', 'section-heading');
  routineHeading.append(element('h2', '', 'Uma rotina leve de 10 minutos'), element('span', 'pill', 'ACTIVE RECALL'));
  root.append(routineHeading);
  const routine = element('section', 'daily-plan');
  const plan = element('article', 'panel');
  plan.append(element('h3', 'panel__title', 'Seu bloco de hoje'));
  const list = element('div', 'plan-list');
  list.append(
    planRow('04 min', 'Revise 3 flashcards', 'Priorize os cartões que errou.'),
    planRow('03 min', 'Faça um drill', 'Responda antes de abrir o gabarito.'),
    planRow('03 min', 'Fale em inglês', 'Grave uma resposta curta de entrevista.')
  );
  plan.append(list);
  const week = element('article', 'panel');
  week.append(element('h3', 'panel__title', 'Ritmo da semana'));
  const strip = element('div', 'week-strip');
  const names = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  snapshot.week.forEach((day, index) => {
    const weekday = element('span', `week-day${day.count ? ' is-done' : ''}${day.today ? ' is-today' : ''}`);
    weekday.setAttribute('aria-label', `${day.date}: ${day.count} atividades`);
    weekday.append(element('span', 'week-day__dot'), element('span', '', names[new Date(`${day.date}T12:00:00`).getDay()]));
    strip.append(weekday);
  });
  week.append(strip, element('p', 'progress-note', `${snapshot.week.filter((day) => day.count > 0).length} dias com atividade nos últimos 7 dias. Volte amanhã e mantenha o ritmo.`));
  routine.append(plan, week);
  root.append(routine);
  return root;
}
