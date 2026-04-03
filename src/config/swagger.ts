import { Options } from 'swagger-jsdoc';
import { env } from './env';

/**
 * Swagger/OpenAPI configuration.
 * Generates the full API spec from JSDoc @swagger annotations.
 */
export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '💰 Finance Dashboard API',
      version: '1.0.0',
      description: `
## Finance Dashboard Backend API

A production-grade REST API for managing financial records, users, and analytics.

### Authentication
This API uses **JWT Bearer tokens** for authentication.
1. Call \`POST /auth/register\` or \`POST /auth/login\` to get tokens.
2. Click **Authorize** (🔓 top right), paste the access token, and click **Authorize**.
3. All protected endpoints will now include your credentials automatically.

### Rate Limits
| Endpoint Group | Limit |
|---|---|
| Auth (login/register) | 15 req / 15 min |
| Records / Users / Dashboard / Audit | 100 req / 15 min |
| Global | 100 req / 15 min |
      `,
      contact: {
        name: 'Finance Dashboard Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api`,
        description: '🔧 Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token. Obtained from `/auth/login` or `/auth/register`.',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',      description: '🔑 Authentication — Register, Login, and Token Management' },
      { name: 'Users',     description: '👤 User Management — Admin-level CRUD operations' },
      { name: 'Records',   description: '📊 Financial Records — Income and Expense tracking' },
      { name: 'Dashboard', description: '📈 Analytics — Summary metrics and trends' },
      { name: 'Audit',     description: '🔍 Audit Logs — System activity tracking' },
    ],
  },
  apis: ['./src/modules/**/*.ts', './src/app.ts'],
};

/**
 * Premium Swagger UI — Dark Glass Finance Theme
 */
