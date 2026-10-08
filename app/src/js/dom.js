export function element(tagName, className = '', text = '') {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== '' && text !== null && text !== undefined) node.textContent = String(text);
  return node;
}

export function button(text, className = 'button', onClick, attributes = {}) {
  const node = element('button', className, text);
  node.type = 'button';
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

export function makePageHeading(eyebrow, title, subtitle, extra = '') {
  const heading = element('div', 'page-heading');
  const copy = element('div');
  copy.append(element('p', 'eyebrow', eyebrow), element('h1', '', title), element('p', 'page-subtitle', subtitle));
  heading.append(copy);
  if (extra) heading.append(element('span', 'date-chip', extra));
  return heading;
}

export function emptyState(title, message) {
  const state = element('div', 'empty-state');
  state.append(element('strong', '', title), element('span', '', message));
  return state;
}

export function createSelect(options, className = 'field') {
  const select = element('select', className);
  options.forEach(({ value, label }) => {
    const option = element('option', '', label);
    option.value = value;
    select.append(option);
  });
  return select;
}
