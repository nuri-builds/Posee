# Posee: pose-reference camera (Expo SDK 58 MVP)

Search for a pose by occasion ("shaadi lehenga", "Goa squad", "Diwali family"), then line yourself up against a see-through ghost overlay on the live camera and shoot. Photos save straight to the phone's gallery with a small Posee watermark.

## Run it

```bash
npm install
cp .env.example .env          # optional: add RevenueCat keys
npx expo run:android          # or: npx expo run:ios  (dev build, since the camera/IAP need native code)
```

You can also build in the cloud with `npx eas-cli@latest build --profile development`.
Expo Go can't run this app because react-native-purchases and react-native-view-shot need a dev build.

## Structure

```
src/
  app/                 Expo Router screens
    _layout.tsx        Stack + purchases init + entitlement listener
    index.tsx          Search screen (query, occasion and group filters, "use your own photo")
    camera.tsx         Viewfinder + ghost overlay, opacity slider, timer, grid, mirror, hold-to-peek
    paywall.tsx        7-day trial / ₹149 monthly / ₹49 weekend pass, restore, disclosures
    privacy.tsx        Privacy promises, watermark toggle (Pro), cloud-consent flag (off)
  components/          GhostOverlay, WatermarkComposer, PoseCard, Chip
  data/poses.ts        Pose catalogue + occasions (replace placeholder images)
  services/            permissions, gallery (local save), purchases (RevenueCat)
  state/store.ts       Zustand store, persisted to AsyncStorage (settings and entitlement cache only)
  utils/search.ts      Offline search: Hinglish synonyms, typo tolerance, ranking
```

`npm test` runs the search tests and `npm run typecheck` runs TypeScript.

## Before launch
1. **Reference images**: `assets/poses/*.png` are outline placeholders. Use photos you own or have licensed.
2. **Store products**: create `posee_monthly_149` (auto-renew, 7-day free intro offer) and `posee_weekend_49`
   (consumable / non-renewing). In RevenueCat, attach them to entitlement `pro` and offering `default`.
3. **Legal**: host Terms and a Privacy Policy, then set the URLs in `src/app/paywall.tsx`.
   Both stores' data-safety forms can declare "no data collected" except anonymous purchase records.
4. **App icon and splash**: replace the default Expo assets in `assets/`.
