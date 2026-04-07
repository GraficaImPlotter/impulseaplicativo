import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const csvService = {
  /**
   * Converte um array de objetos em CSV e dispara o download.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportToCSV: (data: any[], filename: string, headers: Record<string, string>) => {
    if (!data || !data.length) return;

    // Criar cabeçalhos
    const headerRow = Object.values(headers).join(';');
    
    // Criar linhas de dados
    const rows = data.map(item => {
      return Object.keys(headers).map(key => {
        const value = item[key];

        // Formatadores especiais
        if (value === null || value === undefined) return '';
        
        // Tratar números (trocar . por , para Excel PT-BR)
        if (typeof value === 'number') {
            return value.toLocaleString('pt-BR');
        }

        // Tratar datas ISO
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return format(new Date(value), 'dd/MM/yyyy HH:mm');
        }

        // Tratar strings com ponto e vírgula
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(';');
    });

    const csvContent = "\uFEFF" + [headerRow, ...rows].join('\n'); // BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
