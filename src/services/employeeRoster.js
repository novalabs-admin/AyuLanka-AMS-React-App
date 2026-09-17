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

// Fetch Employees from the server
export const fetchEmployees = async () => {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/employee", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

// Fetch Shifts from the server
export const fetchShifts = async () => {
  try {
    const response = await api.get("/shiftmaster");
    return response.data;  // Assuming the response data contains the array of shifts
  } catch (error) {
    console.error("Error fetching shifts:", error);
    throw error;
  }
};

// Fetch Leave Data from the server
export const fetchLeaves = async (startDate, endDate) => {
    try {
      const companyId = sessionStorage.getItem("companyId");
      const params = {
        startDate: startDate.toISOString().substring(0, 10),
        endDate: endDate.toISOString().substring(0, 10)
      };
      if (companyId) params.companyId = companyId;
      const response = await axios.get(`${API_BASE_URL}/staffleave/bydaterange`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching leaves:", error);
      throw error;
    }
  };

// Save roster data to the server
export const saveRoster = async (rosterData) => {
    try {
      const response = await api.post("/staffroster", rosterData);  // Endpoint to save roster data
      return response.data;
    } catch (error) {
      console.error("Error saving roster data:", error);
      throw error;
    }
  };

  // Fetch Shifts from the server
export const fetchRosterDates = async () => {
    try {
      const companyId = sessionStorage.getItem("companyId");
      const params = companyId ? { companyId } : {};
      const response = await api.get("/staffroster/dates", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching staff roster dates:", error);
      throw error;
    }
};

// Fetch Roster Details by ID
export const fetchRosterDetails = async (rosterMasterId) => {
    try {
      const response = await api.get(`/staffroster/${rosterMasterId}`);
      return response.data; // Assuming the response data contains the details of the roster
    } catch (error) {
      console.error("Error fetching roster details:", error);
      throw error;  // Re-throw the error for further handling
    }
};

// Update Roster by ID
export const updateRoster = async (rosterId, rosterData) => {
    try {
      const response = await api.put(`/staffroster/${rosterId}`, rosterData);
      return response.data;  // Assuming the response data contains the updated roster details
    } catch (error) {
      console.error("Error updating roster:", error);
      throw error;  // Re-throw the error for further handling
    }
};

export async function fetchApprovedRosters() {
    // Fetch approved rosters from the server
    return [
        { id: 1, startDate: '2024-01-01', endDate: '2024-12-31' }
    ];
}

export const fetchEmployeeDayOffs = async (employeeId, rosterMasterId) => {
  try {
    const response = await api.get(`/staffroster/approvedDates/${employeeId}/${rosterMasterId}`);
    return response.data; // Assuming the response data contains the day offs for the specified employee and roster
  } catch (error) {
    console.error("Error fetching employee day offs:", error);
    throw error;  // Re-throw the error for further handling
  }
};

export const fetchEmployeeShifts = async (employeeId, rosterMasterId) => {
  try {
    const response = await api.get(`/staffroster/approvedDates/${employeeId}/${rosterMasterId}`);
    return response.data; // Assuming the response data contains the day offs for the specified employee and roster
  } catch (error) {
    console.error("Error fetching employee day offs:", error);
    throw error;  // Re-throw the error for further handling
  }
};

export async function updateDayOff(data) {
  try {
    const response = await api.post("/dayoffchangemaster", data);  // Endpoint to save roster data
    return response.data;
  } catch (error) {
    console.error("Error saving change day off data:", error);
    throw error;
  }
}


// Update Roster by ID
export const updateShift = async (data) => {
  try {
    const response = await api.post("/shiftchangemaster", data);
    return response.data;  // Assuming the response data contains the updated roster details
  } catch (error) {
    console.error("Error saving change shift data:", error);
    throw error;  // Re-throw the error for further handling
  }
};

export async function getPendingDayOffs() {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/dayoffchangemaster", { params });
    return response.data;
  } catch (error) {
    console.error("Error getting day off data:", error);
    throw error;
  }
}

export async function getPendingShifts() {
  try {
    const companyId = sessionStorage.getItem("companyId");
    const params = companyId ? { companyId } : {};
    const response = await api.get("/shiftchangemaster", { params });
    return response.data;
  } catch (error) {
    console.error("Error getting shift data:", error);
    throw error;
  }
}

export const updateDayOffApproval = async (id, isApproved) => {
  const response = await fetch(`/dayoffs/${id}/approval`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ isApproved })
  });
  if (!response.ok) throw new Error('Failed to update');
  return await response.json();
};
