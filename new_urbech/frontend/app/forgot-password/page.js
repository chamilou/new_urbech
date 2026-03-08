export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Загрузка…</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
