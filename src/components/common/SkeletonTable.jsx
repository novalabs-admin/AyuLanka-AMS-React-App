import React from 'react';

/**
 * SkeletonTable — shimmer placeholder while data is loading.
 * Props:
 *   rows    – number of skeleton rows (default 6)
 *   cols    – number of columns      (default 5)
 */
const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div className="scrollable-table-container">
    <table className="report-table" style={{ width: '100%' }}>
      <thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i}><div className="skeleton-cell" style={{ width: '80%' }} /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="skeleton-row">
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <div className="skeleton-cell" style={{ width: c === 0 ? '60%' : '75%' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SkeletonTable;
