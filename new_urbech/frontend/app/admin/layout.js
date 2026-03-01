import styles from './layout.module.css';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <h2>Admin Panel</h2>
          <ul>
  <li><Link href="/admin">Dashboard</Link></li>
  <li><Link href="/admin/products">Products</Link></li>
  <li><Link href="/admin/categories">Categories</Link></li>
  <li><Link href="/admin/orders">Orders</Link></li>
  <li><Link href="/admin/customers">Customers</Link></li>
  <li><Link href="/admin/blog">Blog</Link></li>
  <li><Link href="/admin/settings/seo">SiteMap</Link></li>
</ul>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
