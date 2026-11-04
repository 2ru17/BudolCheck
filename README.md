# BudolCheck

Check First. Budol Later.

BudolCheck is a responsive full-stack e-commerce verification and anti-scam web application. It provides real-time heuristics, seller credibility scoring, and cross-marketplace price comparison across Shopee, Lazada, and Temu.

> Note: This repository contains commissioned work developed for consumer protection and online transaction security.

## Live Application

- Web App: https://budol-check.vercel.app

## Key Capabilities

- 6-Point Verification Engine: Analyzes price parity, seller tenure, review patterns, delivery risk, return escrow, and regulatory compliance.
- Cross-Store Search: Real-time search across supported marketplaces with direct listing access.
- Incident Reporting: Consumer dispute filing compliant with Republic Act No. 11967 (Internet Transactions Act of 2023).
- Role-Based Dashboards: Dedicated views for Shoppers, Sellers, and Platform Administrators.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Mantine UI v7, Tailwind CSS, Zustand, Motion
- Backend: Express, Node.js SQLite (`node:sqlite`), Vercel Serverless Functions
- Security: Helmet, Express Rate Limit, Zod schema validation, HTTP-only session controls

## Maintainer

Maintained by [2ru17](https://github.com/2ru17).

## License

This project is licensed under the MIT License. See the LICENSE file for details.
