import { useClerk, useUser } from '@clerk/react';
import { LogOut, ShieldX } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Unauthorized() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  return <main className="unauthorized-screen" data-testid="status-unauthorized" role="alert">
    <div className="unauthorized-card">
      <div className="section-kicker"><ShieldX size={16} /> ACCESS / RESTRICTED</div>
      <h1>Not on the list<span className="heading-period">.</span></h1>
      <p>The signed-in email <span className="unauthorized-email" data-testid="text-unauthorized-email">{email ?? 'on this account'}</span> is not authorized to view the Ticketmaker operations workspace.</p>
      <p>If you think this is a mistake, ask the workspace administrator to grant access, or sign out and use an authorized account.</p>
      <button className="btn btn-dark" type="button" onClick={() => void signOut({ redirectUrl: basePath || '/' })} data-testid="button-unauthorized-sign-out"><LogOut size={16} /> Sign out</button>
    </div>
  </main>;
}