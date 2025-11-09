# Stage 1: Build frontend
FROM node:20-alpine AS build
WORKDIR /app

# Копируем только package.json для кэширования npm ci
COPY ../oops_trap/package*.json ./
RUN npm ci

# Копируем весь фронтенд и собираем
COPY ../oops_trap ./
RUN npm run build

# Stage 2: nginx отдаёт фронтенд и проксирует API
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
