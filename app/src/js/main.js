import { JsonDataSource } from './data-source.js';
import { StudyRepository } from './repository.js';
import { ProgressStore } from './progress-store.js';
import { StudyRenderer } from './renderer.js';
import { button, element } from './dom.js';
import { homeView } from './components/home-view.js';
import { vocabularyView } from './components/vocabulary-view.js';
import { formulaView } from './components/formula-view.js';
import { drillsView } from './components/drills-view.js';
import { interviewsView } from './components/interviews-view.js';
import { progressView } from './components/progress-view.js';

const app = document.querySelector('#app');
const notice = document.querySelector('#app-notice');
const renderer = new StudyRenderer(app);
const repository = new StudyRepository(new JsonDataSource());
const progress = new ProgressStore();
const viewNames = {
  home: 'Visão geral',
  vocabulary: 'Vocabulário',
  formula: 'Fórmula verbal',
  drills: 'Drills',
  interviews: 'Entrevistas',
  progress: 'Progresso'
};
let currentView = 'home';
let requestNumber = 0;
let noticeTimer = null;

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.hidden = true;
  }, 9000);
}

function setDueCount(count) {
  const badge = document.querySelector('#due-count');
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function setActiveView(view) {
  document.querySelectorAll('[data-view].nav-item').forEach((item) => {
    const active = item.dataset.view === view;
    item.classList.toggle('is-active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
}

function errorView(error, retry) {
  const root = element('section');
  root.append(element('p', 'eyebrow', 'NÃO FOI POSSÍVEL ABRIR ESTE MÓDULO'), element('h1', '', 'O conteúdo não carregou'), element('p', 'page-subtitle', error.message));
  root.append(button('Tentar novamente', 'button spacer-top', retry));
  return root;
}

function loadFailure(name, error) {
  showNotice(`Falha ao carregar ${name}: ${error.message}`);
  return errorView(error, () => renderPage(currentView));
}

async function renderHome() {
  const results = await Promise.allSettled([repository.getVocabulary(), repository.getDrills()]);
  const vocabulary = results[0].status === 'fulfilled' ? results[0].value : [];
  const drills = results[1].status === 'fulfilled' ? results[1].value : [];
  const problems = [];
  if (results[0].status === 'rejected') problems.push(`Vocabulário indisponível: ${results[0].reason.message}`);
  if (results[1].status === 'rejected') problems.push(`Drills indisponíveis: ${results[1].reason.message}`);
  const snapshot = progress.getSnapshot(vocabulary);
  setDueCount(snapshot.dueCount);
  return homeView({
    snapshot,
    vocabularyCount: results[0].status === 'fulfilled' ? vocabulary.length : null,
    drillCount: results[1].status === 'fulfilled' ? drills.length : null,
    problems
  });
}

async function createView(view) {
  if (view === 'home') return renderHome();
  if (view === 'vocabulary') {
    const items = await repository.getVocabulary();
    setDueCount(progress.getSnapshot(items).dueCount);
    return vocabularyView({ items, progress, notify: showNotice, onDueCount: setDueCount });
  }
  if (view === 'formula') return formulaView({ data: await repository.getVerbs() });
  if (view === 'drills') return drillsView({ items: await repository.getDrills(), progress, notify: showNotice });
  if (view === 'interviews') return interviewsView({ items: await repository.getQuestions(), progress, notify: showNotice });
  if (view === 'progress') {
    const [questionResult, vocabularyResult] = await Promise.allSettled([repository.getQuestions(), repository.getVocabulary()]);
    const questions = questionResult.status === 'fulfilled' ? questionResult.value : [];
    const vocabulary = vocabularyResult.status === 'fulfilled' ? vocabularyResult.value : [];
    const problems = [];
    if (questionResult.status === 'rejected') problems.push(`As perguntas não puderam ser carregadas: ${questionResult.reason.message}`);
    if (vocabularyResult.status === 'rejected') problems.push(`O vocabulário não pôde ser carregado: ${vocabularyResult.reason.message}`);
    const snapshot = progress.getSnapshot(vocabulary);
    setDueCount(snapshot.dueCount);
    return progressView({ snapshot, questions, progress, notify: showNotice, problems });
  }
  throw new Error(`Módulo desconhecido: ${view}`);
}

async function renderPage(view) {
  if (!viewNames[view]) return;
  currentView = view;
  setActiveView(view);
  renderer.dispose();
  const currentRequest = ++requestNumber;
  const loading = element('p', 'notice-banner', `Carregando ${viewNames[view].toLocaleLowerCase('pt-BR')}...`);
  app.replaceChildren(loading);
  try {
    const result = await createView(view);
    if (currentRequest === requestNumber) renderer.render(result);
  } catch (error) {
    if (currentRequest === requestNumber) renderer.render(loadFailure(viewNames[view].toLocaleLowerCase('pt-BR'), error));
  }
}

document.addEventListener('click', (event) => {
  const navigation = event.target.closest('[data-view]');
  if (navigation && viewNames[navigation.dataset.view]) {
    event.preventDefault();
    renderPage(navigation.dataset.view);
  }
});

document.querySelector('#theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = nextTheme;
  try {
    window.localStorage.setItem('english-lab-theme', nextTheme);
  } catch (error) {
    showNotice(`O tema foi alterado, mas não pôde ser salvo neste navegador: ${error.message}`);
  }
});

try {
  const savedTheme = window.localStorage.getItem('english-lab-theme');
  if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;
} catch (error) {
  showNotice(`A preferência de tema não pôde ser carregada: ${error.message}`);
}

document.addEventListener('study-progress-reset', () => renderPage(currentView));

if (progress.warning) showNotice(progress.warning);
renderPage(currentView);
