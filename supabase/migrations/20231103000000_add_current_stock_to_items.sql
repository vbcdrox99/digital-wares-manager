-- Adicionar campo current_stock à tabela items
ALTER TABLE items ADD COLUMN current_stock INTEGER;

-- Inicializar current_stock com o valor de initial_stock para itens existentes
UPDATE items SET current_stock = initial_stock WHERE current_stock IS NULL;

-- Tornar o campo obrigatório
ALTER TABLE items ALTER COLUMN current_stock SET NOT NULL;

-- Adicionar constraint para garantir que current_stock não seja negativo
ALTER TABLE items ADD CONSTRAINT items_current_stock_non_negative CHECK (current_stock >= 0);

-- Criar índice para melhorar performance nas consultas por current_stock
CREATE INDEX items_current_stock_idx ON items(current_stock);