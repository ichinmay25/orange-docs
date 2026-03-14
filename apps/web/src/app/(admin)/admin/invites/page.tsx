import { db } from '@designbase/db';
import { InviteManager } from '@/components/admin/InviteManager';

export const dynamic = 'force-dynamic';

export default async function AdminInvitesPage() {
  const codes = await db.inviteCode.findMany({ orderBy: { createdAt: 'desc' } });
  return <InviteManager initialCodes={codes} />;
}
