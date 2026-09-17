import React, { useState, useEffect } from "react";
import "./doctorSessionManager.css";
import {
  fetchDoctorSessions,
  createDoctorSession,
  updateDoctorSession,
} from "../../services/doctorSessionApi";
import { fetchEmployees } from "../../services/appointmentSchedulerApi";

const emptyForm = {
  doctorId: "",
  sessionDate: "",
  startTime: "",
  endTime: "",
  maxPatients: "",
  remarks: "",
  isActive: true,
};

const DoctorSessionManager = () => {
  const [sessions, setSessions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [sessionsData, employeesData] = await Promise.all([
        fetchDoctorSessions(filterDate || null),
        fetchEmployees(),
      ]);
      setSessions(sessionsData);
      const docs = employeesData.filter(
        (e) => e.designation?.designationCode === "ADT"
      );
      setDoctors(docs);
    } catch (err) {
      setError("Failed to load data.");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.endTime <= form.startTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        doctorId: Number(form.doctorId),
        maxPatients: Number(form.maxPatients),
      };
      if (editingId) {
        await updateDoctorSession(editingId, { ...payload, id: editingId });
        setSuccess("Session updated successfully.");
      } else {
        await createDoctorSession(payload);
        setSuccess("Session created successfully.");
      }
      setForm(emptyForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to save session. Please check all fields.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session) => {
    setEditingId(session.id);
    setForm({
      doctorId: session.doctorId,
      sessionDate: session.sessionDate?.substring(0, 10) ?? "",
      startTime: session.startTime ?? "",
      endTime: session.endTime ?? "",
      maxPatients: session.maxPatients,
      remarks: session.remarks ?? "",
      isActive: session.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const formatTime = (t) => (t ? t.substring(0, 5) : "");

  return (
    <div className="doctor-session-container">
      <h2>Doctor Session Management</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form */}
      <div className="session-form-card">
        <h5>{editingId ? "Edit Session" : "Create New Session"}</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Doctor</label>
              <select
                className="form-select"
                name="doctorId"
                value={form.doctorId}
                onChange={handleChange}
                required
              >
                <option value="">Select Doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Session Date</label>
              <input
                type="date"
                className="form-control"
                name="sessionDate"
                value={form.sessionDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                className="form-control"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-control"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Max Patients</label>
              <input
                type="number"
                className="form-control"
                name="maxPatients"
                value={form.maxPatients}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isActive"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="isActive">
                  Active
                </label>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Remarks</label>
              <input
                type="text"
                className="form-control"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                maxLength={500}
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Session" : "Create Session"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Sessions table */}
      <div className="session-table-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Sessions</h5>
          <div className="d-flex align-items-center gap-2">
            <label className="mb-0">Filter by Date:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ width: 160 }}
            />
            {filterDate && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setFilterDate("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Time</th>
                <th>Max</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.sessionDate?.substring(0, 10)}</td>
                    <td>{s.doctor?.fullName ?? `#${s.doctorId}`}</td>
                    <td>
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </td>
                    <td>{s.maxPatients}</td>
                    <td>
                      {s.isActive ? (
                        <span className="badge-available">Active</span>
                      ) : (
                        <span className="badge-full">Inactive</span>
                      )}
                    </td>
                    <td>{s.remarks}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(s)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorSessionManager;
