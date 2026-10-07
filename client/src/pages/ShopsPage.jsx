/**
 * pages/ShopsPage.jsx
 * ---------------------------------------------------------
 * Directory of the approved beauty stores & salons.
 */
import { useEffect, useState } from 'react';
import { catalogApi } from '../api/catalog.api';
import ShopCard from '../components/ShopCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { useLanguage } from '../context/LanguageContext';

const ShopsPage = () => {
  const [shops, setShops] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', city: '', page: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '')
        );
        const response = await catalogApi.getShops(params);
        setShops(response.data);
        setMeta(response.meta);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1>{t.sellers.pageTitle}</h1>
          <p className="muted small" style={{ margin: 0 }}>{t.sellers.subtitle}</p>
        </div>

        <form
          className="search-box"
          style={{ maxWidth: 420 }}
          onSubmit={(event) => {
            event.preventDefault();
            setFilters((current) => ({ ...current, search: searchInput, page: 1 }));
          }}
        >
          <input
            type="search"
            placeholder={t.sellers.searchPlaceholder}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="btn btn-sm">{t.sellers.search}</button>
        </form>
      </div>

      {loading && <Loader label="Loading the sellers…" />}

      {!loading && shops.length === 0 && (
        <EmptyState icon="🏪" title="No store found" message="Try another city or keyword." />
      )}

      {!loading && shops.length > 0 && (
        <>
          <div className="grid grid-3">
            {shops.map((shop) => (
              <ShopCard key={shop._id} shop={shop} />
            ))}
          </div>
          <Pagination
            meta={meta}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
    </div>
  );
};

export default ShopsPage;
