# Guia de Integração Frontend-Backend

Este guia explica como conectar e executar o frontend e backend juntos.

## Configuração

### 1. Backend

Certifique-se de que o backend está configurado e rodando:

```bash
cd scrapping-backend

# Instalar dependências
uv sync

# Configurar .env
cp env.example .env
# Edite o .env com suas configurações

# Executar migrations
uv run alembic upgrade head

# Iniciar servidor
uv run uvicorn app.main:app --reload
```

O backend estará disponível em: `http://localhost:8000`

### 2. Frontend

Configure o frontend para se conectar ao backend:

```bash
cd scrapping-front

# Instalar dependências (se ainda não fez)
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# URL da API do backend
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Usar API (true) ou arquivos JSON estáticos (false)
VITE_USE_API=true
```

## Executando Ambos

### Opção 1: Terminais Separados (Recomendado)

**Terminal 1 - Backend:**
```bash
cd scrapping-backend
uv run uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd scrapping-front
npm run dev
```

### Opção 2: Script de Execução Simultânea

Crie um script para executar ambos:

**Windows (PowerShell) - `start-dev.ps1`:**
```powershell
# start-dev.ps1
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd scrapping-backend; uv run uvicorn app.main:app --reload"
Start-Sleep -Seconds 3
cd scrapping-front
npm run dev
```

**Linux/Mac - `start-dev.sh`:**
```bash
#!/bin/bash
# start-dev.sh

# Inicia backend em background
cd scrapping-backend
uv run uvicorn app.main:app --reload &
BACKEND_PID=$!

# Aguarda backend iniciar
sleep 3

# Inicia frontend
cd ../scrapping-front
npm run dev

# Mata o backend quando o script terminar
trap "kill $BACKEND_PID" EXIT
```

Torne executável (Linux/Mac):
```bash
chmod +x start-dev.sh
```

### Opção 3: Usando npm-run-all (Frontend)

Adicione ao `package.json` do frontend:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:all": "run-p dev backend",
    "backend": "cd ../scrapping-backend && uv run uvicorn app.main:app --reload"
  }
}
```

Então execute:
```bash
npm run dev:all
```

## Verificando a Conexão

### 1. Verificar Backend

Acesse: http://localhost:8000/docs

Você deve ver a documentação Swagger da API.

### 2. Verificar Frontend

Acesse: http://localhost:5173 (ou a porta que o Vite indicar)

O frontend deve carregar e fazer requisições ao backend.

### 3. Verificar no Console do Navegador

Abra o DevTools (F12) e vá na aba Network. Você deve ver requisições para:
- `http://localhost:8000/api/v1/publications`
- `http://localhost:8000/api/v1/dashboard/stats`

## Importando Dados

Antes de usar o frontend, você precisa importar dados para o backend:

```bash
cd scrapping-backend

# Importar um arquivo JSON
uv run python scripts/import_json.py ../scrapping-front/public/json/sport\ recife\ violencia.json

# Ou importar todos os arquivos
for file in ../scrapping-front/public/json/*.json; do
  uv run python scripts/import_json.py "$file"
done
```

## Modos de Operação

O frontend suporta dois modos:

### Modo API (Padrão)

Usa o backend para buscar dados:

```env
VITE_USE_API=true
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Vantagens:**
- Dados dinâmicos
- Filtros no servidor
- Melhor performance com grandes volumes
- Dados sempre atualizados

### Modo JSON (Legado)

Usa arquivos JSON estáticos:

```env
VITE_USE_API=false
```

**Vantagens:**
- Funciona sem backend
- Útil para desenvolvimento offline
- Dados estáticos

## Troubleshooting

### Erro: "Network Error" ou "Failed to fetch"

**Causa:** Backend não está rodando ou URL incorreta.

**Solução:**
1. Verifique se o backend está rodando: `curl http://localhost:8000/health`
2. Verifique a URL no `.env` do frontend
3. Verifique CORS no backend (deve incluir `http://localhost:5173`)

### Erro: "CORS policy"

**Causa:** Backend não permite requisições do frontend.

**Solução:**
No `.env` do backend, adicione:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Erro: "404 Not Found" nas requisições

**Causa:** Rota da API incorreta.

**Solução:**
1. Verifique se a URL base termina com `/api/v1`
2. Verifique se o backend está na porta 8000
3. Use o proxy do Vite (já configurado) ou ajuste a URL

### Dados não aparecem

**Causa:** Banco de dados vazio.

**Solução:**
1. Importe dados usando o script de importação
2. Verifique se as migrations foram executadas
3. Verifique os logs do backend para erros

### Porta já em uso

**Causa:** Outro processo está usando a porta.

**Solução:**
```bash
# Linux/Mac - encontrar processo na porta 8000
lsof -i :8000
kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Estrutura de Arquivos

```
projeto/
├── scrapping-backend/     # Backend (FastAPI)
│   ├── app/
│   ├── alembic/
│   └── ...
├── scrapping-front/       # Frontend (Vue.js)
│   ├── src/
│   │   ├── services/      # Clientes da API
│   │   ├── config/        # Configuração da API
│   │   └── stores/        # Pinia stores
│   └── ...
└── docs/                  # Documentação
```

## Próximos Passos

1. ✅ Backend e frontend conectados
2. ⏳ Implementar autenticação
3. ⏳ Adicionar tratamento de erros mais robusto
4. ⏳ Implementar cache no frontend
5. ⏳ Adicionar loading states
6. ⏳ Implementar retry automático

