import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { CopilotModals } from './modals/CopilotModals';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navbar />
      <main>{children}</main>
      <CopilotModals />
    </div>
  );
}
