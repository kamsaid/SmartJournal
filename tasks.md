# Smart Journal – Refactor & Enhancement Checklist

---

## 11  UI/UX Modernization Pass

Make the UI feel modern and consistent:

* Propose a visual refresh for spacing, radius, typography, and color tokens in `src/design-system/**`.
* Create/align a **theme scale** (8 px base) and replace magic numbers.
* Introduce/standardize components: `Button`, `Card`, `Input`, `ListItem`, `Skeleton`, `EmptyState`, `Toast`.
* Provide edits in place of ad‑hoc styles.

## 12  Design Tokens & Theming

Centralize tokens:

* Extract colors/spacing/typography into a single source of truth (e.g. `tokens.ts`).
* Wire **dark mode** and **high‑contrast** variants; ensure system‑preference sync.
* Replace inline colors with tokenized variables. Provide codemods or batch edits.

## 13  Micro‑interactions & Animations

Audit and refine motion:

* Standardize durations/easings in `design-system/animations.ts`.
* Add subtle transitions for screen changes, button presses, and list‑item interactions (Reanimated if RN).
* Ensure 60 fps and respect accessibility → “prefers‑reduced‑motion”.

## 14  Accessibility Sweep

Run an a11y pass:

* Ensure tappable sizes (min 44 × 44), logical focus order, labels (`aria-label` / `accessibilityLabel`), roles, and keyboard nav.
* Add focus styles and ensure color contrast ≥ 4.5 : 1.
* Provide concrete edits per screen and a checklist enforced in CI (axe‑ci/lighthouse‑ci).

## 15  Navigation Flow Audit

Review `src/navigation/AppNavigator.tsx` and screens:

* Map routes, deep links, and auth guards.
* Fix param typing, remove unused routes, ensure back behaviour is consistent, and preload heavy screens.
* Propose a **two‑step refactor** to simplify stacks/tabs and reduce nesting.

## 16  State‑Management Simplification

Audit state:

* Identify global state that should be local (and vice‑versa).
* Remove prop‑drilling via React Context or a small store (e.g. Zustand).
* Add selectors/memoization to reduce re‑renders. Include a before/after code sample.

## 17  Forms & Validation

Standardize forms:

* Adopt a single forms approach (e.g. **react‑hook‑form + Zod**).
* Create reusable `FormField` + `Input` with error messaging and helper text.
* Replace ad‑hoc validation with **schema‑driven** validation across screens.

## 18  Error Handling & Toasts

Centralize error handling:

* Create an `ErrorBoundary` and a `useToast` / `useBanner` hook.
* Normalize error objects from **Supabase** & **AI services** into user‑friendly messages with actionable next steps.
* Add structured logs for debugging and surface critical failures with a single UX pattern.

## 19  AI Orchestration Review

Audit `src/services/openai/**` and AI call sites:

* Map prompt flows, context size, caching, and error paths.
* Propose prompt compression, response validation, and retries. Add telemetry for token usage.
* Create a generic `callAI` wrapper with guards and timeouts; refactor call sites to use it.

## 20  Prompt Library Hardening

Create a prompt catalog:

* Move all prompts into a **typed registry** with versioning and tests.
* Add placeholders, guardrails, and few‑shot examples where missing.
* Validate outputs (Zod) and add fallbacks for partial responses.

---

### Suggested Next‑Level Improvements

|  ID  |  Area                      | Key Actions                                                                    |
| ---- | -------------------------- | ------------------------------------------------------------------------------ |
| 21   | **Performance Profiling**  | Add React DevTools/Flipper; lazy‑load heavy screens; measure TTI & FPS         |
| 22   | **Automated Testing**      | Integrate Jest + RNTL/Detox; target ≥ 80 % coverage; add visual snapshots      |
| 23   | **CI/CD Hardening**        | GitHub Actions → build/lint/test/a11y/bundle‑size; auto‑deploy preview builds  |
| 24   | **Dependency Health**      | Enable Renovate; run `npm audit`/Snyk; patch & prune                           |
| 25   | **Security & Privacy**     | Secure token storage; scrub logs; review Supabase RLS & rate limits            |
| 26   | **Logging & Analytics**    | Standardize logs (Console → Sentry); add PostHog/Amplitude for product metrics |
| 27   | **Offline Support**        | Optimistic updates; local persistence (MMKV/SQLite); queue AI calls            |
| 28   | **Internationalisation**   | Extract strings; add i18next; RTL & plural rules                               |
| 29   | **Documentation**          | Update README; add CONTRIBUTING, ADRs; Storybook for UI components             |
| 30   | **Licensing & Compliance** | Verify OSS licenses; include NOTICE; link GDPR/CCPA policies                   |

---
