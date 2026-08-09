import { DashboardShell } from '../../../../src/web/components/dashboard-shell.js';
import { DiscordModerationOverview } from '../../../../src/web/components/discord-moderation-overview.js';
import { requireRole } from '../../../../src/web/auth/session.js';

export default async function DiscordModerationPage() {
  const user = await requireRole('admin');
  return <DashboardShell user={user} label="Discord · Moderation" title="Konversationen im Kontext prüfen."><DiscordModerationOverview /></DashboardShell>;
}
