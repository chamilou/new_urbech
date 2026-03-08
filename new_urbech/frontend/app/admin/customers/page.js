'use client';

import { useEffect, useState } from 'react';

import { withAuth } from '../../lib/authFetch';
import styles from '../crud-page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

function createEmptyCustomer() {
  return {
    name: '',
    email: '',
    phone: '',
    group: '',
    city: '',
    country: '',
  };
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function CustomerModal({ customer, onClose, onSaved }) {
  const [formData, setFormData] = useState(createEmptyCustomer());
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setFormData(customer ? {
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      group: customer.group || '',
      city: customer.city || '',
      country: customer.country || '',
    } : createEmptyCustomer());
    setSubmitError('');
  }, [customer]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');

    try {
      const method = customer ? 'PUT' : 'POST';
      const url = customer ? `${API_BASE}/customers/${customer.id}` : `${API_BASE}/customers`;
      const response = await fetch(
        url,
        withAuth({
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            group: formData.group.trim() || null,
            city: formData.city.trim() || null,
            country: formData.country.trim() || null,
          }),
        })
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Не удалось сохранить клиента');
      }
      onSaved();
    } catch (error) {
      setSubmitError(error.message || 'Не удалось сохранить клиента');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{customer ? 'Редактировать клиента' : 'Новый клиент'}</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {submitError ? <div className={styles.error}>{submitError}</div> : null}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="name">Имя</label>
              <input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="phone">Телефон</label>
              <input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="group">Группа</label>
              <input id="group" name="group" value={formData.group} onChange={handleChange} placeholder="Розница, VIP, опт..." />
            </div>
            <div className={styles.field}>
              <label htmlFor="city">Город</label>
              <input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className={styles.field}>
              <label htmlFor="country">Страна</label>
              <input id="country" name="country" value={formData.country} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Сохранение...' : customer ? 'Обновить клиента' : 'Создать клиента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadCustomers = async (searchValue = '') => {
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set('search', searchValue.trim());

    const response = await fetch(
      `${API_BASE}/customers${params.toString() ? `?${params.toString()}` : ''}`,
      withAuth({ cache: 'no-store' })
    );
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(data?.detail || 'Не удалось загрузить клиентов');
    }
    setCustomers(Array.isArray(data) ? data : []);
  };

  const refresh = async (searchValue = search) => {
    try {
      setLoading(true);
      setError('');
      await loadCustomers(searchValue);
    } catch (loadError) {
      setError(loadError.message || 'Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (customerId) => {
    if (!confirm('Удалить этого клиента? Это возможно только если у него нет связанных заказов.')) return;

    try {
      const response = await fetch(
        `${API_BASE}/customers/${customerId}`,
        withAuth({ method: 'DELETE' })
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Не удалось удалить клиента');
      }
      await refresh(search);
    } catch (deleteError) {
      setError(deleteError.message || 'Не удалось удалить клиента');
    }
  };

  const customersWithOrders = customers.filter((customer) => customer.orderCount > 0).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <h1>Клиенты</h1>
            <p>Управляйте карточками клиентов, контактами и количеством связанных заказов.</p>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{customers.length}</span>
              <span className={styles.statLabel}>Клиентов</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statAccent}`}>{customersWithOrders}</span>
              <span className={styles.statLabel}>С заказами</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{customers.length - customersWithOrders}</span>
              <span className={styles.statLabel}>Без заказов</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <input
              className={styles.searchInput}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по имени, email, телефону, городу или стране"
            />
            {search ? (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => {
                  setSearch('');
                  refresh('');
                }}
              >
                ×
              </button>
            ) : null}
          </div>

          <div className={styles.actionGroup}>
            <button type="button" className={styles.secondaryButton} onClick={() => refresh(search)}>
              Найти
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => refresh(search)}>
              Обновить
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setEditingCustomer(null);
                setShowModal(true);
              }}
            >
              Новый клиент
            </button>
          </div>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <div className={styles.loading}>Загрузка клиентов...</div>
      ) : (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>Загружено клиентов: {customers.length}</div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Контакты</th>
                  <th>Сегмент</th>
                  <th>Локация</th>
                  <th>Заказы</th>
                  <th>Создан</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className={styles.cellStack}>
                        <span className={styles.strong}>{customer.name}</span>
                        <span className={`${styles.muted} ${styles.mono}`}>{customer.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span>{customer.email}</span>
                        <span className={styles.muted}>{customer.phone || 'Телефон не указан'}</span>
                      </div>
                    </td>
                    <td>
                      {customer.group ? <span className={styles.pill}>{customer.group}</span> : <span className={styles.muted}>—</span>}
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span>{customer.city || '—'}</span>
                        <span className={styles.muted}>{customer.country || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${customer.orderCount > 0 ? styles.badgeBlue : styles.badgeGray}`}>
                        {customer.orderCount} заказ(ов)
                      </span>
                    </td>
                    <td>{formatDate(customer.createdAt)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.smallSecondaryButton}
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowModal(true);
                          }}
                        >
                          Редактировать
                        </button>
                        <button type="button" className={styles.smallDangerButton} onClick={() => handleDelete(customer.id)}>
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!customers.length ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Клиенты не найдены.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal ? (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            setEditingCustomer(null);
            await refresh(search);
          }}
        />
      ) : null}
    </div>
  );
}
