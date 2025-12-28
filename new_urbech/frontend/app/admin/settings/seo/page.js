"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

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
    const res = await fetch("/api/settings/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excludes }),
    });

    const text = await res.text(); // read error body too
    console.log("SEO save:", res.status, text);

    setStatus(res.ok ? "Saved successfully" : `Save failed (${res.status})`);
  } catch (e) {
    console.log("SEO save network error:", e);
    setStatus("Save failed (network error)");
  } finally {
    setSaving(false);
  }
};

  return (
    <div className={styles.page}>
      <h1>SEO & Sitemap Settings</h1>
      <p className={styles.description}>
        Choose which pages should be excluded from the sitemap and search engines.
      </p>

      <div className={styles.list}>
        {Object.entries(excludes).map(([key, value]) => (
          <label key={key} className={styles.row}>
            <input
              type="checkbox"
              checked={value}
              onChange={() => toggle(key)}
            />
            <span>Exclude <code>/{key}</code> from sitemap</span>
          </label>
        ))}
      </div>

      <button onClick={save} disabled={saving} className={styles.saveBtn}>
        {saving ? "Saving…" : "Save Settings"}
      </button>

      {status && <p className={styles.status}>{status}</p>}
    </div>
  );
}
