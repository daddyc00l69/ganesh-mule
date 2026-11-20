# VPS Deployment Guide (Ubuntu + PM2 + Nginx OR Docker Compose)

This application is optimized for **single-instance VPS hosting** (e.g. Mumbai/Bengaluru KVM VPS on Hostinger, DigitalOcean, Hetzner, or AWS Lightsail):

- **Atomic persistent disk storage (`DATA_DIR`):** Orders, staff registry, Delhivery settings, fee settings, coupons, and inventory adjustments persist atomically on disk across restarts.
- **Single-process consistency:** PM2 runs in single-instance `fork` mode (`ecosystem.config.cjs`) so OTP caches and disk JSON state stay consistent.
- **Healthcheck endpoint:** `GET /api/health` reports uptime, database status (`online` / `fallback`), and storage writability.
- **Secured production APIs:** Fee updates, warehouse reconciliation (`CRON_SECRET`), live Razorpay verification, and production OTP rules are enforced when `NODE_ENV=production`.

---

## Option 1: Ubuntu VPS with PM2 + Nginx + PostgreSQL (Recommended)

### 1. Server prerequisites (Node 22, PostgreSQL, Nginx, PM2)
```bash
sudo apt update && sudo apt install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Create PostgreSQL database
```bash
sudo -u postgres psql -c "CREATE USER ganesh_user WITH PASSWORD 'STRONG_DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE solid_glass_ecommerce OWNER ganesh_user;"
```

### 3. Clone, configure environment, and build
```bash
git clone <your-repo-url> /var/www/ganesh-mule
cd /var/www/ganesh-mule
cp .env.example .env.local
```

Edit `.env.local` with production values:
- `APP_URL="https://yourdomain.com"`
- `NEXT_PUBLIC_APP_URL="https://yourdomain.com"`
- `NODE_ENV="production"`
- `PORT="3000"`
- `DATABASE_URL="postgresql://ganesh_user:STRONG_DB_PASSWORD@127.0.0.1:5432/solid_glass_ecommerce?schema=public"`
- `SESSION_SECRET="$(openssl rand -base64 32)"`
- `CRON_SECRET="$(openssl rand -hex 24)"`
- Razorpay, Resend, Delhivery, and Chatwoot keys

> **Testing via IP over HTTP before setting up a domain?**
> Temporarily add `COOKIE_SECURE="false"` to `.env.local` so login cookies work on `http://<VPS-IP>:3000`. Remove it as soon as HTTPS is enabled.

Install dependencies, push Prisma schema, and build:
```bash
npm ci
npx prisma generate
npx prisma db push
npm run build
```

### 4. Start with PM2 (auto-restart on crash & reboot)
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Verify health locally:
```bash
curl http://127.0.0.1:3000/api/health
```

### 5. Configure Nginx + Free SSL
```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/ganesh-mule
# Edit server_name to your domain:
sudo nano /etc/nginx/sites-available/ganesh-mule
sudo ln -s /etc/nginx/sites-available/ganesh-mule /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. Schedule 12:30 AM IST Warehouse Reconciliation Cron
See `deploy/crontab.example` (`0 19 * * *` UTC = 12:30 AM IST):
```bash
crontab -e
```
Add:
```cron
0 19 * * * curl -fsS -X POST -H "x-cron-secret: YOUR_CRON_SECRET" http://127.0.0.1:3000/api/warehouse/reconcile >> /var/log/ganesh-mule-reconcile.log 2>&1
```

---

## Option 2: Docker Compose (or Coolify)

1. Copy `.env.example` to `.env.local` and fill in your secrets (keeping `DATA_DIR=/app/data`).
2. Start PostgreSQL + Next.js:
   ```bash
   docker compose up -d --build
   ```
3. Push the Prisma schema into the Postgres container (run from a one-off Node/builder container or from host if `DATABASE_URL` points to `127.0.0.1:5432`):
   ```bash
   docker compose --profile tools run --rm db-push
   ```
4. Check `http://localhost:3000/api/health`.
