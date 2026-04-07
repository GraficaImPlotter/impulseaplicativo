import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PDFTransaction {
  due_date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  account_name: string;
}

export const pdfService = {
  generateTransactionReport: (
    transactions: PDFTransaction[], 
    title: string, 
    dateRange: { start: Date, end: Date }
  ) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129); // Emerald-600
    doc.text('IMPULSE | Gestão Financeira', 14, 15);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(title, 14, 25);

    // Period
    doc.setFontSize(10);
    doc.setTextColor(150);
    const periodStr = `Período: ${format(dateRange.start, 'dd/MM/yyyy')} até ${format(dateRange.end, 'dd/MM/yyyy')}`;
    doc.text(periodStr, 14, 32);

    // Table
    const tableData = transactions.map(t => [
      format(new Date(t.due_date), 'dd/MM/yyyy'),
      t.description,
      t.category || '-',
      t.account_name || '-',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount),
      t.status === 'PAGO' ? 'Liquidado' : 'Pendente'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Vencimento', 'Descrição', 'Categoria', 'Conta', 'Valor', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      foot: [[
        '', '', '', 'TOTAL:', 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
          transactions.reduce((acc, t) => acc + Number(t.amount), 0)
        ),
        ''
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 }
    });

    // Footer with page numbers
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text(
            `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
  }
};
