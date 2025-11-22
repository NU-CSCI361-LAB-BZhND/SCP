'use client';
import { useEffect } from 'react';
import { useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import IfAllowed from '@/components/IfAllowed';

export default function DashboardLayout({ children }) {
  const { isAuthenticated, user } = useRBAC();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Supplier Dashboard</h1>
          <p className="text-gray-300 mt-1">{user?.role}</p>
        </div>

        <nav className="flex-1 flex flex-col p-4 space-y-2">
          <Link href="/dashboard" className="px-3 py-2 rounded hover:bg-gray-700 transition">
            Dashboard
          </Link>

          <IfAllowed page="orders" action="track">
            <Link href="/dashboard/orders" className="px-3 py-2 rounded hover:bg-gray-700 transition">
              Orders
            </Link>
          </IfAllowed>

          <IfAllowed page="catalog" action="createProduct">
            <Link href="/dashboard/catalog" className="px-3 py-2 rounded hover:bg-gray-700 transition">
              Catalog
            </Link>
          </IfAllowed>

          <IfAllowed page="complaint" action="handle">
            <Link href="/dashboard/complaints" className="px-3 py-2 rounded hover:bg-gray-700 transition">
              Complaints
            </Link>
          </IfAllowed>

          <IfAllowed page="accounts" action="createAccount">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded hover:bg-gray-700 transition text-red-400 font-semibold"
            >
              Accounts Management
            </Link>
          </IfAllowed>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-100 overflow-auto">{children}</main>
    </div>
  );
}
