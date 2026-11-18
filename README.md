# MarketScope Research Terminal

A free-first market and macroeconomic research terminal built with React, TypeScript, TanStack Start and Tailwind CSS.

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Cloudflare Workers deployment
This repository includes a Wrangler configuration and GitHub Actions workflow. Add repository secrets:
- `CLOUDFLARE_API_TOKEN`: API token with Workers Scripts edit permission.
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID.

Push to `main` or manually run the Deploy to Cloudflare workflow.

## Data and methodology
- TradingView widgets provide embedded market views; exchange entitlements may delay quotes.
- FRED provides macroeconomic time series.
- SEC EDGAR provides company filings and XBRL company facts.
- Watchlists, portfolio transactions, manual prices and preferences are stored in browser local storage.
- Research Lab outputs are deterministic calculations from user assumptions, not AI predictions.

Educational and informational use only. Not investment, tax or legal advice.
