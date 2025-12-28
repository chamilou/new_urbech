// 'use client';
// import { useState, useEffect } from 'react';
// import Image from 'next/image';
// import styles from './page.module.css';
// import ProductForm from '../components/ProductForm';

// const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api';

// export default function AdminProducts() {
//   const [products, setProducts] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [showCsvImport, setShowCsvImport] = useState(false);
//   const [csvFile, setCsvFile] = useState(null);
//   const [importLoading, setImportLoading] = useState(false);
//   const [importProgress, setImportProgress] = useState(0);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [sortField, setSortField] = useState('name');
//   const [sortDirection, setSortDirection] = useState('asc');

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       setError('');
//       const res = await fetch(`${API_BASE}/products?limit=1000`, { 
//         cache: 'no-store' 
//       });
      
//       if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      
//       const data = await res.json();
      
//       // Handle both response formats
//       if (data.products && Array.isArray(data.products)) {
//         setProducts(data.products);
//       } else if (Array.isArray(data)) {
//         setProducts(data);
//       } else {
//         throw new Error('Unexpected response format from API');
//       }
//     } catch (e) {
//       console.error('Error fetching products:', e);
//       setProducts([]);
//       setError(e.message || 'Failed to fetch products');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter and sort products
//   const filteredProducts = products
//     .filter(product => 
//       product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       product.slug?.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//     .sort((a, b) => {
//       let aVal = a[sortField] || '';
//       let bVal = b[sortField] || '';
      
//       // Handle numeric sorting for price and stock
//       if (sortField === 'price' || sortField === 'stock') {
//         aVal = parseFloat(aVal) || 0;
//         bVal = parseFloat(bVal) || 0;
//       }
      
//       if (sortDirection === 'asc') {
//         return aVal > bVal ? 1 : -1;
//       } else {
//         return aVal < bVal ? 1 : -1;
//       }
//     });

//   const handleSort = (field) => {
//     if (sortField === field) {
//       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
//     } else {
//       setSortField(field);
//       setSortDirection('asc');
//     }
//   };

//   const handleDelete = async (productId) => {
//     if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
//     try {
//       const res = await fetch(`${API_BASE}/products/${productId}`, { 
//         method: 'DELETE' 
//       });
      
//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) throw new Error(data?.detail || 'Failed to delete product');
      
//       fetchProducts();
//     } catch (e) {
//       alert(e.message || 'Error deleting product');
//     }
//   };

//   const handleQuickStockUpdate = async (productId, newStock) => {
//     try {
//       const stockValue = parseInt(newStock);
//       if (isNaN(stockValue) || stockValue < 0) return;
      
//       // Prepare the update data according to your ProductUpdate schema
//       const updateData = {
//         stock: stockValue
//       };
      
//       console.log('Updating product:', productId, 'with data:', updateData);
      
//       const res = await fetch(`${API_BASE}/products/${productId}`, {
//         method: 'PUT',
//         headers: { 
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(updateData)
//       });
      
//       const data = await res.json().catch(() => ({}));
      
//       if (!res.ok) {
//         console.error('Update failed:', data);
//         throw new Error(data?.detail || `Failed to update stock: ${res.status}`);
//       }
      
//       console.log('Update successful:', data);
      
//       // Update local state immediately for better UX
//       setProducts(prev => prev.map(p => 
//         p.id === productId ? { ...p, stock: stockValue } : p
//       ));
//     } catch (e) {
//       console.error('Stock update error:', e);
//       alert(e.message || 'Error updating stock');
//       // Revert on error
//       fetchProducts();
//     }
//   };

//   const handleCsvUpload = (event) => {
//     const file = event.target.files?.[0];
//     if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
//       setCsvFile(file);
//     } else {
//       alert('Please select a valid CSV file');
//     }
//   };

//   const handleCsvImport = async () => {
//     if (!csvFile) {
//       alert('Please select a CSV file first');
//       return;
//     }
//     setImportLoading(true);
//     setImportProgress(0);
//     try {
//       const formData = new FormData();
//       formData.append('csv_file', csvFile);

//       const res = await fetch(`${API_BASE}/products/import`, {
//         method: 'POST',
//         body: formData,
//       });

//       setImportProgress(50);

//       const result = await res.json().catch(() => ({}));
//       if (!res.ok) throw new Error(result?.detail || 'Import failed');

