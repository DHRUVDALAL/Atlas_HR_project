# RecruitPro: Enterprise Recruitment & Interview Management System

RecruitPro (Abhiyanta Portal) is a modern, enterprise-grade React application designed to manage the entire hiring lifecycle. From candidates submitting massive behavioral assessments to HR tracking candidates on a Kanban board, and Interviewers providing ratings, the system handles it all with a premium Glassmorphism UI and a robust Role-Based Access Control (RBAC) architecture.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Secure routes tailored to `SYSTEM_ADMIN`, `HR_ADMIN`, `INTERVIEWER`, and `RECEPTIONIST`.
- **Dynamic Dark/Light Mode**: Lag-free, memoized theme toggling built with Material UI's `ThemeProvider`.
- **Multi-Tab Staff Login**: Dedicated login experiences for Admin, HR, and Interviewers.
- **Massive Candidate Registration Form**: A 5-step stepper handling Personal info, Professional details, Behavioral Likert-scales, Situational Scenarios, and Open-ended qualitative assessments using React Hook Form & Yup.
- **Interactive Kanban Board**: Drag-and-drop Interview Pipeline using `@hello-pangea/dnd`.
- **Visual Analytics Hub**: Real-time hiring metrics rendered via Recharts.
- **Advanced API Layer**: Pre-configured Axios instance with JWT interceptors ready for backend integration.

---

## 📂 Project Structure

Understanding the codebase is simple. The application follows a modular, feature-based architecture.

```text
recruitment-portal/
├── index.html               # Main HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite bundler configuration
└── src/
    ├── App.jsx              # Root component (Providers & Router wrapping)
    ├── main.jsx             # React DOM rendering
    ├── index.css            # Global CSS, keyframe animations, and Tailwind utilities
    │
    ├── components/          # Reusable UI Components
    │   ├── Sidebar.jsx      # Navigation drawer that changes links based on User Role
    │   └── DashboardLayout.jsx # Wrapper for authenticated pages (contains Sidebar + Main Content)
    │
    ├── contexts/            # Global State Management
    │   └── AuthContext.jsx  # Manages User Session, Mock JWTs, and Login/Logout functions
    │
    ├── pages/               # Main Application Views
    │   ├── LandingPage.jsx  # Public-facing hero page with marketing copy and mock kanban
    │   ├── Login.jsx        # Multi-tab login portal for staff
    │   ├── CandidateForm.jsx # The massive 5-step candidate registration form
    │   ├── CandidateSearch.jsx # DataGrid view to filter and search candidates
    │   ├── CandidateProfile.jsx # Detailed candidate overview, timeline, and documents
    │   ├── InterviewWorkspace.jsx # The drag-and-drop Kanban board for HR tracking
    │   ├── InterviewEvaluation.jsx # Interviewer scorecard and qualitative rating form
    │   ├── Analytics.jsx    # HR dashboard with visual charts
    │   └── dashboards/      # Role-specific dashboard landing pages
    │       ├── AdminDashboard.jsx
    │       ├── HrDashboard.jsx
    │       ├── TechDashboard.jsx
    │       └── ReceptionistDashboard.jsx
    │
    ├── routes/              # Application Routing Logic
    │   ├── AppRoutes.jsx    # The master router mapping URLs to Pages
    │   └── RoleRoute.jsx    # A Higher-Order Component (HOC) that guards routes by checking user roles
    │
    ├── services/            # Backend Communication Layer
    │   └── api.js           # Axios instance configured to attach JWT tokens to every request automatically
    │
    └── theme/               # Application Styling & Theming
        ├── theme.js         # Material UI Custom Theme (Colors, Shadows, Component Overrides)
        └── ThemeContext.jsx # Context Provider for toggling between Dark Mode and Light Mode
```

---

## 🧠 Core Concepts & How It Works

### 1. Routing & Security (`src/routes/`)
When a user visits a URL, `AppRoutes.jsx` determines what to show. 
If a route is protected (e.g., `/hr/dashboard`), it is wrapped in `<RoleRoute allowedRoles={['HR_ADMIN']} />`. 
The `RoleRoute` component checks the `AuthContext` to see if the user is logged in AND has the exact string `HR_ADMIN` in their role. If not, they are redirected away.

### 2. State Management (`src/contexts/`)
We use React Context instead of Redux for lightweight state management.
- `AuthContext.jsx` holds the `user` object. When you login, it sets the user's role and saves a token to `localStorage`.
- `ThemeContext.jsx` holds the `mode` ('light' or 'dark'). It wraps the entire app in `App.jsx` so that any component can call `useColorMode()` to toggle the theme.

### 3. API Layer (`src/services/api.js`)
Currently, the app uses mocked frontend data. However, `api.js` is fully configured for a real backend. It uses Axios Interceptors. This means that every time you make a request (`api.get('/candidates')`), the interceptor intercepts the request before it leaves your browser and attaches `Authorization: Bearer <token>` to the headers automatically.

### 4. Massive Forms (`src/pages/CandidateForm.jsx`)
The candidate form uses `react-hook-form` for performance (prevents the whole page from re-rendering when typing) and `yup` for validation. Because the form is so large, the validation schema is split into an array `validationSchemas[activeStep]`, ensuring that a candidate cannot click "Next" until the current step passes validation.

### 5. UI & Styling (`src/theme/theme.js`)
The app avoids messy CSS by using Material UI's `sx` prop and customized theme overrides. `theme.js` intercepts default Material UI components (like `MuiButton` or `MuiCard`) and injects our custom borders, gradients, and hover animations globally.

---

## 🛠️ Getting Started Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will run on `http://localhost:5174/`

3. **Build for Production**
   ```bash
   npm run build
   ```
   This compiles the React code into optimized, minified static files in the `/dist` directory.
