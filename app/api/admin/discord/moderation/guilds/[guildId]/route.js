import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../../src/web/admin/prisma.js';
import { pageResult, parseDetailPage } from '../../../../../../../src/web/admin/discord-detail-pagination.js';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session?.roles?.includes('admin')) return unauthorized();
  const { guildId } = await params;
  const section = new URL(request.url).searchParams.get('section');
  if (!['members', 'channels', 'roles'].includes(section)) return NextResponse.json({ error: 'invalid_section' }, { status: 400 });
  const prisma = getAdminPrisma();
  if (!prisma) return NextResponse.json({ error: 'data_unavailable' }, { status: 503 });
  const { limit, cursor } = parseDetailPage(Object.fromEntries(new URL(request.url).searchParams));
  const query = { where: { guildId }, take: limit + 1, ...(cursor ? { cursor: section === 'members' ? { guildId_userId: { guildId, userId: cursor } } : { id: cursor }, skip: 1 } : {}) };
  try {
    if (section === 'members') {
      const records = await prisma.discordGuildMember.findMany({ ...query, orderBy: { userId: 'asc' }, include: { user: true, roles: { include: { role: true } } } });
      return NextResponse.json(pageResult(records, limit, 'userId'), { headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (section === 'channels') {
      const records = await prisma.discordChannel.findMany({ ...query, orderBy: { id: 'asc' }, include: { _count: { select: { messages: true } } } });
      return NextResponse.json(pageResult(records, limit), { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const records = await prisma.discordRole.findMany({ ...query, orderBy: { id: 'asc' } });
    return NextResponse.json(pageResult(records, limit), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'detail_unavailable' }, { status: 503 });
  }
}
