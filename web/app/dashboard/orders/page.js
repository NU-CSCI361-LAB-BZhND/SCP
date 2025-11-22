'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import IfAllowed from '@/components/IfAllowed';

// Mock data
const initialOrders = [
  { id: 1, product: 'Widget A', status: 'Pending', customer: 'John Doe' },
  { id: 2, product: 'Widget B', status: 'Accepted', customer: 'Jane Smith' },
];

export default function OrdersPage() {
  const { hasPageAccess } = useRBAC();
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    if (!hasPageAccess('orders')) router.replace('/unauthorized');
  }, [hasPageAccess, router]);

  const handleChangeStatus = (id, status) => {
    setOrders(orders.map(o => (o.id === id ? { ...o, status } : o)));
    // TODO: replace with API PATCH request
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Orders</h1>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg mb-2">Orders List</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Product</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="border p-2">{order.id}</td>
                <td className="border p-2">{order.product}</td>
                <td className="border p-2">{order.customer}</td>
                <td className="border p-2">{order.status}</td>
                <td className="border p-2 space-x-2">
                  <IfAllowed page="orders" action="accept">
                    {order.status === 'Pending' && (
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => handleChangeStatus(order.id, 'Accepted')}
                      >
                        Accept
                      </button>
                    )}
                  </IfAllowed>
                  <IfAllowed page="orders" action="reject">
                    {order.status === 'Pending' && (
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        onClick={() => handleChangeStatus(order.id, 'Rejected')}
                      >
                        Reject
                      </button>
                    )}
                  </IfAllowed>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
