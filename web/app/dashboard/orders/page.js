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
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!hasPageAccess('orders')) {
      // router.replace('/unauthorized'); 
    }
    fetchOrders();
  }, [hasPageAccess]);

  const fetchOrders = async () => {
    try {
      const data = await dataService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setProcessingId(id);
    try {
      await dataService.updateOrderStatus(id, newStatus);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => (o.id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      // Alert the specific error message from the backend
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Helper to safely extract product names from nested lists
  const renderProductNames = (order) => {
    const items = order.items || order.order_items || [];
    
    if (!items || items.length === 0) return <span className="text-gray-400 italic">No items</span>;

    const names = items.map(item => {
        if (typeof item.product === 'object' && item.product.name) return item.product.name;
        if (item.product_name) return item.product_name; 
        return item.product || 'Unknown Item';
    });

    return (
        <span className="font-medium text-gray-700">
            {names.join(', ')}
        </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <button 
            onClick={fetchOrders} 
            className="text-sm text-blue-600 hover:underline"
        >
            Refresh List
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof order.consumer === 'object' ? order.consumer.email : (order.consumer_email || order.consumer || 'Guest')}
                        <div className="text-xs text-gray-500">{order.delivery_address || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">
                        {renderProductNames(order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ${typeof order.total_amount === 'number' ? order.total_amount.toFixed(2) : order.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${order.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                        order.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* Only show actions if status is PENDING */}
                    {order.status === 'PENDING' && (
                        <>
                            <IfAllowed page="orders" action="accept">
                                <button
                                    onClick={() => handleStatusUpdate(order.id, 'ACCEPTED')}
                                    disabled={processingId === order.id}
                                    className={`text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded transition-colors
                                    ${processingId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Accept
                                </button>
                            </IfAllowed>
                            
                            <IfAllowed page="orders" action="reject">
                                <button
                                    onClick={() => handleStatusUpdate(order.id, 'REJECTED')}
                                    disabled={processingId === order.id}
                                    className={`text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors
                                    ${processingId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Reject
                                </button>
                            </IfAllowed>
                        </>
                    )}
                    {/* Optional: Show message if handled */}
                    {order.status !== 'PENDING' && (
                        <span className="text-gray-400 text-xs italic">Processed</span>
                    )}
                    </td>
                </tr>
                ))}
                
                {orders.length === 0 && (
                <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                        No orders found.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}