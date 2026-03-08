'use client';

import { useEffect, useState } from 'react';

import { withAuth } from '../../lib/authFetch';
import styles from '../crud-page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

const ORDER_STATUSES = ['DRAFT', 'PENDING', 'PAYMENT_FAILED', 'PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'CANCELED', 'REFUNDED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PARTIAL', 'FULFILLED'];

function createEmptyItem() {
  return {
    name: '',
    sku: '',
    unitPrice: '0',
    quantity: '1',
    taxRate: '0',
    discount: '0',
  };
}

function createEmptyOrder() {
  return {
    orderNumber: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    currencyCode: 'RUB',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    fulfillment: 'UNFULFILLED',
    paymentMode: '',
    sendingAgent: '',
    city: '',
    location: '',
    shippingTotal: '0',
    items: [createEmptyItem()],
  };
}

function orderToFormData(order) {
  return {
    orderNumber: order.orderNumber || '',
    customerId: order.customerId || '',
    customerName: order.customerName || '',
    customerEmail: order.customerEmail || '',
    currencyCode: order.currencyCode || 'RUB',
    status: order.status || 'PENDING',
    paymentStatus: order.paymentStatus || 'PENDING',
    fulfillment: order.fulfillment || 'UNFULFILLED',
    paymentMode: order.paymentMode || '',
    sendingAgent: order.sendingAgent || '',
    city: order.city || '',
    location: order.location || '',
    shippingTotal: String(order.shippingTotal ?? 0),
    items: order.items?.length
      ? order.items.map((item) => ({
          name: item.name || '',
          sku: item.sku || '',
          unitPrice: String(item.unitPrice ?? 0),
          quantity: String(item.quantity ?? 1),
          taxRate: String(item.taxRate ?? 0),
          discount: String(item.discount ?? 0),
        }))
      : [createEmptyItem()],
  };
}

function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeSummary(items, shippingTotal) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  items.forEach((item) => {
    const quantity = Math.max(1, Number.parseInt(item.quantity, 10) || 1);
    const unitPrice = Math.max(0, toNumber(item.unitPrice));
    const discount = Math.max(0, toNumber(item.discount));
    const taxRate = Math.max(0, toNumber(item.taxRate));
    const lineSubtotal = unitPrice * quantity;
    const taxable = Math.max(0, lineSubtotal - discount);
    const lineTax = taxable * (taxRate / 100);

    subtotal += lineSubtotal;
    discountTotal += discount;
    taxTotal += lineTax;
  });

  const shipping = Math.max(0, toNumber(shippingTotal));
  const total = subtotal - discountTotal + taxTotal + shipping;

  return { subtotal, discountTotal, taxTotal, shipping, total };
}

