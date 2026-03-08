import { Suspense } from 'react';
import VerifyClient from './VerifyClient';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Загрузка…</div>}>
      <VerifyClient />
    </Suspense>
  );
}
