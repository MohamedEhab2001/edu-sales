import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { UserModel } from "@/models/User";
import { apiError } from "@/lib/api-response";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    await connectToDatabase();
    const user = await UserModel.findOne({ email: input.email }).lean();

    if (!user || !(await compare(input.password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    await createSession({
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: "admin",
    });

    return NextResponse.json({ user: { name: user.name, email: user.email } });
  } catch (error) {
    return apiError(error);
  }
}
