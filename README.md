# EscalaViva — Backend na Nuvem

## O que é isso?
Backend Node.js + MySQL pronto para rodar em qualquer servidor gratuito.
Após o deploy, Líder e Integrante se conectam pelo app de qualquer lugar com internet.

---

## Deploy gratuito em 5 minutos — Railway (recomendado)

Railway oferece plano gratuito com MySQL incluso.

### Passo a passo

1. **Crie conta gratuita** em https://railway.app
2. **Clique em "New Project" → "Deploy from GitHub Repo"**
3. Suba este projeto no GitHub (ou use "Deploy from local" com a CLI)
4. **Adicione o plugin MySQL:**
   - No painel do projeto → "+ New" → "Database" → "MySQL"
5. **Configure as variáveis de ambiente** (Settings → Variables):
   ```
   DB_HOST      = (gerado pelo Railway — copie de "MySQL > Connect")
   DB_PORT      = 3306
   DB_USER      = root
   DB_PASSWORD  = (gerado pelo Railway)
   DB_NAME      = escalaviva
   JWT_SECRET   = escolha_uma_string_longa_e_aleatoria_aqui
   PORT         = 3000
   ```
6. **Execute o schema** para criar as tabelas:
   - Vá em MySQL → Connect → Query
   - Cole o conteúdo do arquivo `schema.sql` e execute
7. Aguarde o deploy finalizar — Railway exibe a URL pública:
   ```
   https://escalaviva-api-production.up.railway.app
   ```
8. **Teste:** abra `https://sua-url.railway.app/health` — deve retornar `{"status":"ok"}`

---

## Deploy gratuito — Render

1. Crie conta em https://render.com
2. "New Web Service" → conecte seu repositório GitHub
3. Em "Environment Variables", adicione as mesmas variáveis acima
4. Para MySQL gratuito, use **PlanetScale** (https://planetscale.com):
   - Crie um banco, copie as credenciais de conexão
   - Atenção: PlanetScale é MySQL-compatível mas usa TLS — adicione `?ssl={"rejectUnauthorized":true}` na connection string
5. Deploy automático — URL no formato: `https://escalaviva.onrender.com`

---

## Deploy gratuito — Fly.io

```bash
# Instale a CLI
curl -L https://fly.io/install.sh | sh

# Autentique
fly auth login

# Dentro desta pasta:
fly launch          # detecta o Dockerfile automaticamente
fly secrets set DB_HOST=... DB_PASSWORD=... JWT_SECRET=...
fly deploy
```

---

## Configurando os APKs

Após obter a URL do servidor, abra qualquer APK:

**EscalaViva-Lider.apk**
- No campo "URL do Servidor": cole `https://sua-url.railway.app`
- Login: `joao@escalaviva.com` / `lider123`

**EscalaViva-Integrante.apk**
- No campo "URL do Servidor": cole a mesma URL
- Logins disponíveis:
  | Nome          | E-mail                      | Senha  |
  |---------------|-----------------------------|--------|
  | Maria Fernanda | maria@escalaviva.com        | vol123 |
  | Carlos Eduardo | carlos@escalaviva.com       | vol123 |
  | Ana Paula      | ana@escalaviva.com          | vol123 |
  | Pedro Henrique | pedro@escalaviva.com        | vol123 |
  | Lúcia Santos   | lucia@escalaviva.com        | vol123 |
  | Rafael Moreira | rafael@escalaviva.com       | vol123 |

A URL fica salva no app — só precisa digitar uma vez.

---

## Variáveis de ambiente obrigatórias

| Variável      | Descrição                          |
|---------------|------------------------------------|
| `DB_HOST`     | Endereço do servidor MySQL         |
| `DB_PORT`     | Porta MySQL (padrão: 3306)         |
| `DB_USER`     | Usuário do banco                   |
| `DB_PASSWORD` | Senha do banco                     |
| `DB_NAME`     | Nome do banco (`escalaviva`)       |
| `JWT_SECRET`  | Chave secreta para tokens JWT      |
| `PORT`        | Porta do servidor (padrão: 3000)   |

---

## Estrutura do projeto

```
escalaviva-backend/
├── server.js              ← Entrada principal (Express + Socket.io)
├── schema.sql             ← Cria e popula o banco MySQL
├── config/
│   └── db.js              ← Pool de conexões MySQL
├── middleware/
│   └── auth.js            ← JWT: autenticação e autorização
├── routes/
│   ├── auth.js            ← POST /api/auth/login, GET /api/auth/me
│   ├── users.js           ← CRUD de voluntários
│   ├── schedules.js       ← CRUD de escalas + atribuição de equipe
│   └── checkins.js        ← Check-in + notificações + sync
├── socket/
│   └── index.js           ← Socket.io para atualizações em tempo real
├── Dockerfile             ← Para deploy em qualquer plataforma
├── railway.json           ← Config Railway
├── render.yaml            ← Config Render
└── .env.example           ← Variáveis de ambiente de exemplo
```

---

## Endpoints da API

| Método   | Rota                                | Acesso      |
|----------|-------------------------------------|-------------|
| POST     | /api/auth/login                     | Público     |
| GET      | /api/auth/me                        | Autenticado |
| GET      | /api/users                          | Autenticado |
| POST     | /api/users                          | Líder       |
| PATCH    | /api/users/:id/availability         | Líder       |
| DELETE   | /api/users/:id                      | Líder       |
| GET      | /api/schedules                      | Autenticado |
| POST     | /api/schedules                      | Líder       |
| PATCH    | /api/schedules/:id/status           | Líder       |
| PUT      | /api/schedules/:id/volunteers       | Líder       |
| DELETE   | /api/schedules/:id                  | Líder       |
| POST     | /api/checkins                       | Autenticado |
| GET      | /api/checkins                       | Autenticado |
| GET      | /api/notifications                  | Autenticado |
| PATCH    | /api/notifications/read-all         | Autenticado |
| GET      | /api/sync?since=TIMESTAMP           | Autenticado |
| GET      | /health                             | Público     |
