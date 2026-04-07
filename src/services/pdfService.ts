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

interface DroneOS {
  id: string;
  client_name: string;
  client_document?: string;
  client_phone?: string;
  client_cep?: string;
  client_address_street?: string;
  client_address_number?: string;
  client_address_neighborhood?: string;
  client_address_city?: string;
  client_address_state?: string;
  service_description: string;
  area_hectares?: number;
  product_used?: string;
  location_link?: string;
  status: string;
  office_notes?: string;
  technician_notes?: string;
  created_at: string;
  logs?: { created_by_name: string; created_at: string; message: string }[];
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
  },

  generateDetailedDronePDF: (service: DroneOS) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Header
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPULSE | ORDEM DE SERVIÇO', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID DA OPERAÇÃO: #${service.id.slice(0, 8).toUpperCase()}`, 14, 33);
    doc.text(`DATA: ${format(new Date(service.created_at), 'dd/MM/yyyy HH:mm')}`, pageWidth - 14, 33, { align: 'right' });

    currentY = 55;

    // Section: Dados do Cliente
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS DO CLIENTE', 14, currentY);
    doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);
    
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome/Razão Social: ${service.client_name}`, 14, currentY);
    doc.text(`CPF/CNPJ: ${service.client_document || 'N/A'}`, pageWidth / 2, currentY);
    
    currentY += 7;
    doc.text(`Telefone: ${service.client_phone || 'N/A'}`, 14, currentY);
    doc.text(`CEP: ${service.client_cep || 'N/A'}`, pageWidth / 2, currentY);

    currentY += 7;
    const address = `${service.client_address_street || 'N/A'}, ${service.client_address_number || 'S/N'} - ${service.client_address_neighborhood || ''}`;
    doc.text(`Endereço: ${address}`, 14, currentY);
    
    currentY += 7;
    doc.text(`Cidade/UF: ${service.client_address_city || ''} - ${service.client_address_state || ''}`, 14, currentY);

    currentY += 15;

    // Section: Detalhes do Serviço
    doc.setFont('helvetica', 'bold');
    doc.text('2. ESPECIFICAÇÕES TÉCNICAS DA OPERAÇÃO', 14, currentY);
    doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);

    currentY += 10;
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        startY: currentY,
        head: [['ÁREA (HA)', 'PRODUTO UTILIZADO', 'LOCALIZAÇÃO (COORDENADAS)']],
        body: [[
            service.area_hectares ? `${service.area_hectares} ha` : '-',
            service.product_used || '-',
            service.location_link || '-'
        ]],
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
        styles: { fontSize: 9 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Section: Descrição e Notas
    doc.setFont('helvetica', 'bold');
    doc.text('3. DESCRIÇÃO E DIÁRIO DE CAMPO', 14, currentY);
    doc.line(14, currentY + 2, pageWidth - 14, currentY + 2);

    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Escopo do Serviço:', 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(service.service_description, 14, currentY, { maxWidth: pageWidth - 28 });

    currentY += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('Diário de Operação (Mensagens):', 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    
    if (service.logs && service.logs.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [['DE', 'DATA/HORA', 'MENSAGEM']],
            body: service.logs.map(log => [
                log.created_by_name,
                format(new Date(log.created_at), 'dd/MM/yyyy HH:mm'),
                log.message
            ]),
            theme: 'striped',
            headStyles: { fillColor: [224, 231, 255], textColor: [49, 46, 129], fontSize: 8 },
            styles: { fontSize: 8, overflow: 'linebreak', cellWidth: 'wrap' },
            columns: [
                { header: 'DE', dataKey: 'de' },
                { header: 'DATA/HORA', dataKey: 'data' },
                { header: 'MENSAGEM', dataKey: 'msg' }
            ]
        });
    } else {
        doc.text('Nenhum registro de conversa nesta OS.', 14, currentY);
    }

    // Signatures
    currentY = doc.internal.pageSize.getHeight() - 60;
    doc.line(20, currentY, 90, currentY);
    doc.line(pageWidth - 90, currentY, pageWidth - 20, currentY);
    
    doc.setFontSize(8);
    doc.text('ASSINATURA DO TÉCNICO', 55, currentY + 5, { align: 'center' });
    doc.text('ASSINATURA DO CLIENTE', pageWidth - 55, currentY + 5, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    const footerText = `Este documento é um registro oficial de prestação de serviço gerado pelo sistema Impulse em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`OS_DRONE_${service.client_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  }
};
