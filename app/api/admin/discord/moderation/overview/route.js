import { NextResponse } from 'next/server';
import { getSession } from '../../../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../../../src/web/admin/prisma.js';
import { loadDiscordModerationOverview } from '../../../../../../src/web/admin/discord-moderation-overview.js';

export async function GET() {
  const session = await getSession();
  if (!session?.roles?.includes('admin')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const prisma = getAdminPrisma();
  if (!prisma) return NextResponse.json({ error: 'data_unavailable' }, { status: 503 });
  try {
    return NextResponse.json(await loadDiscordModerationOverview(prisma), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'overview_unavailable' }, { status: 503 });
  }
}
