# Stage 1: Build
FROM node:24.11.1-alpine AS builder

# Instala o pnpm
RUN npm install -g pnpm

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instala as dependências
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copia o código fonte
COPY . .

# Compila a aplicação
RUN pnpm run build

# Stage 2: Production
FROM node:24.11.1-alpine AS production

# Instala o pnpm
RUN npm install -g pnpm

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instala apenas as dependências de produção
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copia os arquivos compilados do estágio de build
COPY --from=builder /app/dist ./dist

EXPOSE ${PORT:-3000}

# Comando para iniciar a aplicação
CMD ["pnpm", "start:prod"]