function formatCurrency(value, currencyCode) {
  return `${currencyCode || 'RUB'} ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function badgeClass(value) {
  if (['PAID', 'DELIVERED', 'FULFILLED', 'REFUNDED'].includes(value)) return styles.badgeGreen;
  if (['PENDING', 'UNFULFILLED', 'PARTIAL', 'FULFILLING'].includes(value)) return styles.badgeBlue;
  if (['PAYMENT_FAILED', 'CANCELED', 'FAILED'].includes(value)) return styles.badgeRed;
  if (['SHIPPED'].includes(value)) return styles.badgeAmber;
  return styles.badgeGray;
}

function OrderModal({ order, customers, onClose, onSaved }) {
  const [formData, setFormData] = useState(createEmptyOrder());
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setFormData(order ? orderToFormData(order) : createEmptyOrder());
    setSubmitError('');
  }, [order]);

  const summary = computeSummary(formData.items, formData.shippingTotal);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    if (name === 'customerId') {
      const selectedCustomer = customers.find((customer) => customer.id === value);
      setFormData((current) => ({
        ...current,
        customerId: value,
        customerName: selectedCustomer ? selectedCustomer.name : current.customerName,
        customerEmail: selectedCustomer ? selectedCustomer.email : current.customerEmail,
      }));
      return;
    }

    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setFormData((current) => ({ ...current, items: [...current.items, createEmptyItem()] }));
  };

  const removeItem = (index) => {
    setFormData((current) => {
      if (current.items.length === 1) {
        return { ...current, items: [createEmptyItem()] };
      }
      return {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');

    const normalizedItems = formData.items
      .filter((item) => item.name.trim())
      .map((item) => ({
        name: item.name.trim(),
        sku: item.sku.trim() || null,
        unitPrice: Math.max(0, toNumber(item.unitPrice)),
        quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
        taxRate: Math.max(0, toNumber(item.taxRate)),
        discount: Math.max(0, toNumber(item.discount)),
      }));

    try {
      const method = order ? 'PUT' : 'POST';
      const url = order ? `${API_BASE}/orders/${order.id}` : `${API_BASE}/orders`;
      const response = await fetch(
        url,
        withAuth({
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: formData.orderNumber.trim() || null,
            customerId: formData.customerId || null,
            customerName: formData.customerName.trim() || null,
            customerEmail: formData.customerEmail.trim() || null,
            currencyCode: formData.currencyCode.trim().toUpperCase(),
            status: formData.status,
            paymentStatus: formData.paymentStatus,
            fulfillment: formData.fulfillment,
            paymentMode: formData.paymentMode.trim() || null,
            sendingAgent: formData.sendingAgent.trim() || null,
            city: formData.city.trim() || null,
            location: formData.location.trim() || null,
            shippingTotal: Math.max(0, toNumber(formData.shippingTotal)),
            items: normalizedItems,
          }),
        })
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Не удалось сохранить заказ');
      }

      onSaved();
    } catch (error) {
      setSubmitError(error.message || 'Не удалось сохранить заказ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalWide}`}>
        <div className={styles.modalHeader}>
          <h2>{order ? 'Редактировать заказ' : 'Новый заказ'}</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {submitError ? <div className={styles.error}>{submitError}</div> : null}

          <h3 className={styles.sectionTitle}>Детали заказа</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="orderNumber">Номер заказа</label>
              <input id="orderNumber" name="orderNumber" value={formData.orderNumber} onChange={handleFieldChange} placeholder="Будет создан автоматически, если оставить пустым" />
            </div>

            <div className={styles.field}>
              <label htmlFor="currencyCode">Валюта</label>
              <input id="currencyCode" name="currencyCode" value={formData.currencyCode} onChange={handleFieldChange} maxLength={3} required />
            </div>

            <div className={styles.field}>
              <label htmlFor="customerId">Связанный клиент</label>
              <select id="customerId" name="customerId" value={formData.customerId} onChange={handleFieldChange}>
                <option value="">Гость / без клиента</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="customerName">Имя клиента</label>
              <input id="customerName" name="customerName" value={formData.customerName} onChange={handleFieldChange} />
            </div>

            <div className={styles.field}>
              <label htmlFor="customerEmail">Email клиента</label>
              <input id="customerEmail" type="email" name="customerEmail" value={formData.customerEmail} onChange={handleFieldChange} />
            </div>

            <div className={styles.field}>
              <label htmlFor="shippingTotal">Стоимость доставки</label>
              <input id="shippingTotal" name="shippingTotal" type="number" min="0" step="0.01" value={formData.shippingTotal} onChange={handleFieldChange} />
            </div>

            <div className={styles.field}>
              <label htmlFor="status">Статус заказа</label>
              <select id="status" name="status" value={formData.status} onChange={handleFieldChange}>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="paymentStatus">Статус оплаты</label>
              <select id="paymentStatus" name="paymentStatus" value={formData.paymentStatus} onChange={handleFieldChange}>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="fulfillment">Исполнение</label>
              <select id="fulfillment" name="fulfillment" value={formData.fulfillment} onChange={handleFieldChange}>
                {FULFILLMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="paymentMode">Способ оплаты</label>
              <input id="paymentMode" name="paymentMode" value={formData.paymentMode} onChange={handleFieldChange} placeholder="Карта, наличные, перевод..." />
            </div>

            <div className={styles.field}>
              <label htmlFor="sendingAgent">Служба отправки</label>
              <input id="sendingAgent" name="sendingAgent" value={formData.sendingAgent} onChange={handleFieldChange} placeholder="Курьер, СДЭК, оператор..." />
            </div>

            <div className={styles.field}>
              <label htmlFor="city">Город</label>
              <input id="city" name="city" value={formData.city} onChange={handleFieldChange} />
            </div>

            <div className={styles.field}>
              <label htmlFor="location">Адрес / точка выдачи</label>
              <input id="location" name="location" value={formData.location} onChange={handleFieldChange} />
            </div>
          </div>

          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <h3 className={styles.sectionTitle}>Товары</h3>
              <button type="button" className={styles.secondaryButton} onClick={addItem}>
                Добавить товар
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={`${index}-${item.name}`} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <strong>Товар {index + 1}</strong>
                  <button type="button" className={styles.smallDangerButton} onClick={() => removeItem(index)}>
                    Удалить
                  </button>
                </div>

                <div className={styles.itemGrid}>
                  <div className={styles.field}>
                    <label>Название</label>
                    <input value={item.name} onChange={(event) => handleItemChange(index, 'name', event.target.value)} required={index === 0} />
                  </div>
                  <div className={styles.field}>
                    <label>SKU</label>
                    <input value={item.sku} onChange={(event) => handleItemChange(index, 'sku', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Цена за шт.</label>
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => handleItemChange(index, 'unitPrice', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Кол-во</label>
                    <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => handleItemChange(index, 'quantity', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Налог %</label>
                    <input type="number" min="0" step="0.01" value={item.taxRate} onChange={(event) => handleItemChange(index, 'taxRate', event.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label>Скидка</label>
                    <input type="number" min="0" step="0.01" value={item.discount} onChange={(event) => handleItemChange(index, 'discount', event.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryPanel}>
            <div className={styles.summaryRow}>
              <span>Подытог</span>
              <span>{formatCurrency(summary.subtotal, formData.currencyCode)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Скидка</span>
              <span>{formatCurrency(summary.discountTotal, formData.currencyCode)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Налог</span>
              <span>{formatCurrency(summary.taxTotal, formData.currencyCode)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Доставка</span>
              <span>{formatCurrency(summary.shipping, formData.currencyCode)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryStrong}`}>
              <span>Итого</span>
              <span>{formatCurrency(summary.total, formData.currencyCode)}</span>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Сохранение...' : order ? 'Обновить заказ' : 'Создать заказ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const loadOrders = async (searchValue = '') => {
    const params = new URLSearchParams();
    if (searchValue.trim()) params.set('search', searchValue.trim());

    const response = await fetch(
      `${API_BASE}/orders${params.toString() ? `?${params.toString()}` : ''}`,
      withAuth({ cache: 'no-store' })
    );
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(data?.detail || 'Не удалось загрузить заказы');
    }
    setOrders(Array.isArray(data) ? data : []);
  };

  const loadCustomers = async () => {
    const response = await fetch(`${API_BASE}/customers`, withAuth({ cache: 'no-store' }));
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      throw new Error(data?.detail || 'Не удалось загрузить клиентов');
    }
    setCustomers(Array.isArray(data) ? data : []);
  };

  const loadData = async (searchValue = '') => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([loadOrders(searchValue), loadCustomers()]);
    } catch (loadError) {
      setError(loadError.message || 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (orderId) => {
    if (!confirm('Удалить этот заказ? Действие нельзя отменить.')) return;

    try {
      const response = await fetch(
        `${API_BASE}/orders/${orderId}`,
        withAuth({ method: 'DELETE' })
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Не удалось удалить заказ');
      }
      await loadOrders(search);
    } catch (deleteError) {
      setError(deleteError.message || 'Не удалось удалить заказ');
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;
  const paidOrders = orders.filter((order) => order.paymentStatus === 'PAID').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerTitle}>
            <h1>Заказы</h1>
            <p>Управляйте заказами клиентов, статусами, позициями и суммами в одном списке.</p>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{orders.length}</span>
              <span className={styles.statLabel}>Заказов</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statAccent}`}>{paidOrders}</span>
              <span className={styles.statLabel}>Оплачено</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNumber} ${styles.statDanger}`}>{pendingOrders}</span>
              <span className={styles.statLabel}>В ожидании</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{totalRevenue.toFixed(2)}</span>
              <span className={styles.statLabel}>Выручка</span>
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
              placeholder="Поиск по номеру заказа, клиенту или статусу"
            />
            {search ? (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => {
                  setSearch('');
                  loadData('');
                }}
              >
                ×
              </button>
            ) : null}
          </div>

          <div className={styles.actionGroup}>
            <button type="button" className={styles.secondaryButton} onClick={() => loadData(search)}>
              Найти
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => loadData(search)}>
              Обновить
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setEditingOrder(null);
                setShowModal(true);
              }}
            >
              Новый заказ
            </button>
          </div>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <div className={styles.loading}>Загрузка заказов...</div>
      ) : (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableInfo}>Загружено заказов: {orders.length}</div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Клиент</th>
                  <th>Товары</th>
                  <th>Статусы</th>
                  <th>Сумма</th>
                  <th>Обновлено</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className={styles.cellStack}>
                        <span className={styles.strong}>{order.orderNumber}</span>
                        <span className={`${styles.muted} ${styles.mono}`}>{order.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span>{order.customerName || 'Гостевой клиент'}</span>
                        <span className={styles.muted}>{order.customerEmail || 'Без email'}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span>{order.itemCount} поз.</span>
                        <div className={styles.itemPreview}>
                          {order.items.slice(0, 2).map((item) => (
                            <span key={item.id} className={styles.pill}>
                              {item.name}
                            </span>
                          ))}
                          {order.items.length > 2 ? <span className={styles.pill}>+ещё {order.items.length - 2}</span> : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span className={`${styles.badge} ${badgeClass(order.status)}`}>{order.status}</span>
                        <span className={`${styles.badge} ${badgeClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
                        <span className={`${styles.badge} ${badgeClass(order.fulfillment)}`}>{order.fulfillment}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span className={styles.strong}>{formatCurrency(order.total, order.currencyCode)}</span>
                        <span className={styles.muted}>Доставка {formatCurrency(order.shippingTotal, order.currencyCode)}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellStack}>
                        <span>{formatDate(order.updatedAt)}</span>
                        <span className={styles.muted}>Создан {formatDate(order.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.smallSecondaryButton}
                          onClick={() => {
                            setEditingOrder(order);
                            setShowModal(true);
                          }}
                        >
                          Редактировать
                        </button>
                        <button type="button" className={styles.smallDangerButton} onClick={() => handleDelete(order.id)}>
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!orders.length ? (
                  <tr>
                    <td colSpan={7} className={styles.empty}>
                      Заказы не найдены.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal ? (
        <OrderModal
          order={editingOrder}
          customers={customers}
          onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            setEditingOrder(null);
            await loadData(search);
          }}
        />
      ) : null}
    </div>
  );
}
