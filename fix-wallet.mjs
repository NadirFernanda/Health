import { PrismaClient } from "./src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function fix() {
  const pags = await prisma.pagamento.findMany({
    where: { liberadoEm: { not: null }, beneficiarioProfissionalId: { not: null } },
    include: { plantao: true },
  });

  if (pags.length === 0) {
    console.log("Nenhum pagamento liberado encontrado.");
    return;
  }

  for (const pag of pags) {
    const profId = pag.beneficiarioProfissionalId;
    const valor = pag.valorLiquidoAoa;
    const plantaoId = pag.plantaoId;

    const temTransacao = await prisma.transacaoCarteira.findFirst({
      where: { referencia: plantaoId, profissionalId: profId },
    });

    if (temTransacao) {
      console.log(`Pagamento ${pag.id}: ja tem transacao, ignorar.`);
      continue;
    }

    await prisma.$transaction([
      prisma.profissional.update({
        where: { id: profId },
        data: {
          saldoCarteira: { increment: valor },
          saldoCarteiraCentavos: { increment: BigInt(valor) * 100n },
          totalPlantoes: { increment: 1 },
        },
      }),
      prisma.transacaoCarteira.create({
        data: {
          profissionalId: profId,
          tipo: "CREDITO",
          valorCentavos: BigInt(valor) * 100n,
          descricao: "Plantao concluido (correcao manual)",
          referencia: plantaoId,
          estado: "PROCESSADO",
        },
      }),
    ]);

    console.log(`Corrigido: ${valor} AOA creditados ao profissional ${profId}`);
  }

  await prisma.$disconnect();
}

fix().catch((e) => { console.error(e); process.exit(1); });
