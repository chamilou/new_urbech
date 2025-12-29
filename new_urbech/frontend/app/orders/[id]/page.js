import styles from "./order.module.css";

export default async function OrderPage({ params }) {
  const { id } = params;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

  const res = await fetch(`${API_BASE}/orders/${id}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Order not found</h1>
        <div className={styles.card}>
          <div>We couldn’t load order <code>{id}</code>.</div>
          <div>Status: {res.status}</div>
        </div>
      </div>
    );
  }

  const order = await res.json();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Order confirmed</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.meta}>
          <div className={styles.label}>Order #</div><div>{order.orderNumber}</div>
          <div className={styles.label}>Status</div><div>{order.status}</div>
          <div className={styles.label}>Payment</div><div>{order.paymentStatus}</div>
          <div className={styles.label}>Currency</div><div>{order.currencyCode}</div>
        </div>

        <hr className={styles.hr} />

        <h2>Items</h2>
        <div className={styles.items}>
          {order.items?.map((it) => (
            <div key={it.id} className={styles.item}>
              <div className={styles.itemName}>{it.name}</div>
              <div>Qty: {it.quantity}</div>
              <div>Unit: {Number(it.unitPrice).toFixed(2)}</div>
              <div>Line: {Number(it.total).toFixed(2)}</div>
              {it.sku ? <div>SKU: {it.sku}</div> : null}
            </div>
          ))}
        </div>

        <hr className={styles.hr} />

        <h2>Totals</h2>
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span><span>{Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax</span><span>{Number(order.taxTotal).toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Shipping</span><span>{Number(order.shippingTotal).toFixed(2)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.totalStrong}`}>
            <span>Total</span><span>{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
