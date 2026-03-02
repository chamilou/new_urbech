import styles from './layout.module.css';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <h2>Админ-панель</h2>
          <ul>
  <li><Link href="/admin">Главная</Link></li>
  <li><Link href="/admin/products">Товары</Link></li>
  <li><Link href="/admin/categories">Категории</Link></li>
  <li><Link href="/admin/orders">Заказы</Link></li>
  <li><Link href="/admin/customers">Клиенты</Link></li>
  <li><Link href="/admin/blog">Блог</Link></li>
  <li><Link href="/admin/settings/seo">Карта сайта</Link></li>
</ul>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
