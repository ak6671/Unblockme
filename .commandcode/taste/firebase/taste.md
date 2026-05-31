# firebase
- Use Firebase Authentication for OTP when MSG91/DLT registration is not available. Confidence: 0.70
- In Firebase v9+ modular SDK, `ConfirmationResult` is not a named export — it's returned by `signInWithPhoneNumber()` but should not be imported. Confidence: 0.75
- Firebase Phone Authentication does not work on localhost - use test phone numbers in Firebase Console for local development. Confidence: 0.75
- `auth.settings.appVerificationDisabledForTesting` only works with the Firebase Auth Emulator (localhost:9099) — it has no effect and causes auth/captcha-check-failed (MALFORMED) when hitting the production identitytoolkit.googleapis.com endpoint. Do not set it unless using the emulator. Confidence: 0.85
- The `auth/too-many-requests` error is a per-phone-number rate limit enforced by Firebase (not an API quota issue) - use different phone numbers or wait for the limit to reset. Confidence: 0.70
- When testing Firebase Phone Auth, prefer using real OTPs over test phone numbers for more realistic validation. Confidence: 0.70
- Do not use reCAPTCHA (RecaptchaVerifier or reCAPTCHA Enterprise) for Firebase Phone Authentication — Firebase's web SDK internally uses its own key, and custom Enterprise keys cause "Invalid site key" errors. Rely on direct SMS verification without any reCAPTCHA. Confidence: 0.95
