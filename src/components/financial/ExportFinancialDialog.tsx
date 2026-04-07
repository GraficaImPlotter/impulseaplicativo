import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileDown, Upload, Check, AlertCircle, Trash2 } from 'lucide-react';
import { FinancialAccount as Account } from '@/services/accountService';
import { csvService } from '@/services/csvService';
import { pdfService } from '@/services/pdfService';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';

interface ExportFinancialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  transactions: any[]; // All transactions currently filtered on the page
  type: 'RECEITA' | 'DESPESA';
  dateRange: { start: Date, end: Date };
}

export function ExportFinancialDialog({ 
  open, 
  onOpenChange, 
  accounts, 
  transactions, 
  type,
  dateRange
}: ExportFinancialDialogProps) {
  const queryClient = useQueryClient();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(accounts.map(a => a.id));
  
  // CSV Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [targetAccount, setTargetAccount] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<any[][]>([]);
  const [mapping, setMapping] = useState({
    due_date: -1,
    description: -1,
    amount: -1,
    category: -1
  });
  const [step, setStep] = useState(1);

  const importMutation = useMutation({
    mutationFn: (data: any[]) => transactionService.createBatchMany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Importação concluída com sucesso!');
      onOpenChange(false);
      resetImport();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Erro ao importar transações.');
    }
  });

  const resetImport = () => {
    setImportFile(null);
    setCsvPreview([]);
    setStep(1);
    setMapping({ due_date: -1, description: -1, amount: -1, category: -1 });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      try {
        const data = await csvService.parseCSV(file);
        setCsvPreview(data.slice(0, 5)); // Preview first 5 rows
        setStep(2);
      } catch (err) {
        toast.error('Erro ao ler arquivo CSV');
      }
    }
  };

  const handleDoImport = async () => {
    if (!targetAccount) return toast.error('Selecione uma conta de destino');
    if (mapping.due_date === -1 || mapping.description === -1 || mapping.amount === -1) {
        return toast.error('Mapeie os campos obrigatórios (Data, Descrição, Valor)');
    }

    try {
        const fullData = await csvService.parseCSV(importFile!);
        const formattedData = fullData.slice(1).map(row => {
            // Clean amount string (remove R$, dots, etc)
            let rawAmt = String(row[mapping.amount] || '0').replace(/[^\d,-]/g, '').replace(',', '.');
            
            return {
                type,
                status: 'PENDENTE',
                description: String(row[mapping.description] || 'Importado via CSV'),
                amount: Math.abs(parseFloat(rawAmt)),
                due_date: new Date(String(row[mapping.due_date])).toISOString().split('T')[0], // Basic parse
                category: mapping.category !== -1 ? String(row[mapping.category]) : 'Importado',
                account_id: targetAccount
            };
        }).filter(item => !isNaN(item.amount));

        importMutation.mutate(formattedData);
    } catch (err) {
        toast.error('Erro ao processar dados de importação');
    }
  };

  const handleExportPDF = () => {
    const filtered = transactions.filter(t => selectedAccounts.includes(t.account_id || ''));
    if (filtered.length === 0) return toast.error('Nenhuma transação encontrada para o filtro selecionado.');
    
    const formatted = filtered.map(t => ({
      ...t,
      account_name: accounts.find(a => a.id === t.account_id)?.name || 'N/A'
    }));

    pdfService.generateTransactionReport(
      formatted, 
      type === 'RECEITA' ? 'Relatório de Recebíveis' : 'Relatório de Pagamentos',
      dateRange
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-white dark:bg-slate-800 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="w-2 h-6 rounded-full bg-impulse-gold" />
            Central de Movimentação Financeira
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <Tabs defaultValue="export" className="w-full flex-1 flex flex-col">
            <div className="px-6 bg-white dark:bg-slate-800 border-b flex-shrink-0">
                <TabsList className="bg-transparent rounded-none justify-start gap-6 h-12 p-0">
                    <TabsTrigger value="export" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 px-2 font-bold text-slate-400 data-[state=active]:text-emerald-700 h-10 flex gap-2">
                        <FileDown className="h-4 w-4" /> Exportar PDF
                    </TabsTrigger>
                    <TabsTrigger value="import" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 px-2 font-bold text-slate-400 data-[state=active]:text-blue-700 h-10 flex gap-2">
                        <Upload className="h-4 w-4" /> Importar CSV
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* TAB: EXPORTAR */}
            <TabsContent value="export" className="p-8 m-0 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-bold text-slate-700">Escolha as contas para incluir no relatório:</Label>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAccounts(accounts.map(a => a.id))} className="text-xs text-blue-600">Marcar todas</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {accounts.map(acc => (
                            <div key={acc.id} className="flex items-center space-x-2 border p-3 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                                <Checkbox 
                                  id={`acc-${acc.id}`} 
                                  checked={selectedAccounts.includes(acc.id)}
                                  onCheckedChange={(checked) => {
                                      setSelectedAccounts(prev => checked 
                                          ? [...prev, acc.id] 
                                          : prev.filter(i => i !== acc.id)
                                      );
                                  }}
                                />
                                <label htmlFor={`acc-${acc.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                                    {acc.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-sm text-emerald-800">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Informação:</p>
                        <p>O relatório PDF conterá a listagem completa das transações detalhadas para as contas marcadas acima dentro do período filtrado.</p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleExportPDF} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 h-12 rounded-xl text-lg font-bold">
                    <FileText className="h-5 w-5" /> Gerar PDF Detalhado
                  </Button>
                </div>
            </TabsContent>

            {/* TAB: IMPORTAR */}
            <TabsContent value="import" className="p-8 m-0 space-y-6 flex-1 flex flex-col">
              {step === 1 ? (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Conta Destino *</Label>
                        <Select value={targetAccount} onValueChange={setTargetAccount}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Escolha a conta onde salvar" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-white space-y-4">
                        <Upload className="h-10 w-10 text-slate-300 mx-auto" />
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-700">Fazer upload do arquivo de extrato</h3>
                            <p className="text-sm text-slate-400 max-w-xs mx-auto">Aceita qualquer arquivo CSV. Você mapeará as colunas no próximo passo.</p>
                        </div>
                        <Input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileChange} />
                        <Button variant="outline" asChild className="rounded-xl">
                            <label htmlFor="csv-upload" className="cursor-pointer px-10">Selecionar CSV</label>
                        </Button>
                    </div>
                </div>
              ) : (
                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h3 className="font-bold text-lg">Mapear Colunas do CSV</h3>
                            <p className="text-sm text-slate-400">Identifique as colunas do seu arquivo</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={resetImport} className="text-rose-500 gap-2"><Trash2 className="h-3 w-3" /> Reiniciar</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Data de Vencimento *</Label>
                                <Select onValueChange={(v) => setMapping(prev => ({ ...prev, due_date: parseInt(v) }))}>
                                    <SelectTrigger className="bg-white h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {csvPreview[0]?.map((col, idx) => <SelectItem key={idx} value={String(idx)}>{`Coluna ${idx + 1} (${String(col).slice(0, 15)})`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Descrição *</Label>
                                <Select onValueChange={(v) => setMapping(prev => ({ ...prev, description: parseInt(v) }))}>
                                    <SelectTrigger className="bg-white h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {csvPreview[0]?.map((col, idx) => <SelectItem key={idx} value={String(idx)}>{`Coluna ${idx + 1} (${String(col).slice(0, 15)})`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Valor Financeiro *</Label>
                                <Select onValueChange={(v) => setMapping(prev => ({ ...prev, amount: parseInt(v) }))}>
                                    <SelectTrigger className="bg-white h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {csvPreview[0]?.map((col, idx) => <SelectItem key={idx} value={String(idx)}>{`Coluna ${idx + 1} (${String(col).slice(0, 15)})`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Categoria (Opcional)</Label>
                                <Select onValueChange={(v) => setMapping(prev => ({ ...prev, category: parseInt(v) }))}>
                                    <SelectTrigger className="bg-white h-9 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="-1">Nenhuma (Usar 'Importado')</SelectItem>
                                        {csvPreview[0]?.map((col, idx) => <SelectItem key={idx} value={String(idx)}>{`Coluna ${idx + 1} (${String(col).slice(0, 15)})`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-100 rounded-lg p-3 text-[10px] font-mono text-slate-500 flex-1 overflow-hidden">
                        <p className="border-b pb-1 mb-2 font-bold uppercase tracking-tight">Prévia das primeiras linhas:</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <tbody>
                                    {csvPreview.map((row, rIdx) => (
                                        <tr key={rIdx} className="border-b border-slate-200">
                                            {row.map((cell, cIdx) => <td key={cIdx} className="px-2 py-1 max-w-[100px] truncate">{String(cell)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button 
                          onClick={handleDoImport} 
                          disabled={importMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-10 h-11 rounded-xl font-bold"
                        >
                            {importMutation.isPending ? 'Importando...' : (
                                <><Check className="h-5 w-5" /> Confirmar Importação</>
                            )}
                        </Button>
                    </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 bg-slate-100 border-t flex-shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
