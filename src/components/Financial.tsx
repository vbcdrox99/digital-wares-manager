import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Expense {
  id: string;
  description: string;
  value: number;
  created_at: string;
}

const Financial: React.FC = () => {
  const [totalSold, setTotalSold] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // 1. Buscar total de vendas pagas (is_paid = true) a partir de hoje
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total_value')
        .eq('is_paid', true)
        .gte('created_at', todayStart.toISOString());

      if (ordersError) throw ordersError;

      const soldSum = (ordersData || []).reduce((sum, order) => sum + Number(order.total_value), 0);
      setTotalSold(soldSum);

      // 2. Buscar gastos cadastrados
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);
    } catch (error: any) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value) {
      toast.error('Preencha todos os campos do gasto.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          description: description.trim(),
          value: parseFloat(value)
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Gasto adicionado com sucesso!');
      setDescription('');
      setValue('');
      fetchFinancialData();
    } catch (error: any) {
      console.error('Erro ao adicionar gasto:', error);
      toast.error('Erro ao cadastrar gasto.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este gasto?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Gasto removido com sucesso!');
      fetchFinancialData();
    } catch (error: any) {
      console.error('Erro ao deletar gasto:', error);
      toast.error('Erro ao excluir gasto.');
    }
  };

  // Vendas líquidas com desconto de 2%
  const netSold = totalSold * 0.98;

  // Total de gastos
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.value), 0);

  // Saldo final (Vendido - Gasto)
  const balance = netSold - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Resumo de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                Faturamento Líquido <span className="text-[10px] text-zinc-500 font-bold">(-2%)</span>
              </p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-400">
                R$ {netSold.toFixed(2)}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Bruto: R$ {totalSold.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <TrendingUp className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Gastos</p>
              <h3 className="text-3xl font-bold mt-1 text-red-400">
                R$ {totalExpenses.toFixed(2)}
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <TrendingDown className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Final</p>
              <h3 className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                R$ {balance.toFixed(2)}
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${balance >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-500'}`}>
              <Wallet className="w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Novo Gasto */}
        <div className="lg:col-span-1">
          <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Registrar Gasto
              </CardTitle>
              <CardDescription>
                Adicione um novo custo/gasto administrativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-desc">Descrição do Gasto</Label>
                  <Input
                    id="expense-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Compra de chaves Steam, Hospedagem, etc."
                    className="bg-black/40 border-white/10 focus:border-primary/50 text-white placeholder-zinc-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expense-val">Valor Gasto (R$)</Label>
                  <Input
                    id="expense-val"
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    className="bg-black/40 border-white/10 focus:border-primary/50 text-white placeholder-zinc-500"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 transition-all font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Gasto
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Gastos */}
        <div className="lg:col-span-2">
          <Card className="bg-black/20 border-white/10 backdrop-blur-sm shadow-xl min-h-[300px]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" /> Histórico de Gastos
              </CardTitle>
              <CardDescription>
                Todos os gastos administrativos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-red-500/25 border-t-red-500 rounded-full animate-spin" />
                  <span>Carregando histórico...</span>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  Nenhum gasto registrado até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="text-zinc-400">Data</TableHead>
                        <TableHead className="text-zinc-400">Descrição</TableHead>
                        <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                        <TableHead className="text-zinc-400 text-center w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((exp) => (
                        <TableRow key={exp.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-zinc-300 font-mono text-xs">
                            {new Date(exp.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-white font-medium">{exp.description}</TableCell>
                          <TableCell className="text-right text-red-400 font-bold">
                            R$ {Number(exp.value).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Financial;
