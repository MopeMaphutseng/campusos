# ---- Build Stage ----
FROM ghcr.io/cirruslabs/flutter:stable AS builder

WORKDIR /app

COPY pubspec.* ./
RUN flutter pub get

COPY . .
RUN flutter build web --release --dart-define=FLUTTER_WEB_CANVASKIT_URL=/canvaskit/

# ---- Production Stage ----
FROM nginx:alpine AS production

COPY --from=builder /app/build/web /usr/share/nginx/html

# SPA fallback for client-side routing
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
