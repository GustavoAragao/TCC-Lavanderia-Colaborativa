# 🧺 Lavanderia Colaborativa — Salobrinho

Trabalho de Conclusão de Curso (TCC) — Plataforma colaborativa de lavanderia para o bairro Salobrinho.

## 📋 Sobre o Projeto

A **Lavanderia Colaborativa** é uma aplicação que conecta moradores que possuem máquinas de lavar (provedores) com moradores que precisam utilizar o serviço (clientes). A plataforma permite cadastro de máquinas, agendamento de horários, pagamento integrado via Mercado Pago e avaliação do serviço.

### Principais funcionalidades

- **Autenticação via Google** — Login social com Google Sign-In
- **Cadastro de máquinas** — Provedores podem cadastrar suas máquinas com fotos, capacidade e preço por carga
- **Disponibilidade de horários** — Configuração dos dias e horários em que a máquina está disponível
- **Agendamento** — Clientes podem agendar uso de máquinas nos horários disponíveis
- **Pagamento** — Integração com Mercado Pago (Checkout Pro) para pagamento online
- **Avaliações** — Clientes podem avaliar o serviço após o uso (nota de 1 a 5 + comentário)

## 🛠️ Tecnologias

### Backend

- [NestJS](https://nestjs.com/) (Node.js + TypeScript)
- [Prisma ORM](https://www.prisma.io/) — Mapeamento do banco de dados
- [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/)
- [Swagger](https://swagger.io/) — Documentação interativa da API
- [Mercado Pago SDK](https://www.mercadopago.com.br/developers/) — Integração de pagamentos
- JWT — Autenticação e autorização

### Frontend

- [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/) (SDK 54)
- [Expo Router](https://docs.expo.dev/router/introduction/) — Navegação baseada em arquivos
- [React Native Paper](https://callstack.github.io/react-native-paper/) — Componentes de UI (Material Design)
- [Axios](https://axios-http.com/) — Requisições HTTP
- [React Hook Form](https://react-hook-form.com/) — Gerenciamento de formulários
- Google Sign-In — Autenticação social

## 📁 Estrutura do Projeto

```
TCC-Lavanderia-Colaborativa/
├── backend/                # API REST (NestJS)
│   ├── prisma/             # Schema do banco de dados
│   ├── src/
│   │   ├── auth/           # Autenticação (Google + JWT)
│   │   ├── bookings/       # Agendamentos
│   │   ├── machines/       # Máquinas de lavar
│   │   ├── payments/       # Pagamentos (Mercado Pago)
│   │   ├── reviews/        # Avaliações
│   │   ├── users/          # Usuários
│   │   └── prisma/         # Serviço do Prisma
│   └── .env                # Variáveis de ambiente (não versionado)
│
├── frontend/               # App Mobile (React Native + Expo)
│   ├── src/
│   │   ├── app/            # Telas (file-based routing)
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Hooks customizados
│   │   ├── services/       # Chamadas à API
│   │   ├── types/          # Tipagens TypeScript
│   │   └── utils/          # Utilitários
│   └── .env                # Variáveis de ambiente (não versionado)
│
└── README.md
```

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [npm](https://www.npmjs.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- Emulador Android / dispositivo físico com [Expo Go](https://expo.dev/go)

---

### 1. Clonar o repositório

```bash
git clone https://github.com/GustavoAragao/TCC-Lavanderia-Colaborativa.git
cd TCC-Lavanderia-Colaborativa
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` na pasta `backend/` com as seguintes variáveis:

```env
# Conexão com o banco de dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host:porta/banco"
DIRECT_URL="postgresql://usuario:senha@host:porta/banco"

# Mercado Pago
MP_ACCESS_TOKEN="seu_access_token"
MP_PUBLIC_KEY="sua_public_key"
WEBHOOK_URL="https://seu-dominio.ngrok-free.dev"

# Google Auth
GOOGLE_CLIENT_ID="seu_google_client_id"

# JWT
JWT_SECRET="sua_chave_secreta"
JWT_EXPIRES_IN="7d"
```

Gere o cliente Prisma e aplique as migrações:

```bash
npx prisma generate
npx prisma db push
```

Inicie o servidor de desenvolvimento:

```bash
npm run start:dev
```

> O backend estará disponível em `http://localhost:3000`
> A documentação Swagger estará em `http://localhost:3000/api`

### 3. Configurar o Frontend

```bash
cd frontend
npm install
```

Crie o arquivo `.env` na pasta `frontend/` com as seguintes variáveis:

```env
# Endereço da API (backend)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000  # Para emulador Android

# Google Sign-In
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu_google_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=seu_google_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.seu-id
```

Inicie o app:

```bash
npx expo start
```

> Escaneie o QR Code com o app **Expo Go** ou pressione `a` para abrir no emulador Android.

---

## 📖 Documentação da API

Com o backend rodando, acesse a documentação interativa da API via Swagger:

```
http://localhost:3000/api
```

## 📄 Licença

Este projeto é de uso acadêmico (TCC) e não possui licença aberta.
