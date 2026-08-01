import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { petitions, signatures } from "@/db/schema";
import { maybeEscalatePetitionGoal } from "@/lib/petition-goal";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/petitions", request.url));
  }

  const [signature] = await db
    .select({
      id: signatures.id,
      petitionId: signatures.petitionId,
      confirmTokenExpires: signatures.confirmTokenExpires,
      verified: signatures.verified,
    })
    .from(signatures)
    .where(eq(signatures.confirmToken, token))
    .limit(1);

  const expired =
    !!signature?.confirmTokenExpires && signature.confirmTokenExpires < new Date();

  if (!signature || expired) {
    return NextResponse.redirect(new URL("/petitions?confirm=invalid", request.url));
  }

  const [petition] = await db
    .select({ slug: petitions.slug })
    .from(petitions)
    .where(eq(petitions.id, signature.petitionId))
    .limit(1);

  if (!signature.verified) {
    await db
      .update(signatures)
      .set({ verified: true, confirmToken: null, confirmTokenExpires: null })
      .where(eq(signatures.id, signature.id));
    await maybeEscalatePetitionGoal(signature.petitionId);
  }

  const destination = petition ? `/petitions/${petition.slug}?confirmed=1` : "/petitions";
  return NextResponse.redirect(new URL(destination, request.url));
}
