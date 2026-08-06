import { redirect } from 'next/navigation';

export default async function DirectMessageRedirect({ params }) {
  const { channelId } = await params;
  redirect(`/admin/discord/moderation/channels/${encodeURIComponent(channelId)}`);
}
