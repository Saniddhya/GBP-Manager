# 🚀 AI-Powered Google Business Profile (GBP) Manager

> An AI-powered platform that helps local businesses create, manage, and organize Google Business Profile posts from one centralized dashboard.

**GBP Manager** is a full-stack SaaS-style web application built with **Next.js, TypeScript, MongoDB, Mongoose, JWT authentication, and OpenRouter AI**.

It enables businesses to generate promotional content using AI, edit it through a live GBP-style preview, save drafts, and manage their posts from a centralized dashboard.

---

## ✨ Features

### 🔐 Authentication

* Secure user registration and login
* JWT-based authentication
* HTTP-only authentication cookies
* Password hashing with `bcryptjs`
* Protected dashboard routes
* User-specific data isolation

### 🤖 AI Content Generation

* AI-powered GBP post generation
* OpenRouter API integration
* Generate content based on:

  * Business information
  * Topic
  * Post type
  * Tone
  * Language
  * Call-to-action
* Server-side API integration to protect API credentials

### 📍 Business Locations

* Business location management
* Location-based post creation
* Location-aware content workflow
* Designed to support multiple business locations

### 📝 GBP Post Management

* Create posts
* Edit posts
* Save drafts
* Publish posts
* Delete posts
* Search posts
* Filter posts
* Sort posts
* Ownership validation

### 👀 Live Preview

* Real-time Google Business Profile-style preview
* Content updates while editing
* Preview CTA and post information before saving

### 📊 Dashboard

* Total posts
* Draft posts
* Published posts
* Recent posts
* Location information
* MongoDB-powered live metrics

### 🛡️ Security

* HTTP-only authentication cookies
* Password hashing
* Server-side authentication
* Request validation using Zod
* Database ownership checks
* Protected API routes

---

# 🏗️ Application Flow

```text
                    ┌─────────────────────┐
                    │       Register      │
                    │       / Login       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Dashboard      │
                    │  Metrics & Activity │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          ┌──────────────────┐   ┌──────────────────┐
          │    Locations     │   │      Posts       │
          └────────┬─────────┘   └────────┬─────────┘
                   │                      │
                   └──────────┬───────────┘
                              ▼
                    ┌─────────────────────┐
                    │    Create a Post    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   AI Generation     │
                    │    OpenRouter       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Edit + Preview   │
                    └──────────┬──────────┘
                               │
                         ┌─────┴─────┐
                         ▼           ▼
                    ┌────────┐  ┌──────────┐
                    │ Draft  │  │ Publish  │
                    └────────┘  └──────────┘
```

---

# 🧰 Technology Stack

| Layer             | Technology                          |
| ----------------- | ----------------------------------- |
| Frontend          | Next.js                             |
| Language          | TypeScript                          |
| UI                | React + Tailwind CSS                |
| Backend           | Next.js App Router / Route Handlers |
| Database          | MongoDB                             |
| ODM               | Mongoose                            |
| Authentication    | JWT + HTTP-only Cookies             |
| Password Security | bcryptjs                            |
| AI                | OpenRouter API                      |
| Validation        | Zod                                 |
| Deployment        | Vercel                              |

---

# 📂 Project Structure

```text
GBP-Manager/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── locations/
│   │   │   └── posts/
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       ├── ai/
│   │       ├── dashboard/
│   │       ├── locations/
│   │       └── posts/
│   │
│   ├── components/
│   │   ├── Preview/
│   │   ├── Forms/
│   │   └── Layout/
│   │
│   ├── lib/
│   │   ├── db/
│   │   ├── auth/
│   │   └── validations/
│   │
│   └── models/
│       ├── User.ts
│       └── Post.ts
│
├── public/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

> The structure above represents the intended architecture. Update individual folder names if your implementation differs.

---

# ⚙️ Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Saniddhya/GBP-Manager.git
cd GBP-Manager
```

## 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

---

# 🔑 Environment Variables

Create a `.env.local` file in the project root.

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Example `.env.example`

The repository should contain:

```env
MONGODB_URI=
JWT_SECRET=
OPENROUTER_API_KEY=
```

### ⚠️ Security

**Never commit `.env` or `.env.local` to GitHub.**

Make sure your `.gitignore` contains:

```gitignore
node_modules/
.next/
.env
.env.local
.env*.local
*.log
```

