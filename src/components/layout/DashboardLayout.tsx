import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import Navbar from './Navbar';

export interface SidebarLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  links: SidebarLink[];
  title: string;
  children: ReactNode;
}

export default function DashboardLayout({ links, title, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-gray-200 p-4 hidden lg:block">
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
                      isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
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
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}