//       setImportProgress(100);
//       setTimeout(() => {
//         const message = `Successfully imported ${result.imported}/${result.total} products`;
//         const errorsMessage = result.errors ? `\n\nErrors:\n${result.errors.join('\n')}` : '';
//         alert(message + errorsMessage);
//         setShowCsvImport(false);
//         setCsvFile(null);
//         fetchProducts();
//       }, 500);
//     } catch (e) {
//       console.error('Error importing CSV:', e);
//       alert(e.message || 'Error importing products. Please check your CSV format.');
//     } finally {
//       setImportLoading(false);
//       setImportProgress(0);
//     }
//   };

//   const downloadCsvTemplate = () => {
//     const template = `name,slug,description,price,currencyCode,stock,categorySlugs,mainImageUrl,images
// "Premium Coffee Beans","premium-coffee-beans","Freshly roasted arabica coffee beans","12.99","USD",50,"beverages,coffee","https://example.com/coffee.jpg","https://example.com/coffee-1.jpg,https://example.com/coffee-2.jpg"
// "Organic Green Tea","organic-green-tea","High-quality organic green tea leaves","8.50","USD",25,"beverages,tea","https://example.com/tea.jpg",""
// "Artisanal Honey","artisanal-honey","Raw unfiltered honey from local bees","15.75","USD",30,"spreads,sweeteners","https://example.com/honey.jpg","https://example.com/honey-1.jpg"`;
    
