import { config } from "dotenv";
import { hash } from "bcryptjs";

config({ path: ".env.local" });

async function main() {
  const [{ connectToDatabase }, { UserModel }, { OptionModel }] = await Promise.all([
    import("../src/lib/db"),
    import("../src/models/User"),
    import("../src/models/Option"),
  ]);

  const email = process.env.SEED_EMAIL?.toLowerCase();
  const password = process.env.SEED_PASSWORD;
  const name = process.env.SEED_NAME ?? "Edulato Admin";

  if (!email || !password || password.length < 8) {
    throw new Error("SEED_EMAIL and a SEED_PASSWORD of at least 8 characters are required.");
  }

  await connectToDatabase();
  await UserModel.updateOne(
    { email },
    {
      $set: {
        name,
        email,
        passwordHash: await hash(password, 12),
        role: "admin",
      },
    },
    { upsert: true },
  );

  const defaults = [
    { type: "response", value: "No answer", valueKey: "no answer" },
    { type: "response", value: "Interested", valueKey: "interested" },
    { type: "response", value: "Call later", valueKey: "call later" },
    { type: "response", value: "Not interested", valueKey: "not interested" },
  ];
  await Promise.all(
    defaults.map((item) =>
      OptionModel.updateOne(
        { type: item.type, valueKey: item.valueKey },
        { $setOnInsert: { ...item, active: true, usageCount: 0 } },
        { upsert: true },
      ),
    ),
  );

  console.log(`Seeded ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
