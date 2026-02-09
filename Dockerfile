FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CLIENT_ID
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY <<EOF /etc/caddy/Caddyfile
:80 {
    root * /srv
    file_server
    try_files {path} /index.html
}
EOF
EXPOSE 80
