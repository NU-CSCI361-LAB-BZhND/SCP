'use client';
import { useEffect, useState } from 'react';
import { useRBAC } from '@/context/RBACContext';
import { useRouter } from 'next/navigation';
import IfAllowed from '@/components/IfAllowed';

const initialCatalog = [
  { id: 1, name: 'Widget A', price: 100, stock: 10 },
  { id: 2, name: 'Widget B', price: 150, stock: 5 },
];

export default function CatalogPage() {
  const { hasPageAccess } = useRBAC();
  const router = useRouter();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });

  useEffect(() => {
    if (!hasPageAccess('catalog')) router.replace('/unauthorized');
  }, [hasPageAccess, router]);

  const handleAddProduct = () => {
    const product = { ...newProduct, id: catalog.length + 1 };
    setCatalog([...catalog, product]);
    setNewProduct({ name: '', price: '', stock: '' });
    // TODO: replace with API POST
  };

  const handleDelete = (id) => {
    setCatalog(catalog.filter(p => p.id !== id));
    // TODO: replace with API DELETE
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Catalog</h1>

      <IfAllowed page="catalog" action="createProduct">
        <div className="bg-white p-4 rounded shadow space-y-2">
          <h2 className="font-semibold text-lg">Add Product</h2>
          <input
            type="text"
            placeholder="Name"
            className="border p-2 rounded w-full"
            value={newProduct.name}
            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            className="border p-2 rounded w-full"
            value={newProduct.price}
            onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Stock"
            className="border p-2 rounded w-full"
            value={newProduct.stock}
            onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleAddProduct}
          >
            Add Product
          </button>
        </div>
      </IfAllowed>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold text-lg mb-2">Catalog List</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map(p => (
              <tr key={p.id}>
                <td className="border p-2">{p.id}</td>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2">{p.price}</td>
                <td className="border p-2">{p.stock}</td>
                <td className="border p-2">
                  <IfAllowed page="catalog" action="deleteProduct">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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
