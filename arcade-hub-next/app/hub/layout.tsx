import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PartyFAB } from '@/components/party/party-fab';

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-16 transition-all duration-300">
        <Header />
        <main className="pt-16">
          <div className="container max-w-7xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      <PartyFAB />
    </div>
  );
}
