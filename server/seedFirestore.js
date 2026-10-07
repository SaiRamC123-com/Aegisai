import "dotenv/config";
import { db } from "./src/config/firebaseAdmin.js";
import { seedZones } from "./src/config/seedZones.js";

const batch = db.batch();
seedZones.forEach(({ id, ...zone }) => batch.set(db.collection("zones").doc(id), zone));
await batch.commit();
console.log(`✅ Seeded ${seedZones.length} zones to Firestore`);
process.exit(0);