# syntax=docker/dockerfile:1
FROM nginx:1.25-alpine

RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/certs \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/gateway.key \
        -out /etc/nginx/certs/gateway.crt \
        -subj "/C=EC/ST=Pichincha/L=Quito/O=OSINT-Ecuador/OU=Paquete-D/CN=localhost"

COPY gateway-config/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
