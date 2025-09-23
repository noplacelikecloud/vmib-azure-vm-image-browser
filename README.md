# Azure VM Marketplace Browser

A modern web application for browsing Azure Marketplace VM Images with OAuth2/OIDC authentication and Infrastructure as Code (IaC) integration.

## Features

- **Azure Authentication**: OAuth2/OIDC authentication via Azure Multi-Tenant App
- **Hierarchical Browsing**: Navigate through Publishers → Offers → SKUs
- **Subscription Management**: Select and browse VM images within specific Azure subscriptions
- **IaC Integration**: Copy VM image references for ARM, Terraform, Bicep, and Ansible templates
- **Responsive Design**: Modern, mobile-first interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (to be added)
- **Authentication**: MSAL React (to be added)
- **Routing**: React Router (to be added)
- **Code Quality**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Azure subscription and Multi-Tenant App registration

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── navigation/     # Navigation components
│   ├── data-display/   # Data display components
│   └── ui/             # Reusable UI components
├── services/           # API services
├── stores/             # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## Development

This project uses:
- **TypeScript** in strict mode for type safety
- **ESLint** with Prettier integration for code quality
- **Tailwind CSS** for styling
- **Vite** for fast development and building

## License

MIT