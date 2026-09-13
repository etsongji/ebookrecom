import PencilMeter from './PencilMeter';
import { LEVEL_MAX, levelOf } from '../lib/levels';
import { storytelSearchUrl } from '../lib/links';

interface BookCardProps {
  title: string;
  author: string;
  url: string;
  level?: number;
  reason?: string;
  meta?: string[];
}

export default function BookCard({ title, author, url, level, reason, meta = [] }: BookCardProps) {
  const info = levelOf(level);

  return (
    <article className="card book">
      {info && (
        <p className="book-level meta">
          {info.key} {info.name}
          <PencilMeter value={info.step} max={LEVEL_MAX} />
        </p>
      )}
      <h3 className="display book-title">{title}</h3>
      <p className="book-author">{author}</p>
      {meta.length > 0 && (
        <p className="book-meta meta">
          {meta.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </p>
      )}
      {reason && <p className="book-reason">{reason}</p>}
      <div className="book-links">
        <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noopener noreferrer">
          원문 읽기 <span aria-hidden="true">↗</span>
        </a>
        <a className="text-link" href={storytelSearchUrl(title)} target="_blank" rel="noopener noreferrer">
          스토리텔에서 오디오북 찾기 <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