//     const blob = new Blob([template], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'products_template.csv';
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   const getStockStatus = (product) => {
//     if (product.stock === 0) return 'outOfStock';
//     if (product.stock < (product.minStock || 5)) return 'lowStock';
//     return 'inStock';
//   };

//   const getStatusText = (product) => {
//     if (product.stock === 0) return 'Out of Stock';
//     if (product.stock < (product.minStock || 5)) return 'Low Stock';
//     return 'In Stock';
//   };

//   return (
//     <div className={styles.container}>
//       {/* Header with Stats */}
//       <div className={styles.header}>
//         <div className={styles.headerMain}>
//           <div className={styles.headerTitle}>
//             <h1>Product Management</h1>
//             <p>Manage your product inventory and listings</p>
//           </div>
//           <div className={styles.stats}>
//             <div className={styles.stat}>
//               <span className={styles.statNumber}>{products.length}</span>
//               <span className={styles.statLabel}>Total Products</span>
//             </div>
//             <div className={styles.stat}>
//               <span className={`${styles.statNumber} ${styles.statWarning}`}>
//                 {products.filter(p => p.stock < (p.minStock || 5) && p.stock > 0).length}
//               </span>
//               <span className={styles.statLabel}>Low Stock</span>
//             </div>
//             <div className={styles.stat}>
//               <span className={`${styles.statNumber} ${styles.statDanger}`}>
//                 {products.filter(p => p.stock === 0).length}
//               </span>
//               <span className={styles.statLabel}>Out of Stock</span>
//             </div>
//           </div>
//         </div>
        
//         <div className={styles.headerActions}>
//           <div className={styles.searchBox}>
//             <input
//               type="text"
//               placeholder="Search products by name, description, or slug..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className={styles.searchInput}
//             />
//             {searchTerm && (
//               <button 
//                 className={styles.clearSearch}
//                 onClick={() => setSearchTerm('')}
//                 title="Clear search"
//               >
//                 ×
//               </button>
//             )}
//           </div>
//           <div className={styles.actionButtons}>
//             <button 
//               className={`${styles.btn} ${styles.btnSecondary}`} 
//               onClick={() => setShowCsvImport(true)}
//               disabled={importLoading}
//             >
//               📥 Import CSV
//             </button>
//             <button 
//               className={`${styles.btn} ${styles.btnPrimary}`}
//               onClick={() => {
//                 setEditingProduct(null);
//                 setShowForm(true);
//               }}
//             >
//               ➕ Add Product
//             </button>
//           </div>
//         </div>
//       </div>

//       {error && (
//         <div className={styles.error}>
//           <strong>Error:</strong> {error}
//           <button onClick={fetchProducts} className={styles.retryBtn}>
//             Try Again
//           </button>
//         </div>
//       )}

//       {/* Loading State */}
//       {loading && (
//         <div className={styles.loading}>
//           <div className={styles.spinner}></div>
//           <p>Loading products...</p>
//         </div>
//       )}

//       {/* Products Table */}
//       {!loading && (
//         <div className={styles.tableSection}>
//           <div className={styles.tableHeader}>
//             <div className={styles.tableInfo}>
//               Showing {filteredProducts.length} of {products.length} products
//               {searchTerm && ` matching "${searchTerm}"`}
//             </div>
//             <div className={styles.tableControls}>
//               <button 
//                 className={styles.refreshBtn}
//                 onClick={fetchProducts}
//                 title="Refresh products"
//               >
//                 🔄 Refresh
//               </button>
//             </div>
//           </div>

//           <div className={styles.tableContainer}>
//             <table className={styles.productsTable}>
//               <thead>
//                 <tr>
//                   <th className={`${styles.imageCol} ${styles.sortable}`}>Image</th>
//                   <th 
//                     className={`${styles.nameCol} ${styles.sortable}`}
//                     onClick={() => handleSort('name')}
//                   >
//                     Product Name 
//                     {sortField === 'name' && (
//                       <span className={styles.sortIndicator}>
//                         {sortDirection === 'asc' ? '↑' : '↓'}
//                       </span>
//                     )}
//                   </th>
//                   <th 
//                     className={`${styles.priceCol} ${styles.sortable}`}
//                     onClick={() => handleSort('price')}
//                   >
//                     Price 
//                     {sortField === 'price' && (
//                       <span className={styles.sortIndicator}>
//                         {sortDirection === 'asc' ? '↑' : '↓'}
//                       </span>
//                     )}
//                   </th>
//                   <th 
//                     className={`${styles.stockCol} ${styles.sortable}`}
//                     onClick={() => handleSort('stock')}
//                   >
//                     Stock 
//                     {sortField === 'stock' && (
//                       <span className={styles.sortIndicator}>
//                         {sortDirection === 'asc' ? '↑' : '↓'}
//                       </span>
//                     )}
//                   </th>
//                   <th className={styles.statusCol}>Status</th>
//                   <th className={styles.actionsCol}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredProducts.map((product) => (
//                   <tr key={product.id} className={styles.productRow}>
//                     <td className={styles.imageCell}>
//                       <div className={styles.productImage}>
//                         <Image
//                           src={product.mainImageUrl || '/placeholder-image.jpg'}
//                           alt={product.name}
//                           width={48}
//                           height={48}
//                           className={styles.image}
//                           onError={(e) => {
//                             e.target.src = '/placeholder-image.jpg';
//                           }}
//                         />
//                       </div>
//                     </td>
//                     <td className={styles.nameCell}>
//                       <div className={styles.productInfo}>
//                         <div className={styles.productName}>{product.name || 'Unnamed Product'}</div>
//                         <div className={styles.productMeta}>
//                           <span className={styles.productSlug}>/{product.slug}</span>
//                           {product.description && (
//                             <div className={styles.productDescription}>
//                               {product.description.length > 80 
//                                 ? `${product.description.substring(0, 80)}...` 
//                                 : product.description
//                               }
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </td>
//                     <td className={styles.priceCell}>
//                       <div className={styles.price}>
//                         {product.currencyCode || 'USD'} {product.price || '0.00'}
//                       </div>
//                     </td>
//                     <td className={styles.stockCell}>
//                       <div className={styles.stockControl}>
//                         <input
//                           type="number"
//                           value={product.stock || 0}
//                           onChange={(e) => handleQuickStockUpdate(product.id, e.target.value)}
//                           className={styles.stockInput}
//                           min="0"
//                         />
//                         <span className={styles.stockLabel}>units</span>
//                       </div>
//                     </td>
//                     <td className={styles.statusCell}>
//                       <div className={`${styles.status} ${styles[getStockStatus(product)]}`}>
//                         {getStatusText(product)}
//                       </div>
//                     </td>
//                     <td className={styles.actionsCell}>
//                       <div className={styles.actionButtons}>
//                         <button 
//                           className={`${styles.btn} ${styles.btnSmall} ${styles.btnWarning}`}
//                           onClick={() => {
//                             setEditingProduct(product);
//                             setShowForm(true);
//                           }}
//                           title="Edit product"
//                         >
//                           Edit
//                         </button>
//                         <button 
//                           className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
//                           onClick={() => handleDelete(product.id)}
//                           title="Delete product"
//                         >
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
            
//             {filteredProducts.length === 0 && (
//               <div className={styles.emptyState}>
//                 {searchTerm ? (
//                   <>
//                     <h3>No products found</h3>
//                     <p>No products match your search for "{searchTerm}"</p>
//                     <button 
//                       className={styles.clearSearchBtn}
//                       onClick={() => setSearchTerm('')}
//                     >
//                       Clear Search
//                     </button>
//                   </>
//                 ) : (
//                   <>
//                     <h3>No products yet</h3>
//                     <p>Get started by adding your first product or importing from CSV</p>
//                     <div className={styles.emptyStateActions}>
//                       <button 
//                         className={`${styles.btn} ${styles.btnPrimary}`}
//                         onClick={() => setShowForm(true)}
//                       >
//                         ➕ Add First Product
//                       </button>
//                       <button 
//                         className={`${styles.btn} ${styles.btnSecondary}`}
//                         onClick={() => setShowCsvImport(true)}
//                       >
//                         📥 Import CSV
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* CSV Import Modal */}
//       {showCsvImport && (
//         <div className={styles.modalOverlay}>
//           <div className={styles.modal}>
//             <div className={styles.modalHeader}>
//               <h2>Import Products from CSV</h2>
//               <button
//                 className={styles.closeButton}
//                 onClick={() => {
//                   setShowCsvImport(false);
//                   setCsvFile(null);
//                   setImportProgress(0);
//                 }}
//                 disabled={importLoading}
//               >
//                 ×
//               </button>
//             </div>

