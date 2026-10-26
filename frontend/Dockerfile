# Compila la pantalla de React y la sirve con Nginx, que también reenvía /api a la API.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Vacío: el navegador llama a /api en el mismo servidor, sin dirección fija de la API.
ENV VITE_API_URL=""
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
