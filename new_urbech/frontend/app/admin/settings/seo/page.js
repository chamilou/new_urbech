"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { withAuth } from "../../../lib/authFetch";

const DEFAULT_EXCLUDES = {
  admin: true,
  cart: true,
  profile: true,
  shipping: true,
  login: true,
  register: true,
  orders: true,
};

export default function SeoSettings() {
  const [excludes, setExcludes] = useState(DEFAULT_EXCLUDES);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/settings/seo")
      .then((r) => r.json())
      .then((data) => setExcludes(data.excludes || DEFAULT_EXCLUDES));
  }, []);

  const toggle = (key) =>
    setExcludes((prev) => ({ ...prev, [key]: !prev[key] }));

 const save = async () => {
  setSaving(true);
  setStatus(null);

  try {
    const res = await fetch(
      "/api/settings/seo",
      withAuth({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludes }),
      })
    );

    await res.text();
    setStatus(res.ok ? "Сохранено" : `Ошибка сохранения (${res.status})`);
  } catch (e) {
    setStatus("Ошибка сохранения (сеть)");
  } finally {
    setSaving(false);
  }
};

  return (
    <div className={styles.page}>
      <h1>SEO и карта сайта</h1>
      <p className={styles.description}>
        Выберите страницы, которые нужно исключить из карты сайта и поисковой индексации.
      </p>

      <div className={styles.list}>
        {Object.entries(excludes).map(([key, value]) => (
          <label key={key} className={styles.row}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => toggle(key)}
            />
            <span>Исключить <code>/{key}</code> из карты сайта</span>
          </label>
        ))}
      </div>

      <button onClick={save} disabled={saving} className={styles.saveBtn}>
        {saving ? "Сохраняем…" : "Сохранить настройки"}
      </button>

      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}
