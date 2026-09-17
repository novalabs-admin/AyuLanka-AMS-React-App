// src/api.js
import axios from "axios";

// Import URL from config file
const baseUrl = process.env.REACT_APP_API_BASEURL;
const sublink = process.env.REACT_APP_API_SUBLINK;

// Construct the base API URL
export const API_BASE_URL = `${baseUrl}${sublink}`;

// Create an Axios instance configured with the base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

export const searchPatients = async (keyword) => {
  const companyCode = sessionStorage.getItem("companyCode");
  const params = { keyword };
  if (companyCode) params.companyCode = companyCode;
  const res = await api.get("/appointmentschedule/patientsearch", { params });
  return res.data;
};

export const createCustomer = async (payload) => {
  try {
    const companyCode = sessionStorage.getItem("companyCode");
    const enriched = { ...payload, companyCode: companyCode ?? null };
    const response = await api.post(`/appointmentschedule/create-customer`, enriched);
    return response.data;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const fetchPatientSearch = async (keyword) => {
  try {
    const response = await api.get(`/patients/search?keyword=${keyword}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching patients:", error);
    throw error;
  }
};

export const fetchPatientProfile = async (id) => {
  try {
    const response = await api.get(`/patients/${id}/profile`);
    return response.data;
  } catch (error) {
    console.error("Error fetching patients:", error);
    throw error;
  }
};

// Fetch Employees from the server
export const fetchEmployees = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/employee", { params });
    return response.data;  // Assuming the response data contains the array of employees
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;  // Re-throw the error for further handling
  }
};

// Fetch treatment types from the server
export const fetchTreatmentTypes = async () => {
  try {
    const response = await api.get("/treatmenttype");
    return response.data;  // Assuming the response data contains the array of shifts
  } catch (error) {
    console.error("Error fetching treatment types:", error);
    throw error;
  }
};

// Fetch treatment locations from the server
export const fetchAllLocations = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/location", { params });
    return response.data;  // Assuming the response data contains the array of shifts
  } catch (error) {
    console.error("Error fetching treatment locations:", error);
    throw error;
  }
};

export const fetchEliteCareTreatmentLocations = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/location/elitecare", { params });
    return response.data;  // Assuming the response data contains the array of shifts
  } catch (error) {
    console.error("Error fetching treatment locations:", error);
    throw error;
  }
};

// Fetch treatment locations from the server
export const fetchPrimeCareTreatmentLocations = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/location/primecare", { params });
    return response.data;  // Assuming the response data contains the array of shifts
  } catch (error) {
    console.error("Error fetching treatment locations:", error);
    throw error;
  }
};

// Submit an Appointment to the server
export const addAppointment = async (appointment) => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    // Always ensure CompanyId is set — callers that already include it are not overwritten
    // (they'd have the same value); callers that omit it (TokenGenerate, appointmentScheduler,
    // appointmentSchedulerPrimeCare) get it injected here.
    const payload = {
      ...appointment,
      CompanyId: appointment.CompanyId || appointment.companyId || (companyId ? Number(companyId) : 0),
    };
    const response = await api.post("/appointmentschedule", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

export const fetchAppointmentDetails = async (id) => {
  try {
    const response = await api.get(`/appointmentschedule/${id}`);
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

export const fetchEmployeeSchedule = async (id, scheduledate) => {
  try {
    const encodedDate = encodeURIComponent(scheduledate);
    const response = await api.get(`/staffroster/employeeschedule/${id}?scheduledate=${encodedDate}`);
    return response.data;  // Assuming the API returns the data or a clear message
  } catch (error) {
    if (error.response) {
      // Handle HTTP errors that are responded by the server
      console.error("Error fetching schedule:", error.response.data);
      if (error.response.status === 404) {
        // Handle not found error specifically
        alert(error.response.data); // Or show a notification
      }
    } else {
      // Handle errors in setting up the request or client side issues
      console.error("Error in request setup:", error.message);
    }
    throw error; // You can still throw the error to be handled by the caller or in global error handling
  }
};

export const fetchAppointments = async () => {
  try {
    const response = await api.get("/appointmentschedule");
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

// Fetch treatment types from the server by location
export const fetchTreatmentTypesByLocation = async () => {
  try {
    const response = await api.get(`/treatmenttype`);
    return response.data;
  } catch (error) {
    console.error("Error fetching treatment types:", error);
    throw error;
  }
};

export const deleteAppointment = async (appointmentId, userId, remark) => {
  try {
    const response = await api.delete(`/appointmentschedule/${appointmentId}?deletedByUserId=${userId}&remark=${remark}`);
    return response.data;  // Assuming the response data is the confirmation of deletion
  } catch (error) {
    console.error("Error deleting appointment:", error);
    if (error.response) {
      // Handle HTTP errors that are responded by the server
      console.error("Server responded with:", error.response.data);
      if (error.response.status === 404) {
        // Handle not found error specifically
        alert("Appointment not found."); // or use a more sophisticated error handling/notification system
      }
    } else {
      // Handle errors in setting up the request or client side issues
      console.error("Error in request setup:", error.message);
    }
    throw error; // Re-throw the error to allow calling code to handle it further if necessary
  }
};

export const fetchDayOffsData = async (date) => {
  try {
    const response = await api.get(`/staffroster/getdayoffsbydate/${date}`);
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching day offs:", error);
    throw error;
  }
};

export const fetchAppoitmentByDate = async (date) => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get(`/AppointmentSchedule/ByDate/${date}`, { params });
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching day offs:", error);
    throw error;
  }
};

export const fetchPrimeCareAppoitmentByDate = async (date) => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get(`/AppointmentSchedule/PrimeCareByDate/${date}`, { params });
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching day offs:", error);
    throw error;
  }
};

export const fetchDeletedAppoitmentByDate = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const companyId = sessionStorage.getItem("companyId");
  try {
    const params = {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
    };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/DeletedAppointmentsByDateRange`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching deleted appointments:", error);
    throw error;
  }
};

export const fetchAppointmentsByDateRange = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const companyId = sessionStorage.getItem("companyId");

  try {
    const params = {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
    };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/bydaterange`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointmentschedule:", error);
    throw error;
  }
};

export const fetchAllAppointmentsByDateRange = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const companyId = sessionStorage.getItem("companyId");

  try {
    const params = {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
    };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/allbydaterange`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointmentschedule:", error);
    throw error;
  }
};

export const fetchAllDashboardChartsDatabyDateRange = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  // Ensure startDate and endDate are valid Date objects
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  try {
    const response = await api.get(`/appointmentschedule/dashboardchartsdatabydaterange`, {
      params: {
        startDate: start.toISOString().substring(0, 10), // Format as YYYY-MM-DD
        endDate: end.toISOString().substring(0, 10)      // Format as YYYY-MM-DD
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointmentschedule:", error);
    throw error;
  }
};

export const fetchDashboardSummaryByDateRange = async (startDate, endDate, category) => {
  console.log(startDate, ' ', endDate, ' ', category)
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  try {
    const response = await api.get(`/appointmentschedule/dashboardSummaryByDateRange`, {
      params: {
        startDate: start.toISOString().substring(0, 10), 
        endDate: end.toISOString().substring(0, 10), 
        category     // Format as YYYY-MM-DD
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching DashboardSummaryByDate:", error);
    throw error;
  }
};

export const fetchDashboardDetailsByDate = async (date, category, type) => {
  console.log(date, ' ', category, ' ', type)
  const formattedDate =
  typeof date === "string"
    ? date
    : date.toISOString().substring(0, 10);

  try {
    const response = await api.get(`/appointmentschedule/dashboarddetailsbydate`, {
      params: {
        date: formattedDate, category, type
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboarddetailsbydate:", error);
    throw error;
  }
};

export const fetchCustomerProfile = async (id) => {
  try {
    const response = await api.get(
      `/appointmentschedule/customerprofile`,
      { params: { customerId: id } }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching customer profile:", error);
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

export const fetchPrimeCareAppointmentsByDateRange = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const companyId = sessionStorage.getItem("companyId");

  try {
    const params = { startDate: start, endDate: end };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/primecarebydaterange`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointmentschedule:", error);
    throw error;
  }
};

export const fetchTokensByDate = async (scheduledDate) => {
  console.log(scheduledDate)

  // Ensure startDate and endDate are valid Date objects
  const scDate = typeof scheduledDate === "string" ? new Date(scheduledDate) : scheduledDate;
  const companyId = sessionStorage.getItem("companyId");

  try {
    const params = { date: scDate.toISOString().substring(0, 10) };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/tokensbydate`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointmentschedule:", error);
    throw error;
  }
};

export const fetchIssuedTokens = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get(`/appointmentschedule/issuedtokens`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching treatment types:", error);
    throw error;
  }
};

export const fetchAllPreScheduledScheduledAppointmentsByDateRange = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const companyId = sessionStorage.getItem("companyId");

  try {
    const params = {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
    };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/getAllPreScheduledScheduledAppointments`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching getAllPreScheduledScheduledAppointments:", error);
    throw error;
  }
};

export const fetchCompletedAppointmentsByDateRange = async (startDate, endDate) => {
  console.log(startDate, ' ', endDate)

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const companyId = sessionStorage.getItem("companyId");

  try {
    const params = {
      startDate: start.toISOString().substring(0, 10),
      endDate: end.toISOString().substring(0, 10),
    };
    if (companyId) params.companyId = companyId;
    const response = await api.get(`/appointmentschedule/getCompletedPreScheduledScheduledAppointments`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching getCompletedPreScheduledScheduledAppointments:", error);
    throw error;
  }
};

export const fetchAppointmentsByDoctorSession = async (sessionId) => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get(`/appointmentschedule/ByDoctorSession/${sessionId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching appointments by doctor session:", error);
    throw error;
  }
};

export const fetchDoctorChannelingLocations = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/location/doctorechanneling", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor channeling locations:", error);
    throw error;
  }
};

export const fetchDoctorChannelingAppointmentsByDateRange = async (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const companyId = sessionStorage.getItem("companyId");
  try {
    const params = { startDate: start, endDate: end };
    if (companyId) params.companyId = companyId;
    const response = await api.get("/appointmentschedule/doctorechannelingbydaterange", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor channeling appointments:", error);
    throw error;
  }
};

export const fetchLeaveData = async (date) => {
  try {
    const response = await api.get(`/staffleave/getleavesbydate/${date}`);
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
};

export const fetchShiftsData = async (date) => {
  try {
    const response = await api.get(`/staffroster/getworkingshiftssbydate/${date}`);
    return response.data;  // Assuming the API returns an array of appointments
  } catch (error) {
    console.error("Error fetching shifts:", error);
    throw error;
  }
};
