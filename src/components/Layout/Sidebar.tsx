import { NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, Home, BarChart3 } from 'lucide-react';
import { useInspections } from '../../contexts/InspectionContext';

export function Sidebar() {
  const { state } = useInspections();
  const count = state.inspections.length;

  const links = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/new', icon: PlusCircle, label: 'Nueva Inspección' },
    { to: '/inspections', icon: ClipboardList, label: 'Inspecciones', badge: count },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">InspectAI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Inspecciones Inteligentes</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
            end={link.to === '/'}
          >
            <link.icon size={18} />
            <span>{link.label}</span>
            {link.badge != null && link.badge > 0 && (
              <span className="ml-auto bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400">v1.0.0</p>
      </div>
    </aside>
  );
}
