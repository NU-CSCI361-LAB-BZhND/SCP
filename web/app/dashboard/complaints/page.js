'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import IfAllowed from '@/components/IfAllowed';

// Mock data
const initialComplaints = [
  { id: 1, orderId: 1, issue: 'Wrong item shipped', status: 'Open' },
  { id: 2, orderId: 2, issue: 'Damaged product', status: 'Open' },
];

export default function ComplaintsPage() {
  const { hasPageAccess } = useRBAC();
  const router = useRouter();
  const [complaints, setComplaints] = useState(initialComplaints);
  const [newComplaint, setNewComplaint] = useState({ orderId: '', issue: '' });

  useEffect(() => {
    if (!hasPageAccess('complaint')) router.replace('/unauthorized');
  }, [hasPageAccess, router]);

  const handleCreate = () => {
    const complaint = { ...newComplaint, id: complaints.length + 1, status: 'Open' };
    setComplaints([...complaints, complaint]);
    setNewComplaint({ orderId: '', issue: '' });
    // TODO: replace with API POST request
  };

  const handleResolve = (id) => {
    setComplaints(complaints.map(c => (c.id === id ? { ...c, status: 'Resolved' } : c)));
    // TODO: replace with API PATCH request
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>

      <IfAllowed page="complaint" action="handle">
        <div className="bg-white p-4 rounded shadow space-y-2">
          <h2 className="font-semibold text-lg">Log Complaint</h2>
          <input
            type="number"
            placeholder="Order ID"
            className="border p-2 rounded w-full"
            value={newComplaint.orderId}
            onChange={e => setNewComplaint({ ...newComplaint, orderId: e.target.value })}
          />
          <input
            type="text"
            placeholder="Issue"
            className="border p-2 rounded w-full"
            value={newComplaint.issue}
            onChange={e => setNewComplaint({ ...newComplaint, issue: e.target.value })}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleCreate}
          >
            Submit Complaint
          </button>
        </div>
      </IfAllowed>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg mb-2">Complaints List</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Order ID</th>
              <th className="border p-2">Issue</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c.id}>
                <td className="border p-2">{c.id}</td>
                <td className="border p-2">{c.orderId}</td>
                <td className="border p-2">{c.issue}</td>
                <td className="border p-2">{c.status}</td>
                <td className="border p-2">
                  <IfAllowed page="complaint" action="handle">
                    {c.status === 'Open' && (
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => handleResolve(c.id)}
                      >
                        Resolve
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