//             <div className={styles.modalContent}>
//               <div className={styles.csvInstructions}>
//                 <h3>CSV Format Requirements:</h3>
//                 <ul>
//                   <li><strong>Required columns:</strong> name</li>
//                   <li><strong>Optional columns:</strong> slug, description, price, currencyCode, stock, categorySlugs, mainImageUrl, images</li>
//                   <li><strong>categorySlugs:</strong> comma-separated slugs (e.g. "beverages,coffee")</li>
//                   <li><strong>images:</strong> comma-separated URLs for additional images</li>
//                   <li>First row must be the header row</li>
//                 </ul>

//                 <button 
//                   className={styles.templateButton} 
//                   onClick={downloadCsvTemplate}
//                   disabled={importLoading}
//                 >
//                   📋 Download CSV Template
//                 </button>
//               </div>

//               <div className={styles.fileUpload}>
//                 <label className={styles.fileInputLabel}>
//                   📁 Choose CSV File
//                   <input
//                     type="file"
//                     accept=".csv,text/csv"
//                     onChange={handleCsvUpload}
//                     className={styles.fileInput}
//                     disabled={importLoading}
//                   />
//                 </label>
//                 {csvFile && (
//                   <div className={styles.fileInfo}>
//                     ✅ Selected: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024).toFixed(1)} KB)
//                   </div>
//                 )}
//               </div>

//               {importLoading && (
//                 <div className={styles.progressContainer}>
//                   <div className={styles.progressBar}>
//                     <div 
//                       className={styles.progressFill} 
//                       style={{ width: `${importProgress}%` }} 
//                     />
//                   </div>
//                   <span className={styles.progressText}>
//                     Importing... {importProgress}%
//                     {importProgress >= 100 && ' - Processing...'}
//                   </span>
//                 </div>
//               )}
//             </div>

//             <div className={styles.modalActions}>
//               <button
//                 className={`${styles.btn} ${styles.btnSecondary}`}
//                 onClick={() => {
//                   setShowCsvImport(false);
//                   setCsvFile(null);
//                 }}
//                 disabled={importLoading}
//               >
//                 Cancel
//               </button>
//               <button
//                 className={`${styles.btn} ${styles.btnPrimary}`}
//                 onClick={handleCsvImport}
//                 disabled={!csvFile || importLoading}
//               >
//                 {importLoading ? '🔄 Importing...' : '🚀 Import Products'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Product Form Modal */}
//       {showForm && (
//         <ProductForm
//           product={editingProduct}
//           onClose={() => {
//             setShowForm(false);
//             setEditingProduct(null);
//           }}
//           onSave={() => {
//             setShowForm(false);
//             setEditingProduct(null);
//             fetchProducts();
//           }}
//         />
//       )}
//     </div>
//   );
// }

