import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft, Plus, RefreshCw } from "lucide-react";
import { featureFlagService } from "@/services/featureFlagService";
import { ApiSetting, apiSettingsService } from "@/services/apiSettingsService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";

export function FeatureFlagManager() {
  const [flags, setFlags] = useState<ApiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await featureFlagService.getAllFlags();
      setFlags(data);
    } catch (error) {
      console.error("Error loading flags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (id: string, isEnabled: boolean) => {
    try {
      await featureFlagService.toggleFlag(id, isEnabled);
      setFlags(prev => prev.map(f => f.id === id ? { ...f, value: isEnabled ? "false" : "true" } : f));
      toast({ title: "Flag atualizada" });
    } catch (error) {
      toast({ title: "Erro ao atualizar flag", variant: "destructive" });
    }
  };

  const createInitialFlags = async () => {
    try {
      setIsSyncing(true);
      const initialFlags = [
        { key: "MODULE_AGENDA_ENABLED", desc: "Habilita/Desabilita o módulo de Agenda" },
        { key: "MODULE_CALCULATOR_ENABLED", desc: "Habilita/Desabilita a Calculadora Solar" },
        { key: "MODULE_FUNNEL_ENABLED", desc: "Habilita/Desabilita o Funil de Vendas" },
        { key: "MODULE_CLIENTS_ENABLED", desc: "Habilita/Desabilita o módulo de Clientes" },
        { key: "MODULE_QUOTES_ENABLED", desc: "Habilita/Desabilita o módulo de Orçamentos" },
        { key: "MODULE_PROJECTS_ENABLED", desc: "Habilita/Desabilita o módulo de Projetos" },
        { key: "MODULE_SERVICE_ORDERS_ENABLED", desc: "Habilita/Desabilita o módulo de Ordens de Serviço (OS)" },
        { key: "MODULE_SUPPLIERS_ENABLED", desc: "Habilita/Desabilita o módulo de Fornecedores" },
        { key: "MODULE_INVENTORY_ENABLED", desc: "Habilita/Desabilita o módulo de Estoque" },
        { key: "MODULE_FINANCIAL_ENABLED", desc: "Habilita/Desabilita o módulo Financeiro" },
        { key: "MODULE_SALES_ENABLED", desc: "Habilita/Desabilita o módulo de Vendas" },
        { key: "MODULE_DRONE_ENABLED", desc: "Habilita/Desabilita o módulo de Drones" },
        { key: "MODULE_EMPLOYEES_ENABLED", desc: "Habilita/Desabilita o módulo de Funcionários" },
        { key: "MODULE_SETTINGS_ENABLED", desc: "Habilita/Desabilita o módulo de Configurações" },
      ];

      // Get current keys to avoid duplicates
      const currentKeys = flags.map(f => f.key);

      for (const flag of initialFlags) {
        if (!currentKeys.includes(flag.key)) {
          await apiSettingsService.create({
            key: flag.key,
            value: "true",
            description: flag.desc,
            category: "feature_flag"
          });
        }
      }
      
      await loadFlags();
      toast({ title: "Módulos sincronizados com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao sincronizar flags", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-impulse-gold" />
          Gerenciador de Funcionalidades
        </h3>
        <Button 
          size="sm" 
          variant={flags.length < 14 ? "default" : "outline"}
          onClick={createInitialFlags} 
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {flags.length < 14 ? "Sincronizar Módulos" : "Forçar Sincronização"}
        </Button>
      </div>

      <div className="grid gap-4">
        {loading && flags.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground animate-pulse">
            Carregando flags...
          </div>
        ) : flags.length === 0 ? (
          <Card className="border-dashed border-sidebar-border bg-transparent">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma flag de funcionalidade cadastrada. Clique em Sincronizar.
            </CardContent>
          </Card>
        ) : (
          flags.map((flag) => (
            <Card key={flag.id} className="border-sidebar-border bg-card/50 hover:border-primary/30 transition-colors group">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-primary">{flag.key}</code>
                    {flag.value === "true" ? (
                      <Badge variant="default" className="bg-emerald-600 text-[10px] h-4">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] h-4">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
                <Switch 
                  checked={flag.value === "true"}
                  onCheckedChange={() => handleToggle(flag.id, flag.value === "true")}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
