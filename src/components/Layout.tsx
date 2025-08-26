import { ReactNode } from "react";
import { ClientOnlyNavbar } from "./ClientOnlyNavbar";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
}

export function Layout({ children, showNavbar = true, showFooter = true }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showNavbar && <ClientOnlyNavbar />}
      <main className={`flex-1 ${showNavbar ? 'pt-16' : ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
