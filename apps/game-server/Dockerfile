# RIW game server — Colyseus authoritative.
# Monorepo pnpm. Le serveur depend de @riw/shared et @riw/content qui exposent
# directement leur src/*.ts (pas de dist). On execute donc en prod via tsx,
# qui resout les .ts workspace au runtime. Image volontairement simple.
#
# Build context = RACINE du monorepo, pas apps/game-server :
#   docker build -f apps/game-server/Dockerfile -t riw-game-server .
# (Fly.io le fait automatiquement avec ce Dockerfile + fly.toml.)

FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=2567
ENV HOST=0.0.0.0

WORKDIR /app

# Corepack -> pnpm pinne par packageManager dans le package.json racine.
RUN corepack enable

# 1) Manifests d'abord (cache Docker des deps tant qu'ils ne changent pas).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/game-server/package.json apps/game-server/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/content/package.json packages/content/package.json

# 2) Install filtre : serveur + ses deps workspace uniquement (pas le client).
#    "..." inclut les dependances workspace (@riw/shared, @riw/content).
RUN corepack pnpm install --frozen-lockfile --filter "@riw/game-server..."

# 3) Sources.
COPY packages/shared packages/shared
COPY packages/content packages/content
COPY apps/game-server apps/game-server

EXPOSE 2567

# Health check applicatif (double celui de fly.toml en local/docker run).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:2567/health || exit 1

WORKDIR /app/apps/game-server
CMD ["corepack", "pnpm", "start"]
