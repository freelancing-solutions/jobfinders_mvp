# JobFinders - AI-Powered Job Board

## Project Overview

This is a full-stack, AI-powered job board platform built with Next.js, TypeScript, and Prisma. It's designed for both job seekers and employers, offering advanced features like an AI Resume Builder, an intelligent Applicant Tracking System (ATS), AI-driven candidate matching, and context-aware notifications. The frontend is built with Tailwind CSS and shadcn/ui, while the backend uses a custom server with Socket.IO for real-time features.

**Key Technologies:**

*   **Framework:** Next.js 15 (with App Router)
*   **Language:** TypeScript 5
*   **Styling:** Tailwind CSS 4, shadcn/ui
*   **Backend:** Custom Node.js server with Socket.IO
*   **Database:** PostgreSQL (via Prisma ORM)
*   **AI:** OpenAI GPT-4, TensorFlow.js
*   **Authentication:** NextAuth.js
*   **State Management:** Zustand, TanStack Query

## Building and Running

### Prerequisites

*   Node.js (v20 or later)
*   npm
*   PostgreSQL

### Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables, including the `DATABASE_URL`.

3.  **Run Database Migrations:**
    ```bash
    npx prisma migrate dev
    ```

### Development

To run the development server:

```bash
npm run dev
```

This will start the Next.js application with a custom server on `http://localhost:3010`.

### Production

To build and run the application in production:

```bash
npm run build
npm start
```

## Development Conventions

*   **Linting:** The project uses ESLint, but many rules are currently disabled. It is recommended to gradually enable and enforce more rules to improve code quality.
*   **Testing:** Jest is configured for unit and integration testing. Test files are located in the `__tests__` directory.
*   **Database:** Database schema is managed with Prisma. All schema changes should be done in `prisma/schema.prisma` and applied with `npx prisma migrate dev`.
*   **Real-time Features:** Real-time functionality is handled by a custom Socket.IO server. The main socket logic is in `src/lib/socket.ts`.
*   **AI Services:** AI-related services are organized in the `src/ai` directory (although this directory is not present in the file listing, it is mentioned in the `README.md`).

## Project Structure

```
src/
├── app/           # Next.js App Router pages & API routes
├── components/    # Reusable React components
│   └── ui/       # shadcn/ui components
├── hooks/        # Custom React hooks
└── lib/          # Utilities and configurations, including socket.io setup
prisma/
└── schema.prisma  # Database schema
__tests__/
└── ...            # Jest tests
server.ts          # Custom server for Next.js and Socket.IO
```
