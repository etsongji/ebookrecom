import type { Metadata } from 'next';
import QuoteCopybook from '../../components/QuoteCopybook';
import { QUOTES } from '../../lib/quotes';

export const metadata: Metadata = {
  title: '명언 필사 — 구텐베르크 원서 서재',
  description: '고전 원서의 유명한 한 문장을 눈으로 읽고, 타이핑으로 따라 쓰고, 필사지로 뽑아 손으로 옮겨 적습니다.',
};

export default function QuotesPage() {
  return (
    <main className="page">
      <header className="page-head no-print">
        <p className="eyebrow">Famous lines</p>
        <h1 className="page-title">명언 필사</h1>
        <p className="lede">
          서재에 있는 고전에서 널리 알려진 한 문장만 골랐습니다. 모두 원문에 그대로 나오는 문장이며, 타이핑으로 따라 쓰거나
          필사지로 뽑아 손으로 옮겨 적을 수 있습니다.
        </p>
      </header>

      <QuoteCopybook quotes={QUOTES} />
    </main>
  );
}
