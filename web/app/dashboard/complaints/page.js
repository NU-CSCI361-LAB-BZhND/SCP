'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import IfAllowed from '@/components/IfAllowed';
import { dataService } from '@/services/dataService';

export default function ComplaintsPage() {
  const { hasPageAccess, user } = useRBAC();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the resolution modal
  const [selectedId, setSelectedId] = useState(null);
  const [actionType, setActionType] = useState('RESOLVE'); // 'RESOLVE' or 'DISMISS'
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

  const handleOpenModal = (id, type) => {
    setSelectedId(id);
    setActionType(type);
    setResolutionText('');
  };

  const handleSubmit = async () => {
    if (!resolutionText.trim()) return alert("Please write a note.");
    
    const status = actionType === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED';

    try {
      // Calls PATCH /api/support/complaints/{id}/
      await dataService.resolveComplaint(selectedId, { 
        resolution: resolutionText, // or 'resolution_note' depending on backend field name
        status: status 
      });
      
      await fetchComplaints();
      setSelectedId(null);
      setResolutionText('');
    } catch (err) {
      alert(`Failed to ${actionType.toLowerCase()} complaint: ` + err.message);
    }
  };

  const handleEscalate = async (id) => {
    if (!confirm('Are you sure you want to escalate this complaint?')) return;
    try {
        await dataService.escalateComplaint(id);
        await fetchComplaints();
        alert('Complaint escalated successfully');
    } catch (err) {
        alert('Failed to escalate complaint: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    let classes = 'px-2 py-1 rounded text-xs font-bold ';
    switch (status) {
      case 'OPEN': return <span className={classes + 'bg-red-100 text-red-800'}>Open</span>;
      case 'IN_PROGRESS': return <span className={classes + 'bg-yellow-100 text-yellow-800'}>In Progress</span>;
      case 'RESOLVED': return <span className={classes + 'bg-green-100 text-green-800'}>Resolved</span>;
      case 'DISMISSED': return <span className={classes + 'bg-gray-100 text-gray-800'}>Dismissed</span>;
      default: return <span className={classes + 'bg-gray-100 text-gray-800'}>{status}</span>;
    }
  };

  const getEscalationBadge = (level) => {
    let color = 'text-gray-600 bg-gray-50';
    if (level === 'MANAGER') color = 'text-purple-700 bg-purple-50';
    if (level === 'OWNER') color = 'text-red-700 bg-red-50';
    
    return (
      <span className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wide ${color}`}>
        {level?.replace('_', ' ')}
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading complaints...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Complaints Management</h1>
        <button onClick={fetchComplaints} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Escalation</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="border-b p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {complaints.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-600 font-mono text-sm">#{c.id}</td>
                <td className="p-3 text-sm text-gray-600 whitespace-nowrap">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="p-3 text-sm font-medium text-blue-600">
                  {c.order ? `#${c.order}` : '-'}
                </td>
                <td className="p-3 text-sm text-gray-900">
                  {c.created_by_email || 'Unknown'}
                </td>
                <td className="p-3 text-sm text-gray-900 max-w-xs">
                  <div className="font-semibold text-gray-800">{c.subject}</div>
                  <div className="text-gray-500 text-xs mt-0.5 line-clamp-2" title={c.description}>
                    {c.description}
                  </div>
                </td>
                <td className="p-3">
                  {getEscalationBadge(c.escalation_level)}
                </td>
                <td className="p-3">
                  {getStatusBadge(c.status)}
                </td>
                <td className="p-3">
                  <IfAllowed page="complaint" action="handle">
                    {(c.status === 'OPEN' || c.status === 'IN_PROGRESS') && (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition"
                            onClick={() => handleOpenModal(c.id, 'RESOLVE')}
                            >
                            Resolve
                            </button>
                            <button
                            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 transition"
                            onClick={() => handleOpenModal(c.id, 'DISMISS')}
                            >
                            Dismiss
                            </button>
                        </div>
                        {/* Show Escalate button if user is SALES_REP or MANAGER and not yet escalated to OWNER */}
                        {c.escalation_level !== 'OWNER' && (
                            <button
                                className="text-blue-600 text-xs hover:underline text-left pl-1"
                                onClick={() => handleEscalate(c.id)}
                            >
                                Escalate Issue
                            </button>
                        )}
                      </div>
                    )}
                  </IfAllowed>
                </td>
              </tr>
            ))}
            {complaints.length === 0 && (
              <tr><td colSpan="8" className="p-6 text-center text-gray-500">No complaints found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {selectedId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all">
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {actionType === 'RESOLVE' ? 'Resolve Complaint' : 'Dismiss Complaint'} #{selectedId}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Please provide a reason or note for this action.
                </p>
                
                <textarea 
                    className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 text-sm"
                    rows="4"
                    placeholder={actionType === 'RESOLVE' ? "e.g., Refund processed..." : "e.g., Invalid claim..."}
                    value={resolutionText}
                    onChange={e => setResolutionText(e.target.value)}
                />
                
                <div className="flex justify-end gap-3">
                    <button 
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium" 
                        onClick={() => { setSelectedId(null); setResolutionText(''); }}
                    >
                        Cancel
                    </button>
                    <button 
                        className={`px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm transition
                          ${actionType === 'RESOLVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`} 
                        onClick={handleSubmit}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}