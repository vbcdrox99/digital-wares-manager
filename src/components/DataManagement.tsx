import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Chest, Item, Order } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface DataManagementProps {
  chests: Chest[];
  items: Item[];
  orders: Order[];
  onImportData: (data: { chests: Chest[]; items: Item[]; orders: Order[] }) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({
  chests,
  items,
  orders,
  onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Calculate available stock for items
      const calculateAvailableStock = (item: Item) => {
        const usedInOrders = orders
          .filter(order => order.status === 'pending')
          .reduce((total, order) => {
            const orderItem = order.items.find(oi => oi.item_id === item.id);
            return total + (orderItem ? orderItem.quantity : 0);
          }, 0);
        return Math.max(0, item.initial_stock - usedInOrders);
      };

      // User-friendly views
      const stockView = items.map(item => {
        const chest = chests.find(c => c.id === item.chest_id);
        return {
          'Baú': chest?.name || 'Desconhecido',
          'Herói': item.hero_name,
          'Raridade': item.rarity,
          'Preço (R$)': item.price,
          'Estoque Inicial': item.initial_stock,
          'Estoque Disponível': calculateAvailableStock(item),
          'Em Pedidos': item.initial_stock - calculateAvailableStock(item)
        };
      });

      const ordersView = orders.map(order => ({
        'Cliente': order.customer_name,
        'Steam ID': order.steam_id,
        'Tipo': order.order_type === 'sale' ? 'Venda' : 'Sorteio',
        'Status': order.status === 'pending' ? 'Pendente' : 
                 order.status === 'sent' ? 'Enviado' : 'Cancelado',
        'Data do Pedido': order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '',
        'Data de Envio': order.sent_at ? new Date(order.sent_at).toLocaleDateString('pt-BR') : '',
        'Valor Total (R$)': order.total_value,
        'Itens': order.items.map(item => `${item.hero_name} (${item.rarity}) x${item.quantity}`).join('; ')
      }));

      const shippingView = orders
        .filter(order => order.status === 'pending')
        .map(order => {
          const createdDate = order.created_at ? new Date(order.created_at) : new Date();
          const deadline = order.deadline ? new Date(order.deadline) : new Date(createdDate.getTime() + 31 * 24 * 60 * 60 * 1000);
          const now = new Date();
          const isOverdue = now > deadline;
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            'Cliente': order.customer_name,
            'Steam ID': order.steam_id,
            'Prazo de Envio': deadline.toLocaleDateString('pt-BR'),
            'Status': isOverdue ? 'Atrasado' : 'Aguardando',
            'Dias Restantes': isOverdue ? `${Math.abs(daysLeft)} dias em atraso` : `${daysLeft} dias`,
            'Valor Total (R$)': order.total_value,
            'Itens': order.items.map(item => `${item.hero_name} (${item.rarity}) x${item.quantity}`).join('; ')
          };
        })
        .sort((a, b) => new Date(a['Prazo de Envio']).getTime() - new Date(b['Prazo de Envio']).getTime());

      // Add user-friendly sheets
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stockView), 'Estoque Atual');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ordersView), 'Histórico de Pedidos');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(shippingView), 'Fila de Envios');

      // Add raw data sheets for import (hidden from normal view)
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(chests), 'RAW_Chests');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items), 'RAW_Items');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orders), 'RAW_Orders');

      // Generate filename with current date
      const now = new Date();
      const filename = `digital-wares-backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast({ title: 'Backup exportado com sucesso!' });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({ title: 'Erro ao exportar backup', variant: 'destructive' });
    }
  };

  const importFromExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Check if raw data sheets exist
        const requiredSheets = ['RAW_Chests', 'RAW_Items', 'RAW_Orders'];
        const missingSheets = requiredSheets.filter(sheet => !workbook.Sheets[sheet]);
        
        if (missingSheets.length > 0) {
          toast({ 
            title: 'Arquivo inválido', 
            description: `Planilhas não encontradas: ${missingSheets.join(', ')}`,
            variant: 'destructive' 
          });
          return;
        }

        // Import raw data
        const importedChests = XLSX.utils.sheet_to_json(workbook.Sheets['RAW_Chests']) as Chest[];
        const importedItems = XLSX.utils.sheet_to_json(workbook.Sheets['RAW_Items']) as Item[];
        const importedOrders = XLSX.utils.sheet_to_json(workbook.Sheets['RAW_Orders']) as Order[];

        // Validate data structure
        if (!Array.isArray(importedChests) || !Array.isArray(importedItems) || !Array.isArray(importedOrders)) {
          throw new Error('Estrutura de dados inválida');
        }

        onImportData({
          chests: importedChests,
          items: importedItems,
          orders: importedOrders
        });

        toast({ title: 'Backup importado com sucesso!' });
      } catch (error) {
        console.error('Error importing from Excel:', error);
        toast({ 
          title: 'Erro ao importar backup', 
          description: 'Verifique se o arquivo é um backup válido gerado por esta aplicação.',
          variant: 'destructive' 
        });
      }
    };

    reader.readAsArrayBuffer(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="border-t border-border/50 pt-6">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Gerenciamento de Dados
          </CardTitle>
          <CardDescription>
            Importe e exporte dados da aplicação em formato Excel (.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={exportToExcel}
              className="bg-gradient-gaming flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Backup (.xlsx)
            </Button>
            
            <Button 
              onClick={importFromExcel}
              variant="outline"
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Carregar Backup (.xlsx)
            </Button>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Informações Importantes:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• O backup exportado contém 3 planilhas amigáveis (Estoque, Pedidos, Fila) e 3 planilhas de dados brutos</li>
                  <li>• Para importar, use apenas arquivos gerados por esta aplicação</li>
                  <li>• A importação irá substituir todos os dados atuais</li>
                  <li>• Recomendamos fazer backup regular dos seus dados</li>
                </ul>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;