'use client';
import { useRBAC } from '@/context/RBACContext';

export default function IfAllowed({ page, action, children }) {
  const { canPerformAction } = useRBAC();

  if (!canPerformAction(page, action)) return null;
  return <>{children}</>;
}