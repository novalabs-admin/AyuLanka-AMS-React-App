import React from 'react';

/**
 * ConfirmDialog — lightweight confirm overlay.
 * Props:
 *   show        – boolean
 *   title       – dialog heading
 *   message     – body text
 *   confirmText – confirm button label (default "Confirm")
 *   cancelText  – cancel button label  (default "Cancel")
 *   variant     – 'danger' | 'warning' (default 'danger')
 *   onConfirm   – callback
 *   onCancel    – callback
 */
const ConfirmDialog = ({
  show,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  const icon = variant === 'danger' ? '⚠️' : '❓';
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-warning';

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">{icon}</div>
        <h5>{title}</h5>
        <p>{message}</p>
        <div className="btn-row">
          <button className="btn btn-outline-secondary btn-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`btn ${btnClass} btn-sm`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
