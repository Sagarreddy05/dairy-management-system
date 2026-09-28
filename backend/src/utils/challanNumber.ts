import prisma from './prisma';

export const generateChallanNumber = async (): Promise<string> => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = `CH-${y}${m}${d}-`;

  const latest = await prisma.salesChallan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let seq = 1;
  if (latest?.challanNumber) {
    const part = latest.challanNumber.split('-').pop();
    const n = parseInt(part || '0', 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
};
 
