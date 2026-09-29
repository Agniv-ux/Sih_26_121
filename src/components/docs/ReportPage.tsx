import type { ReportDoc } from '../../types';

/**
 * A mock report page rendered as a "document". Rows marked `hl` (or matching `match`) are highlighted
 * as the lines the extraction / answer came from.
 */
export default function ReportPage({ doc, match, compact }: { doc: ReportDoc; match?: string; compact?: boolean }) {
  if (!doc.excerpt)
    return (
      <div className="doc-page scan flex h-[320px] items-center justify-center p-6 text-center text-[#8a8a8a]">
        Page image could not be read.
        <br />
        {doc.failReason}
      </div>
    );
  const { title, meta, rows } = doc.excerpt;
  const isHl = (r: (typeof rows)[number]) => (match ? r.text.includes(match) || r.time.includes(match) : !!r.hl);
  const isLog = rows.some((r) => r.hrs);
  return (
    <div className={`doc-page ${doc.method === 'OCR' ? 'scan' : ''} ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start justify-between border-b-2 border-[#555] pb-1.5">
        <div className="font-bold tracking-wide">{title}</div>
        <div className="text-right text-[11px] text-[#666]">
          Page {doc.page} of {doc.pages}
          <br />
          SAMPLE – NOT A REAL REPORT
        </div>
      </div>
      <table className="mt-2 w-full text-[12px]">
        <tbody>
          {Array.from({ length: Math.ceil(meta.length / 2) }, (_, i) => (
            <tr key={i}>
              {meta.slice(i * 2, i * 2 + 2).map(([k, v]) => (
                <td key={k} className="w-1/2 py-[1px] pr-3">
                  <span className="text-[#666]">{k}:</span> {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 border-t border-[#999] pt-1 font-bold">{isLog ? 'TIME LOG / OPERATIONS SUMMARY' : 'SUMMARY'}</div>
      <table className="mt-1 w-full border-collapse text-[12.5px]">
        {isLog && (
          <thead>
            <tr className="border-b border-[#999] text-left">
              <th className="w-[92px] py-0.5 font-bold">From–To</th>
              <th className="w-[40px] py-0.5 font-bold">Hrs</th>
              <th className="py-0.5 font-bold">Activity</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              <td className="whitespace-nowrap py-[3px] pr-2">{r.time}</td>
              {isLog && <td className="py-[3px] pr-2">{r.hrs}</td>}
              <td className="py-[3px]">{isHl(r) ? <mark className="hl">{r.text}</mark> : r.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between border-t border-[#bbb] pt-1 text-[11px] text-[#777]">
        <span>{doc.file}</span>
        <span>{doc.method === 'OCR' ? 'Scanned copy' : 'Digital PDF'}</span>
      </div>
    </div>
  );
}
