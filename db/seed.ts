import { config } from "dotenv";

config({ path: ".env.local" });

import { db, pool } from "./index";
import { seedDatabase } from "./seed-runner";

seedDatabase(db)
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool?.end();
  });
