import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Search, Landmark, Filter, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';

interface FinancialHeaderProps {
  type: 'RECEITA' | 'DESPESA';
  filters: {
      startDate: Date;
      endDate: Date;
      search: string;
      accountId: string;
  };
  onFilterChange: (filters: {
      startDate: Date;
      endDate: Date;
      search: string;
      accountId: string;
  }) => void;
  summary: {
      vencidos: number;
      hoje: number;
      aVencer: number;
      liquidados: number;
      total: number;
  };
  selectedCount?: number;
  onBatchAction?: (action: string) => void;
}

export function FinancialHeader({ type, filters, onFilterChange, summary, selectedCount = 0, onBatchAction }: FinancialHeaderProps) {
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-active'],
    queryFn: accountService.getActive,
  });

  const handlePrevMonth = () => {
    const newDate = subMonths(filters.startDate, 1);
    onFilterChange({
        ...filters,
        startDate: startOfMonth(newDate),
        endDate: endOfMonth(newDate),
    });
  };

  const handleNextMonth = () => {
    const newDate = addMonths(filters.startDate, 1);
    onFilterChange({
        ...filters,
        startDate: startOfMonth(newDate),
        endDate: endOfMonth(newDate),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const monthLabel = format(filters.startDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Top Filters Bar */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vencimento</label>
          <div className="flex items-center border rounded-md h-10 bg-card overflow-hidden">
            <Button variant="ghost" size="icon" className="h-full rounded-none px-2" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 font-medium min-w-[140px] text-center capitalize border-x">
              {monthLabel}
            </div>
            <Button variant="ghost" size="icon" className="h-full rounded-none px-2" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pesquisar no período selecionado</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-10" 
              placeholder="Pesquisar..." 
            />
          </div>
        </div>

        <div className="w-52 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conta</label>
          <Select value={filters.accountId} onValueChange={(val) => onFilterChange({ ...filters, accountId: val })}>
            <SelectTrigger className="h-10">
              <div className="flex items-center gap-2 truncate">
                <Landmark className="h-4 w-4 text-impulse-gold" />
                <SelectValue placeholder="Selecionar todas" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="gap-2 h-10 text-primary">
          <Filter className="h-4 w-4" />
          Mais filtros
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border rounded-xl overflow-hidden bg-card divide-x divide-y md:divide-y-0 shadow-sm">
        <div className="p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Vencidos (R$)</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(summary.vencidos)}</p>
        </div>
        <div className="p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Vencem hoje (R$)</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.hoje)}</p>
        </div>
        <div className="p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">A vencer (R$)</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(summary.aVencer)}</p>
        </div>
        <div className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-500/5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{type === 'RECEITA' ? 'Recebidos' : 'Pagos'} (R$)</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(summary.liquidados)}</p>
        </div>
        <div className="p-4 text-center bg-blue-50/50 dark:bg-blue-600/5 border-l-2 border-l-blue-600/20">
            <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-1">Total do período (R$)</p>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-400">{formatCurrency(summary.total)}</p>
        </div>
      </div>

      {/* Batch Actions Bar */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckSquare className="h-4 w-4" />
                <span>{selectedCount} registro(s) selecionado(s)</span>
            </div>
            {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-blue-600 h-8">Renegociar</Button>
                    <Select onValueChange={onBatchAction}>
                        <SelectTrigger className="h-8 w-40 text-xs">
                             <SelectValue placeholder="Ações em lote" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="markAsPaid">{type === 'RECEITA' ? 'Marcar como Recebido' : 'Marcar como Pago'}</SelectItem>
                            <SelectItem value="delete">Excluir Selecionados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
