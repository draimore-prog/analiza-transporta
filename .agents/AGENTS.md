# Workspace Rules - Analiza Transporta

## Deployment & Iteration Policy
1. **GitHub Iterations**: Every code or data change must be committed to Git with a clear commit message and pushed immediately to `origin/master` (`https://github.com/draimore-prog/analiza-transporta`).
2. **Firebase Hosting Deployment**: After every change, deploy the updated application to Firebase Hosting (`npx firebase-tools deploy --only hosting`) so that live users always have access to the latest version (`https://analiza-transporta-flota.web.app`).
3. **Cache Invalidation**: Maintain zero-cache header settings (`Cache-Control: max-age=0, no-cache, no-store, must-revalidate`) in `firebase.json` and meta tags in HTML files so users receive instant updates upon page refresh.
