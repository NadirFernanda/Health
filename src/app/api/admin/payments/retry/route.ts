import { requireSession } from "@/lib/api-auth";
import { processDuePaymentRetries } from "@/lib/payment-service";

export async function POST() {
  const auth = await requireSession("ADMIN");
  if (auth instanceof Response) return auth;

  await processDuePaymentRetries();
  return Response.json({ ok: true });
}
