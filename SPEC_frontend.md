# Frontend Specification - TITÃ | ISP

## Technology Stack
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (Alpha) + Vanilla CSS Modules
- **State Management**:
  - **Global State**: [Zustand](https://github.com/pmndrs/zustand)
  - **Server State**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Routing**: [React Router v7](https://reactrouter.com/en/main)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/) & [Lucide](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## UI/UX Design System

### Customization (Premium Shield)
The application implements a unique "Finishing" and "Theme" system:
- **Themes**: `dark` (Zinc-based), `light` (Slate-based), `soft` (Antique/Sylvan-based).
- **Finishes**: `glossy` (Glassmorphism, high blur) and `matte` (Flat, high contrast).
- **Accent Colors**: User-definable (defaulting to Titanium Blue/Red).

### CSS Architecture
- **CSS Variables**: Defined in `index.css` for semantic colors, spacing, and effects.
- **Utility Classes**: Uses Tailwind for layout and standard spacing.
- **Component CSS**: Each component has its own `.css` file for complex animations and specific glassmorphism effects.

## Core Patterns

### Authentication & Authorization
- **Supabase Auth**: Managed via `AuthContext`.
- **Protected Routes**: Handled in `App.tsx` via session checks.
- **IP Protection**: Built-in shield that blocks access if the user's IP is not whitelisted, requiring a **CVA (Support Access)** code to bypass.

### Global Shortcuts
- `Ctrl + .`: Toggle Sidebar
- `Ctrl + Space` (double): Toggle Dark/Light mode
- `Shift + Space`: Toggle Soft mode

### Data Fetching
- Centralized `api.ts` fetch wrapper.
- Service-based organization (`services/leadService.ts`, etc.).
- Integrated with React Query for caching and optimistic updates.

## Key Component Modules
- **Sidebar**: Dynamic navigation with theme/finish toggles.
- **DashboardManager**: KPI visualization and widget layouts.
- **ChatArea / ChatList**: WhatsApp-style interface for customer service.
- **LeadsManager / SalesPipeline**: CRM tools with Kanban boards.
- **OSManager / OSAgenda**: Field service management and scheduling.
- **SettingsManager**: Multi-section system configuration.
- **InternalChat (Connect)**: P2P communication between employees.
