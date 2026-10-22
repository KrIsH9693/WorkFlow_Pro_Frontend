WorkFlow Pro – Frontend Client
A modern, responsive collaboration and workflow management dashboard built with React, TypeScript, Vite, and Tailwind CSS. The application connects to a live backend to provide real-time updates, team management, workspace organization, and role-based access.

Features
Authentication & Authorization: Secure JWT-based login, company registration, and session management.

Workspace & Project Tracking: Intuitive dashboards for viewing, organizing, and managing tasks and company projects.

Team Management & Invitations: Invite team members via email and accept team invitations with dedicated token verification.

Real-Time Updates: Integrated with Socket.IO client for live notifications and instant updates across team members.

Responsive UI: Built with Tailwind CSS and Material UI icons for seamless desktop and mobile workflows.

Tech Stack
Framework: React 18+ with TypeScript

Bundler & Tooling: Vite

Styling: Tailwind CSS, PostCSS

UI Components & Icons: Material UI (@mui/material, @mui/icons-material)

HTTP Client: Axios

WebSockets: socket.io-client

Routing: React Router DOM

Getting Started
Prerequisites
Ensure you have the following installed on your machine:

Node.js (version 18 or later recommended)

npm or yarn

Installation
Clone the repository and navigate into the frontend directory:

Bash
git clone <REPOSITORY_URL>
cd frontend
Install dependencies:

Bash
npm install


Code snippet
# Backend API Base URL
VITE_API_BASE_URL=https://workflow-pro-backend-q064.onrender.com/api

# WebSocket Server URL
VITE_SOCKET_URL=https://workflow-pro-backend-q064.onrender.com
Note: For local development with a local backend, point these values to http://localhost:5000/api and http://localhost:5000 respectively.

Available Scripts
In the project directory, you can run:

npm run dev
Runs the app in development mode with Hot Module Replacement (HMR).

Open http://localhost:5173 to view it in your browser.

npm run build
Compiles TypeScript and builds the production-ready assets into the dist/ directory.

npm run preview
Locally previews the production build created in dist/.

npm run lint
Runs ESLint to detect issues and enforce coding standards across the TypeScript codebase.

Project Structure
Plaintext
frontend/
├── public/              # Static assets and favicons
├── src/
│   ├── assets/          # Images, logos, and SVGs
│   ├── components/      # Reusable UI components (Modals, Buttons, Navbars)
│   ├── context/         # Auth and global application state
│   ├── pages/           # Routed views (LoginPage, Dashboard, AcceptInvitePage, etc.)
│   ├── services/        # Axios instances, API helpers, and socket client setup
│   ├── types/           # TypeScript interfaces and data models
│   ├── App.tsx          # Main application component & route configuration
│   └── main.tsx         # Application entry point
├── .env.example         # Example environment file template
├── index.html           # HTML template
├── package.json         # Project scripts and dependencies
├── tailwind.config.js   # Tailwind CSS design system configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite build setup

Production Deployment Link: 
