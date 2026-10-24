# Solid Glass E-Commerce Platform

A production-ready full-stack enterprise e-commerce platform built with **Next.js (App Router)**, **TypeScript**, **PostgreSQL / Prisma ORM**, **Tailwind CSS**, **Razorpay**, and **Chatwoot**.

It features three distinct interfaces:
1. **Customer-Facing Storefront (`/`, `/shop`, `/product/[slug]`, `/cart`, `/checkout`, `/account`, `/support`)**: Clean, bright, minimal daylight storefront optimized for customer accessibility. Showcases 100% Raw Wild Forest Honey (Western Ghats), acacia reserves, Kashmiri saffron infusions, and honeycomb in heavy solid glass jars, with Razorpay integration and Chatwoot support.
2. **Admin Dashboard (`/admin`)**: Full governance interface styled after the **Solid Glass design reference** (dark obsidian glass with glowing rim highlights), featuring executive analytics, manager provisioning & RBAC permissions, product catalog, categories, inventory audit logs, and settings.
3. **Manager Dashboard (`/manager`)**: Operational desk utilizing Solid Glass design language, featuring **direct inline inventory quantity editing** (type any number, +/- steppers, instant save, bulk save, and audit trail), order state transitions, courier tracking, and live Chatwoot support.

---

## 1. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, Recharts, React Hook Form, Zod.
- **Backend**: Next.js Route Handlers, Server Services, PostgreSQL, Prisma ORM.
- **Authentication**: Server-managed sessions, HttpOnly SameSite=Lax signed cookies, cryptographic password hashing via `crypto.scrypt` with random 16-byte salt and timing-safe equality checks.
- **Payments**: Razorpay Test Mode & Production, server-calculated amounts in integer minor units (paise), official HMAC SHA256 payment signature verification, idempotent webhook processing.
- **Customer Support**: Chatwoot Live Support widget with client-safe tokens and manager support desk.
- **Testing**: Vitest with unit & integration test suites.

---

## 2. Solid Glass Design System Specifications

Reproduces the visual language from [https://deeplethe.github.io/solid-glass/](https://deeplethe.github.io/solid-glass/):
- **Smoky Translucent Panes**: Layered depth (`.glass-panel` < `.glass-card` < `.glass-popover`).
- **Physical Highlights**: Hairline top-rim light line (`inset 0 1px 0 var(--glass-rim)`), subtle inner edge (`inset 0 0 0 1px var(--glass-inner)`), hairline outer border, and gathered contact shadow.
- **Daylight & Dark Modes**: Daylight smoky white glass with subtle ambient radial background glow shifting to deep smoky dark glass.
- **Responsive Layouts**: Accessible keyboard navigation, focus indicators, responsive sidebar with mobile backdrop, data tables with horizontal scroll, and confirmation dialogs.

---

## 3. User Roles & Granular Permissions Matrix

| Permission Key | Category | Description |
| :--- | :--- | :--- |
| `products.read` | Products | View products, categories, prices, and stock |
| `products.create` | Products | Create merchandise items and upload images |
| `products.update` | Products | Edit product details, prices, and status |
| `inventory.read` | Inventory | View stock levels, reservations, and history |
| `inventory.update` | Inventory | Adjust stock quantities and record restocks |
| `orders.read` | Orders | Inspect customer orders and delivery addresses |
| `orders.update` | Orders | Process order stages and add courier tracking |
| `customers.read` | Customers | View customer records and order histories |
| `support.manage` | Support | Handle Chatwoot support inquiries |
| `refunds.request` | Orders | Initiate refund evaluation tickets |
| `refunds.approve` | Orders | Authorize and execute Razorpay refunds |
| `reports.read` | Reports | View operational sales and velocity reports |
| `managers.manage` | Administration | Provision, activate, and deactivate managers |
| `settings.manage` | Administration | Configure tax rates, shipping, and integrations |

---

## 4. Environment Variables Setup

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

### Key Configuration Fields:
```ini
# Application URL
APP_URL="http://localhost:3000"

# PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/solid_glass_ecommerce?schema=public"

# Cryptographic Session Secret (min 32 characters)
SESSION_SECRET="your-cryptographically-secure-random-string-min-32-chars"

# Razorpay Integration (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_YourTestKeyIdHere"
RAZORPAY_KEY_SECRET="YourRazorpayKeySecretHere"
RAZORPAY_WEBHOOK_SECRET="YourRazorpayWebhookSecretHere"

# Chatwoot Live Support Integration
NEXT_PUBLIC_CHATWOOT_BASE_URL="https://app.chatwoot.com"
NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN="YourChatwootWebsiteToken"
CHATWOOT_API_TOKEN=""
```

---

## 5. Quick Start & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Run Database Migrations & Seed
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Default Demo Credentials (for Evaluators)

| Role | Email | Password | Portal URL |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@solidglass.com` | `Admin@123456` | `/portal` |
| **Store Manager** | `operations@solidglass.com` | `Manager@123456` | `/portal` |
| **Customer** | `customer@solidglass.com` | `Customer@123` | `/login` |

---

## 7. Running Automated Tests

```bash
npm run test
```

Executes test suites for:
- Node.js scrypt password hashing & constant-time verification
- HMAC signed session token generation & tamper rejection
- Granular 14-permission RBAC evaluation
- Official Razorpay HMAC SHA256 payment signature verification
- Raw webhook signature verification & replay/tampering detection
- Minor monetary unit integer calculations and non-negative stock invariants.

---

## 8. Razorpay Webhook Configuration Guide

1. In your Razorpay Dashboard, navigate to **Settings** → **Webhooks**.
2. Click **Add New Webhook**.
3. Set the Webhook URL to: `https://your-domain.com/api/webhooks/razorpay`.
4. Generate a random **Secret** and add it to `RAZORPAY_WEBHOOK_SECRET` in `.env.local`.
5. Select the following events:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
6. Save. The webhook handler in `src/app/api/webhooks/razorpay/route.ts` will verify the signature with `crypto.createHmac('sha256', secret)` and process events idempotently using `WebhookEvent.eventId`.

---

## 9. Chatwoot Live Support Setup

1. In your Chatwoot instance (cloud or self-hosted), go to **Settings** → **Inboxes** → **Add Inbox**.
2. Choose **Website**.
3. Enter your store domain and a channel name.
4. Copy the generated **Website Token**.
5. Set `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` in `.env.local`.
6. The widget will automatically load on customer pages and sync inquiries to the Manager Support Desk.
