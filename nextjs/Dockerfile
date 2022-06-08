# FROM node:16.15.0-alpine3.14 AS development
# RUN apk add --no-cache libc6-compat
# WORKDIR /app
# COPY . .
# ENV HOST=0.0.0.0
# ENV PORT=3000
# ENV NODE_ENV=development
# EXPOSE 3000
# CMD [ "yarn", "dev" ]

FROM node:16.15.0-alpine3.14 AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:16.15.0-alpine3.14 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY .env.production .env.production
RUN yarn build

FROM node:16.15.0-alpine3.14 AS runner
WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --chown=nextjs:nodejs --from=builder /app/next.config.js ./
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/.env.production .env.production
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/.next ./.next


USER nextjs
EXPOSE 3000
CMD [ "yarn", "start" ]