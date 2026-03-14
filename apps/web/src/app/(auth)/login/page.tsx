import { LoginForm } from '@/components/auth/LoginForm';

interface Props {
  searchParams: { error?: string };
}

export default function LoginPage({ searchParams }: Props) {
  const inviteRequired = searchParams.error === 'invite_required';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Orange Docs</h1>
        <p className="mt-2 text-sm text-gray-500">
          Orange Docs is currently invite-only.
        </p>
      </div>
      {inviteRequired && (
        <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          You need a valid invite to create an account.
        </div>
      )}
      <LoginForm />
    </div>
  );
}
