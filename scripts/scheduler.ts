import cron from "node-cron";

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET!;

if (!cronSecret) {
  throw new Error("CRON_SECRET is required to run the local scheduler.");
}

async function triggerPricingRun() {
  const response = await fetch(`${appUrl}/api/cron/pricing-run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error("Pricing cron failed:", payload);
    return;
  }

  console.log("Pricing cron completed:", payload);
}

console.log(`Local scheduler running. Target: ${appUrl}`);

cron.schedule("0 * * * *", () => {
  void triggerPricingRun();
});
