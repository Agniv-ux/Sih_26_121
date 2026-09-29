import type { ExtractedField } from '../../types';
import { Confidence } from '../IssueTag';

export default function ExtractedFields({ fields }: { fields: ExtractedField[] }) {
  if (fields.length === 0) return <div className="p-4 text-muted">No fields extracted.</div>;
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Field</th>
          <th>Extracted value</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.field}>
            <td className="w-[100px] font-semibold">{f.field}</td>
            <td>{f.value}</td>
            <td className="w-[110px]">
              <Confidence value={f.confidence} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
