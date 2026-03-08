import styles from "./order.module.css";

export default async function OrderPage({ params }) {
  const { id } = params;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

  const res = await fetch(`${API_BASE}/orders/${id}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Заказ не найден</h1>
        <div className={styles.card}>
          <div>Не удалось загрузить заказ <code>{id}</code>.</div>
          <div>Статус ответа: {res.status}</div>
        </div>
      </div>
    );
  }

  const order = await res.json();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Заказ подтвержден</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.meta}>
          <div className={styles.label}>Номер заказа</div><div>{order.orderNumber}</div>
          <div className={styles.label}>Статус</div><div>{order.status}</div>
          <div className={styles.label}>Оплата</div><div>{order.paymentStatus}</div>
          <div className={styles.label}>Валюта</div><div>{order.currencyCode}</div>
        </div>

        <hr className={styles.hr} />

        <h2>Товары</h2>
        <div className={styles.items}>
          {order.items?.map((it) => (
            <div key={it.id} className={styles.item}>
              <div className={styles.itemName}>{it.name}</div>
              <div>Кол-во: {it.quantity}</div>
              <div>Цена за шт.: {Number(it.unitPrice).toFixed(2)}</div>
              <div>Сумма: {Number(it.total).toFixed(2)}</div>
              {it.sku ? <div>Артикул: {it.sku}</div> : null}
            </div>
          ))}
        </div>

        <hr className={styles.hr} />

        <h2>Итоги</h2>
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Подытог</span><span>{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Налог</span><span>{Number(order.taxTotal).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Доставка</span><span>{Number(order.shippingTotal).toFixed(2)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.totalStrong}`}>
            <span>Итого</span><span>{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
