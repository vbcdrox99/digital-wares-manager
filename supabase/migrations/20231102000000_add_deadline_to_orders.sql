-- Adicionar campo deadline à tabela orders
ALTER TABLE orders ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;

-- Criar índice para melhorar performance nas consultas por deadline
CREATE INDEX orders_deadline_idx ON orders(deadline);