'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import ProductForm from '../components/ProductForm';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingProduct, setUpdatingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  
  const itemsPerPage = 50;

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const skip = (page - 1) * itemsPerPage;
      const res = await fetch(
        `${API_BASE}/products?limit=${itemsPerPage}&skip=${skip}`,
        { cache: 'no-store' }
      );
      
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      
      const data = await res.json();
      
      // Handle both response formats
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalPages(Math.ceil((data.total_count || data.products.length) / itemsPerPage));
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(Math.ceil(data.length / itemsPerPage));
      } else {
        throw new Error('Unexpected response format from API');
      }
    } catch (e) {
      console.error('Error fetching products:', e);
      setProducts([]);
      setError(e.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.slug?.toLowerCase().includes(term) ||
        product.categorySlugs?.some(slug => slug.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle numeric sorting for price and stock
      if (sortField === 'price' || sortField === 'stock') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    setDeletingProduct(productId);
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || 'Failed to delete product');
      
      // Remove from local state immediately
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (e) {
      alert(e.message || 'Error deleting product');
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleQuickStockUpdate = async (productId, newStock) => {
    try {
      const stockValue = parseInt(newStock);
      if (isNaN(stockValue) || stockValue < 0) {
        // Revert to original value
        fetchProducts(currentPage);
        return;
      }
      
      setUpdatingProduct(productId);
      
      // Debounce rapid updates
      clearTimeout(window.stockUpdateTimeout);
      window.stockUpdateTimeout = setTimeout(async () => {
        try {
          const updateData = {
            stock: stockValue
          };
          
          const res = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });
          
          const data = await res.json().catch(() => ({}));
          
          if (!res.ok) {
            throw new Error(data?.detail || `Failed to update stock: ${res.status}`);
          }
          
          // Update local state immediately for better UX
          setProducts(prev => prev.map(p => 
            p.id === productId ? { ...p, stock: stockValue } : p
          ));
        } catch (e) {
          console.error('Stock update error:', e);
          alert(e.message || 'Error updating stock');
          fetchProducts(currentPage);
        } finally {
          setUpdatingProduct(null);
        }
      }, 500);
    } catch (e) {
      console.error('Stock update error:', e);
      setUpdatingProduct(null);
    }
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError('No file selected');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      event.target.value = ''; // Clear file input
      return;
    }
    
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvFile(file);
      setError('');
    } else {
      setError('Please select a valid CSV file');
      event.target.value = ''; // Clear file input
    }
  };
