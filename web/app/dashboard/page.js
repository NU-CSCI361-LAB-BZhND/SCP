'use client';
import { useState, useEffect } from 'react';
import { useRBAC } from '@/context/RBACContext';
import IfAllowed from '@/components/IfAllowed';
import { dataService } from '@/services/dataService';
import { useRouter } from 'next/navigation';

export default function AccountsPage() {
  const { hasPageAccess } = useRBAC();
  const router = useRouter();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state with fields required for a user account
  const [newAccount, setNewAccount] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'MANAGER'
  });

  useEffect(() => {
    // 1. Check permissions
    if (!hasPageAccess('accounts')) {
       // Optional: Redirect if this is the main dashboard page and they shouldn't see it
       // router.replace('/dashboard/orders'); 
       // For now, we just let IfAllowed handle the hiding, but fetching might fail if API is secured.
    }
    
    // 2. Fetch data
    fetchAccounts();
  }, [hasPageAccess]);

  const fetchAccounts = async () => {
    try {
      const data = await dataService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      // Don't show error if it's just 403 (permission denied) on load
      if (err.message.includes('403')) return;
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAccount.email || !newAccount.password || !newAccount.first_name) {
        alert("Please fill in all required fields");
        return;
    }

    try {
      const createdUser = await dataService.createAccount(newAccount);
      setAccounts([...accounts, createdUser]);
      // Reset form
      setNewAccount({ first_name: '', last_name: '', email: '', password: '', role: 'MANAGER' });
      setError('');
    } catch (err) {
      alert(err.message || 'Failed to create account');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        await dataService.deleteAccount(id);
        setAccounts(accounts.filter(a => a.id !== id));
    } catch (err) {
        alert(err.message || 'Failed to delete user');
    }
  };

  if (loading) return <div>Loading accounts...</div>;

  return (
    <IfAllowed page="accounts" action="createAccount">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Management</h1>
        {error && <div className="text-red-500">{error}</div>}

        {/* Create Account Form */}
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg">Add New Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              className="border p-2 rounded w-full"
              value={newAccount.first_name}
              onChange={e => setNewAccount({ ...newAccount, first_name: e.target.value })}
            />
             <input
              type="text"
              placeholder="Last Name"
              className="border p-2 rounded w-full"
              value={newAccount.last_name}
              onChange={e => setNewAccount({ ...newAccount, last_name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email (Login)"
              className="border p-2 rounded w-full"
              value={newAccount.email}
              onChange={e => setNewAccount({ ...newAccount, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              className="border p-2 rounded w-full"
              value={newAccount.password}
              onChange={e => setNewAccount({ ...newAccount, password: e.target.value })}
            />
            <select
              value={newAccount.role}
              className="border p-2 rounded w-full"
              onChange={e => setNewAccount({ ...newAccount, role: e.target.value })}
            >
              <option value="MANAGER">Manager</option>
              <option value="OWNER">Owner</option>
            </select>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleAdd}
          >
            Create Account
          </button>
        </div>

        {/* Accounts List */}
        <div className="bg-white rounded shadow p-4 overflow-x-auto">
          <h2 className="font-semibold text-lg mb-2">Staff List</h2>
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td className="border p-2">{a.id}</td>
                  <td className="border p-2">{a.first_name} {a.last_name}</td>
                  <td className="border p-2">{a.email}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${a.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {a.role}
                    </span>
                  </td>
                  <td className="border p-2">
                    <IfAllowed page="accounts" action="deleteAccount">
                        <button 
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            onClick={() => handleDelete(a.id)}
                        >
                            Delete
                        </button>
                    </IfAllowed>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">No accounts found.</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    </IfAllowed>
  );
}