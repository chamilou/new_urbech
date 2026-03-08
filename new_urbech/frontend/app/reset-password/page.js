export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Загрузка…</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
