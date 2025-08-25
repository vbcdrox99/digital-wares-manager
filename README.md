# Digital Wares Manager

Um sistema para gerenciamento de itens digitais, com controle de estoque, pedidos e envios.

## Configuração do Backend no Supabase

### Pré-requisitos

1. Conta no [Supabase](https://supabase.com/)
2. Projeto criado no Supabase

### Passos para Configuração

1. Acesse o painel de controle do seu projeto no Supabase
2. Navegue até a seção SQL Editor
3. Copie e cole o conteúdo do arquivo `supabase/migrations/20231101000000_create_tables.sql`
4. Execute o script SQL para criar as tabelas necessárias

### Estrutura do Banco de Dados

O banco de dados contém as seguintes tabelas:

- **chests**: Armazena os baús (categorias de itens)
  - `id`: UUID (chave primária)
  - `name`: TEXT (nome do baú)
  - `created_at`: TIMESTAMP (data de criação)

- **items**: Armazena os itens vinculados aos baús
  - `id`: UUID (chave primária)
  - `hero_name`: TEXT (nome do herói)
  - `rarity`: ENUM (raridade do item)
  - `price`: NUMERIC (preço do item)
  - `initial_stock`: INTEGER (estoque inicial)
  - `chest_id`: UUID (referência ao baú)
  - `created_at`: TIMESTAMP (data de criação)

## Executando o Projeto

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Acessando a Aplicação

- Versão com armazenamento local: [http://localhost:8080/](http://localhost:8080/)
- Versão com Supabase: [http://localhost:8080/supabase](http://localhost:8080/supabase)

## Funcionalidades

### Controle de Estoque

- Criar baús (categorias)
- Adicionar itens aos baús
- Visualizar catálogo de itens por baú
- Excluir itens e baús

### Próximas Implementações

- Gerenciamento de pedidos
- Fila de envios
- Relatórios e estatísticas
