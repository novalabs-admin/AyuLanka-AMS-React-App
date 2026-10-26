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

export const searchCities = async (keyword, limit = 20) => {
  const params = { keyword, limit };
  const res = await api.get("/Geography/search-cities", { params });
  return res.data;
};
