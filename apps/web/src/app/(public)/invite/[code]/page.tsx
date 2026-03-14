import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface Props {
  params: { code: string };
}

export default async function InvitePage({ params }: Props) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/invites/validate/${params.code}`,
    { cache: 'no-store' }
  );
  const { valid, reason } = await res.json();

  if (valid) {
    const cookieStore = await cookies();
    cookieStore.set('invite_code', params.code, {
      httpOnly: true,
      maxAge: 60 * 30, // 30 minutes
      sameSite: 'lax',
      path: '/',
    });
    redirect('/login');
  }

  const messages: Record<string, string> = {
    already_used: 'This invite link has already been used.',
    expired: 'This invite link has expired.',
    not_found: 'This invite link is invalid.',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
        <p className="text-sm text-gray-500 mb-6">
          {messages[reason ?? ''] ?? 'This invite link is not valid.'}
        </p>
        <p className="text-sm text-gray-400">
          Need access? Contact us to request an invite.
        </p>
      </div>
    </div>
  );
}
