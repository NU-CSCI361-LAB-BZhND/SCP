'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import IfAllowed from '@/components/IfAllowed';
import { dataService } from '@/services/dataService';

export default function OrdersPage() {
  const { hasPageAccess } = useRBAC();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasPageAccess('orders')) {
      router.replace('/unauthorized');
      return;
    }
    fetchOrders();
  }, [hasPageAccess, router]);

  const fetchOrders = async () => {
    try {
      const data = await dataService.getOrders();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id, status) => {
    try {
      // status should probably be UPPERCASE based on your roles, e.g., "ACCEPTED"
      // but check your Django model choices. I'll use title case for display.
      await dataService.updateOrderStatus(id, status);
      
      // Optimistic update or re-fetch
      setOrders(orders.map(o => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
      {error && <div className="text-red-500">{error}</div>}

      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <h2 className="font-semibold text-lg mb-2">Orders List</h2>
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Customer (ID)</th>
              <th className="border p-2">Total Amount</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="border p-2">{order.id}</td>
                <td className="border p-2">{formatDate(order.created_at)}</td>
                <td className="border p-2">
                    {/* If backend sends full consumer object, use order.consumer.email, else ID */}
                    {typeof order.consumer === 'object' ? order.consumer.email : order.consumer_id || order.consumer}
                </td>
                <td className="border p-2 font-mono font-bold">${order.total_amount}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${order.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                      order.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="border p-2 space-x-2">
                  <IfAllowed page="orders" action="accept">
                    {order.status === 'PENDING' && (
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                        onClick={() => handleChangeStatus(order.id, 'ACCEPTED')}
                      >
                        Accept
                      </button>
                    )}
                  </IfAllowed>
                  <IfAllowed page="orders" action="reject">
                    {order.status === 'PENDING' && (
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                        onClick={() => handleChangeStatus(order.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    )}
                  </IfAllowed>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
                <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No orders found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}