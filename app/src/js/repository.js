export class StudyRepository {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.cache = new Map();
  }

  async getVocabulary() {
    const payload = await this.#load('vocabulary.json');
    return this.#collection(payload, 'vocabulary', 'vocabulary.json');
  }

  async getVerbs() {
    const payload = await this.#load('verbs.json');
    return {
      columns: this.#collection(payload, 'columns', 'verbs.json'),
      verbs: this.#collection(payload, 'verbs', 'verbs.json')
    };
  }

  async getDrills() {
    const payload = await this.#load('drills.json');
    return this.#collection(payload, 'drills', 'drills.json');
  }

  async getQuestions() {
    const payload = await this.#load('questions.json');
    return this.#collection(payload, 'questions', 'questions.json');
  }

  async #load(fileName) {
    if (!this.cache.has(fileName)) {
      const request = this.dataSource.fetchAll(fileName);
      this.cache.set(fileName, request);
      request.catch(() => this.cache.delete(fileName));
    }
    return this.cache.get(fileName);
  }

  #collection(payload, key, fileName) {
    if (!Array.isArray(payload?.[key])) {
      throw new Error(`O arquivo ${fileName} precisa conter uma lista "${key}".`);
    }
    return payload[key];
  }
}
