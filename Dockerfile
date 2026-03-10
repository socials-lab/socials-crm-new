FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile 2>/dev/null || npm ci
COPY . .

# Supabase env vars needed at build time for Vite
ARG VITE_SUPABASE_URL=https://bkemtvqmbpxopuasgxcq.supabase.co
ARG VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg
ARG VITE_AUTH_PROXY_ORIGIN=https://auth.preview.citrus.bitterlemon.co
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_SENTRY_DSN
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_AUTH_PROXY_ORIGIN=$VITE_AUTH_PROXY_ORIGIN
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# SPA routing: serve index.html for all routes
RUN echo 'server { listen 3000; root /usr/share/nginx/html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
