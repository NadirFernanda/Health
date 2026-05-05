import webpush from "web-push";
import { prisma } from "@/lib/db";

let vapidConfigured = false;
function getWebPush() {
  if (!vapidConfigured) {
    const email = process.env.VAPID_EMAIL;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!email || !publicKey || !privateKey) return null;
    webpush.setVapidDetails(email, publicKey, privateKey);
    vapidConfigured = true;
  }
  return webpush;
}

interface PushPayload {
  title: string;
  body: string;
  href?: string;
  tag?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const wp = getWebPush();
  if (!wp) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });
  if (subscriptions.length === 0) return;

  const stale: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          ((err as { statusCode: number }).statusCode === 410 ||
            (err as { statusCode: number }).statusCode === 404)
        ) {
          stale.push(sub.endpoint);
        }
      }
    })
  );

  if (stale.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: stale } },
    });
  }
}

// Helper that creates a Notificacao AND fires a push (non-blocking).
export async function criarNotificacaoComPush(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  data: {
    userId: string;
    tipo: string;
    titulo: string;
    corpo: string;
    href?: string;
  }
) {
  await tx.notificacao.create({ data });
  // fire-and-forget: doesn't block the transaction
  sendPushToUser(data.userId, {
    title: data.titulo,
    body: data.corpo,
    href: data.href,
    tag: data.tipo,
  }).catch(() => {});
}
