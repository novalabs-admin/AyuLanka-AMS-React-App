import axios from "axios";

const baseUrl = process.env.REACT_APP_API_BASEURL;
const sublink = process.env.REACT_APP_API_SUBLINK;
export const API_BASE_URL = `${baseUrl}${sublink}`;

const api = axios.create({ baseURL: API_BASE_URL });

// Fetch all sessions, optionally filtered by companyId and/or date
export const fetchDoctorSessions = async (date = null) => {
  const companyId = sessionStorage.getItem("companyId");
  const params = {};
  if (companyId) params.companyId = companyId;
  if (date) params.date = typeof date === "string" ? date : date.toISOString().substring(0, 10);
  const response = await api.get("/DoctorSession", { params });
  return response.data;
};

// Fetch a single session by id
export const fetchDoctorSessionById = async (id) => {
  const response = await api.get(`/DoctorSession/${id}`);
  return response.data;
};

// Fetch availability (booked/remaining) for a session
export const fetchDoctorSessionAvailability = async (id) => {
  const response = await api.get(`/DoctorSession/${id}/Availability`);
  return response.data;
};

// Fetch sessions by doctor, optionally filtered by date
export const fetchSessionsByDoctor = async (doctorId, date = null) => {
  const params = {};
  if (date) params.date = typeof date === "string" ? date : date.toISOString().substring(0, 10);
  const response = await api.get(`/DoctorSession/ByDoctor/${doctorId}`, { params });
  return response.data;
};

// Ensure TimeSpan-compatible format "HH:MM:SS" (backend rejects "HH:MM")
const toTimeSpan = (t) => {
  if (!t) return t;
  return t.length === 5 ? t + ":00" : t;  // "09:00" → "09:00:00"
};

// Create a new doctor session
export const createDoctorSession = async (session) => {
  const companyId = sessionStorage.getItem("companyId");
  const createdBy = sessionStorage.getItem("userId");
  const payload = {
    ...session,
    startTime: toTimeSpan(session.startTime),
    endTime: toTimeSpan(session.endTime),
    companyId: Number(companyId),
    createdBy: Number(createdBy),
  };
  const response = await api.post("/DoctorSession", payload);
  return response.data;
};

// Update an existing doctor session
export const updateDoctorSession = async (id, session) => {
  const payload = {
    ...session,
    startTime: toTimeSpan(session.startTime),
    endTime: toTimeSpan(session.endTime),
  };
  const response = await api.put(`/DoctorSession/${id}`, payload);
  return response.data;
};
