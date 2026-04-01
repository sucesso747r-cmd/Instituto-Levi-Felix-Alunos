import { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useLocation, Link } from 'wouter';

interface LayoutProps {
  children: ReactNode;
  showLogout?: boolean;
  onLogout?: () => void;
  subtitle?: string;
}

export default function Layout({ children, showLogout, onLogout, subtitle }: LayoutProps) {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    if (onLogout) onLogout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center px-4 py-8">
      {/* Logo */}
      <div className="mb-4">
        <img 
          src="/logo.png" 
          alt="Instituto Levi Felix Logo" 
          className="w-32 h-auto"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = '<div class="w-24 h-24 bg-secondary flex items-center justify-center rounded-lg border border-white/10"><span class="text-xs text-white/50 uppercase font-bold tracking-tighter">Levi Felix</span></div>';
          }}
        />
      </div>

      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight uppercase">
          Instituto <span className="text-primary">Levi Felix</span>
        </h1>
        <p className="text-white/60 text-sm mt-1">{subtitle ?? 'Área do Aluno'}</p>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col">
        {children}
      </main>

      {showLogout && (
        <button
          onClick={handleLogout}
          className="mt-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
        >
          <LogOut size={16} />
          Sair do sistema
        </button>
      )}

      <footer className="mt-12 text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-white/20 text-[8px] uppercase tracking-[0.2em] font-bold">
          <Link href="/terms" className="hover:text-white transition-colors">Termos de Uso</Link>
          <span className="w-1 h-1 bg-white/10 rounded-full" />
          <Link href="/privacy" className="hover:text-white transition-colors">Privacidade e LGPD</Link>
        </div>
        <p className="text-white/20 text-[10px] uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Instituto Levi Felix - desenvolvido por <a href="https://i9star.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">i9star.com.br</a>
        </p>
      </footer>
    </div>
  );
}
