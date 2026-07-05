import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <Menu size={20} className="text-slate-600 dark:text-slate-400" />
      </button>

      <div className="flex-1" />

      <button
        onClick={toggle}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {theme === 'dark' ? (
          <Sun size={20} className="text-slate-400" />
        ) : (
          <Moon size={20} className="text-slate-600" />
        )}
      </button>
    </header>
  );
}
