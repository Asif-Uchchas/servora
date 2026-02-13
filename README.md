# 🍽️ Servora - Restaurant Management Platform

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-gold" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-gold" alt="License">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat&logo=prisma" alt="Prisma">
</p>

<p align="center">
  <a href="https://servora.app">
    <img src="https://placehold.co/1200x600/1a1a1a/D4AF37?text=Servora" alt="Servora Dashboard" width="100%">
  </a>
</p>

---

## ✨ Features

### 📊 Dashboard
- **Real-time Analytics** - Live revenue, orders, and reservation tracking
- **Revenue Charts** - Beautiful area charts showing weekly performance
- **Popular Items** - Track your best-selling dishes
- **Low Stock Alerts** - Never run out of ingredients
- **Recent Orders** - Monitor order status at a glance

### 🍕 Menu Management
- **Visual Menu Editor** - Add, edit, and organize menu items
- **Category Organization** - Group items by Appetizers, Main Course, Desserts, etc.
- **Pricing & Offers** - Set prices, offer prices, and discounts
- **Featured Items** - Highlight your signature dishes
- **Availability Toggle** - Enable/disable items instantly

### 🛒 Point of Sale (POS)
- **Touch-Optimized Interface** - Designed for tablets and touchscreens
- **Quick Order Creation** - Add items with a single tap
- **Real-time Order Tracking** - PENDING → PREPARING → READY → SERVED
- **Payment Processing** - Accept payments and calculate change instantly
- **Receipt Printing** - Generate professional customer receipts
- **Keyboard Shortcuts** - F1 for help, F2 for new order, Ctrl+S to save

### 📅 Reservations
- **Reservation Management** - Track CONFIRMED, PENDING, CANCELLED, COMPLETED
- **Guest Tracking** - Monitor party sizes and table assignments
- **Status Updates** - Quick status changes with one click
- **Customer Details** - Name, phone, email, and notes

### 👥 User Management
- **Role-based Access** - ADMIN, MANAGER, STAFF roles
- **Authentication** - Secure login with NextAuth.js
- **Restaurant Association** - Multi-restaurant support ready

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org) |
| **Database** | [PostgreSQL](https://postgresql.org) |
| **ORM** | [Prisma](https://prisma.io) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **Charts** | [Recharts](https://recharts.org) |
| **Animations** | [Framer Motion](https://www.framer.com/motion) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **State** | [Zustand](https://zustand-demo.pmnd.rs) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/servora.git
cd servora

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL and auth secrets

# Push database schema
npm run db:push

# (Optional) Seed the database with sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/servora"

# NextAuth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# (Optional) OAuth providers
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

---

## 📁 Project Structure

```
servora/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Sample data seeder
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Authenticated dashboard routes
│   │   │   ├── dashboard/ # Main dashboard
│   │   │   ├── menu/      # Menu management
│   │   │   ├── orders/    # Order management
│   │   │   ├── pos/       # Point of Sale
│   │   │   ├── reservations/ # Reservations
│   │   │   └── settings/  # Settings
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # NextAuth endpoints
│   │   │   ├── menu/      # Menu API
│   │   │   ├── orders/    # Orders API
│   │   │   └── pos/       # POS API
│   │   ├── login/         # Login page
│   │   └── menu/          # Public menu page
│   ├── components/
│   │   ├── dashboard/     # Dashboard components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utilities
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── package.json
```

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary Gold** | `#D4AF37` | Buttons, accents, highlights |
| **Background Light** | `#FAF7F2` | Light mode background |
| **Background Dark** | `#121212` | Dark mode background |
| **Surface Light** | `#FFFFFF` | Card backgrounds (light) |
| **Surface Dark** | `#1E1E1E` | Card backgrounds (dark) |
| **Text Light** | `#1A1A1A` | Primary text (light) |
| **Text Dark** | `#F5F5F5` | Primary text (dark) |

### Typography

- **Headings**: Cormorant Garamond (elegant serif)
- **Body**: DM Mono (modern monospace)
- **UI**: Inter (clean sans-serif)

---

## 📸 Screenshots

### 🖥️ Dashboard
![Dashboard](https://placehold.co/1200x700/1a1a1a/D4AF37?text=Dashboard+Overview)

### 🍔 Public Menu
![Menu](https://placehold.co/1200x700/FAF7F2/1A1A1A?text=Public+Menu+Page)

### 💳 Point of Sale
![POS](https://placehold.co/1200x700/0d0d0f/D4AF37?text=POS+System)

### 📋 Reservations
![Reservations](https://placehold.co/1200x700/1a1a1a/D4AF37?text=Reservations+Management)

---

## 🔌 API Endpoints

### Menu
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create menu item
- `PATCH /api/menu/[id]` - Update menu item
- `DELETE /api/menu/[id]` - Delete menu item

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/[id]` - Update order status

### POS
- `GET /api/pos` - Get active orders
- `POST /api/pos` - Create new order
- `PATCH /api/pos/orders/[id]` - Update order
- `POST /api/pos/orders/[id]/complete` - Mark as paid

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations/[id]` - Update reservation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) - For the beautiful component library
- [Next.js Team](https://nextjs.org) - For an amazing framework
- [Vercel](https://vercel.com) - For hosting and infrastructure

---

<p align="center">
  Made with ❤️ for restaurant owners everywhere<br>
  <strong>Servora</strong> - The Modern Restaurant Management Platform
</p>

<p align="center">
  <a href="https://servora.app">
    <img src="https://placehold.co/200x50/1a1a1a/D4AF37?text=Visit+Servora" alt="Visit Website">
  </a>
</p>
