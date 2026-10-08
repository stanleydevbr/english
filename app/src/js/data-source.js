export class JsonDataSource {
  constructor(baseUrl = './data/') {
    this.baseUrl = baseUrl;
  }

  async fetchAll(fileName) {
    const response = await fetch(`${this.baseUrl}${fileName}`);
    if (!response.ok) {
      throw new Error(`Não foi possível carregar ${fileName} (HTTP ${response.status}).`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`O arquivo ${fileName} contém JSON inválido.`, { cause: error });
    }
  }
}
