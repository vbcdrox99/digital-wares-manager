# Instruções para Configuração do Supabase

Este documento contém instruções detalhadas para configurar o banco de dados no Supabase para o projeto Digital Wares Manager.

## Pré-requisitos

1. Conta no [Supabase](https://supabase.com/)
2. Acesso ao projeto `jlghsevsildatnjhediw`

## Passos para Configuração Manual

### 1. Acesse o Painel do Supabase

- Vá para [https://app.supabase.com/](https://app.supabase.com/)
- Faça login na sua conta
- Selecione o projeto `jlghsevsildatnjhediw`

### 2. Navegue até o SQL Editor

- No menu lateral esquerdo, clique em "SQL Editor"
- Clique em "New Query" ou "Nova Consulta"

### 3. Execute o Script SQL

Copie e cole o script abaixo no editor SQL e clique em "Run" ou "Executar":

```sql
-- Criar extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar enum para raridade
CREATE TYPE rarity AS ENUM ('common', 'uncommon', 'rare', 'legendary', 'immortal', 'mythic');

-- Criar enum para tipo de pedido
CREATE TYPE order_type AS ENUM ('sale', 'giveaway');

-- Criar enum para status de pedido
CREATE TYPE order_status AS ENUM ('pending', 'sent', 'cancelled');

-- Criar enum para status de envio
CREATE TYPE shipping_status AS ENUM ('awaiting', 'overdue');

-- Criar tabela de baús
CREATE TABLE chests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de itens
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hero_name TEXT NOT NULL,
  rarity rarity NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  initial_stock INTEGER NOT NULL,
  chest_id UUID NOT NULL REFERENCES chests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  steam_id TEXT NOT NULL,
  order_type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  total_value NUMERIC(10, 2) NOT NULL
);

-- Criar tabela de itens do pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de fila de envios
CREATE TABLE shipping_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status shipping_status NOT NULL DEFAULT 'awaiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX items_chest_id_idx ON items(chest_id);
CREATE INDEX order_items_order_id_idx ON order_items(order_id);
CREATE INDEX order_items_item_id_idx ON order_items(item_id);
CREATE INDEX shipping_queue_order_id_idx ON shipping_queue(order_id);

-- Criar políticas de segurança (RLS)
ALTER TABLE chests ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_queue ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso anônimo (para desenvolvimento)
CREATE POLICY "Acesso anônimo a baús" ON chests FOR ALL USING (true);
CREATE POLICY "Acesso anônimo a itens" ON items FOR ALL USING (true);
CREATE POLICY "Acesso anônimo a pedidos" ON orders FOR ALL USING (true);
CREATE POLICY "Acesso anônimo a itens de pedidos" ON order_items FOR ALL USING (true);
CREATE POLICY "Acesso anônimo a fila de envios" ON shipping_queue FOR ALL USING (true);
```

### 4. Verificação

Após executar o script, verifique se as tabelas foram criadas corretamente:

1. No menu lateral esquerdo do Supabase, clique em "Table Editor"
2. Você deverá ver as tabelas: `chests`, `items`, `orders`, `order_items` e `shipping_queue`

## Solução de Problemas

### Se o Script Falhar

#### Erro de Extensão UUID

Se houver erro na criação da extensão UUID, tente executar apenas:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

E depois execute o restante do script.

#### Erro de Tipos Existentes

Se os tipos enum já existirem, você pode modificar o script para usar:

```sql
DROP TYPE IF EXISTS rarity CASCADE;
CREATE TYPE rarity AS ENUM ('common', 'uncommon', 'rare', 'legendary', 'immortal', 'mythic');
```

(Repita para os outros tipos)

#### Erro de Tabelas Existentes

Se as tabelas já existirem, você pode modificar o script para usar:

```sql
DROP TABLE IF EXISTS shipping_queue CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS chests CASCADE;
```

E depois execute o restante do script.

## Próximos Passos

Depois de criar as tabelas com sucesso:

1. Reinicie o servidor de desenvolvimento (se necessário)
2. Acesse a aplicação em: http://localhost:8080/supabase
3. Teste a criação de baús e itens para verificar se a conexão com o Supabase está funcionando corretamente