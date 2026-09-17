import React, { useState, useEffect, useCallback } from "react";
import Modal from "react-modal";
import CreatableSelect from "react-select/creatable";
import "./channelingAppointment.css";
import { fetchDoctorSessions, fetchDoctorSessionAvailability } from "../../services/doctorSessionApi";
import {
  addAppointment,
  deleteAppointment,
  fetchTreatmentTypesByLocation,
  searchPatients,
  fetchAppointmentsByDoctorSession,
  createCustomer,
} from "../../services/appointmentSchedulerApi";
import { ConfirmationModal } from "../confirmationModal/confirmationModal.jsx";
import AppointmentModalComponent from "../appointmentModalComponent/appointmentModalComponent.jsx";
import CreateCustomerModal from "../modalComponent/createCustomerModal.jsx";

Modal.setAppElement("#root");

const COLS = 8; // tokens per row

const emptyForm = {
  id: undefined,
  customerName: "",
  contactNo: "",
  customerId: "",
  tokenNo: "",
  remarks: "",
  appoinmentTreatments: [],
  isPatientContacted: false,
};

const ChannelingAppointment = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [bookedTokens, setBookedTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const [treatmentTypes, setTreatmentTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Booking modal state
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedTokenNo, setSelectedTokenNo] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Patient search for modal
  const [patientOptions, setPatientOptions] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  // Create customer modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Confirmation / result modals
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModal, setResultModal] = useState({ type: "", message: "" });

  const companyId = sessionStorage.getItem("companyId");
  const userId = sessionStorage.getItem("userId");

  // ── Load sessions when date changes ──────────────────────────────────────
  useEffect(() => {
    loadSessions();
    setSelectedSession(null);
    setAvailability(null);
    setBookedTokens([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // ── Load booked tokens when session is selected ──────────────────────────
  useEffect(() => {
    if (!selectedSession) return;
    loadTokens(selectedSession.id);
    fetchDoctorSessionAvailability(selectedSession.id)
      .then(setAvailability)
      .catch(() => setAvailability(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession]);

  // ── Load treatment types once ─────────────────────────────────────────────
  useEffect(() => {
    fetchTreatmentTypesByLocation().then(setTreatmentTypes).catch(() => {});
  }, []);

  const loadSessions = async () => {
    try {
      const data = await fetchDoctorSessions(selectedDate);
      setSessions(data);
    } catch {
      /* silent */
    }
  };

  const loadTokens = async (sessionId) => {
    try {
      setLoadingTokens(true);
      const data = await fetchAppointmentsByDoctorSession(sessionId);
      setBookedTokens(data);
    } catch {
      setBookedTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  // ── Patient search ────────────────────────────────────────────────────────
  const handlePatientSearch = useCallback(async (inputValue) => {
    if (inputValue.length < 3) {
      setPatientOptions([]);
      return;
    }
    setIsLoadingPatients(true);
    try {
      const results = await searchPatients(inputValue);
      setPatientOptions(
        results.map((p) => ({
          value: p.id,
          label: `${p.customerName} (${p.contactNo})`,
          customerName: p.customerName,
          customerId: p.id,
          contactNo: p.contactNo,
        }))
      );
    } catch {
      setPatientOptions([]);
    } finally {
      setIsLoadingPatients(false);
    }
  }, []);

  // ── Session selection ─────────────────────────────────────────────────────
  const handleSessionSelect = (session) => {
    if (!session.isActive) return;
    setSelectedSession(session);
  };

  // ── Token click ───────────────────────────────────────────────────────────
  const handleTokenClick = (tokenNumber) => {
    setSelectedTokenNo(tokenNumber);
    const existing = bookedTokens.find(
      (a) => parseInt(a.tokenNo, 10) === tokenNumber
    );

    if (existing) {
      setForm({
        id: existing.id,
        customerName: existing.customerName || "",
        contactNo: existing.contactNo || "",
        customerId: existing.customerId || "",
        tokenNo: tokenNumber,
        remarks: existing.remarks || "",
        appoinmentTreatments:
          existing.appointmentTreatments?.map((t) => ({
            AppoinmentId: t.appointmentId,
            TreatmentTypeId: t.treatmentTypeId,
          })) || [],
        isPatientContacted: existing.isPatientContacted || false,
        chitNo: existing.chitNo,
      });
      setSelectedEventId(existing.id);
    } else {
      setForm({ ...emptyForm, tokenNo: tokenNumber });
      setSelectedEventId(null);
    }
    setModalIsOpen(true);
  };

  // ── Render token grid ─────────────────────────────────────────────────────
  const renderTokens = () => {
    if (!selectedSession) return null;
    const total = selectedSession.maxPatients;
    const rows = Math.ceil(total / COLS);
    const layout = [];

    const filteredBookedTokens = bookedTokens.filter(
      (bt) =>
        bt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bt.contactNo?.includes(searchTerm)
    );

    let tokenNumber = 1;
    for (let r = 0; r < rows; r++) {
      const rowTokens = [];
      for (let c = 0; c < COLS; c++) {
        if (tokenNumber > total) break;
        const current = tokenNumber++;

        const booked = bookedTokens.find(
          (bt) => parseInt(bt.tokenNo, 10) === current
        );

        // If searching, only show matching booked tokens (hide others entirely)
        if (
          searchTerm &&
          !filteredBookedTokens.some(
            (bt) => parseInt(bt.tokenNo, 10) === current
          )
        ) {
          rowTokens.push(null);
          continue;
        }

        let btnClass = "btn-secondary";
        if (booked) {
          btnClass = booked.chitNo
            ? "btn-success"
            : booked.isNeededToFollowUp
            ? "btn-danger"
            : "btn-warning";
        }

        rowTokens.push(
          <div
            key={current}
            className="p-1"
            style={{ flex: `0 0 ${100 / COLS}%` }}
          >
            <button
              className={`btn p-1 ${btnClass}`}
              style={{
                width: "80px",
                height: "80px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                fontWeight: "bold",
                position: "relative",
              }}
              onClick={() => handleTokenClick(current)}
            >
              <span style={{ fontSize: "20px" }}>{current}</span>

              {booked?.chitNo && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "normal",
                    color: "#fff",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    marginTop: "4px",
                  }}
                >
                  Chit: {booked.chitNo}
                </span>
              )}

              {booked?.isPatientContacted && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "6px",
                    color: "blue",
                    fontSize: "20px",
                  }}
                  title="Patient Contacted"
                >
                  ★
                </span>
              )}
            </button>
          </div>
        );
      }

      // Only render row if there's at least one visible token
      if (rowTokens.some((t) => t !== null)) {
        layout.push(
          <div className="d-flex align-items-center mb-2" key={r}>
            <div className="d-flex flex-wrap flex-grow-1">{rowTokens}</div>
          </div>
        );
      }
    }
    return layout;
  };

  // ── Submit booking ────────────────────────────────────────────────────────
  const handleSubmit = async (e, isTokenIssue = false) => {
    if (e) e.preventDefault();
    if (!form.customerName || !form.contactNo) {
      alert("Patient name and contact number are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        Id: form.id ? form.id : 0,
        CustomerName: form.customerName,
        ContactNo: form.contactNo,
        CustomerId: form.customerId ? Number(form.customerId) : null,
        TokenNo: form.tokenNo ? Number(form.tokenNo) : null,
        Remarks: form.remarks,
        ScheduleDate: selectedDate,
        EnteredBy: Number(userId),
        CompanyId: Number(companyId),
        DoctorSessionId: selectedSession.id,
        IsTokenIssued: isTokenIssue,
        IsPatientContacted: form.isPatientContacted,
        appoinmentTreatments: form.appoinmentTreatments,
        FromTime: selectedSession.startTime,
        ToTime: selectedSession.endTime,
        MainTreatmentArea: null,
      };

      await addAppointment(payload);
      const msg = form.id ? "Appointment updated!" : "Appointment booked!";
      setResultModal({ type: "success", message: msg });
      setShowResultModal(true);
      setModalIsOpen(false);
      resetForm();
      await loadTokens(selectedSession.id);
      const updated = await fetchDoctorSessionAvailability(selectedSession.id);
      setAvailability(updated);
    } catch (err) {
      const msg =
        err?.response?.data?.message ?? "Failed to save appointment.";
      setResultModal({ type: "error", message: msg });
      setShowResultModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete appointment ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!form.remarks) {
      alert("Please enter a remark before deleting.");
      return;
    }
    try {
      await deleteAppointment(selectedEventId, userId, form.remarks);
      setIsConfirmDeleteOpen(false);
      setModalIsOpen(false);
      resetForm();
      await loadTokens(selectedSession.id);
      const updated = await fetchDoctorSessionAvailability(selectedSession.id);
      setAvailability(updated);
    } catch {
      alert("Could not delete the appointment. Please try again.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedTokenNo(null);
    setSelectedEventId(null);
    setPatientOptions([]);
  };

  const handleCreateCustomer = async () => {
    try {
      setIsCreatingCustomer(true);
      const res = await createCustomer({
        customerName: newCustomerName,
        phone: newCustomerPhone,
      });
      setForm((prev) => ({
        ...prev,
        customerId: res.data.result.customerId,
        customerName: res.data.result.customerName,
        contactNo: res.data.result.phone,
      }));
      setShowCreateModal(false);
      setNewCustomerPhone("");
    } catch {
      alert("Customer creation failed.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const formatTime = (t) => (t ? t.substring(0, 5) : "");

  const getAvailabilityFillClass = () => {
    if (!availability) return "";
    const pct = availability.booked / availability.maxPatients;
    if (pct >= 1) return "full";
    if (pct >= 0.8) return "almost-full";
    return "";
  };

  return (
    <div className="channeling-container">
      <h2 className="token-header">
        Channeling Appointments —{" "}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded p-1"
        />
      </h2>
      <br />

      <div className="row">
        {/* ── Session list (left column) ─────────────────────────────── */}
        <div className="col-md-3">
          <h6 className="fw-semibold mb-3">
            Sessions ({sessions.length})
          </h6>
          {sessions.length === 0 ? (
            <p className="text-muted">No sessions for this date.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`session-card ${
                  !s.isActive
                    ? "inactive"
                    : selectedSession?.id === s.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleSessionSelect(s)}
              >
                <div className="doctor-name">
                  Dr. {s.doctor?.fullName ?? `Employee #${s.doctorId}`}
                </div>
                <div className="session-time">
                  {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </div>
                <div className="d-flex justify-content-between mt-1 small text-muted">
                  <span>Max: {s.maxPatients}</span>
                  {!s.isActive && (
                    <span className="text-danger">Inactive</span>
                  )}
                </div>
                {selectedSession?.id === s.id && availability && (
                  <>
                    <div className="availability-bar mt-1">
                      <div
                        className={`availability-fill ${getAvailabilityFillClass()}`}
                        style={{
                          width: `${Math.min(
                            (availability.booked / availability.maxPatients) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="small text-muted mt-1">
                      {availability.remaining} remaining / {availability.maxPatients}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Token grid (right) ─────────────────────────────────────── */}
        <div className="col-md-9">
          {selectedSession ? (
            <>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">
                  Dr. {selectedSession.doctor?.fullName ?? `#${selectedSession.doctorId}`}
                  <small className="text-muted ms-2">
                    ({formatTime(selectedSession.startTime)} – {formatTime(selectedSession.endTime)})
                  </small>
                </h5>

                {/* Search bar */}
                <div
                  className="input-group"
                  style={{
                    maxWidth: 360,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderRadius: "10px",
                  }}
                >
                  <span
                    className="input-group-text"
                    style={{
                      backgroundColor: "#f8f9fa",
                      border: "none",
                      borderRight: "1px solid #dee2e6",
                      padding: "8px 12px",
                      borderTopLeftRadius: "10px",
                      borderBottomLeftRadius: "10px",
                    }}
                  >
                    <i className="fas fa-search" style={{ color: "#6c757d" }} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search patient…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: "none", boxShadow: "none" }}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-danger"
                      onClick={() => setSearchTerm("")}
                      style={{
                        borderTopRightRadius: "10px",
                        borderBottomRightRadius: "10px",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="d-flex gap-3 mb-3 small">
                <span>
                  <span className="badge bg-secondary me-1">&nbsp;</span>Free
                </span>
                <span>
                  <span className="badge bg-warning me-1">&nbsp;</span>Booked
                </span>
                <span>
                  <span className="badge bg-success me-1">&nbsp;</span>Token Issued
                </span>
                <span>
                  <span className="badge bg-danger me-1">&nbsp;</span>Follow-up
                </span>
              </div>

              {/* Token grid */}
              {loadingTokens ? (
                <div
                  className="d-flex justify-content-center align-items-center"
                  style={{
                    height: "200px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "12px",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    className="spinner-border"
                    role="status"
                    style={{ width: "3rem", height: "3rem", color: "#28a745" }}
                  />
                  <strong style={{ color: "#495057" }}>Loading Tokens…</strong>
                </div>
              ) : (
                renderTokens()
              )}
            </>
          ) : (
            <div className="text-muted pt-4">
              ← Select a session on the left to view and book appointments.
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => { setModalIsOpen(false); resetForm(); }}
        className="Modal custom-modal"
        overlayClassName="Overlay"
        closeTimeoutMS={300}
        contentLabel="Channeling Appointment"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content custom-modal-content">
            {/* Header */}
            <div className="modal-header custom-modal-header">
              <div className="container-fluid">
                <div className="row">
                  <div className="col-4">
                    <h5 className="modal-title-appointment custom-modal-title-appointment">
                      {form.id ? "Update Appointment" : "Book Appointment"}
                    </h5>
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control"
                      type="text"
                      value={form.tokenNo}
                      readOnly
                      style={{
                        textAlign: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        backgroundColor: "#ffc107",
                      }}
                    />
                  </div>
                  <div className="col-2" style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="close custom-close"
                      style={{ width: "50px" }}
                      onClick={() => { setModalIsOpen(false); resetForm(); }}
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Session info bar */}
            {selectedSession && (
              <div className="px-3 py-2 bg-light border-bottom small text-muted">
                Dr. {selectedSession.doctor?.fullName ?? `#${selectedSession.doctorId}`}
                &nbsp;|&nbsp;{formatTime(selectedSession.startTime)} – {formatTime(selectedSession.endTime)}
                &nbsp;|&nbsp;{selectedDate}
              </div>
            )}

            {/* Body */}
            <form
              onSubmit={(e) => handleSubmit(e, false)}
              className="modal-appoinment-body modal-body custom-modal-body"
            >
              <div className="container-fluid">
                {/* Patient Name */}
                <div className="row">
                  <div className="col-md-6 form-group">
                    <label>
                      Customer Name <span className="text-danger">*</span>
                    </label>
                    <CreatableSelect
                      placeholder="Search or create customer…"
                      isClearable
                      isLoading={isLoadingPatients}
                      options={patientOptions}
                      value={
                        form.customerId
                          ? { value: form.customerId, label: form.customerName }
                          : null
                      }
                      onInputChange={(value) => {
                        handlePatientSearch(value);
                        return value;
                      }}
                      formatCreateLabel={(input) => `➕ Create customer "${input}"`}
                      onChange={(selected) => {
                        if (!selected) {
                          setForm((prev) => ({
                            ...prev,
                            customerName: "",
                            customerId: "",
                            contactNo: "",
                          }));
                          return;
                        }
                        if (selected.__isNew__) {
                          setNewCustomerName(selected.label);
                          setNewCustomerPhone("");
                          setShowCreateModal(true);
                          return;
                        }
                        setForm((prev) => ({
                          ...prev,
                          customerName: selected.customerName,
                          customerId: selected.customerId,
                          contactNo: selected.contactNo,
                        }));
                      }}
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className="col-md-6 form-group">
                    <label>
                      Contact Number <span className="text-danger">*</span>
                    </label>
                    <input
                      className="form-control"
                      type="text"
                      value={form.contactNo}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, contactNo: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* Treatments */}
                <div className="row mt-2">
                  <div className="col-12 form-group">
                    <label>Treatments</label>
                    <select
                      className="form-select"
                      multiple
                      style={{ height: 90 }}
                      value={form.appoinmentTreatments.map((t) =>
                        String(t.TreatmentTypeId)
                      )}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                          (o) => ({
                            AppoinmentId: form.id || 0,
                            TreatmentTypeId: Number(o.value),
                          })
                        );
                        setForm((prev) => ({
                          ...prev,
                          appoinmentTreatments: selected,
                        }));
                      }}
                    >
                      {treatmentTypes.map((t) => (
                        <option key={t.id} value={String(t.id)}>
                          {t.name}
                          {t.treatmentShortCode ? ` - ${t.treatmentShortCode}` : ""}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Hold Ctrl/Cmd to select multiple
                    </small>
                  </div>
                </div>

                {/* Remarks */}
                <div className="row mt-2">
                  <div className="col-12 form-group">
                    <label>Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={form.remarks}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, remarks: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Patient Contacted toggle */}
                <div className="row mt-2">
                  <div className="col-md-3 form-group">
                    <label className="form-check-label" style={{ color: "red" }}>
                      Patient Contacted
                    </label>
                  </div>
                  <div className="col-md-6 form-group form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={form.isPatientContacted}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isPatientContacted: e.target.checked,
                        }))
                      }
                    />
                  </div>
                </div>

                {form.chitNo != null && (
                  <div className="row mt-1">
                    <div className="col-12">
                      <label style={{ fontSize: "18px", fontWeight: "bold", color: "red" }}>
                        Chit No: {form.chitNo}
                      </label>
                    </div>
                  </div>
                )}

                <br />

                {/* Footer buttons */}
                <div className="custom-modal-footer row">
                  <div className="col-6 p-2">
                    <button
                      type="button"
                      className="btn btn-danger w-100"
                      disabled={!form.id || form.chitNo != null || isSubmitting}
                      onClick={() => setIsConfirmDeleteOpen(true)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="col-6 p-2">
                    <button
                      type="submit"
                      className="btn btn-success w-100"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving…" : form.id ? "Update" : "Create"}
                    </button>
                  </div>
                </div>

                <div className="custom-modal-footer row">
                  <div className="col-12 p-2">
                    <button
                      type="button"
                      className="btn btn-secondary w-100"
                      disabled={!form.id || form.chitNo != null || isSubmitting}
                      onClick={(e) => handleSubmit(e, true)}
                    >
                      Issue Token
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* ── Create customer modal ──────────────────────────────────────────── */}
      <CreateCustomerModal
        show={showCreateModal}
        customerName={newCustomerName}
        setCustomerName={setNewCustomerName}
        phone={newCustomerPhone}
        setPhone={setNewCustomerPhone}
        loading={isCreatingCustomer}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCustomer}
      />

      {/* ── Delete confirmation ────────────────────────────────────────────── */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      {/* ── Success / Error result modal ───────────────────────────────────── */}
      <AppointmentModalComponent
        show={showResultModal}
        onClose={() => setShowResultModal(false)}
        type={resultModal.type}
        message={resultModal.message}
      />
    </div>
  );
};

export default ChannelingAppointment;
