import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof Error && error.message.includes("E11000")) {
    return NextResponse.json(
      { message: "A lead with this phone number already exists." },
      { status: 409 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { message: error instanceof Error ? error.message : "Something went wrong." },
    { status: 500 },
  );
}
