const CreateCustomerModal = ({
  show,
  customerName,
  setCustomerName,
  phone,
  setPhone,
  loading,
  onClose,
  onCreate,
}) => {
  if (!show) return null;

  const isPhoneValid = isValidContactNo(phone);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">Create New Customer</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
              />
            </div>

            <div className="modal-body">
              {/* Customer Name */}
              <div className="mb-3">
                <label className="form-label">
                  Customer Name <span className="text-danger">*</span>
                </label>
                <input
                  className="form-control"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              {/* Contact Number */}
              <div className="mb-3">
                <label className="form-label">
                  Contact Number <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    phone && !isPhoneValid ? "is-invalid" : ""
                  }`}
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  } // digits only, max 10
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="e.g. 0784327095"
                />

                {phone && !isPhoneValid && (
                  <div className="invalid-feedback">
                    Contact number must be exactly 10 digits and start with 0
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                className="btn btn-success"
                disabled={!customerName.trim() || !isPhoneValid || loading}
                onClick={onCreate}
              >
                {loading ? "Creating..." : "Create Customer"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

// helper: exactly 10 digits, leading 0
const isValidContactNo = (value) => /^0\d{9}$/.test(value);

export default CreateCustomerModal;
