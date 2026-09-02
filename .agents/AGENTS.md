# Workspace Rules - Analiza Transporta

## Deployment & Iteration Policy
1. **GitHub Iterations**: Every code or data change must be committed to Git with a clear commit message and pushed immediately to `origin/master` (`https://github.com/draimore-prog/analiza-transporta`).
2. **Firebase Hosting Deployment**: After every change, deploy the updated application to Firebase Hosting (`npx firebase-tools deploy --only hosting`) so that live users always have access to the latest version (`https://analiza-transporta-flota.web.app`).
3. **Cache Invalidation**: Maintain zero-cache header settings (`Cache-Control: max-age=0, no-cache, no-store, must-revalidate`) in `firebase.json` and meta tags in HTML files so users receive instant updates upon page refresh.
4. **Conversation & Decision Logging**: Always save conversation summaries, plans, and key decisions into the `docs/razgovori/` directory within the project so they remain permanently accessible and version-controlled.
5. **Firestore as Single Source of Truth for Imports**: All data entry, imports, and reconciliations must be executed directly against Google Cloud Firestore (`analiza-transporta-flota`). The existing database already contains verified records for 2021 through 2026-06 (June 2026). All future imports (such as July 2026 onwards) must connect to Firestore, cross-reference/de-duplicate against existing records in Firestore, and commit only the incremental delta (new/missing entries) directly to Firestore.
