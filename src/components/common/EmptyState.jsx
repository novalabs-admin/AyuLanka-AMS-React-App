import React from 'react';

/**
 * EmptyState — shown when a table/list has no data after a fetch.
 * Props:
 *   title    – heading text  (default: "No data found")
 *   message  – sub-text      (default: "Try adjusting the date range or filters.")
 */
const EmptyState = ({ title = 'No data found', message = 'Try adjusting the date range or filters.' }) => (
  <div className="empty-state">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="32" fill="#f0f4f8"/>
      <path d="M20 44V22a2 2 0 012-2h20a2 2 0 012 2v22" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 44h32" stroke="#2c3e50" strokeWidth="2" strokeLinecap="round"/>
      <path d="M27 28h10M27 34h6" stroke="#707070" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="44" cy="44" r="8" fill="#fff" stroke="#28a745" strokeWidth="2"/>
      <path d="M41 44h6M44 41v6" stroke="#28a745" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
    <h5>{title}</h5>
    <p>{message}</p>
  </div>
);

export default EmptyState;
