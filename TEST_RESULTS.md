# Verification — 10 October 2026

Verified locally on Windows with Node.js 24.21.0 and Google Chrome.

| Check | Result |
| --- | --- |
| Dependency installation | Completed; npm reported zero known vulnerabilities |
| TypeScript and ESLint | Passed |
| Production build | Passed |
| API contract/security tests | 8 passed |
| Real MongoDB integration | 1 comprehensive test passed |
| Desktop/mobile browser suite | 18 passed in the final complete run |
| Real MongoDB browser flows | 2 passed, desktop and mobile |
| Transparent car assets | 60 unique sources and file hashes; all retain real alpha transparency |
| Optimized cutouts | Approximately 5.3 MB combined |
| Visual review | Car contact sheet plus desktop/mobile home and studio screenshots reviewed |

The supplied A24 reference was opened in Chrome and reviewed before/after wheel input. The car rail implements its diagonal perspective movement with GSAP: mouse wheel/trackpad and drag move neighbouring images together with depth and tilt; arrows and reduced-motion navigation also work. The carousel does not autoplay. Gallery images are deduplicated by URL. Partial vehicles, a montage and a logo were replaced during visual review.

The detailed Ferrari reference GLB and Draco decoder load locally. Browser coverage confirms actual WebGL orbit, paint changes, zoom, camera controls, model/specification selection, save/restore/share URL state, all public routes, loaded images, viewport overflow, catalogue filters, comparison, gallery keyboard/focus handling, mobile navigation and pinned cabin storytelling. There were no uncaught page errors in the all-routes tests.

The MongoDB integration test starts a real isolated mongod, verifies non-destructive seeding, bcrypt login, contact/test-drive writes, duplicate indexes, populated vehicle references and status updates. It reconnects the API and session store and confirms the existing admin cookie and records remain valid. The full-stack browser tests verify successful contact submissions, administrator status updates, labelled vehicle editing, persistence after page reload and logout. Test databases are separate from the persistent local development database.

The service-outage browser check explicitly simulates one contact HTTP 503 response. API tests separately verify the actual unavailable-repository response. Initial test timeouts caused by obsolete button labels were corrected. A mobile story test assumed lazy images outside the viewport had loaded; it now scrolls through the collection before checking the pinned story. Final suites pass.

Actual Android/iPhone hardware, Safari, production hosting, email delivery, real scheduling, fullscreen compatibility across browsers, clipboard permissions across browsers and Lighthouse were not measured. No performance score or confirmed appointment is claimed. The current Three.js/Fiber combination emits a nonfatal THREE.Clock deprecation warning. Real cars and the Ferrari model are visual references, not validated representations of fictional AERION specifications.

Reproduce:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run test:mongo
npm run build
npm run test:browser
npm run test:fullstack
node scripts/verify-car-assets.mjs
```

Use npm.cmd in Windows PowerShell if execution policy blocks npm.ps1. Start the complete persistent local preview with npm run dev:full; credentials are in the Git-ignored .local/admin-credentials.json.
