# Project Structure

```
frontend/
├── index.html              # Entry HTML (title: Samm AI)
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind + RTL config
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
├── .gitignore              # Git ignores (dist/)
│
└── src/
    ├── main.tsx            # App entry + i18n init
    ├── index.css           # Global styles + RTL vars
    │
    ├── components/
    │   └── LanguageSwitcher.tsx
    │
    ├── layouts/
    │   ├── AuthLayout.tsx      # Login layout
    │   └── DashboardLayout.tsx # Main app layout
    │
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Calls.tsx
    │   ├── CallDetail.tsx
    │   ├── Orders.tsx
    │   ├── Reservations.tsx
    │   ├── Menu.tsx
    │   ├── Settings.tsx
    │   ├── LLMSettings.tsx
    │   ├── Tenants.tsx
    │   └── Login.tsx
    │
    ├── lib/
    │   ├── api.ts          # Axios API client
    │   ├── i18n.ts         # i18next config
    │   └── utils.ts        # Utility functions
    │
    ├── stores/
    │   ├── auth.ts         # Auth Zustand store
    │   └── language.ts     # Language/direction store
    │
    └── locales/
        ├── en.json         # English translations
        └── ar.json         # Arabic translations
```
