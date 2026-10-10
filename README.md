# AERION DRIVE

An original automotive concept exhibition built with React, TypeScript, Vite, Tailwind, React Router, GSAP, Motion, Lenis, React Three Fiber and Drei. The Express API uses MongoDB/Mongoose, validated enquiries and a private cookie-authenticated administration studio.

The five AERION concepts, performance figures, prices and contact details are fictional demonstration content. Photography and background-free cutouts show real cars as visual references; those manufacturers are not affiliated with AERION. No scheduling, payment, email delivery or real manufacturer integration is implied.

## Complete local studio

```sh
npm install
npm run dev:full
```

This starts the frontend, API and a real loopback-only MongoDB process with authentication. The first run downloads MongoDB if it is not cached. Open http://localhost:5173. A randomly generated administrator login is saved in `.local/admin-credentials.json`; open http://localhost:5173/admin to sign in. Credentials, sessions and the database persist between runs in the Git-ignored `.local/` directory. Ctrl+C stops the owned processes while preserving the local database. This is a local development convenience; production uses your separately managed MongoDB.

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
| `/`                | Mouse-controlled 60-car GSAP perspective rail, five-stage pinned vehicle story, collection, cockpit and enquiry invitation                                                                                                           |
| `/explore`         | API-backed catalogue, category filters, price/range sorting                                                                                                                                              |
| `/vehicles/:slug`  | Vehicle presentation, specifications, media and next steps                                                                                                                                               |
| `/configurator`    | Detailed Ferrari reference vehicle; drag orbit, pinch/wheel zoom, paint interpolation and alloy finishes, camera angles, lighting, three environments, fullscreen, local save/restore and shareable URLs |
| `/compare`         | Up to three vehicles, nine specification rows, difference highlighting, remove/reset                                                                                                                     |
| `/technology`      | Interactive 3D architectural presentation and expandable technical information                                                                                                                           |
| `/story`           | Editorial brand story and design principles                                                                                                                                                              |
| `/gallery`         | Category filters, editorial/grid layout, image lightbox, arrows, Escape, focus trap and swipe                                                                                                            |
| `/book-test-drive` | Validated enquiry with model, date/time, location and customer details                                                                                                                                   |
| `/contact`         | Department-based enquiries, fictional contact information and FAQ                                                                                                                                        |
| `/admin`           | Login/logout, statistics, enquiry status updates/search, vehicle/specification editing and gallery management                                                                                            |

The homepage presents 60 distinct, background-free real car images on a diagonal perspective rail inspired by the supplied A24 reference. Mouse wheel, trackpad, horizontal drag, touch swipe, keyboard arrows and navigation buttons control its GSAP movement. Neighbouring cars move together, with depth, tilt and smooth settling. It does not autoplay. Gallery references are deduplicated by URL.

The 3D studio uses the detailed Ferrari 458 Italia reference model distributed in the official Three.js examples, credited to vicent091036. Paint, alloy finish, cameras, environments and lighting remain interactive. AERION model selections choose illustrative specifications, not five separate Ferrari geometries. The GLB and Draco decoder are served locally. Photography and transparent WebP cutouts are also local assets.

Image sources and licence details are in `client/public/credits.txt` and `shared/car-cutouts.json`. PNGimg cutouts use **CC BY-NC 4.0**, suitable for this noncommercial concept exhibition; commercial deployment needs appropriately licensed replacement images. Unsplash photographs use the Unsplash License. Original SVG studies remain in the repository but are no longer the displayed vehicle photography. The 60 optimized cutouts total approximately 5.3 MB; only nearby rail images mount in the DOM.

## Project structure

```text
client/
  public/images/          Real photography, transparent cutouts and legacy studies
  src/App.tsx            Navigation, home exhibition, motion and route shell
  src/pages/Pages.tsx     Catalogue, studio, comparison, forms and admin
  src/three/CarScene.tsx  Detailed GLB reference vehicle and real camera controls
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
npm run test:mongo
npm run build
npm run test:browser
npm run test:fullstack
node scripts/verify-car-assets.mjs
```

Browser tests use installed Google Chrome via Playwright. The outage UI check intercepts one contact request with an explicit HTTP 503 response. `test:mongo` launches an isolated real MongoDB process and checks seed preservation, submissions, indexes and persisted sessions across an API restart. `test:fullstack` starts separate frontend/API test ports and verifies successful submissions plus structured admin editing against real MongoDB on desktop and mobile. These isolated tests do not modify the `.local/database` development data. See `TEST_RESULTS.md` for actual verification.

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

No Lighthouse score is claimed. A production service still needs environment configuration, hosting, monitoring, commercially suitable media rights and any business integrations before public use.
