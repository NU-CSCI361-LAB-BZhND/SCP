'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import IfAllowed from '@/components/IfAllowed';
import { dataService } from '@/services/dataService';

export default function CatalogPage() {
  const { hasPageAccess } = useRBAC();
  const router = useRouter();
  
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);

  const [productForm, setProductForm] = useState({ 
    name: '', description: '', price: '', unit: 'pcs', stock_level: '' 
  });

  useEffect(() => {
    if (!hasPageAccess('catalog')) return;
    fetchCatalog();
  }, [hasPageAccess]);

  const fetchCatalog = async () => {
    try {
      const data = await dataService.getProducts();
      setCatalog(data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      unit: product.unit,
      stock_level: product.stock_level
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setProductForm({ name: '', description: '', price: '', unit: 'pcs', stock_level: '' });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock_level: parseInt(productForm.stock_level),
        is_available: true
      };
      
      if (editingId) {
        // UC3: Update existing product
        const updated = await dataService.updateProduct(editingId, payload);
        setCatalog(catalog.map(p => p.id === editingId ? updated : p));
        handleCancelEdit();
      } else {
        // Create new product
        const created = await dataService.createProduct(payload);
        setCatalog([...catalog, created]);
        handleCancelEdit();
      }
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await dataService.deleteProduct(id);
      setCatalog(catalog.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Catalog</h1>
      {error && <div className="text-red-500">{error}</div>}

      <IfAllowed page="catalog" action="createProduct">
        <div className="bg-white p-6 rounded shadow space-y-4">
          <h2 className="font-semibold text-lg">
            {editingId ? 'Edit Product' : 'Add Product'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text" placeholder="Name" className="border p-2 rounded"
              value={productForm.name}
              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
            />
            <input
              type="text" placeholder="Description" className="border p-2 rounded"
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
            />
            <input
              type="number" placeholder="Price" className="border p-2 rounded"
              value={productForm.price}
              onChange={e => setProductForm({ ...productForm, price: e.target.value })}
            />
            <div className="flex gap-2">
                <input
                  type="number" placeholder="Stock" className="border p-2 rounded w-full"
                  value={productForm.stock_level}
                  onChange={e => setProductForm({ ...productForm, stock_level: e.target.value })}
                />
                <select 
                    className="border p-2 rounded"
                    value={productForm.unit}
                    onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
                className={`px-4 py-2 rounded text-white ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleSubmit}
            >
                {editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
                <button className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600" onClick={handleCancelEdit}>
                    Cancel
                </button>
            )}
          </div>
        </div>
      </IfAllowed>

      <div className="bg-white rounded shadow p-4 overflow-x-auto">
        <table className="w-full table-auto border-collapse text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map(p => (
              <tr key={p.id}>
                <td className="border p-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.description}</div>
                </td>
                <td className="border p-2">${p.price} / {p.unit}</td>
                <td className="border p-2">{p.stock_level}</td>
                <td className="border p-2 space-x-2">
                  <IfAllowed page="catalog" action="editProduct">
                    <button 
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                        onClick={() => handleEditClick(p)}
                    >
                        Edit
                    </button>
                  </IfAllowed>
                  <IfAllowed page="catalog" action="deleteProduct">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
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