# Builder
FROM node:22.20.0 AS builder
ENV NODE_OPTIONS="--max_old_space_size=4096"

WORKDIR /usr/app

COPY package.json yarn.lock ./
RUN node -e "const p=require('./package.json'); delete p.scripts.postinstall; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2))"
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# Nginx
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY --from=builder /usr/app/build .
COPY ./docker/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

ENTRYPOINT ["nginx", "-g", "daemon off;"]
