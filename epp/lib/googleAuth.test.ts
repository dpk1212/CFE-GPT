import assert from "node:assert/strict";
import { test } from "node:test";
import { GOOGLE_REDIRECT_URIS, GOOGLE_SCOPES, googlePublicOrigin, googleRedirectUri } from "./googleAuth.ts";

test("google sign-in uses the registered redirect path and scopes", () => {
  assert.equal(GOOGLE_SCOPES, "openid email profile");
  assert.equal(GOOGLE_REDIRECT_URIS.production, "https://cfe-epp.vercel.app/api/auth/google/callback");
  assert.equal(GOOGLE_REDIRECT_URIS.local, "http://localhost:3000/api/auth/google/callback");
  assert.equal(googleRedirectUri("localhost:3000"), GOOGLE_REDIRECT_URIS.local);
  assert.equal(googleRedirectUri("127.0.0.1:3000"), GOOGLE_REDIRECT_URIS.local);
  assert.equal(googleRedirectUri("cfe-epp.vercel.app"), GOOGLE_REDIRECT_URIS.production);
  assert.equal(googleRedirectUri("cfe-epp-preview.vercel.app"), GOOGLE_REDIRECT_URIS.production);
  assert.equal(googlePublicOrigin("localhost:3000"), "http://localhost:3000");
  assert.equal(googlePublicOrigin("cfe-epp.vercel.app"), "https://cfe-epp.vercel.app");
});
