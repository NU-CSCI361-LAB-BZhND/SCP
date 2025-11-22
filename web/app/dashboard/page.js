'use client';
import { useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import IfAllowed from '@/components/IfAllowed';

const initialAccounts = [
  { id: 1, name: 'Owner 1', role: 'OWNER' },
  { id: 2, name: 'Manager 1', role: 'MANAGER' },
];

export default function AccountsPage() {
  const { hasPageAccess } = useRBAC();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [newAccount, setNewAccount] = useState({ name: '', role: 'MANAGER' });

  const handleAdd = () => {
    setAccounts([...accounts, { ...newAccount, id: accounts.length + 1 }]);
    setNewAccount({ name: '', role: 'MANAGER' });
    // TODO: replace with API POST
  };

  return (
    <IfAllowed page="accounts" action="createAccount">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Management</h1>

        <div className="bg-white p-4 rounded shadow space-y-2">
          <h2 className="font-semibold text-lg">Add Account</h2>
          <input
            type="text"
            placeholder="Name"
            className="border p-2 rounded w-full"
            value={newAccount.name}
            onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
          />
          <select
            value={newAccount.role}
            className="border p-2 rounded w-full"
            onChange={e => setNewAccount({ ...newAccount, role: e.target.value })}
          >
            <option value="OWNER">OWNER</option>
            <option value="MANAGER">MANAGER</option>
          </select>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleAdd}
          >
            Add Account
          </button>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="font-semibold text-lg mb-2">Accounts List</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td className="border p-2">{a.id}</td>
                  <td className="border p-2">{a.name}</td>
                  <td className="border p-2">{a.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </IfAllowed>
  );
}