export const swaggerUiOptions = {
  customSiteTitle: 'Finance Dashboard · API Docs',

  customCss: `
    /* ── Google Fonts ─────────────────────────────────────────────── */
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

    /* ── Design Tokens ────────────────────────────────────────────── */
    :root {
      --bg-base:        #080e1a;
      --bg-surface:     #0d1627;
      --bg-elevated:    #111e35;
      --bg-hover:       #162240;
      --border:         rgba(99, 155, 255, 0.10);
      --border-bright:  rgba(99, 155, 255, 0.22);

      --accent:         #10d98a;
      --accent-dim:     rgba(16, 217, 138, 0.12);
      --accent-glow:    rgba(16, 217, 138, 0.30);

      --text-primary:   #e8f0fe;
      --text-secondary: #7b92b8;
      --text-muted:     #3d5278;

      --method-get:     #3b82f6;
      --method-post:    #10d98a;
      --method-put:     #f59e0b;
      --method-patch:   #a78bfa;
      --method-delete:  #f43f5e;

      --radius-sm:  6px;
      --radius-md:  10px;
      --radius-lg:  14px;

      --font-sans: 'DM Sans', system-ui, sans-serif;
      --font-mono: 'DM Mono', 'Fira Code', monospace;
    }

    /* ── Reset & Base ─────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }

    body {
      font-family: var(--font-sans) !important;
      background-color: var(--bg-base) !important;
      background-image:
        radial-gradient(circle at 18% 12%, rgba(16,217,138,0.05) 0%, transparent 50%),
        radial-gradient(circle at 82% 85%, rgba(59,130,246,0.05) 0%, transparent 50%),
        radial-gradient(rgba(99,155,255,0.035) 1px, transparent 1px) !important;
      background-size: 100% 100%, 100% 100%, 28px 28px !important;
      background-attachment: fixed !important;
      color: var(--text-primary) !important;
      min-height: 100vh;
    }

    #swagger-ui { background: transparent !important; min-height: 100vh; }

    .swagger-ui, .swagger-ui * { font-family: var(--font-sans) !important; }

    /* ── TOPBAR FIXED ───────────────────────────────────────────────────── */
    .swagger-ui .topbar {
      background: rgba(8, 14, 26, 0.88) !important;
      backdrop-filter: blur(20px) saturate(1.4);
      -webkit-backdrop-filter: blur(20px) saturate(1.4);
      border-bottom: 1px solid var(--border-bright);
      padding: 0 !important;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 24px rgba(0,0,0,0.5);
    }

    .swagger-ui .topbar-wrapper {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      padding: 8px 32px !important;
      gap: 16px !important;
      max-width: 1100px;
      margin: 0 auto;
      min-height: 56px !important;
      box-sizing: border-box !important;
    }

    .swagger-ui .topbar-wrapper .link {
      display: flex !important;
      align-items: center !important;
      text-decoration: none !important;
      flex-shrink: 0 !important;
      line-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .swagger-ui .topbar-wrapper img,
    .swagger-ui .topbar-wrapper svg {
      display: inline-block !important;
      height: 28px !important;
      width: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      vertical-align: middle !important;
    }

    .swagger-ui .topbar-wrapper .link span {
      display: none !important;
    }

    .swagger-ui .topbar-wrapper::after {
      content: 'Finance Dashboard · API Reference';
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.2px;
      white-space: nowrap;
      line-height: 1.2;
      display: inline-flex;
      align-items: center;
      margin-left: 0;
    }

    .swagger-ui .topbar .download-url-wrapper {
      display: none !important;
    }

    .swagger-ui .topbar .wrapper {
      padding: 0 !important;
      max-width: 100% !important;
    }

    /* ── Page layout & centering with reduced top padding ──────────────────── */
    .swagger-ui { width: 100% !important; }

    .swagger-ui .wrapper {
      width: 100% !important;
      max-width: 1100px !important;
      margin: 0 auto !important;
      padding: 32px 32px 0 !important; /* Reduced from 64px to 32px */
      box-sizing: border-box !important;
    }

    .swagger-ui .scheme-container {
      background: transparent !important;
      box-shadow: none !important;
      padding: 12px 0 0 !important;
      margin: 0 !important;
    }

    /* HERO Gap Fix - reduced margin */
    .swagger-ui .information-container.wrapper {
      margin-top: 32px !important; /* Reduced from 64px */
      margin-bottom: 28px !important;
    }

    /* ── Info block - Fixed background color ───────────────────────────────── */
    .swagger-ui .information-container {
      background: rgba(13, 22, 39, 0.7) !important; /* Slightly lighter than surface */
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border: 1px solid var(--border) !important;
      border-radius: var(--radius-lg) !important;
      padding: 28px 40px !important;
      box-shadow: 0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04) !important;
      box-sizing: border-box !important;
    }

    /* Title styling */
    .swagger-ui .info .title {
      color: var(--text-primary) !important;
      font-size: 28px !important;
      font-weight: 700 !important;
      letter-spacing: -0.6px !important;
      margin-bottom: 12px !important;
    }

    /* Info text styling */
    .swagger-ui .info p, .swagger-ui .info li {
      color: var(--text-secondary) !important;
      font-size: 14px !important;
      line-height: 1.7 !important;
    }

    .swagger-ui .info h2, .swagger-ui .info h3 {
      color: var(--text-primary) !important;
      font-weight: 600 !important;
      letter-spacing: -0.3px !important;
    }

    /* Rate-limit table - improved styling */
    .swagger-ui .info table {
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 20px 0 !important;
      border-radius: var(--radius-md) !important;
      overflow: hidden !important;
      border: 1px solid var(--border) !important;
      background: rgba(13, 22, 39, 0.5) !important;
    }
    .swagger-ui .info table th {
      background: rgba(16,217,138,0.12) !important;
      color: var(--accent) !important;
      font-weight: 600 !important;
      padding: 10px 16px !important;
      font-size: 12px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.6px !important;
      border-bottom: 1px solid var(--border-bright) !important;
    }
    .swagger-ui .info table td {
      color: var(--text-secondary) !important;
      padding: 10px 16px !important;
      border-bottom: 1px solid var(--border) !important;
      font-size: 13px !important;
      background: transparent !important;
    }
    .swagger-ui .info table tr:last-child td { border-bottom: none !important; }
    .swagger-ui .info table tr:hover td { background: rgba(16,217,138,0.05) !important; }

    .swagger-ui .info code {
      font-family: var(--font-mono) !important;
      background: rgba(99,155,255,0.12) !important;
      color: var(--accent) !important;
      padding: 2px 7px !important;
      border-radius: 4px !important;
      font-size: 12.5px !important;
    }

    /* ── Tag headers - FIXED: removed gray background ──────────────────────────────── */
    .swagger-ui .opblock-tag-section { 
      margin-bottom: 8px !important;
      background: transparent !important;
    }
    
    .swagger-ui .opblock-tag {
      font-size: 15px !important;
      font-weight: 600 !important;
      color: var(--text-primary) !important;
      border: none !important;
      border-bottom: 1px solid var(--border) !important;
      padding: 14px 4px !important;
      margin: 0 !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      background: transparent !important;
      border-radius: 0 !important;
    }
    
    .swagger-ui .opblock-tag:hover { 
      color: var(--accent) !important; 
      background: transparent !important;
      border-bottom-color: var(--accent) !important;
      padding-left: 8px !important;
    }
    
    .swagger-ui .opblock-tag small { 
      color: var(--text-secondary) !important; 
      font-weight: 400 !important; 
      font-size: 12px !important;
      background: rgba(16,217,138,0.08) !important;
      padding: 2px 8px !important;
      border-radius: 12px !important;
      margin-left: 8px !important;
    }

    /* ── Operation blocks - Improved backgrounds ─────────────────────────────────────────── */
    .swagger-ui .opblock {
      border-radius: var(--radius-md) !important;
      margin: 8px 0 !important;
      border-width: 1px !important;
      box-shadow: none !important;
      transition: all 0.2s ease !important;
      overflow: hidden !important;
      background: rgba(13, 22, 39, 0.4) !important; /* Semi-transparent background */
      backdrop-filter: blur(2px) !important;
    }
    
    .swagger-ui .opblock:hover { 
      transform: translateY(-2px) !important; 
      box-shadow: 0 6px 24px rgba(0,0,0,0.3) !important;
      background: rgba(13, 22, 39, 0.6) !important;
    }

    /* Method-specific border colors (no gray backgrounds) */
    .swagger-ui .opblock.opblock-get    { border-color: rgba(59,130,246,0.4) !important; }
    .swagger-ui .opblock.opblock-post   { border-color: rgba(16,217,138,0.4) !important; }
    .swagger-ui .opblock.opblock-put    { border-color: rgba(245,158,11,0.4) !important; }
    .swagger-ui .opblock.opblock-patch  { border-color: rgba(167,139,250,0.4) !important; }
    .swagger-ui .opblock.opblock-delete { border-color: rgba(244,63,94,0.4) !important; }

    .swagger-ui .opblock.is-open { 
      box-shadow: 0 0 0 1px var(--border-bright), 0 8px 32px rgba(0,0,0,0.4) !important;
      background: rgba(13, 22, 39, 0.7) !important;
    }

    .swagger-ui .opblock .opblock-summary { 
      border-radius: var(--radius-md) !important; 
      padding: 12px 16px !important; 
      align-items: center !important;
      background: transparent !important;
    }
    
    .swagger-ui .opblock .opblock-summary:hover { 
      filter: brightness(1.05) !important;
      background: rgba(255,255,255,0.02) !important;
    }

    /* ── Method badges - Modern styling ────────────────────────────────────────────── */
    .swagger-ui .opblock-summary-method {
      border-radius: 8px !important;
      font-weight: 700 !important;
      font-size: 11px !important;
      min-width: 70px !important;
      padding: 6px 12px !important;
      letter-spacing: 0.8px !important;
      font-family: var(--font-mono) !important;
      text-align: center !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
      transition: all 0.2s ease !important;
    }
    
    .swagger-ui .opblock-summary-method:hover {
      transform: scale(1.02) !important;
      filter: brightness(1.1) !important;
    }
    
    .swagger-ui .opblock.opblock-get    .opblock-summary-method { 
      background: linear-gradient(135deg, var(--method-get), #2563eb) !important;
      color: #fff !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
    }
    
    .swagger-ui .opblock.opblock-post   .opblock-summary-method { 
      background: linear-gradient(135deg, var(--method-post), #0d9488) !important;
      color: #fff !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
    }
    
    .swagger-ui .opblock.opblock-put    .opblock-summary-method { 
      background: linear-gradient(135deg, var(--method-put), #d97706) !important;
      color: #fff !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
    }
    
    .swagger-ui .opblock.opblock-patch  .opblock-summary-method { 
      background: linear-gradient(135deg, var(--method-patch), #7c3aed) !important;
      color: #fff !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
    }
    
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { 
      background: linear-gradient(135deg, var(--method-delete), #dc2626) !important;
      color: #fff !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
    }

    .swagger-ui .opblock-summary-path { 
      font-family: var(--font-mono) !important; 
      font-size: 13.5px !important; 
      color: var(--text-primary) !important; 
      font-weight: 500 !important;
    }
    
    .swagger-ui .opblock-summary-description { 
      color: var(--text-secondary) !important; 
      font-size: 13px !important;
    }

    /* ── Expanded body - Fixed backgrounds ────────────────────────────────────────────── */
    .swagger-ui .opblock-body { 
      background: rgba(8, 14, 26, 0.6) !important; 
      border-top: 1px solid var(--border) !important;
      backdrop-filter: blur(4px) !important;
    }
    
    .swagger-ui .opblock-section-header { 
      background: rgba(17, 30, 53, 0.8) !important; 
      border-bottom: 1px solid var(--border) !important; 
      padding: 12px 20px !important;
      border-radius: 0 !important;
    }
    
    .swagger-ui .opblock-section-header h4 { 
      color: var(--text-primary) !important; 
      font-size: 12px !important; 
      font-weight: 600 !important; 
      text-transform: uppercase !important; 
      letter-spacing: 0.8px !important;
    }

    /* ── Buttons ──────────────────────────────────────────────────── */
    .swagger-ui .try-out__btn {
      background: rgba(13, 22, 39, 0.8) !important;
      border: 1px solid var(--border-bright) !important;
      color: var(--text-secondary) !important;
      border-radius: var(--radius-sm) !important;
      font-weight: 500 !important;
      font-size: 12px !important;
      transition: all 0.15s ease !important;
      backdrop-filter: blur(4px) !important;
    }
    .swagger-ui .try-out__btn:hover { 
      border-color: var(--accent) !important; 
      color: var(--accent) !important;
      background: rgba(16,217,138,0.1) !important;
    }
    .swagger-ui .try-out__btn.cancel { 
      border-color: rgba(244,63,94,0.4) !important; 
      color: var(--method-delete) !important;
    }

    .swagger-ui .btn.execute {
      background: linear-gradient(135deg, var(--accent), #06b6d4) !important;
      border: none !important;
      border-radius: var(--radius-sm) !important;
      color: #fff !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      padding: 9px 22px !important;
      transition: all 0.2s ease !important;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
    }
    .swagger-ui .btn.execute:hover { 
      box-shadow: 0 0 18px var(--accent-glow) !important; 
      transform: translateY(-1px) !important; 
      filter: brightness(1.08) !important;
    }

    /* ── Inputs ───────────────────────────────────────────────────── */
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=email],
    .swagger-ui textarea,
    .swagger-ui select {
      background: rgba(8, 14, 26, 0.8) !important;
      border: 1px solid var(--border-bright) !important;
      border-radius: var(--radius-sm) !important;
      color: var(--text-primary) !important;
      font-family: var(--font-mono) !important;
      font-size: 13px !important;
      padding: 8px 12px !important;
      transition: all 0.15s ease !important;
    }
    .swagger-ui input[type=text]:focus,
    .swagger-ui input[type=password]:focus,
    .swagger-ui textarea:focus {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 3px rgba(16,217,138,0.15) !important;
      outline: none !important;
      background: rgba(8, 14, 26, 0.95) !important;
    }
    .swagger-ui input::placeholder, .swagger-ui textarea::placeholder { color: var(--text-muted) !important; }
    .swagger-ui .parameter__name  { color: var(--text-primary) !important;   font-family: var(--font-mono) !important; font-size: 13px !important; }
    .swagger-ui .parameter__type  { color: var(--accent) !important;          font-family: var(--font-mono) !important; font-size: 11px !important; }
    .swagger-ui .parameter__in    { color: var(--text-muted) !important;      font-size: 11px !important; }
    .swagger-ui .required::after  { color: var(--method-delete) !important; }

    /* ── Tables ───────────────────────────────────────────────────── */
    .swagger-ui table { width: 100% !important; }
    .swagger-ui table thead tr th { 
      background: rgba(17, 30, 53, 0.8) !important; 
      color: var(--text-secondary) !important; 
      font-size: 11px !important; 
      font-weight: 600 !important; 
      text-transform: uppercase !important; 
      letter-spacing: 0.8px !important; 
      padding: 12px 16px !important; 
      border-bottom: 1px solid var(--border) !important;
    }
    .swagger-ui table tbody tr td { 
      background: rgba(13, 22, 39, 0.4) !important; 
      border-bottom: 1px solid var(--border) !important; 
      padding: 12px 16px !important; 
      color: var(--text-secondary) !important; 
      font-size: 13px !important; 
      vertical-align: top !important;
    }
    .swagger-ui table tbody tr:hover td { 
      background: rgba(16,217,138,0.08) !important;
    }
    .swagger-ui table tbody tr:last-child td { border-bottom: none !important; }

    /* ── Responses ────────────────────────────────────────────────── */
    .swagger-ui .responses-wrapper { padding: 0 16px 16px !important; }
    .swagger-ui .response-col_status { 
      font-family: var(--font-mono) !important; 
      font-weight: 700 !important; 
      font-size: 13px !important;
    }

    /* ── Code ─────────────────────────────────────────────────────── */
    .swagger-ui .microlight,
    .swagger-ui pre,
    .swagger-ui code { 
      font-family: var(--font-mono) !important; 
      font-size: 12.5px !important; 
      background: rgba(8, 14, 26, 0.9) !important; 
      border: 1px solid var(--border) !important; 
      border-radius: var(--radius-sm) !important; 
      color: var(--text-primary) !important;
    }
    .swagger-ui .highlight-code pre { padding: 14px !important; line-height: 1.6 !important; }
    .swagger-ui .curl-command .curl { 
      background: rgba(8, 14, 26, 0.9) !important; 
      color: var(--accent) !important; 
      border: 1px solid var(--border) !important; 
      border-radius: var(--radius-sm) !important; 
      padding: 12px 14px !important; 
      font-family: var(--font-mono) !important; 
      font-size: 12.5px !important;
    }

    /* ── Models - Improved alignment and braces ──────────────────── */
    .swagger-ui section.models { 
      background: transparent !important; 
      border: 1px solid var(--border) !important; 
      border-radius: var(--radius-lg) !important; 
      margin-top: 32px !important; 
      overflow: hidden !important;
    }
    .swagger-ui .model-container { 
      background: transparent !important; 
      padding: 0 !important; 
      margin: 12px 16px !important; 
    }
    .swagger-ui .model-box { 
      background: rgba(8, 14, 26, 0.5) !important; 
      border-radius: var(--radius-md) !important; 
      border: 1px solid rgba(255,255,255,0.06) !important; 
      padding: 16px 20px !important;
      font-family: var(--font-mono) !important;
      transition: all 0.2s ease !important;
    }
    .swagger-ui .model-box:hover {
      background: rgba(8, 14, 26, 0.7) !important;
      border-color: rgba(16,217,138,0.2) !important;
    }
    .swagger-ui .model { 
      color: var(--text-secondary) !important; 
      font-size: 13.5px !important;
      line-height: 1.6 !important;
    }
    .swagger-ui .model .property-row {
      display: block !important;
      padding: 6px 0 6px 20px !important;
      border-left: 1px solid rgba(16,217,138,0.1) !important;
      margin: 4px 0 !important;
    }
    .swagger-ui .model .property { 
      color: var(--text-primary) !important; 
      font-weight: 600 !important;
      margin-right: 12px !important;
    }
    .swagger-ui .model .prop-type { 
      color: var(--accent) !important; 
      font-family: var(--font-mono) !important; 
      font-weight: 400 !important;
    }
    .swagger-ui .model-toggle { 
      filter: invert(1) opacity(0.6) !important; 
      margin-right: 6px !important;
    }

    /* Fix Braces alignment */
    .swagger-ui .model-box > .model > span {
      display: block !important;
      color: var(--text-muted) !important;
      margin: 4px 0 !important;
    }

    /* ── Tabs - Clean pill look without dividers ─────────────────── */
    .swagger-ui .tab {
      display: flex !important;
      gap: 8px !important;
      border: none !important;
      margin: 0 0 16px 0 !important;
      padding: 0 !important;
    }
    .swagger-ui .tab li { 
      color: var(--text-secondary) !important; 
      font-size: 11.5px !important; 
      font-weight: 600 !important; 
      padding: 6px 16px !important; 
      border-radius: 8px !important; 
      transition: all 0.2s ease !important; 
      cursor: pointer !important;
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid transparent !important;
      list-style: none !important;
      margin: 0 !important;
    }
    .swagger-ui .tab li::after { display: none !important; } /* Remove default dividers */
    
    .swagger-ui .tab li.active { 
      background: linear-gradient(135deg, rgba(16,217,138,0.15), rgba(16,217,138,0.05)) !important; 
      color: var(--accent) !important;
      border-color: rgba(16,217,138,0.3) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    }
    .swagger-ui .tab li:hover:not(.active) { 
      background: rgba(255,255,255,0.08) !important; 
      color: var(--text-primary) !important;
    }

    /* ── Auth modal ───────────────────────────────────────────────── */
    .swagger-ui .dialog-ux .modal-ux { 
      background: rgba(13, 22, 39, 0.95) !important; 
      backdrop-filter: blur(20px) !important;
      border: 1px solid var(--border-bright) !important; 
      border-radius: var(--radius-lg) !important; 
      box-shadow: 0 24px 64px rgba(0,0,0,0.7) !important;
    }
    .swagger-ui .dialog-ux .modal-ux-header { 
      background: rgba(17, 30, 53, 0.9) !important; 
      border-bottom: 1px solid var(--border) !important; 
      border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important; 
      padding: 18px 24px !important;
    }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: var(--text-primary) !important; font-size: 16px !important; font-weight: 700 !important; }
    .swagger-ui .dialog-ux .modal-ux-content { padding: 20px 24px !important; }
    .swagger-ui .dialog-ux .modal-ux-content p,
    .swagger-ui .dialog-ux .modal-ux-content label { color: var(--text-secondary) !important; font-size: 13px !important; }
    .swagger-ui .auth-container .auth-btn-wrapper {
      display: flex !important;
      justify-content: flex-end !important;
      gap: 12px !important;
      padding: 16px 0 0 !important;
    }

    .swagger-ui .auth-container .auth-btn-wrapper .btn { 
      border-radius: var(--radius-sm) !important; 
      font-weight: 600 !important; 
      font-size: 13px !important;
      padding: 8px 18px !important;
      transition: all 0.2s ease !important;
    }

    .swagger-ui .auth-container .auth-btn-wrapper .btn:first-child {
      background: linear-gradient(135deg, rgba(16,217,138,0.2), rgba(16,217,138,0.1)) !important; 
      border: 1px solid var(--accent) !important; 
      color: var(--accent) !important;
    }

    .swagger-ui .auth-container .auth-btn-wrapper .btn:first-child:hover {
      background: rgba(16,217,138,0.25) !important;
      box-shadow: 0 0 12px var(--accent-glow) !important;
    }
    /* Close button - override to red */
    .swagger-ui .auth-container .auth-btn-wrapper .btn-done,
    .swagger-ui .auth-container .auth-btn-wrapper .btn:last-child { 
      background: rgba(244, 63, 94, 0.15) !important;
      border: 1px solid rgba(244, 63, 94, 0.4) !important;
      color: #f43f5e !important;
    }
    
    .swagger-ui .auth-container .auth-btn-wrapper .btn:last-child:hover {
      background: rgba(244, 63, 94, 0.25) !important;
      border-color: #f43f5e !important;
      box-shadow: 0 0 12px rgba(244, 63, 94, 0.3) !important;
    }

    /* ── Filter ───────────────────────────────────────────────────── */
    .swagger-ui .filter .operation-filter-input { 
      background: rgba(13, 22, 39, 0.8) !important; 
      border: 1px solid var(--border-bright) !important; 
      border-radius: var(--radius-md) !important; 
      color: var(--text-primary) !important; 
      font-family: var(--font-sans) !important; 
      font-size: 13px !important; 
      padding: 10px 16px !important; 
      margin-bottom: 18px !important; 
      width: 100% !important;
      backdrop-filter: blur(4px) !important;
    }
    .swagger-ui .filter .operation-filter-input:focus { 
      border-color: var(--accent) !important; 
      box-shadow: 0 0 0 3px rgba(16,217,138,0.12) !important; 
      outline: none !important;
      background: rgba(13, 22, 39, 0.95) !important;
    }

    /* ── Select ───────────────────────────────────────────────────── */
    .swagger-ui select { 
      appearance: none !important; 
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2310d98a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") !important; 
      background-repeat: no-repeat !important; 
      background-position: right 12px center !important; 
      padding-right: 32px !important; 
      cursor: pointer !important;
      background-color: rgba(13, 22, 39, 0.8) !important;
    }

    /* ── Misc ─────────────────────────────────────────────────────── */
    .swagger-ui .loading-container { background: transparent !important; }
    .swagger-ui .loading-container .loading::after { border-top-color: var(--accent) !important; }
    .swagger-ui .copy-to-clipboard { 
      background: rgba(17, 30, 53, 0.8) !important; 
      border: 1px solid var(--border) !important; 
      border-radius: 4px !important; 
      transition: all 0.15s ease !important;
    }
    .swagger-ui .copy-to-clipboard:hover { 
      border-color: var(--accent) !important; 
      background: rgba(16,217,138,0.15) !important;
    }
    .swagger-ui .copy-to-clipboard button { filter: invert(0.7) !important; }
    .swagger-ui .servers-title { 
      color: var(--accent) !important; 
      font-size: 11px !important; 
      font-weight: 700 !important; 
      text-transform: uppercase !important; 
      letter-spacing: 0.8px !important;
    }
    .swagger-ui a { color: var(--accent) !important; text-decoration: none !important; }
    .swagger-ui a:hover { text-decoration: underline !important; }
    .swagger-ui svg.arrow { fill: var(--text-muted) !important; transition: transform 0.2s ease !important; }
    .swagger-ui .opblock-tag.is-open svg.arrow { transform: rotate(180deg) !important; fill: var(--accent) !important; }

    /* ── Scrollbar ────────────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: rgba(8, 14, 26, 0.5); border-radius: 4px; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, var(--accent), #06b6d4); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    /* ── Animations ───────────────────────────────────────────────── */
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .swagger-ui .opblock-body          { animation: fadeSlideIn 0.18s ease; }
    .swagger-ui .information-container { animation: fadeSlideIn 0.25s ease; }
    .swagger-ui .opblock-tag           { animation: fadeSlideIn 0.2s ease; }
  `,

  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'list',
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    syntaxHighlight: {
      activated: true,
      theme: 'monokai',
    },
    requestSnippetsEnabled: true,
    requestSnippets: {
      generators: {
        curl_bash:        { title: 'cURL',     syntax: 'bash' },
        javascript_fetch: { title: 'JS Fetch', syntax: 'javascript' },
      },
      defaultExpanded: false,
    },
  },
};