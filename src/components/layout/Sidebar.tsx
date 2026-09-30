import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

export default function Sidebar({ links }: { links: SidebarLink[] }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)] p-4 hidden lg:block">
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}