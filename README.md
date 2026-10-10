# AERION DRIVE

An original automotive concept exhibition built with React, TypeScript, Vite, Tailwind, React Router, GSAP, Motion, Lenis, React Three Fiber and Drei. The Express API uses MongoDB/Mongoose, validated enquiries and a private cookie-authenticated administration studio.

All five vehicles, performance figures, prices, artwork and contact details are fictional demonstration content. No scheduling, payment, email delivery or real manufacturer integration is implied.

## Run in VS Code

Requirements: Node.js 24 LTS, npm, MongoDB Community locally or a MongoDB Atlas connection. Open this directory in VS Code.

```sh
npm install
```

On Windows PowerShell where execution policy blocks `npm.ps1`, use `npm.cmd` for each command below.

Copy `.env.example` to `server/.env`, supply your MongoDB URI, and generate a session secret:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters in `server/.env`, then seed:

```sh
npm run seed
npm run dev
```

Open **http://localhost:5173**. API: **http://localhost:4000/api**. Admin: **http://localhost:5173/admin**. The seed preserves existing records and does not reset existing passwords. Remove the seed password from the environment after provisioning the administrator. There is no public registration or default password.

Without MongoDB, development starts with a read-only fictional catalogue. Configurations still save on the visitor's device. Enquiries and administrator login report an unavailable service and are never silently stored in memory. Production requires a reachable MongoDB database and session secret.

## Experience

| Route              | Features                                                                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | Cinematic 3D hero, five-stage pinned vehicle story, collection, cockpit and enquiry invitation                                                                                                           |
| `/explore`         | API-backed catalogue, category filters, price/range sorting                                                                                                                                              |
| `/vehicles/:slug`  | Vehicle presentation, specifications, media and next steps                                                                                                                                               |
| `/configurator`    | Original WebGL vehicle; drag orbit, pinch/wheel zoom, paint interpolation, actual wheel geometry changes, camera angles, lighting, three environments, fullscreen, local save/restore and shareable URLs |
| `/compare`         | Up to three vehicles, nine specification rows, difference highlighting, remove/reset                                                                                                                     |
| `/technology`      | Interactive 3D architectural presentation and expandable technical information                                                                                                                           |
| `/story`           | Editorial brand story and design principles                                                                                                                                                              |
| `/gallery`         | Category filters, editorial/grid layout, image lightbox, arrows, Escape, focus trap and swipe                                                                                                            |
| `/book-test-drive` | Validated enquiry with model, date/time, location and customer details                                                                                                                                   |
| `/contact`         | Department-based enquiries, fictional contact information and FAQ                                                                                                                                        |
| `/admin`           | Login/logout, statistics, enquiry status updates/search, vehicle/specification editing and gallery management                                                                                            |

The car is an original procedural mesh with independently configurable paint, glass, wheels and lighting. The five models vary in roofline, proportions and details; this is a concept-level model, not a photoreal scanned vehicle. A detailed interior 3D model is not included, so interior camera/trim controls are intentionally absent. The cockpit illustration presents the cabin design direction.

Artwork in `client/public/images` is original SVG, licensed with this project. SVG has no raster compression requirement; no GLB textures or downloaded model files need Draco. Critical 3D code uses a real loading fallback without an artificial timed splash.

## Project structure

```text
client/
  public/images/          Original concept and editorial illustrations
  src/App.tsx            Navigation, home exhibition, motion and route shell
  src/pages/Pages.tsx     Catalogue, studio, comparison, forms and admin
  src/three/CarScene.tsx  Original procedural car and real camera controls
  src/styles/main.css    Responsive theme, components and reduced motion
server/
  src/app.js             Express API, authentication, validation, limits
  src/models.js          MongoDB schemas and repository
  src/validation.js      Zod request schemas
  src/index.js           Environment, database and persistent session startup
  src/seed.js            Safe initial fictional data/admin provisioning
  test/api.test.js       API and security integration tests
shared/vehicles.json     Consistent fictional vehicle dataset
tests/                   Desktop/mobile browser tests
```

## Validation commands

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Browser tests use your installed Google Chrome via Playwright. To use a bundled Chromium instead, remove `channel: 'chrome'` in `playwright.config.ts` and run `npx playwright install chromium`. The browser enquiry-failure test expects development without MongoDB. API integration tests use a test-only injected repository to check validation, duplicate prevention, session cookies, protected routes, status updates and service errors. They do not prove a live MongoDB deployment; see `TEST_RESULTS.md` for the actual checks performed.

## Production

```sh
npm ci
npm run build
```

Serve `client/dist` with an HTTPS static host that rewrites frontend routes to `index.html`. Route `/api/*` on the same public origin to the Node process. Run the API with `NODE_ENV=production`, `MONGODB_URI`, a random `SESSION_SECRET`, `CLIENT_ORIGIN=https://your-host.example` and `PORT` supplied through your deployment's secret manager, then `npm start`.

Production cookies are HTTP-only, secure and SameSite Strict. Sessions persist in MongoDB. TLS termination must be at one trusted reverse proxy (the API trusts one proxy hop in production). Match `CLIENT_ORIGIN` exactly; it is also checked for mutating requests. Helmet, body size limits, global/enquiry/login rate limits and server validation are enabled. If deploying the client with a different origin, deliberately adapt cookie/CORS policy rather than disabling origin protection. Do not put secrets in Vite environment variables.

Admin vehicle/gallery media accepts local `/images/` URLs or HTTPS URLs; it manages references, not file uploads. Enquiry status means `new`, `reviewing`, `contacted` or `closed`, never a scheduled confirmation. Add a real scheduling/mail integration separately if needed.

For the full endpoint contract, read [server/README.md](server/README.md).

## Accessibility and performance

Keyboard navigation, visible focus, a skip link, labelled inputs, native validation, gallery focus management and reduced-motion behavior are implemented. Mobile navigation and touch camera controls have deliberate layouts. Rendering caps device pixel ratio at 1.5; shadow maps and procedural geometry are bounded. Scene geometries dispose on unmount and ScrollTrigger/Lenis subscriptions clean up. Route and 3D loading have fallbacks; the application has a recoverable error boundary.

No Lighthouse score is claimed. A production service still needs environment configuration, real MongoDB verification, hosting, monitoring and any business integrations before public use.
