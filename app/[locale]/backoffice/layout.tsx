import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const locale = await getLocale();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check user role from profile/metadata
  // Assuming 'role' is in app_metadata or we need to fetch from 'users' table
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !userData || (userData.role !== 'officer' && userData.role !== 'admin')) {
    // If not officer or admin, redirect to home or show error
    redirect(`/${locale}?error=unauthorized`);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
