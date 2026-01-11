# i18n and RTL Implementation

## Configuration
- `src/lib/i18n.ts` - i18next setup with language detection
- `src/stores/language.ts` - Zustand store for language/direction

## Translation Files
- `src/locales/en.json` - English (~380 keys)
- `src/locales/ar.json` - Arabic (~380 keys)

## Components
- `src/components/LanguageSwitcher.tsx` - EN/AR toggle

## Translation Key Structure
```
common.*      - Shared UI elements
nav.*         - Navigation items
dashboard.*   - Dashboard page
calls.*       - Calls page + status labels
orders.*      - Orders page + status labels
reservations.* - Reservations page
menu.*        - Menu management + form
settings.*    - Settings page + days
llmSettings.* - AI settings + providers
tenants.*     - Tenant management
login.*       - Login page
auth.*        - Auth layout (brandName: "Samm AI")
errors.*      - Error messages
time.*        - Time formatting
```

## RTL Pattern
```tsx
const { t } = useTranslation()
const { direction } = useLanguageStore()

return (
  <div dir={direction}>
    {t('key.path')}
  </div>
)
```

## Tailwind RTL
Using logical properties: `ps-*`, `pe-*`, `start-*`, `end-*`