const handleCsvImport = async () => {
  if (!csvFile) {
    setError('Please select a CSV file first');
    return;
  }
  
  if (!confirm(
    `Import products from ${csvFile.name}?\n` +
    `This will create new products and update existing ones based on slugs.`
  )) return;
  
  setImportLoading(true);
  setImportProgress(0);
  setError('');
  
  try {
    const formData = new FormData();
    formData.append('csv_file', csvFile);

    // First, get existing categories to validate slugs
    setImportProgress(10);
    let existingCategories = [];
    try {
      const categoriesRes = await fetch(`${API_BASE}/categories?limit=1000`);
      if (categoriesRes.ok) {
        existingCategories = await categoriesRes.json();
      }
    } catch (e) {
      console.warn('Could not fetch categories for validation:', e);
    }

    // Create a map of slug to ID for validation
    const slugToIdMap = {};
    existingCategories.forEach(cat => {
      if (cat.slug) {
        slugToIdMap[cat.slug.toLowerCase()] = cat.id;
      }
    });

    setImportProgress(20);

    const res = await fetch(`${API_BASE}/products/import`, {
      method: 'POST',
      body: formData,
    });

    setImportProgress(90);

    const result = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      // Check if error is about unknown category slugs
      if (result.detail?.includes('categorySlugs') || result.errors?.some(e => e.includes('categorySlugs'))) {
        const missingSlugs = [];
        result.errors?.forEach(error => {
          const match = error.match(/categorySlugs:\s*([^,)]+)/);
          if (match) {
            missingSlugs.push(match[1].trim());
          }
        });
        
        const uniqueSlugs = [...new Set(missingSlugs)];
        
        if (uniqueSlugs.length > 0) {
          throw new Error(
            `Unknown category slugs: ${uniqueSlugs.join(', ')}\n\n` +
            `Please create these categories first or remove them from the CSV.\n` +
            `Existing categories: ${existingCategories.slice(0, 10).map(c => c.slug).join(', ')}${existingCategories.length > 10 ? '...' : ''}`
          );
        }
      }
      throw new Error(result?.detail || `Import failed: ${res.status}`);
    }

    setImportProgress(100);
    
    // Show success message
    const successMessage = `Successfully imported ${result.imported || 0}/${result.total || 0} products`;
    const errorsMessage = result.errors?.length > 0 
      ? `\n\n${result.errors.length} error(s):\n${result.errors.slice(0, 5).join('\n')}${result.errors.length > 5 ? '\n... and more' : ''}`
      : '';
    
    setTimeout(() => {
      alert(successMessage + errorsMessage);
      setShowCsvImport(false);
      setCsvFile(null);
      fetchProducts(currentPage);
    }, 500);
  } catch (e) {
    console.error('Error importing CSV:', e);
    setError(e.message || 'Error importing products. Please check your CSV format.');
  } finally {
    setImportLoading(false);
    setImportProgress(0);
  }
};



 const downloadCsvTemplate = async () => {
  // Fetch existing categories first
  let existingCategories = [];
  try {
    const res = await fetch(`${API_BASE}/categories?limit=50`);
    if (res.ok) {
      existingCategories = await res.json();
    }
  } catch (error) {
    console.warn('Could not fetch categories:', error);
  }

  // Get first 5 category slugs as example
  const exampleSlugs = existingCategories
    .slice(0, 5)
    .map(cat => cat.slug)
    .filter(Boolean)
    .join(', ');

  const template = `name,slug,description,price,currencyCode,stock,categorySlugs,mainImageUrl,images,minStock,featured,tags
"Premium Coffee Beans","premium-coffee-beans","Freshly roasted arabica coffee beans",12.99,USD,50,"${exampleSlugs || 'example-category-1,example-category-2'}",https://example.com/coffee.jpg,"https://example.com/coffee-1.jpg,https://example.com/coffee-2.jpg",10,true,"coffee,arabica,organic"
"Organic Green Tea","organic-green-tea","High-quality organic green tea leaves",8.50,USD,25,"${exampleSlugs || 'example-category-1'}",https://example.com/tea.jpg,,5,true,"tea,green,organic"
"Artisanal Honey","artisanal-honey","Raw, unfiltered honey from local bees",15.75,USD,30,"",https://example.com/honey.jpg,,8,false,"honey,raw,local"

# IMPORTANT:
# 1. Required column: name
# 2. categorySlugs: comma-separated slugs from existing categories
# 3. Leave categorySlugs empty if no category needed
# 4. Available categories (first 20): ${existingCategories.slice(0, 20).map(c => c.slug).join(', ')}${existingCategories.length > 20 ? '...' : ''}
# 5. Create categories first in the admin panel if needed`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products_import_template.csv';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
  const getStockStatus = (product) => {
    const stock = product.stock || 0;
    const minStock = product.minStock || 5;
    
    if (stock === 0) return 'outOfStock';
    if (stock < minStock) return 'lowStock';
    return 'inStock';
  };

  const getStatusText = (product) => {
    const stock = product.stock || 0;
    const minStock = product.minStock || 5;
    
    if (stock === 0) return 'Out of Stock';
    if (stock < minStock) return `Low Stock (${stock}/${minStock})`;
    return 'In Stock';
  };

  const getFeaturedBadge = (product) => {
    return product.featured ? (
      <span className={styles.featuredBadge} title="Featured Product">★</span>
    ) : null;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    // First page
    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className={styles.pageButton}
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="start-ellipsis" className={styles.ellipsis}>...</span>);
      }
    }
    
    // Middle pages
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageButton} ${
            currentPage === i ? styles.activePage : ''
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className={styles.ellipsis}>...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={styles.pageButton}
        >
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  return (
    <div className={styles.container}>
      {/* Header with Stats */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <h1>Product Management</h1>
            <p>Manage your product inventory and listings</p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{products.length}</span>
              <span className={styles.statLabel}>Total Products</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statWarning}`}>
                {products.filter(p => (p.stock || 0) < (p.minStock || 5) && (p.stock || 0) > 0).length}
              </span>
              <span className={styles.statLabel}>Low Stock</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statDanger}`}>
                {products.filter(p => (p.stock || 0) === 0).length}
              </span>
              <span className={styles.statLabel}>Out of Stock</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statSuccess}`}>
                {products.filter(p => p.featured).length}
              </span>
              <span className={styles.statLabel}>Featured</span>
            </div>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search products by name, description, slug, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchTerm('')}
                title="Clear search"
                type="button"
              >
                ×
              </button>
            )}
          </div>
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`} 
              onClick={() => setShowCsvImport(true)}
              disabled={importLoading}
              type="button"
            >
              📥 Import CSV
            </button>
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              type="button"
            >
              ➕ Add Product
            </button>
          </div>
        </div>
      </div>

      {error && !showCsvImport && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
          <button onClick={() => fetchProducts(currentPage)} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading products...</p>
        </div>
      )}

      {/* Products Table */}
      {!loading && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>
              Showing {filteredProducts.length} of {products.length} products
              {searchTerm && ` matching "${searchTerm}"`}
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            <div className={styles.tableControls}>
              <button 
                className={styles.refreshBtn}
                onClick={() => fetchProducts(currentPage)}
                title="Refresh products"
                type="button"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.productsTable}>
              <thead>
                <tr>
                  <th className={`${styles.imageCol} ${styles.sortable}`}>Image</th>
                  <th 
                    className={`${styles.nameCol} ${styles.sortable}`}
                    onClick={() => handleSort('name')}
                  >
                    Product Name 
                    {sortField === 'name' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`${styles.priceCol} ${styles.sortable}`}
                    onClick={() => handleSort('price')}
                  >
                    Price 
                    {sortField === 'price' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`${styles.stockCol} ${styles.sortable}`}
                    onClick={() => handleSort('stock')}
                  >
                    Stock 
                    {sortField === 'stock' && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className={styles.statusCol}>Status</th>
                  <th className={styles.actionsCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={styles.productRow}>
                    <td className={styles.imageCell}>
                      <div className={styles.productImage}>
                        {product.mainImageUrl ? (
                          <Image
                            src={product.mainImageUrl}
                            alt={product.name || 'Product image'}
                            width={60}
                            height={60}
                            className={styles.image}
                            unoptimized={true}
                            onError={(e) => {
                              e.target.src = '/placeholder-image.jpg';
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <div className={styles.placeholderImage}>📦</div>
                        )}
                      </div>
                    </td>
                    <td className={styles.nameCell}>
                      <div className={styles.productInfo}>
                        <div className={styles.productName}>
                          {getFeaturedBadge(product)}
                          {product.name || 'Unnamed Product'}
                          {product.categorySlugs?.length > 0 && (
                            <div className={styles.categoryTags}>
                              {product.categorySlugs.slice(0, 2).map((slug, idx) => (
                                <span key={idx} className={styles.categoryTag}>
                                  {slug}
                                </span>
                              ))}
                              {product.categorySlugs.length > 2 && (
                                <span className={styles.moreTags}>+{product.categorySlugs.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.productMeta}>
                          <span className={styles.productSlug}>/{product.slug || 'no-slug'}</span>
                          {product.description && (
                            <div className={styles.productDescription}>
                              {product.description.length > 60 
                                ? `${product.description.substring(0, 60)}...` 
                                : product.description
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.priceCell}>
                      <div className={styles.price}>
                        <span className={styles.currency}>{product.currencyCode || 'USD'}</span>
                        <span className={styles.amount}>{parseFloat(product.price || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className={styles.stockCell}>
                      <div className={styles.stockControl}>
                        <input
                          type="number"
                          value={product.stock || 0}
                          onChange={(e) => handleQuickStockUpdate(product.id, e.target.value)}
                          className={styles.stockInput}
                          min="0"
                          disabled={updatingProduct === product.id}
                        />
                        <span className={styles.stockLabel}>
                          {updatingProduct === product.id ? 'Updating...' : 'units'}
                        </span>
                      </div>
                    </td>
                    <td className={styles.statusCell}>
                      <div className={`${styles.status} ${styles[getStockStatus(product)]}`}>
                        {getStatusText(product)}
                      </div>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionButtons}>
                        <button 
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnWarning}`}
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                          }}
                          title="Edit product"
                          type="button"
                        >
                          Edit
                        </button>
                        <button 
                          className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                          onClick={() => handleDelete(product.id)}
                          title="Delete product"
                          disabled={deletingProduct === product.id}
                          type="button"
                        >
                          {deletingProduct === product.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className={styles.emptyState}>
                {searchTerm ? (
                  <>
                    <h3>No products found</h3>
                    <p>No products match your search for "{searchTerm}"</p>
                    <button 
                      className={styles.clearSearchBtn}
                      onClick={() => setSearchTerm('')}
                      type="button"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h3>No products yet</h3>
                    <p>Get started by adding your first product or importing from CSV</p>
                    <div className={styles.emptyStateActions}>
                      <button 
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => setShowForm(true)}
                        type="button"
                      >
                        ➕ Add First Product
                      </button>
                      <button 
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => setShowCsvImport(true)}
                        type="button"
                      >
                        📥 Import CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && filteredProducts.length > 0 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={styles.paginationButton}
                  type="button"
                >
                  ← Previous
                </button>
                
                <div className={styles.pageNumbers}>
                  {renderPagination()}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={styles.paginationButton}
                  type="button"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Import Products from CSV</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  if (!importLoading) {
                    setShowCsvImport(false);
                    setCsvFile(null);
                    setImportProgress(0);
                    setError('');
                  }
                }}
                disabled={importLoading}
                type="button"
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              {error && (
                <div className={styles.modalError}>
                  <strong>Error:</strong> {error}
                </div>
              )}
              <div className={styles.csvInstructions}>
  <h3>CSV Format Requirements:</h3>
  <ul>
    <li><strong>Required column:</strong> name</li>
    <li><strong>categorySlugs:</strong> <span className={styles.important}>Use existing category SLUGS, comma-separated (e.g. "electronics,mobile-phones")</span></li>
    <li><strong>Important:</strong> Categories must exist before importing. Use Category Management to create them.</li>
    <li><strong>images:</strong> comma-separated URLs for additional images</li>
    <li><strong>featured:</strong> true/false</li>
    <li><strong>tags:</strong> comma-separated tags</li>
    <li>First row must be the header row</li>
    <li>Maximum file size: 10MB</li>
  </ul>

  {/* Category validation warning */}
  <div className={styles.categoryWarning}>
    ⚠️ <strong>Important:</strong> The "categorySlugs" column must contain slugs (not IDs) of existing categories.
    Leave empty if no category is needed.
  </div>

  {/* Quick category check */}
  <div className={styles.categoryCheck}>
    <button 
      type="button"
      onClick={async () => {
        try {
          const res = await fetch(`${API_BASE}/categories?limit=10`);
          if (res.ok) {
            const cats = await res.json();
            const slugs = cats.map(c => c.slug).filter(Boolean);
            if (slugs.length > 0) {
              alert(`First 10 available category slugs:\n${slugs.join('\n')}`);
            } else {
              alert('No categories found. Please create categories first.');
            }
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
          alert('Could not fetch categories');
        }
      }}
      className={styles.checkCategoriesBtn}
      disabled={importLoading}
    >
      🔍 Check Available Category Slugs
    </button>
  </div>

  <button 
    className={styles.templateButton} 
    onClick={downloadCsvTemplate}
    disabled={importLoading}
    type="button"
  >
    📋 Download CSV Template
  </button>
</div>
              <div className={styles.fileUpload}>
                <label className={styles.fileInputLabel}>
                  <span>📁 Choose CSV File</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                    className={styles.fileInput}
                    disabled={importLoading}
                  />
                </label>
                {csvFile && (
                  <div className={styles.fileInfo}>
                    <div className={styles.fileInfoRow}>
                      <span className={styles.fileSuccess}>✅ Selected:</span>
                      <strong>{csvFile.name}</strong>
                    </div>
                    <div className={styles.fileInfoRow}>
                      <span>Size:</span> {(csvFile.size / 1024).toFixed(1)} KB
                    </div>
                    <div className={styles.fileInfoRow}>
                      <span>Type:</span> {csvFile.type || 'text/csv'}
                    </div>
                  </div>
                )}
              </div>

              {importLoading && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${importProgress}%` }} 
                    />
                  </div>
                  <span className={styles.progressText}>
                    {importProgress < 100 ? `Importing... ${importProgress}%` : 'Processing...'}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => {
                  setShowCsvImport(false);
                  setCsvFile(null);
                  setError('');
                }}
                disabled={importLoading}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleCsvImport}
                disabled={!csvFile || importLoading}
                type="button"
              >
                {importLoading ? '🔄 Importing...' : '🚀 Import Products'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts(currentPage);
          }}
        />
      )}
    </div>
  );
}