If an API key has ever been committed to Git, rotate/revoke it before making the repository public.

---

# 🗄️ Database

The application uses **MongoDB with Mongoose**.

The main data models include:

```text
User
 ├── authentication information
 └── account information

Post
 ├── userId
 ├── location
 ├── content
 ├── post type
 ├── tone
 ├── language
 ├── CTA
 └── status
```

Posts are associated with their owning user, allowing the application to enforce data ownership at the API level.

---

# 🤖 AI Architecture

The application uses **OpenRouter** as the AI gateway.

The general flow is:

```text
User Input
     │
     ▼
Post Configuration
     │
     ├── Topic
     ├── Tone
     ├── Language
     ├── Post Type
     └── CTA
     │
     ▼
Next.js API Route
     │
     ▼
OpenRouter API
     │
     ▼
Generated Content
     │
     ▼
Live Preview
     │
     ▼
Save Draft / Publish
```

The API key is kept server-side and is never exposed directly to the browser.

---

# 🔒 Authentication Flow

```text
User
 │
 ▼
Login / Register
 │
 ▼
Server validates credentials
 │
 ▼
Password verified using bcrypt
 │
 ▼
JWT generated
 │
 ▼
HTTP-only Cookie
 │
 ▼
Protected Dashboard
 │
 ▼
Authenticated API Requests
```

The application validates ownership before accessing user-specific resources.

---

# 📊 Dashboard

The dashboard provides an overview of the user's GBP content.

Current metrics include:

* Total Posts
* Draft Posts
* Published Posts
* Recent Posts
* Business Locations

Dashboard data is retrieved from MongoDB through protected server-side API routes.

---

# 🧪 Development

Start the development server:

```bash
npm run dev
```

Open:

```text
https://gbp-manager-six.vercel.app/
```

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

Run linting if configured:

```bash
npm run lint
```

---

# 🛡️ Security Considerations

The application follows several security practices:

* JWT stored in HTTP-only cookies
* Password hashing with bcrypt
* Server-side authentication
* API-level ownership validation
* Zod request validation
* Environment variables for secrets
* Server-side OpenRouter API calls
* Protected dashboard routes

Production deployments should additionally use:

* HTTPS
* Strong JWT secrets
* Restricted MongoDB network access
* API rate limiting
* Input sanitization
* Secure cookie configuration
* Monitoring and logging

---

# 🚧 Current Status

**Development / MVP**

The core application architecture and GBP content management workflow are implemented.

### Implemented

* [x] User authentication
* [x] Protected dashboard
* [x] MongoDB integration
* [x] GBP post CRUD
* [x] AI content generation
* [x] Live post preview
* [x] Draft management
* [x] Post filtering/search
* [x] Dashboard metrics
* [x] API validation
* [x] User ownership checks

### Planned

* [ ] Real Google Business Profile API integration
* [ ] Direct post publishing to Google Business Profile
* [ ] Scheduled publishing
* [ ] Multi-location management
* [ ] Analytics and performance tracking
* [ ] Post templates
* [ ] Content calendar
* [ ] AI content history
* [ ] Team/workspace support
* [ ] Subscription and billing
* [ ] Advanced role-based access control

---

# 🗺️ Roadmap

### Phase 1 — Core Platform

* Authentication
* Dashboard
* Locations
* Post management
* AI generation

### Phase 2 — GBP Integration

* Google OAuth
* Google Business Profile API
* Real location synchronization
* Direct publishing
* Post scheduling

### Phase 3 — Business Intelligence

* Post performance analytics
* Engagement tracking
* Content recommendations
* AI-powered optimization

### Phase 4 — SaaS

* Organizations
* Team members
* Role-based permissions
* Subscription plans
* Billing
* Usage limits

---

# 🎯 Product Vision

GBP Manager is being built to simplify local-business content management by combining:

**AI Content Generation + Business Profile Management + Automation**

The long-term goal is to provide businesses and marketing teams with a centralized platform for creating, managing, scheduling, and analyzing their Google Business Profile content.

---

# 👨‍💻 Author

**Sanidhya Rathore**

Full-Stack Developer & Creative Technologist

* GitHub: [@Saniddhya](https://github.com/Saniddhya)
* LinkedIn: Add your LinkedIn profile

---

# 📄 License

This project is currently under development.

License information will be added before public production distribution.
