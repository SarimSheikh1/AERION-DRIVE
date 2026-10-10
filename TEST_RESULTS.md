# Verification — 10 October 2026

Executed in this Windows workspace with Node.js 24.21.0, installed Google Chrome, Playwright and the versions pinned in `package-lock.json`.

| Check | Actual result |
| --- | --- |
| Dependency installation | Completed; npm reported zero known vulnerabilities |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | Eight API integration tests passed |
| `npm run build` | Passed; Vite produced `client/dist` |
| `npm run test:browser` | All fourteen tests passed in the final complete run (approximately one minute) |
| Original SVG assets | Seven vehicle/editorial illustrations parsed as valid XML |
| Visual review | Desktop/mobile home and configurator screenshots captured; wheel orientation and proportions corrected |
| Encoding | UTF-8 UI text checked; corrupted punctuation repaired |

## API coverage

Published catalogue queries, missing vehicles, contact validation and duplicate prevention, valid test-drive enquiries, invalid model/date rejection, private administrator sessions, HTTP-only/SameSite cookies, logout, enquiry status changes, cross-origin write rejection, honest database-outage responses, vehicle specification CRUD, gallery CRUD/unsafe URL validation and login throttling.

The API tests inject a **test-only in-memory repository**. MongoDB models, seeding and persistent session integration are implemented, but a live MongoDB server/Atlas connection was not supplied, so MongoDB persistence and production seed execution were **not tested**. Development preview ran in read-only catalogue mode. Browser contact submission correctly returned a service-unavailable error instead of reporting success.

## Browser coverage

Both a 1440 × 1000 desktop viewport and a 390 × 844 mobile touch viewport were tested in headless Chrome. Coverage includes every public route plus admin login/404, no horizontal overflow in those viewports, loaded-image checks, category filtering and price sorting, three-vehicle comparison/difference highlighting/reset, real WebGL orbit interaction, paint changes, zoom buttons, model switching, camera controls, local save/restore, share URL generation, gallery keyboard/focus handling, reduced-motion navigation, mobile menu, pinned cabin storytelling and technical hotspots.

There were no uncaught page errors in the all-routes browser test. Expected offline-enquiry HTTP 503 responses and a nonfatal `THREE.Clock` deprecation warning from the current React Three Fiber/Three.js dependency combination were observed. The initial desktop story test exposed layout measurement before vehicle images settled; image aspect-ratio reservation and a cleaned-up ResizeObserver/ScrollTrigger refresh fixed it. The final full suite passed.

Real Android/iPhone hardware, Safari, email delivery, real scheduling, production hosting, full-screen behavior, clipboard permissions on every browser and Lighthouse were not measured. No Lighthouse score or confirmed appointment is claimed. The configurable 3D model is an original procedural concept with an exterior; a detailed 3D interior is not included.

## Reproduce

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run test:browser
```

Use `npm.cmd` in Windows PowerShell if execution policy blocks `npm.ps1`. Browser tests expect the development API to run without MongoDB for the offline-contact check; see the README for setup.
