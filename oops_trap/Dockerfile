# --- Stage 1: Build stage ---
FROM node:20 AS build

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходники и собираем проект
COPY . .
RUN npm run build

# --- Stage 2: Production stage ---
FROM nginx:1.25

# Копируем сборку из build stage
COPY --from=build /app/dist /usr/share/nginx/html

# (опционально) Свой конфиг nginx, если нужно:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
