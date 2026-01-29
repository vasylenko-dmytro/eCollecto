# eCollecto Frontend 🇺🇦

A modern web application designed for Ukrainian postage stamp collectors, built with React 19 and Vite. The project allows users to browse stamp catalogs, explore "First Day" issues, and manage their personal philatelic collections.

## 🚀 Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 7](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Routing:** [React Router DOM 7](https://reactrouter.com/)
- **Linting:** [ESLint](https://eslint.org/)

## 📂 Project Structure

The project follows a **Feature-based architecture**, ensuring scalability and maintainability:

```text
src/
├── app/              # Global providers, App.tsx, and entry point (main.tsx)
├── assets/           # Static assets (logos, icons, images)
├── features/         # Isolated functional modules
│   └── product/      # Product (stamps) logic: components, types, and JSON data
├── pages/            # Page-level components (Home, Collection, Product, etc.)
├── shared/           # Global shared resources
│   ├── layout/       # Header, Footer
│   ├── ui/           # Base UI components (buttons, inputs)
│   └── utils/        # Helper functions and utilities
└── styles/           # Global styles (Tailwind, CSS variables)
```

## 🛠️ Key Features

- **Interactive Product Gallery:** High-quality stamp previews with an integrated Lightbox for zooming.
- **Collection Management:** Advanced filtering and display of stamps by series, denomination, and designer.
- **Responsive Design:** Optimized for seamless performance across mobile, tablet, and desktop devices.
- **Data-Driven:** Efficiently renders content using structured local data (JSON).

## 📦 Installation & Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend/ecollecto-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 📜 Available Scripts

- `npm run dev` — Starts the development server.
- `npm run build` — Compiles the project for production (includes `tsc` type checking).
- `npm run lint` — Runs ESLint to check for code quality issues.
- `npm run preview` — Locally previews the production build.

## 🔧 Configuration

- **Tailwind CSS:** Configured via `tailwind.config.ts` using the modern `@tailwindcss/vite` approach.
- **TypeScript:** Strict type checking is enforced via `tsconfig.json`.
- **Path Aliases:** Convenient path aliases are set up (e.g., `@/` points to `src/`).

---
*Created with passion for Ukrainian philately.*