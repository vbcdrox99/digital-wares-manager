import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Minus, Trash2, Package, Loader2, Users, Edit, Star, Settings, Palette, Check, X, ChevronsUpDown } from 'lucide-react';
import { Rarity } from '@/types/inventory';
import { toast } from '@/hooks/use-toast';
import { supabaseServices, Chest, Item, Customer } from '@/integrations/supabase/services';
import { supabase } from '@/integrations/supabase/client';
import { getBadgeStyleFromColor } from '@/utils/rarityUtils';
import { HeroCombobox } from './HeroCombobox';


interface RarityDefinition {
  id: string;
  name: string;
  color: string;
}



const SupabaseStockControl: React.FC = () => {
  // Estados para os dados
  const [chests, setChests] = useState<Chest[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Estados para carregamento
  const [loading, setLoading] = useState({
    chests: false,
    items: false,
    customers: false,
    createChest: false,
    addItem: false,
    deleteChest: false,
    deleteItem: false,
    editItem: false,
    createCustomer: false,
    rarities: false,
    manageRarity: false
  });

  // Estados para formulários
  const [newChestName, setNewChestName] = useState('');
  const [selectedChestForAdd, setSelectedChestForAdd] = useState('');
  const [selectedChestForView, setSelectedChestForView] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    hero_name: '',
    rarity: 'comum' as Rarity,
    price: 0,
    initial_stock: 0,
    image_url: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    steam_id: ''
  });
  
  // Estados para controle de preços, descontos e estoque
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [itemStocks, setItemStocks] = useState<Record<string, number>>({});
  
  // Estados para modal de edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    hero_name: '',
    rarity: 'comum' as Rarity,
    price: 0,
    initial_stock: 0,
    current_stock: 0,
    image_url: ''
  });
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string>('');

  // Estados para modal de confirmação de exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [chestToDelete, setChestToDelete] = useState<string | null>(null);

  // Estado para filtro de busca
  const [searchFilter, setSearchFilter] = useState('');
  const [rarityDefinitions, setRarityDefinitions] = useState<RarityDefinition[]>([]);
  const [showManageRarities, setShowManageRarities] = useState(false);
  const [newRarity, setNewRarity] = useState({ name: '', color: '#000000' });
  const [editingRarity, setEditingRarity] = useState<RarityDefinition | null>(null);
  const [rarityToDelete, setRarityToDelete] = useState<RarityDefinition | null>(null);

  // Carregar baús e clientes ao iniciar
  useEffect(() => {
    loadChests();
    loadCustomers();
    loadRarities();
  }, []);

  // Carregar itens quando um baú for selecionado para visualização
  useEffect(() => {
    if (selectedChestForView) {
      loadItemsByChestId(selectedChestForView);
    } else {
      setItems([]);
    }
  }, [selectedChestForView]);

  // Inicializar preços quando itens forem carregados
  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    const initialDiscounts: Record<string, number> = {};
    items.forEach(item => {
      initialPrices[item.id] = item.price;
      initialDiscounts[item.id] = item.discount || 0;
    });
    setItemPrices(initialPrices);
    setItemDiscounts(initialDiscounts);
  }, [items]);



  const loadRarities = async () => {
    try {
      setLoading(prev => ({ ...prev, rarities: true }));
      const { data, error } = await supabase
        .from('rarities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setRarityDefinitions(data);
      }
    } catch (error) {
      console.error('Erro ao carregar raridades:', error);
      toast({ title: 'Erro ao carregar raridades', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, rarities: false }));
    }
  };

  const handleCreateRarity = async () => {
    const name = newRarity.name.trim().toLowerCase();
    if (!name) {
      toast({ title: 'Nome inválido', description: 'Digite um nome de raridade.', variant: 'destructive' });
      return;
    }
    
    if (rarityDefinitions.some(r => r.name.toLowerCase() === name)) {
      toast({ title: 'Já existe', description: 'Essa raridade já está na lista.' });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, manageRarity: true }));
      const { data, error } = await supabase
        .from('rarities')
        .insert({ name, color: newRarity.color })
        .select()
        .single();

      if (error) throw error;

      setRarityDefinitions(prev => [...prev, data]);
      setNewRarity({ name: '', color: '#000000' });
      toast({ title: 'Raridade adicionada', description: `"${name}" disponível na lista.` });
    } catch (error) {
      console.error('Erro ao criar raridade:', error);
      toast({ title: 'Erro ao criar raridade', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, manageRarity: false }));
    }
  };

  const handleUpdateRarity = async () => {
    if (!editingRarity) return;
    
    try {
      setLoading(prev => ({ ...prev, manageRarity: true }));
      
      // Get original name to update items if changed
      const originalRarity = rarityDefinitions.find(r => r.id === editingRarity.id);
      
      const { error } = await supabase
        .from('rarities')
        .update({ name: editingRarity.name, color: editingRarity.color })
        .eq('id', editingRarity.id);

      if (error) throw error;
      
      // If name changed, update all items
      if (originalRarity && originalRarity.name !== editingRarity.name) {
         const { error: itemsError } = await supabase
           .from('items')
           .update({ rarity: editingRarity.name })
           .eq('rarity', originalRarity.name);
           
         if (itemsError) {
            console.error('Erro ao atualizar itens com nova raridade:', itemsError);
            toast({ title: 'Aviso: Itens podem não ter sido atualizados', variant: 'destructive' });
         }
      }

      setRarityDefinitions(prev => prev.map(r => r.id === editingRarity.id ? editingRarity : r));
      setEditingRarity(null);
      toast({ title: 'Raridade atualizada com sucesso!' });
      
      // Reload items to reflect changes if necessary
      if (selectedChestForView) {
        loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error('Erro ao atualizar raridade:', error);
      toast({ title: 'Erro ao atualizar raridade', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, manageRarity: false }));
    }
  };

  const confirmDeleteRarity = async () => {
    if (!rarityToDelete) return;
    
    try {
      setLoading(prev => ({ ...prev, manageRarity: true }));
      const { error } = await supabase
        .from('rarities')
        .delete()
        .eq('id', rarityToDelete.id);

      if (error) throw error;

      setRarityDefinitions(prev => prev.filter(r => r.id !== rarityToDelete.id));
      setRarityToDelete(null);
      toast({ title: 'Raridade excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir raridade:', error);
      toast({ title: 'Erro ao excluir raridade', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, manageRarity: false }));
    }
  };

  const getRarityColor = (rarityName: string) => {
    const rarity = rarityDefinitions.find(r => r.name.toLowerCase() === rarityName.toLowerCase());
    return rarity ? rarity.color : 'bg-gray-700 text-white border-gray-800';
  };

  // Função para manipular upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tamanho do arquivo (máx. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Verificar tipo do arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato de imagem não suportado. Use JPG, PNG, GIF, WebP ou SVG.",
        variant: "destructive"
      });
      return;
    }

    setSelectedImage(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImagePreview(result);
      setNewItem({ ...newItem, image_url: result });
    };
    reader.readAsDataURL(file);
  };

  // Função para limpar imagem selecionada
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setNewItem({ ...newItem, image_url: '' });
  };

  // Função para manipular upload de imagem no modal de edição
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tamanho do arquivo (máx. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Verificar tipo do arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato de imagem não suportado. Use JPG, PNG, GIF, WebP ou SVG.",
        variant: "destructive"
      });
      return;
    }

    setEditSelectedImage(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditImagePreview(result);
      setEditForm({ ...editForm, image_url: result });
    };
    reader.readAsDataURL(file);
  };

  // Função para limpar imagem selecionada no modal de edição
  const clearEditImage = () => {
    setEditSelectedImage(null);
    setEditImagePreview('');
    setEditForm({ ...editForm, image_url: '' });
  };

  // Funções para carregar dados com timeout
  const loadChests = async () => {
    try {
      setLoading(prev => ({ ...prev, chests: true }));
      console.log('🔍 Carregando baús...');
      
      // Implementar timeout de 15 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar baús')), 15000);
      });

      const chestsPromise = supabaseServices.chests.getAll();
      const chestsData = await Promise.race([chestsPromise, timeoutPromise]);
      
      console.log('📦 Baús carregados:', chestsData);
      
      setChests(chestsData);
      
      // Se não houver baú selecionado e existirem baús, seleciona o primeiro
      if (!selectedChestForView && chestsData.length > 0) {
        setSelectedChestForView(chestsData[0].id);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar baús:', error);
      toast({ 
        title: 'Erro ao carregar baús', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    } finally {
      setLoading(prev => ({ ...prev, chests: false }));
    }
  };

  const loadItemsByChestId = async (chestId: string) => {
    try {
      setLoading(prev => ({ ...prev, items: true }));
      console.log('🔍 Carregando itens do baú:', chestId);
      
      // Implementar timeout de 15 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar itens')), 15000);
      });

      const itemsPromise = supabaseServices.items.getByChestId(chestId);
      const itemsData = await Promise.race([itemsPromise, timeoutPromise]);
      
      console.log('🎮 Itens carregados:', itemsData);
      
      setItems(itemsData);
    } catch (error) {
      console.error(`❌ Erro ao carregar itens do baú ${chestId}:`, error);
      toast({ 
        title: 'Erro ao carregar itens', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    } finally {
      setLoading(prev => ({ ...prev, items: false }));
    }
  };

  const loadCustomers = async () => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      console.log('🔍 Carregando clientes...');
      
      // Implementar timeout de 15 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar clientes')), 15000);
      });

      const customersPromise = supabaseServices.customers.getAll();
      const customersData = await Promise.race([customersPromise, timeoutPromise]);
      
      console.log('👥 Clientes carregados:', customersData);
      
      setCustomers(customersData);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast({ 
        title: 'Erro ao carregar clientes', 
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive' 
      });
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  // Funções para manipular dados
  const handleCreateChest = async () => {
    if (!newChestName.trim()) {
      toast({ title: 'Nome do baú é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, createChest: true }));
      
      console.log('🔍 Iniciando criação de baú:', { name: newChestName.trim() });
      
      const newChest = await supabaseServices.chests.create({ name: newChestName.trim() });
      
      console.log('✅ Baú criado com sucesso:', newChest);
      
      // Atualizar a lista de baús diretamente no estado
      setChests(prev => [newChest, ...prev]);
      
      setNewChestName('');
      toast({ title: 'Baú criado com sucesso!' });
      
      // Recarregar a lista de baús para garantir sincronização
      await loadChests();
    } catch (error) {
      console.error('❌ Erro ao criar baú:', error);
      toast({ title: 'Erro ao criar baú', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, createChest: false }));
    }
  };

  const handleAddItem = async () => {
    if (!selectedChestForAdd || !newItem.name.trim() || !newItem.hero_name.trim() || newItem.price <= 0 || newItem.initial_stock < 0) {
      toast({ title: 'Preencha todos os campos obrigatórios corretamente', variant: 'destructive' });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, addItem: true }));
      
      const itemData = {
        name: newItem.name.trim(),
        hero_name: newItem.hero_name.trim(),
        rarity: newItem.rarity,
        price: newItem.price,
        initial_stock: newItem.initial_stock,
        current_stock: newItem.initial_stock,
        chest_id: selectedChestForAdd,
        image_url: newItem.image_url.trim() || null
      };
      
      console.log('🔍 Iniciando criação de item:', itemData);
      
      const createdItem = await supabaseServices.items.create(itemData);
      
      console.log('✅ Item criado com sucesso:', createdItem);
      
      setNewItem({ name: '', hero_name: '', rarity: 'comum', price: 0, initial_stock: 0, image_url: '' });
      setSelectedImage(null);
      setImagePreview('');
      toast({ title: 'Item adicionado com sucesso!' });
      
      // Se o baú atual for o mesmo que estamos visualizando, recarregar itens
      if (selectedChestForAdd === selectedChestForView) {
        await loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
      toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, addItem: false }));
    }
  };

  const handleDeleteChest = async (chestId: string) => {
    console.log('handleDeleteChest chamado com ID:', chestId);
    
    if (!confirm('Tem certeza que deseja excluir este baú? Todos os itens e pedidos relacionados serão removidos permanentemente.')) {
      console.log('Exclusão cancelada pelo usuário');
      return;
    }

    console.log('Usuário confirmou a exclusão, iniciando processo...');
    
    try {
      setLoading(prev => ({ ...prev, deleteChest: true }));
      
      // Primeiro, buscar todos os itens do baú
      console.log('Buscando itens do baú...');
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id')
        .eq('chest_id', chestId);
      
      if (itemsError) {
        throw itemsError;
      }
      
      console.log('Itens encontrados:', items?.length || 0);
      
      // Se existem itens, excluir order_items relacionados primeiro
      if (items && items.length > 0) {
        const itemIds = items.map(item => item.id);
        console.log('Excluindo order_items relacionados...');
        
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .delete()
          .in('item_id', itemIds);
        
        if (orderItemsError) {
          throw orderItemsError;
        }
        
        console.log('Order_items excluídos com sucesso');
      }
      
      // Agora excluir o baú (que excluirá os itens em cascata)
      console.log('Excluindo baú...');
      const result = await supabaseServices.chests.remove(chestId);
      console.log('Resultado da exclusão:', result);
      
      toast({ title: 'Baú e todos os dados relacionados removidos com sucesso!' });
      
      // Se o baú removido for o que estamos visualizando, limpar seleção
      if (chestId === selectedChestForView) {
        setSelectedChestForView('');
      }
      
      console.log('Recarregando lista de baús...');
      await loadChests();
      console.log('Lista de baús recarregada com sucesso');
    } catch (error) {
      console.error(`Erro ao remover baú ${chestId}:`, error);
      toast({ 
        title: 'Erro ao remover baú', 
        description: 'Verifique se não há pedidos pendentes relacionados a este baú.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(prev => ({ ...prev, deleteChest: false }));
    }
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(prev => ({ ...prev, deleteItem: true }));
      await supabaseServices.items.remove(itemToDelete);
      toast({ title: 'Item removido com sucesso!' });
      
      if (selectedChestForView) {
        await loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error(`Erro ao remover item ${itemToDelete}:`, error);
      toast({ title: 'Erro ao remover item', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, deleteItem: false }));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const cancelDeleteItem = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      hero_name: item.hero_name,
      rarity: item.rarity,
      price: item.price,
      initial_stock: item.initial_stock,
      current_stock: item.current_stock || item.initial_stock,
      image_url: item.image_url || ''
    });
    // Resetar estados de imagem do modal de edição
    setEditSelectedImage(null);
    setEditImagePreview(item.image_url || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setLoading(prev => ({ ...prev, editItem: true }));
      
      await supabaseServices.items.update(editingItem.id, {
        name: editForm.name,
        hero_name: editForm.hero_name,
        rarity: editForm.rarity,
        price: editForm.price,
        initial_stock: editForm.initial_stock,
        current_stock: editForm.current_stock,
        image_url: editForm.image_url
      });
      
      toast({ title: 'Item atualizado com sucesso!' });
      setIsEditModalOpen(false);
      setEditingItem(null);
      
      if (selectedChestForView) {
        await loadItemsByChestId(selectedChestForView);
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, editItem: false }));
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.steam_id.trim()) {
      toast({ title: 'Nome e Steam ID são obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, createCustomer: true }));
      console.log('🔄 Criando cliente:', newCustomer);
      
      await supabaseServices.customers.create({
        name: newCustomer.name.trim(),
        steam_id: newCustomer.steam_id.trim()
      });
      
      toast({ title: 'Cliente criado com sucesso!' });
      
      // Limpar formulário
      setNewCustomer({ name: '', steam_id: '' });
      
      // Recarregar lista de clientes
      await loadCustomers();
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      if (error.message?.includes('duplicate key')) {
        toast({ title: 'Steam ID já cadastrado', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao criar cliente', variant: 'destructive' });
      }
    } finally {
      setLoading(prev => ({ ...prev, createCustomer: false }));
    }
  };

  // Funções para controle de preços e descontos
  const handlePriceChange = async (itemId: string, change: number) => {
    try {
      const currentPrice = itemPrices[itemId] || 0;
      const newPrice = Math.max(0, currentPrice + change);
      
      // Atualizar estado local
      setItemPrices(prev => ({ ...prev, [itemId]: newPrice }));
      
      // Atualizar no banco de dados
      await supabaseServices.items.update(itemId, { price: newPrice });
      
      // Atualizar item na lista local
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, price: newPrice } : i));
      
      toast({
        title: "Preço atualizado",
        description: `Preço alterado para R$ ${newPrice.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço.",
        variant: "destructive"
      });
    }
  };

  const handleStockChange = async (itemId: string, change: number) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const currentStock = itemStocks[itemId] ?? item.current_stock ?? item.initial_stock ?? 0;
      const newStock = Math.max(0, currentStock + change);

      // Atualizar no banco de dados
      await supabaseServices.items.update(itemId, { current_stock: newStock });

      // Atualizar estado local
      setItemStocks(prev => ({ ...prev, [itemId]: newStock }));

      // Atualizar a lista de itens para refletir a mudança
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, current_stock: newStock } : i
      ));

      toast({
        title: "Estoque atualizado",
        description: `Estoque do item alterado para ${newStock}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque",
        variant: "destructive",
      });
    }
  };

  const handleToggleHighlight = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newHighlightedState = !item.highlighted;

      // Atualizar no banco de dados
      await supabaseServices.items.update(itemId, { highlighted: newHighlightedState });

      // Atualizar estado local
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, highlighted: newHighlightedState } : i
      ));

      toast({
        title: "Destaque atualizado",
        description: `Item ${newHighlightedState ? 'destacado' : 'removido do destaque'}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar destaque:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o destaque",
        variant: "destructive",
      });
    }
  };

  const handleDiscountChange = async (itemId: string, discount: number) => {
    try {
      // Atualizar estado local
      setItemDiscounts(prev => ({ ...prev, [itemId]: discount }));
      
      // Atualizar no banco de dados
      await supabaseServices.items.update(itemId, { discount });
      
      toast({
        title: "Desconto atualizado",
        description: `Desconto de ${discount}% aplicado com sucesso.`,
      });
      
      // Atualizar item na lista local
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, discount } : i));
    } catch (error) {
      console.error('Erro ao atualizar desconto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o desconto.",
        variant: "destructive"
      });
    }
  };

  const getDiscountedPrice = (itemId: string, originalPrice: number) => {
    const currentPrice = itemPrices[itemId] || originalPrice;
    const discount = itemDiscounts[itemId] || 0;
    return currentPrice * (1 - discount / 100);
  };

  const discountOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  const viewingChest = chests.find(c => c.id === selectedChestForView);

  return (
    <div className="space-y-6">
      {/* Create Chest */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Criar Baú
          </CardTitle>
          <CardDescription>Crie uma nova categoria de itens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="chest-name">Nome do Baú</Label>
              <Input
                id="chest-name"
                value={newChestName}
                onChange={(e) => setNewChestName(e.target.value)}
                placeholder="Ex: Skins de Herói"
                className="bg-secondary/50"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateChest} 
                className="bg-gradient-gaming"
                disabled={loading.createChest}
              >
                {loading.createChest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Baú'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Customer */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Cadastrar Cliente
          </CardTitle>
          <CardDescription>Cadastre um novo cliente com nome e Steam ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-name">Nome do Cliente</Label>
              <Input
                id="customer-name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="bg-secondary/50"
              />
            </div>
            <div>
              <Label htmlFor="customer-steam-id">Steam ID</Label>
              <Input
                id="customer-steam-id"
                value={newCustomer.steam_id}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, steam_id: e.target.value }))}
                placeholder="Ex: 76561198123456789"
                className="bg-secondary/50"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleCreateCustomer} 
              className="bg-gradient-gaming"
              disabled={loading.createCustomer}
            >
              {loading.createCustomer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Cliente'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Item */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Adicionar Item ao Baú</CardTitle>
          <CardDescription>Adicione um novo item a um baú existente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Baú</Label>
              <Select value={selectedChestForAdd} onValueChange={setSelectedChestForAdd}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecionar baú" />
                </SelectTrigger>
                <SelectContent>
                  {chests.map((chest) => (
                    <SelectItem key={chest.id} value={chest.id}>
                      {chest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Nome do Item</Label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Ex: Dragonclaw Hook"
                className="bg-secondary/50"
              />
            </div>
            
            <div>
              <Label>Nome do Herói</Label>
              <HeroCombobox
                value={newItem.hero_name}
                onChange={(value) => setNewItem({ ...newItem, hero_name: value })}
              />
            </div>
            
            <div>
              <Label>Imagem do Item (link externo, opcional)</Label>
              <div className="space-y-3">
                <Input
                  type="url"
                  placeholder="https://exemplo.com/imagem.png"
                  value={newItem.image_url || ''}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  className="bg-secondary/50"
                />
                {newItem.image_url && (
                  <div className="relative w-64 aspect-[2/1]">
                    <img
                      src={newItem.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg border-2 border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={clearImage}
                    >
                      ×
                    </Button>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Informe a URL completa da imagem (https://...).
                </div>
              </div>
            </div>
            
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                value={newItem.price || ''}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                placeholder="0.00"
                className="bg-secondary/50"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label>Estoque Inicial</Label>
              <Input
                type="number"
                value={newItem.initial_stock || ''}
                onChange={(e) => setNewItem({ ...newItem, initial_stock: Number(e.target.value) })}
                placeholder="0"
                className="bg-secondary/50"
                min="0"
              />
            </div>
            
            <div>
              <Label>Raridade</Label>
              <div className="flex items-center gap-2">
                <Select 
                  value={newItem.rarity} 
                  onValueChange={(value: string) => setNewItem({ ...newItem, rarity: value })}
                >
                  <SelectTrigger className="bg-secondary/50 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rarityDefinitions.map((rarity) => (
                      <SelectItem key={rarity.id} value={rarity.name}>
                        <Badge {...getBadgeStyleFromColor(rarity.color)}>
                          {rarity.name}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setShowManageRarities(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleAddItem} 
              className="bg-gradient-gaming"
              disabled={loading.addItem}
            >
              {loading.addItem ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Chest */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Visualizar Catálogo</CardTitle>
          <CardDescription>Visualize e gerencie os itens em cada baú</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Selecionar Baú</Label>
              <Select value={selectedChestForView} onValueChange={setSelectedChestForView}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecionar baú" />
                </SelectTrigger>
                <SelectContent>
                  {chests.map((chest) => (
                    <SelectItem key={chest.id} value={chest.id}>
                      {chest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {viewingChest && (
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteChest(viewingChest.id)}
                disabled={loading.deleteChest}
              >
                {loading.deleteChest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Baú
                  </>
                )}
              </Button>
            )}
          </div>

          {loading.items ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewingChest ? (
            <>
              {/* Caixa de busca */}
              <div className="mb-4">
                <Input
                  placeholder="Buscar por nome do herói ou nome do item..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {items.filter(item => 
                item.hero_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                item.name.toLowerCase().includes(searchFilter.toLowerCase())
              ).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destaque</TableHead>
                    <TableHead>Herói</TableHead>
                    <TableHead>Nome do Item</TableHead>
                    <TableHead>Raridade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.filter(item => 
                    item.hero_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    item.name.toLowerCase().includes(searchFilter.toLowerCase())
                  ).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleHighlight(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Star 
                            className={`h-4 w-4 ${item.highlighted ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{item.hero_name}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge {...getBadgeStyleFromColor(getRarityColor(item.rarity as Rarity))}>
                          {item.rarity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePriceChange(item.id, -1)}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[80px] text-center font-medium">
                              R$ {(itemPrices[item.id] || item.price).toFixed(2)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePriceChange(item.id, 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Desconto:</Label>
                            <Select
                              value={(itemDiscounts[item.id] || 0).toString()}
                              onValueChange={(value) => handleDiscountChange(item.id, parseInt(value))}
                            >
                              <SelectTrigger className="h-8 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {discountOptions.map(discount => (
                                  <SelectItem key={discount} value={discount.toString()}>
                                    {discount}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {(itemDiscounts[item.id] || 0) > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              Final: R$ {getDiscountedPrice(item.id, item.price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockChange(item.id, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="min-w-[60px] text-center font-medium">
                            {itemStocks[item.id] ?? item.current_stock ?? item.initial_stock}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockChange(item.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            disabled={loading.editItem}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={loading.deleteItem}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchFilter ? 
                  `Nenhum item encontrado para "${searchFilter}".` : 
                  'Nenhum item encontrado neste baú.'
                }
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Selecione um baú para visualizar seus itens.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no item selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome do Item
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-hero" className="text-right">
                Herói
              </Label>
              <div className="col-span-3">
                <HeroCombobox
                  id="edit-hero"
                  value={editForm.hero_name}
                  onChange={(value) => setEditForm(prev => ({ ...prev, hero_name: value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-rarity" className="text-right">Raridade</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Select
                  value={editForm.rarity}
                  onValueChange={(value: string) => setEditForm(prev => ({ ...prev, rarity: value }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rarityDefinitions.map(rarity => (
                      <SelectItem key={rarity.id} value={rarity.name}>
                        <Badge {...getBadgeStyleFromColor(rarity.color)}>
                          {rarity.name}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setShowManageRarities(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Preço
              </Label>
              <Input
                id="edit-price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-initial-stock" className="text-right">
                Estoque Inicial
              </Label>
              <Input
                id="edit-initial-stock"
                type="number"
                value={editForm.initial_stock}
                onChange={(e) => setEditForm(prev => ({ ...prev, initial_stock: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-current-stock" className="text-right">
                Estoque Atual
              </Label>
              <Input
                id="edit-current-stock"
                type="number"
                value={editForm.current_stock}
                onChange={(e) => setEditForm(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-image-url" className="text-right">
                Imagem do Item (link externo)
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="edit-image-url"
                  type="url"
                  placeholder="https://exemplo.com/imagem.png"
                  value={editForm.image_url || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Informe a URL completa da imagem (https://...).</p>
                {editForm.image_url && (
                  <div className="relative w-40 aspect-[2/1]">
                    <img
                      src={editForm.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={clearEditImage}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={loading.editItem}
            >
              {loading.editItem ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteItem}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteItem}
              disabled={loading.deleteItem}
            >
              {loading.deleteItem ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showManageRarities} onOpenChange={setShowManageRarities}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Raridades</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova raridades e suas cores.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Create New Rarity Form */}
            <div className="p-4 border rounded-lg bg-secondary/20 space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar Nova Raridade
              </h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Nome</Label>
                  <Input 
                    value={newRarity.name} 
                    onChange={(e) => setNewRarity(prev => ({ ...prev, name: e.target.value }))} 
                    placeholder="Ex: lendária" 
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={newRarity.color.startsWith('#') ? newRarity.color : '#000000'}
                      onChange={(e) => setNewRarity(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={newRarity.color}
                      onChange={(e) => setNewRarity(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#000000 ou classe"
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateRarity} disabled={loading.manageRarity}>
                  {loading.manageRarity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <Badge {...getBadgeStyleFromColor(newRarity.color)}>
                  {newRarity.name || 'Nome da Raridade'}
                </Badge>
              </div>
            </div>

            {/* List Existing Rarities */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Raridades Existentes</h3>
              <div className="border rounded-lg divide-y">
                {rarityDefinitions.map(rarity => (
                  <div key={rarity.id} className="p-3 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                    {editingRarity?.id === rarity.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <Input 
                          value={editingRarity.name} 
                          onChange={(e) => setEditingRarity(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                          className="h-8"
                        />
                        <div className="flex gap-1 items-center flex-1">
                          <Input 
                            type="color" 
                            value={editingRarity.color.startsWith('#') ? editingRarity.color : '#000000'}
                            onChange={(e) => setEditingRarity(prev => prev ? ({ ...prev, color: e.target.value }) : null)}
                            className="w-8 h-8 p-0.5 cursor-pointer shrink-0"
                          />
                          <Input 
                            value={editingRarity.color}
                            onChange={(e) => setEditingRarity(prev => prev ? ({ ...prev, color: e.target.value }) : null)}
                            className="h-8 min-w-[100px]"
                          />
                        </div>
                        <Button size="sm" variant="ghost" onClick={handleUpdateRarity} disabled={loading.manageRarity}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingRarity(null)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Badge {...getBadgeStyleFromColor(rarity.color)}>
                            {rarity.name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingRarity(rarity)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRarityToDelete(rarity)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageRarities(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Rarity Confirmation */}
      <Dialog open={!!rarityToDelete} onOpenChange={(open) => !open && setRarityToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Raridade</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a raridade "{rarityToDelete?.name}"?
              <br /><br />
              <span className="text-red-500 font-bold">Atenção:</span> Isso pode afetar itens que usam esta raridade. Eles manterão o nome da raridade, mas perderão a associação com a cor definida aqui.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRarityToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteRarity} disabled={loading.manageRarity}>
              {loading.manageRarity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default SupabaseStockControl;