'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import IfAllowed from '@/components/IfAllowed';
import { dataService } from '@/services/dataService';

export default function ComplaintsPage() {
  const { hasPageAccess } = useRBAC();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the resolution modal
  const [selectedId, setSelectedId] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  useEffect(() => {
    if (!hasPageAccess('complaint')) return;
    fetchComplaints();
  }, [hasPageAccess]);

  const fetchComplaints = async () => {
    try {
      const data = await dataService.getComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionText.trim()) return alert("Please write a resolution note.");
    
    try {
      await dataService.resolveComplaint(selectedId, resolutionText);
      // Refresh the list after successful resolution
      await fetchComplaints();
      // Close modal
      setSelectedId(null);
      setResolutionText('');
    } catch (err) {
      alert("Failed to resolve complaint: " + err.message);
    }
  };

  if (loading) return <div className="p-6">Loading complaints...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>

      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <h2 className="font-semibold text-lg mb-2">Complaints List</h2>
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Issue</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id}>
                <td className="border p-2 text-gray-600">#{c.id}</td>
                <td className="border p-2 text-sm">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="border p-2">
                  {/* Handle case where consumer is an object or just an ID */}
                  {typeof c.consumer === 'object' ? c.consumer.email : c.consumer || 'Unknown'}
                </td>
                <td className="border p-2">{c.description || c.issue}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    c.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="border p-2">
                  <IfAllowed page="complaint" action="handle">
                    {c.status !== 'RESOLVED' && (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        onClick={() => setSelectedId(c.id)}
                      >
                        Resolve
                      </button>
                    )}
                  </IfAllowed>
                </td>
              </tr>
            ))}
            {complaints.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resolution Modal */}
      {selectedId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Resolve Complaint #{selectedId}</h3>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Note:</label>
                <textarea 
                    className="w-full border border-gray-300 p-2 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
                    rows="4"
                    placeholder="Describe how the issue was resolved (e.g., 'Refunded order', 'Sent replacement')..."
                    value={resolutionText}
                    onChange={e => setResolutionText(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                    <button 
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded" 
                        onClick={() => { setSelectedId(null); setResolutionText(''); }}
                    >
                        Cancel
                    </button>
                    <button 
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium" 
                        onClick={handleResolve}
                    >
                        Confirm Resolution
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}