import { DashboardShell } from '../../../../src/web/components/dashboard-shell.js';
import { DiscordOAuthConfigurationPanel } from '../../../../src/web/components/discord-oauth-configuration-panel.js';
import { requireRole } from '../../../../src/web/auth/session.js';
import { getAdminPrisma } from '../../../../src/web/admin/prisma.js';
import { publicDiscordOAuthApplication } from '../../../../src/web/admin/discord-oauth-application.js';

export default async function DiscordOAuthPage() {
  const user = await requireRole('admin');
  const prisma = getAdminPrisma();
  let configuration = null;
  if (prisma) {
    try {
      const record = await prisma.oauthProviderConfiguration.findUnique({ where: { provider: 'discord' } });
      if (record) configuration = publicDiscordOAuthApplication(record);
    } catch {}
  }
  return <DashboardShell user={user} label="Discord · Developer Settings" title="OAuth zentral und sicher verwalten.">
    <DiscordOAuthConfigurationPanel configuration={configuration} />
  </DashboardShell>;
}
