import { button, element } from '../dom.js';

export function audioRecorder(notify) {
  const panel = element('section', 'panel');
  panel.append(element('span', 'pill pill--accent', 'PRÁTICA ORAL · OPCIONAL'), element('h2', 'panel__title spacer-top', 'Grave sua resposta'));
  const explanation = element('p', 'question-card__hint', 'O áudio fica nesta sessão do navegador. Permita o acesso ao microfone quando solicitado.');
  const status = element('p', 'progress-note', 'Nenhuma gravação nesta sessão.');
  status.setAttribute('role', 'status');
  const record = button('Iniciar gravação', 'button button--secondary', toggleRecording);
  const audio = element('audio');
  audio.controls = true;
  audio.hidden = true;
  audio.setAttribute('aria-label', 'Reproduzir sua gravação de fala');
  const controls = element('div', 'flashcard-actions');
  controls.append(record);

  const checklist = element('fieldset', 'self-check');
  checklist.append(element('legend', '', 'Depois de ouvir, confira:'));
  [
    ['check-clear', 'Falei com clareza e ritmo confortável'],
    ['check-structure', 'Organizei a resposta com começo, meio e fim'],
    ['check-example', 'Usei um exemplo concreto']
  ].forEach(([id, label]) => {
    const row = element('label', 'self-check__item');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    row.append(checkbox, element('span', '', label));
    checklist.append(row);
  });
  panel.append(explanation, controls, status, audio, checklist);

  let recorder = null;
  let stream = null;
  let objectUrl = null;
  let disposed = false;

  async function toggleRecording() {
    if (recorder?.state === 'recording') {
      recorder.stop();
      record.disabled = true;
      status.textContent = 'Finalizando gravação...';
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      const message = 'A gravação de áudio não é compatível com este navegador. Você ainda pode praticar usando o gravador do celular.';
      status.textContent = message;
      notify(message);
      return;
    }

    record.disabled = true;
    status.textContent = 'Aguardando permissão para usar o microfone...';
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed) {
        activeStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = activeStream;
      const activeRecorder = new window.MediaRecorder(stream);
      recorder = activeRecorder;
      const chunks = [];
      activeRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });
      activeRecorder.addEventListener('stop', () => {
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        record.disabled = false;
        if (disposed) return;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        const recording = new Blob(chunks, { type: activeRecorder.mimeType || 'audio/webm' });
        objectUrl = URL.createObjectURL(recording);
        audio.src = objectUrl;
        audio.hidden = false;
        record.textContent = 'Gravar novamente';
        status.textContent = 'Gravação pronta. Ouça e marque sua autoavaliação.';
      });
      activeRecorder.start();
      record.disabled = false;
      record.textContent = 'Parar gravação';
      status.textContent = 'Gravando... Se possível, responda à pergunta em até 90 segundos.';
    } catch (error) {
      record.disabled = false;
      status.textContent = `Não foi possível iniciar a gravação: ${error.message}`;
      notify(`O acesso ao microfone falhou: ${error.message}`);
    }
  }

  function dispose() {
    disposed = true;
    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  return { element: panel, dispose };
}
