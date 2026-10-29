# Radhe Windson Residential Society ERP

Operational housing society management system built for **Radhe Windson Residential Society** by **Shree RevaTech LLP**.

---

## Architecture Overview

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3.4, Lucide React, Zustand, React Hook Form, Zod, Axios.
* **Backend**: Node.js, Express.js, TypeScript, MongoDB & Mongoose.
* **Authentication**: Real password hashing (`bcryptjs`, 12 rounds), encrypted `HttpOnly`, `SameSite=Lax`, and `Secure` cookie session tokens (`rw_token`), instant token revocation via `tokenVersion`, and strict backend RBAC.
* **Admin Provisioning**: Controlled CLI seeder (`npm run seed:admin`) with password complexity enforcement and overwrite protection.
* **Testing**: Automated test suite with Vitest & Supertest running against isolated database environments.

---

## Directory Structure

```text
radhe-windson-erp/
├── backend/
│   ├── src/
│   │   ├── config/          # Zod environment validation, DB & CORS configs
│   │   ├── middleware/      # Auth, RBAC, error handling, rate limiting, Zod validator
│   │   ├── models/          # User and domain Mongoose models
│   │   ├── modules/         # Modular domain features (auth, society, flats, etc.)
│   │   ├── scripts/         # CLI seeders (admin provisioning)
│   │   ├── utils/           # Security, response formatting, errors
│   │   ├── app.ts           # Express setup and health routes
│   │   └── server.ts        # Server entrypoint and graceful shutdown
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── features/        # Auth, Dashboard, Society UI
│   │   ├── layouts/         # AppLayout shell with dynamic role-based navigation
│   │   ├── services/        # Axios API client with interceptors
│   │   ├── store/           # Zustand state stores
│   │   ├── types/           # Shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── .env.example
├── package.json             # Root workspace orchestrator
└── .gitignore
```

---

## Setup & Local Development

### 1. Prerequisites
* Node.js v20+ or v24+
* npm v10+

### 2. Install Dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in both `backend` and `frontend`:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Provision Initial Administrator
```bash
npm run seed:admin --workspace=backend
```

### 5. Run Automated Tests
```bash
npm run test --workspace=backend
```

### 6. Start Development Servers
```bash
# In root directory
npm run dev:backend
npm run dev:frontend
```
* Frontend available at: `http://localhost:5173`
* Backend available at: `http://localhost:5000`
* Health check: `http://localhost:5000/api/v1/health`

---

## License & Ownership
Copyright © 2026 Shree RevaTech LLP. Developed exclusively for Radhe Windson Residential Society.
