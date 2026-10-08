export class StudyRenderer {
  constructor(container) {
    this.container = container;
    this.disposeCurrent = null;
  }

  dispose() {
    this.disposeCurrent?.();
    this.disposeCurrent = null;
  }

  render(result) {
    this.dispose();
    this.disposeCurrent = result?.dispose ?? null;
    this.container.replaceChildren(result?.element ?? result);
    this.container.focus({ preventScroll: true });
  }
}
