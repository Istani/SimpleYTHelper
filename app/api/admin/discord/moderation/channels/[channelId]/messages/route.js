import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../../../src/web/admin/prisma.js';
import { pageResult, parseDetailPage } from '../../../../../../../../src/web/admin/discord-detail-pagination.js';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session?.roles?.includes('admin')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { channelId } = await params;
  const prisma = getAdminPrisma();
  if (!prisma) return NextResponse.json({ error: 'data_unavailable' }, { status: 503 });
  const { limit, cursor } = parseDetailPage(Object.fromEntries(new URL(request.url).searchParams));
  try {
    const records = await prisma.discordMessage.findMany({
      where: { channelId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { author: true, media: { orderBy: [{ kind: 'asc' }, { position: 'asc' }] } },
    });
    return NextResponse.json(pageResult(records, limit), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'detail_unavailable' }, { status: 503 });
  }
}
