# AERION API

Run commands from `server/` or use the root workspace scripts. Copy `../.env.example` to `.env`; dotenv reads the server working directory. Use Node 22 or newer.

```
npm install
npm run dev
npm test
```

Local development without MongoDB exposes the fictional shared catalogue, but returns HTTP 503 for writes and admin login. It never stores enquiries in memory. `/api/health` returns HTTP 503 with `databaseAvailable: false` in this mode.

To enable persistence, run MongoDB locally or configure an Atlas connection string. Set `MONGODB_URI`, a random `SESSION_SECRET` of at least 32 characters, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` of at least 12 characters. Run `npm run seed` once. Seeding inserts missing demo vehicles, gallery items and the initial admin; it does not overwrite existing content or rotate existing admin passwords. Remove the seed password from the environment afterwards.

Production requires a connected MongoDB, a strong session secret, `NODE_ENV=production`, and `CLIENT_ORIGIN` matching the HTTPS frontend origin. The proxy must terminate HTTPS and forward protocol correctly. Sessions use MongoDB, HTTP-only Secure SameSite=Strict cookies, eight-hour expiry and session regeneration at login. Deploy frontend and API on the same site for cookie-based authentication; proxy `/api` to this server. The app trusts one proxy in production.

Public endpoints are `GET /api/vehicles`, `GET /api/vehicles/:slug`, `GET /api/gallery`, `POST /api/contact`, and `POST /api/test-drives`. Test-drive fields are `name`, `email`, `phone`, `vehicle` (slug), `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `location`, and optional `message`. Dates and times are requests, not confirmed appointments. Contact departments are `General`, `Sales`, `Design`, `Press`, and `Support`.

Admin login is `POST /api/admin/login` with `email` and `password`. Authenticated routes expose `/me`, `/overview`, `/test-drives`, `/contacts`, `/vehicles`, and `/gallery`; logout uses POST. Enquiry status updates use PATCH `/:id` with `status` (`new`, `reviewing`, `contacted`, `closed`). Vehicle PATCH/DELETE routes use the slug, gallery PATCH/DELETE uses the item's `id`. POST and PATCH vehicle bodies use the shared vehicle shape, and gallery bodies use `url`, `alt`, `category`. CRUD payloads are validated, APIs rate limited, and identical enquiry payloads rejected as duplicates. API errors do not disclose database details.

`npm test` checks API contracts with an injected test-only repository. Root `npm run test:mongo` separately launches an isolated real MongoDB process to verify Mongoose writes, indexes, non-destructive seeding, populated vehicle references and persisted sessions across an API restart. Root `npm run test:fullstack` verifies real submissions and administration through desktop/mobile browsers. Root `npm run dev:full` provides an authenticated, persistent local MongoDB and generated local admin login. No scheduling, email delivery, payment processing or real showroom integration is implied.
