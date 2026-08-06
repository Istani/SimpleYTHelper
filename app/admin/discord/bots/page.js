import { DashboardShell } from '../../../../src/web/components/dashboard-shell.js';
import { BotManagementPanel } from '../../../../src/web/components/bot-management-panel.js';
import { requireRole } from '../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../src/web/admin/prisma.js';
import { publicBotRegistration } from '../../../../src/web/admin/bot-management.js';
import { mergeBotRuntimeStatus } from '../../../../src/web/admin/live-status.js';

async function fetchAdapterBotStatuses() {
  const adapterUrl = process.env.DISCORD_ADAPTER_INTERNAL_URL || process.env.DISCORD_ADAPTER_URL || 'http://discord-adapter:3000';
  const token = process.env.INTERNAL_ADAPTER_TOKEN;
  if (!token) return [];
  try {
    const response = await fetch(`${adapterUrl}/internal/v1/bots`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(2000) });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload.bots) ? payload.bots : [];
  } catch { return []; }
}

export default async function DiscordBotsPage() {
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  let bots = [];
  if (prisma) {
    try {
      const [records, runtime] = await Promise.all([prisma.discordBotRegistration.findMany({ orderBy: { createdAt: 'desc' }, include: { audits: { orderBy: { createdAt: 'desc' }, take: 10 } } }), fetchAdapterBotStatuses()]);
      bots = mergeBotRuntimeStatus(records, runtime).map((record) => publicBotRegistration(record, record));
    } catch {}
  }
  return <DashboardShell user={user} label="Discord · Bots" title="Bots gezielt verwalten.">
    <section className="area-heading"><span className="kicker">Keine Versandfreigabe</span><h2>Registrierte Bot-Instanzen</h2><p>Status und SimpleYTH-Capabilities sind konfigurierbar. Token werden nur über einen separaten Dialog gesetzt und nie angezeigt.</p></section>
    <BotManagementPanel bots={bots} />
  </DashboardShell>;
}
