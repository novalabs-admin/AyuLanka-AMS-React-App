import React from "react";
import "./user.css";
import ModalComponent from "../modalComponent/modalComponent";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";

function UserTemplate(props) {
  const {
    submitAttempted,
    currentUser,
    handleInputChange,
    handleSubmit,
    isEditing,
    shiftMasters,
    employmentTypes,
    designations,
    companies,
    isSuperAdmin,
    users,
    successModalOpen,
    handleSuccessClose,
    errorModalOpen,
    handleErrorClose,
    resetPasswordModalOpen,
    resetPasswordUserName,
    newPassword,
    resetPasswordError,
    onNewPasswordChange,
    openResetPassword,
    closeResetPassword,
    handleResetPasswordSubmit,
    // confirm dialog props
    confirmResetOpen,
    confirmResetUser,
    onConfirmResetYes,
    onConfirmResetNo,
  } = props;

  // Returns true when the field is empty AND the user has tried to submit
  const shouldShowError = (field) => !currentUser[field] && submitAttempted;

  return (
    <div className="container">
      <div className="row user-content">
        {/* ── Form column ── */}
        <div className="col-md-4 form-column">
          <h2 className="edit-create-header">{isEditing ? "Edit Employee" : "Create Employee"}</h2>
          <form onSubmit={handleSubmit}>
            {[
              { id: "fullName",         label: "Full Name" },
              { id: "callingName",      label: "Calling Name" },
              { id: "employeeNumber",   label: "Employee Number" },
              { id: "address",          label: "Address" },
              { id: "nic",             label: "NIC" },
              { id: "joinedDate",       label: "Joined Date", type: "date" },
              { id: "shiftMasterId",    label: "Shift",             type: "select", options: shiftMasters,     optionLabelFields: ['fromTime', 'toTime'] },
              { id: "employmentTypeId", label: "Employment Type",   type: "select", options: employmentTypes,  optionLabelField: 'name' },
              { id: "designationId",    label: "Designation",       type: "select", options: designations,     optionLabelField: 'name' },
              { id: "username",         label: "Username" },
              ...(isSuperAdmin ? [{ id: "companyId", label: "Company", type: "select", options: companies, optionLabelField: 'name' }] : [])
            ].map((field) => (
              <div key={field.id} className="form-group">
                <label htmlFor={field.id}>{field.label} <span className="required-star">*</span></label>
                {field.type === 'select' ? (
                  <select
                    className={`form-control ${shouldShowError(field.id) ? 'is-invalid' : ''}`}
                    id={field.id} name={field.id}
                    value={currentUser[field.id]}
                    onChange={handleInputChange}
                  >
                    <option value="">--Select--</option>
                    {field.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {field.optionLabelFields
                          ? field.optionLabelFields.map(f => option[f]).join(' - ')
                          : option[field.optionLabelField]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    className={`form-control ${shouldShowError(field.id) ? 'is-invalid' : ''}`}
                    id={field.id} name={field.id}
                    value={currentUser[field.id]}
                    onChange={handleInputChange}
                  />
                )}
                {shouldShowError(field.id) && (
                  <span className="field-error">{field.label} is required.</span>
                )}
              </div>
            ))}

            {!isEditing && (
              <div className="form-group">
                <label htmlFor="password">Password <span className="required-star">*</span></label>
                <input
                  type="password"
                  className={`form-control ${shouldShowError('password') ? 'is-invalid' : ''}`}
                  id="password" name="password"
                  value={currentUser.password}
                  onChange={handleInputChange}
                  required={!isEditing}
                />
                {shouldShowError('password') && (
                  <span className="field-error">Password is required.</span>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block">
              {isEditing ? "Update" : "Create"}
            </button>
          </form>
        </div>

        {/* ── Table column ── */}
        <div className="col-md-7 table-column">
          <h2 className="employees-header">Employees</h2>
          <div className="table-scrollable">
            {users.length === 0 ? (
              <EmptyState title="No employees yet" message="Create the first employee using the form." />
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>NIC</th>
                    {isSuperAdmin && <th>Company</th>}
                    <th className="actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.employeeNumber} - {user.callingName}</td>
                      <td>{user.nic}</td>
                      {isSuperAdmin && <td>{user.company?.name ?? user.companyId}</td>}
                      <td className="actions">
                        <button className="btn btn-sm btn-success"
                          onClick={() => props.editUser(user)}
                          style={{ backgroundColor: '#28a745' }}>
                          Edit
                        </button>
                        {isSuperAdmin && (
                          <button className="btn btn-sm btn-warning ms-1"
                            onClick={() => props.requestResetPassword(user)}
                            style={{ marginLeft: '4px' }}>
                            Reset Password
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Success / Error modals ── */}
      <ModalComponent show={successModalOpen} onClose={handleSuccessClose} type="success" />
      <ModalComponent show={errorModalOpen}   onClose={handleErrorClose}   type="error" />

      {/* ── Confirm before reset password ── */}
      <ConfirmDialog
        show={confirmResetOpen}
        title="Reset Password?"
        message={`Reset the password for ${confirmResetUser?.callingName || confirmResetUser?.fullName || ''}? You will be asked to enter a new password.`}
        confirmText="Yes, Reset"
        cancelText="Cancel"
        variant="warning"
        onConfirm={onConfirmResetYes}
        onCancel={onConfirmResetNo}
      />

      {/* ── Reset Password modal ── */}
      {resetPasswordModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reset Password — {resetPasswordUserName}</h5>
                <button type="button" className="btn-close" onClick={closeResetPassword} />
              </div>
              <div className="modal-body">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className={`form-control ${resetPasswordError ? 'is-invalid' : ''}`}
                  value={newPassword}
                  onChange={(e) => onNewPasswordChange(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  autoFocus
                />
                {resetPasswordError && (
                  <span className="field-error">{resetPasswordError}</span>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeResetPassword}>Cancel</button>
                <button className="btn btn-primary" onClick={handleResetPasswordSubmit}>Reset Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTemplate;
