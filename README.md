# Pulse Security - Frontend

Frontend Vue.js para análise de sentimento e tópicos em publicações de redes sociais.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20.19.0+ ou 22.12.0+
- npm ou yarn
- Backend rodando (veja [INTEGRATION.md](./docs/INTEGRATION.md))

### Instalação

```bash
npm install
```

### Configuração

Copie o arquivo de exemplo e configure:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# URL da API do backend
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Usar API (true) ou arquivos JSON estáticos (false)
VITE_USE_API=true
```

### Executar

```bash
npm run dev
```

Acesse: http://localhost:5173

## 📚 Documentação

- [Guia de Integração](./docs/INTEGRATION.md) - Como conectar frontend e backend
- [Backend Documentation](../scrapping-backend/docs/) - Documentação completa do backend

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Build para produção
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # Executa ESLint
npm run format           # Formata código com Prettier
npm run type-check       # Verifica tipos TypeScript

# Testes
npm run test:unit        # Testes unitários
npm run test:e2e         # Testes end-to-end
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes Vue reutilizáveis
├── views/              # Páginas/Views
├── stores/             # Pinia stores (gerenciamento de estado)
├── services/           # Serviços de API
│   ├── api.js         # Cliente HTTP
│   ├── publicationService.js
│   └── dashboardService.js
├── config/             # Configurações
│   └── api.js         # Configuração da API
├── utils/              # Utilitários
│   ├── sentimentClassifier.js
│   ├── emotionClassifier.js
│   └── topicClassifier.js
└── router/             # Rotas Vue Router
```

## 🔌 Integração com Backend

O frontend pode operar em dois modos:

### Modo API (Padrão)

Conecta-se ao backend FastAPI:

```env
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Modo JSON (Legado)

Usa arquivos JSON estáticos:

```env
VITE_USE_API=false
```

## 🚀 Executando Frontend + Backend

### Opção 1: Scripts Automáticos

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Windows:**
```powershell
.\start-dev.ps1
```

### Opção 2: Terminais Separados

**Terminal 1 - Backend:**
```bash
cd ../scrapping-backend
uv run uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 📦 Tecnologias

- **Vue 3** - Framework JavaScript
- **TypeScript** - Tipagem estática
- **Pinia** - Gerenciamento de estado
- **Vue Router** - Roteamento
- **Chart.js** - Gráficos e visualizações
- **Vite** - Build tool e dev server

## 🔧 Desenvolvimento

### Adicionar Nova Rota

1. Crie o componente em `src/views/`
2. Adicione a rota em `src/router/index.ts`

### Adicionar Novo Serviço de API

1. Crie o serviço em `src/services/`
2. Use o cliente `api` de `src/services/api.js`

### Adicionar Novo Store

1. Crie o store em `src/stores/`
2. Use `defineStore` do Pinia

## 🐛 Troubleshooting

### Erro: "Failed to fetch"

- Verifique se o backend está rodando
- Confirme a URL no `.env`
- Verifique CORS no backend

### Dados não aparecem

- Verifique se os dados foram importados no backend
- Confirme que `VITE_USE_API=true` no `.env`
- Verifique o console do navegador para erros

### Porta já em uso

```bash
# Linux/Mac
lsof -i :5173
kill -9 <PID>

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## 📝 Licença

[Adicione sua licença aqui]
