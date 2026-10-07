import "dotenv/config";
import admin from "./src/config/firebaseAdmin.js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node setAdmin.js user@email.com");
  process.exit(1);
}

const user = await admin.auth().getUserByEmail(email);
await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
console.log(`✅ ${email} is now admin. Sign out and back in to refresh the token.`);
process.exit(0);