# ÇAP ve Yan Dal Yönetim Sistemi (Student Tracking & Management System)

> **Selçuk Üniversitesi Mühendislik Fakültesi — Bilgisayar Mühendisliği Bölümü**  
> *Double Major (ÇAP) and Minor (YDP) Student Tracking Automation — Phase 1 MVP*  
> **Live Deployment:** [https://cap-ydp-otomasyon.vercel.app/](https://cap-ydp-otomasyon.vercel.app/)

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)]()
[![Prisma](https://img.shields.io/badge/Prisma-5-teal.svg)]()
[![License](https://img.shields.io/badge/license-Academic-lightgrey.svg)]()

---

## 📌 Project Overview

This application is a specialized web platform engineered for the Computer Engineering Department at Selçuk University to manage the academic lifecycle of Double Major (**ÇAP**) and Minor (**YDP**) students from other engineering faculties (Electrical & Electronics, Mechanical, Industrial, etc.).

### Key Highlights
* **Multi-Role Server RBAC:** Strict separation of duties between **Coordinator**, **Student**, and **Department Head (Read-Only)**.
* **Curriculum Protocol Engine:** Enforces the official 135-ECTS Electrical & Electronics $\rightarrow$ Computer Engineering protocol (20 core courses, 8 technical electives, and conditional footnote exemptions).
* **Automated Official FORM01 Generation:** Direct, client-side/server-side generation of the faculty's official `.docx` course registration form using valid Word XML templating.
* **Dual GPA Tracking & Academic Warnings:** Automatic monitoring of Selçuk University Senate by-laws (2.50 GPA probation warning, 2.72 dismissal threshold).
* **Document Verification Flow:** Grade entry is locked until the student's primary departmental transcript is verified and approved.
* **Security & Immutability:** `bcrypt` (cost 12) password hashing, 5-attempt brute-force lockout, IDOR-protected binary downloads, and immutable append-only audit logging. No physical record deletions (soft-deletes only).

---

## 🚀 Quick Start (Installation & Setup)

### Prerequisites
* **Node.js** (v18.0.0 or higher, tested on Node 20 & Node 24)
* **npm** (v9+ or v11+)
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/arminhere/cap-ydp-otomasyon.git
cd cap-ydp-otomasyon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create your local `.env` file by copying the provided `.env.example`:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

*The database is configured for PostgreSQL (Neon Serverless PostgreSQL). Ensure your `DATABASE_URL` is set in `.env`.*

### 4. Initialize & Seed the Database
Apply the schema and populate all official protocols, courses, and demo test accounts:

```bash
# 1. Push schema tables to the database
npm run db:push

# 2. Generate Prisma Client
npm run db:generate

# 3. Seed with official ÇAP protocol, course catalog, and test users
npm run db:seed
```

### 5. Start the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Configured Test Accounts

All accounts use strictly synthetic data. You can log in using these credentials or click the **One-Click Quick-Fill** buttons on the login page:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Coordinator (Koordinatör)** | `koordinator@selcuk.edu.tr` | `Test1234!` | Full administrative management, enrollment, grade finalization, approval desk. |
| **Student (Öğrenci)** | `ogrenci@ogr.selcuk.edu.tr` | `Test1234!` | Personal course selection, FORM01 download, transcript upload, progress matrix. |
| **Department Head (Bölüm Başkanı)** | `baskan@selcuk.edu.tr` | `Test1234!` | Read-only executive analytics and immutable audit log inspection. |

---

## 🛠 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with hot-reload on `localhost:3000`. |
| `npm run build` | Compiles the optimized production bundle. |
| `npm start` | Runs the compiled production server. |
| `npm run db:push` | Synchronizes the Prisma schema with your database. |
| `npm run db:generate` | Generates the typed Prisma Client. |
| `npm run db:seed` | Inserts official protocols, courses, and demo accounts into the database. |
| `npm test` | Runs the full automated test suite (7/7 passing unit and E2E integration tests). |
| `npx prisma studio` | Opens an interactive visual database browser at `http://localhost:5555`. |

---

## 📂 Project Structure

```
├── documents/                     # Official Faculty PDFs and FORM01 .docx templates
│   ├── FORM01 - Ders Kayıt Formu_04062026120421.docx
│   └── Protokol - Elektrik-Elektronikten Bilgisayara_04062026120421.pdf
├── prisma/                        # Database layer
│   ├── schema.prisma              # 15 relational tables & indexes
│   └── seed.ts                    # Bootstrap data (135 ECTS protocol, catalog, users)
├── src/
│   ├── actions/                   # Next.js Server Actions (course selections, grades, messages)
│   ├── app/                       # App Router routes and pages
│   │   ├── (auth)/login/          # Login page with quick-fill credentials
│   │   ├── (dashboard)/
│   │   │   ├── koordinator/       # Coordinator roster, student card, approvals, protocols
│   │   │   ├── ogrenci/           # Course selection, FORM01 download, progress matrix, documents
│   │   │   ├── bolum-baskani/     # Read-only analytics & immutable audit logs
│   │   │   └── sifre-degistir/    # Self-service password change
│   │   └── api/documents/[id]/download/ # Protected binary stream endpoint (IDOR defense)
│   ├── components/                # Reusable UI components (Navbar, badges, layout)
│   └── lib/                       # Core business logic
│       ├── auth.ts                # bcrypt hashing, brute-force defense, token crypto
│       ├── session.ts             # Cookie management & server role gate
│       ├── rules.ts               # GPA calculation, 2.50 warning, 2.72 dismissal engine
│       ├── docx.ts                # Official FORM01 .docx population engine
│       ├── pdf.ts                 # Adobe PDF 1.4 compliant generator
│       ├── audit.ts               # Immutable action logger
│       └── __tests__/             # Automated unit and E2E workflow tests
├── .env.example                   # Environment configuration template
└── package.json
```

---

## 🔒 Security & Data Integrity

1. **Object-Level Authorization (IDOR Defense):** Document downloads are protected on the server; students cannot access another student's files by altering IDs.
2. **Brute-Force Lockout:** Automatically locks accounts after 5 consecutive failed login attempts.
3. **No Physical Deletions:** All records utilize soft-deletion flags. Historical attempts and grades are preserved permanently.
4. **Synthetic Data Only:** No real student identification numbers or private personal data are included.

---

## 📄 License & Academic Attribution
Developed as part of the **BMU-2 Capstone Project** for the Department of Computer Engineering at Selçuk University (2025–2026).
All official templates and logos belong to Selçuk University.
