import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/products/ProductCard';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'finalPrice,asc',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {
          page: pagination.page,
          size: pagination.size,
          sort: filters.sort,
        };

        if (filters.name) params.name = filters.name;
        if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
        if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);

        const response = await productService.getProducts(params);
        setProducts(response.content || []);
        setPagination({
          page: response.number || 0,
          size: response.size || 12,
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
        });
      } catch (err) {
        setError('No se pudieron cargar los productos.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [pagination.page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <div className="container my-5">
      <h1 className="mb-4">Catálogo de Productos</h1>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre..."
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Precio mínimo"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Precio máximo"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.sort}
                onChange={handleSortChange}
              >
                <option value="finalPrice,asc">Precio: Menor a Mayor</option>
                <option value="finalPrice,desc">Precio: Mayor a Menor</option>
                <option value="name,asc">Nombre: A-Z</option>
                <option value="name,desc">Nombre: Z-A</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setFilters({ name: '', minPrice: '', maxPrice: '', sort: 'finalPrice,asc' });
                  setPagination(prev => ({ ...prev, page: 0 }));
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron productos con los filtros seleccionados.</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="row row-cols-1 row-cols-md-3 row-cols-lg-4 g-4 mb-4">
            {products.map((product) => (
              <div key={product.id} className="col">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${pagination.page === 0 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    {...(pagination.page === 0 && { disabled: true })}
                  >
                    Anterior
                  </button>
                </li>
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <li
                    key={index}
                    className={`page-item ${pagination.page === index ? 'active' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(index)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${pagination.page === pagination.totalPages - 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    {...(pagination.page === pagination.totalPages - 1 && { disabled: true })}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}

          <div className="text-center text-muted">
            Mostrando {products.length} de {pagination.totalElements} productos
          </div>
        </>
      )}
    </div>
  );
};

export default Catalog;
