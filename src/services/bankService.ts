export interface BankInfo {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export const bankService = {
  /**
   * Busca informações de um banco pelo seu código (ex: 001, 237, 341)
   */
  getBankByCode: async (code: string): Promise<BankInfo | null> => {
    if (!code || code.length < 1) return null;
    
    try {
      // Normalizar o código para busca (remover zeros à esquerda se necessário para a URL, 
      // mas a BrasilAPI aceita o código direto)
      const response = await fetch(`https://brasilapi.com.br/api/banks/v1/${code}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Erro ao buscar banco');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro na BrasilAPI:', error);
      return null;
    }
  },

  /**
   * Lista todos os bancos disponíveis
   */
  listAll: async (): Promise<BankInfo[]> => {
    try {
      const response = await fetch('https://brasilapi.com.br/api/banks/v1');
      if (!response.ok) throw new Error('Erro ao listar bancos');
      return await response.json();
    } catch (error) {
      console.error('Erro na BrasilAPI:', error);
      return [];
    }
  }
};
