# Plates and Container Quantities Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this approved plan task by task in the current session. Steps use checkbox syntax for tracking.

**Goal:** Add plate/container article types, container configuration planning and separate quantity bookings on web and Android.

**Architecture:** Extend existing `cartons`, `instructions`, and `movements` records with backward-compatible optional metadata. A pure article/configuration module supplies validation and calculations; SQLite retains metadata in its existing JSON payloads. Source overrides are tracked alongside the verified original archive and restored into an owned build directory; website assets ultimately come from the signed APK.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, esbuild, Firebase Realtime Database, Capacitor/SQLite, Node 22+ with node:sqlite, Playwright, Java 21; CI Ubuntu 24.04.

**Spec:** `docs/superpowers/specs/2026-11-19-plates-containers-design.md` (approved by user: “Ja passt so”).

## Global Constraints

- Quantity management per article type; no per-container instance IDs or actual Container Track API integration.
- Calculation never changes or reserves stock. Container and plate quantities are booked separately.
- Preserve legacy records without `kind`, permissions, offline queues and movement UUID idempotency.
- Feature version 5.1.0, Android code greater than 29, same package and signing certificate; immutable prior tags/assets.
- Keep the readable V5 dark UI and safe-area handling; web and Android use identical application assets.
- No production stock or users are created for tests. Live Firebase rule deployment requires real available authorization.

## Review Focus

- Existing implicit carton records, mixed categories and missing references must not give optimistic capacity.
- A concurrent booking during an administrator edit must not be silently overwritten.
- New movement metadata must survive SQLite queue/retry/restart and legacy movements must remain valid.
- Customer views/exports must not reveal internal stock, recipients or external article references.
- Reopening/duplicating a container configuration must not insert a second target-container material row.

---

### Task 1: Domain module and reproducible feature source

**Files:** create `cloud-build/overrides/src/articles.mjs`, `cloud-build/overrides/scripts/test-articles.mjs`, `cloud-build/restore-source.mjs`; extend `cloud-build/prepare-release.mjs`, its tests, `test-phase12.mjs`, `test-release.mjs`; retain verified source archive and readability patch.

**Interfaces:** `articleKind(article) -> 'carton'|'plate'|'container'`; `validateArticle(input, previous?) -> normalized record`; `configurationMaterials(containerId, plates, articles) -> materials[]`; `calculateConfiguration(configuration, articles, quantity) -> {capacity, canFulfill, lines, bottleneck}`; `createMovementMetadata(article, options) -> metadata`; `movementMetadata(record) -> only validated optional metadata` (absence preserved); `containerMovementRows(movements, articles) -> export rows`.

- [x] Write failing Node tests for the 10/30/20 stock example, input boundaries, wrong/missing types, duplicates, no input mutation, immutable explicit category, optional metadata and legacy absence.
- [x] Implement the pure functions and run `node --test cloud-build/overrides/scripts/test-articles.mjs` until green.
- [x] Restore existing source into a new owned directory, apply overlays/build scripts and normalize all selected release metadata. New `articles.js` bundle is part of copy/cache lists.
- [x] Extend real version tests to 5.1.0; run all preparation tests and commit the domain/source task.

### Task 2: Persistent quantities, movement metadata and rule compatibility

**Files:** create/modify `cloud-build/overrides/src/offline-core.js`, `cloud-build/overrides/database.rules.json`, `cloud-build/overrides/scripts/test-offline-articles.mjs`, and rule tests/CI runtime configuration.

**Interfaces:** native `recordMovement({...core, partner?, reference?})` returns a payload with trusted article metadata; `getSyncBatch`, `getMovementsByStatus`, `getMovements` preserve optional metadata while authoritative columns still own core values. Use Task 1 metadata helpers. Firebase article/instruction paths remain unchanged.

- [x] Write failing integration tests using real SQLite for typed-cache/config round trips, separate container booking, metadata through queue/batch/retry, and old movements without metadata.
- [x] Implement metadata persistence and validation without changing the SQLite schema or manufacturing defaults on old queued movements.
- [x] Add backward-compatible field validation and staff immutability to the supplied Firebase rules. Exercise actual rules with an isolated local emulator in CI; never a production project.
- [x] Run the existing security/stability gates plus domain/SQLite/rule checks and commit.

### Task 3: Article, configuration, planner, booking and export UI

**Files:** `cloud-build/overrides/index.html`, copy/build script overrides if needed, `.github/scripts/articles-ui.py`.

**Interfaces:** controllers consume Task 1 helpers and Task 2 metadata. Existing DOM IDs remain compatible; add category filters, `cKind`, `cExternalRef`, configuration kind/target controls and optional booking partner/reference controls.

- [x] Add failing browser flows for typed article creation/filtering, configuration creation/edit/duplicate, expected shortage/capacity, no stock effects during planning, separate container booking, and customer restrictions.
- [x] Implement administrator forms and metadata-preserving article transactions, including safe handling of stock changes while the edit dialog is open.
- [x] Implement container configurations containing one target-container row and plate rows, dynamic planner labels/results, journal metadata and neutral CSV of currently loaded container movements. Preserve formula neutralization.
- [x] Run browser flows at phone/desktop sizes, the existing readability sweep and the full app suite. Capture a bounded visual batch, fix actual defects, and commit.

### Task 4: Whole-branch review and release

**Files:** Android/source QA workflows, release notes, canonical root assets/provenance, environment setup/start instructions and release report.

- [x] Validate restored source locally and in pinned Ubuntu 24.04 CI; preserve existing test gates and add new suites.
- [x] Dispatch one fresh whole-branch review as required by the inline execution skill, fix material findings with regression coverage, and record decisions in the ledger.
- [x] Build/sign the corrective V5.1.1 APK; independently verify APK metadata, SHA and signer. Do not move a failed release tag.
- [x] Extract exact public assets into web root, update provenance/tests, publish the approved feature via normal main fast-forward, and verify the actual public site.
- [x] Save tested reusable environment instructions and report what passed, what remains unverified, and any actual Firebase access blocker.


## Verified delivery on 19 November 2026

V5.1.1 shipped from product commit `d856c4f3eda0d932b3fbfe34b6b8f658b19d376e`. The earlier V5.1.0 build stopped before signing. The published V5.1.1 APK has Android version code 42 and SHA-256 `c461ebdf309a139ce490c06d881e2a57e822c246f295a6b8e9489fa0a342909e`. Its single signer matches the published V5.0.2 APK. [Release](https://github.com/samkruw/Zerostock/releases/tag/v5.1.1) · [Release verification](https://github.com/samkruw/Zerostock/actions/runs/44523915445)

All 18 web assets came from that APK. The public website passed desktop and mobile checks including the Firebase SDK, service worker and file hashes. The isolated article tests covered planning, separate bookings and role access. The new feature was tested with fixtures and a real SQLite database. Testing on a physical Android device and deployment of the emulator-verified database rules require separate project access. [Pages deployment](https://github.com/samkruw/Zerostock/actions/runs/44525414630) · [Public website verification](https://github.com/samkruw/Zerostock/actions/runs/44525416530)
