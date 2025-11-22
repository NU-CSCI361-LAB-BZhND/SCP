'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRBAC } from '@/context/RBACContext';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useRBAC();

  useEffect(() => {
    // If authenticated, go straight to dashboard
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login'); // otherwise, go to login
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
