// services/authService.ts
import axios from "axios";

const API_URL = "http://localhost:3000/auth";

export async function login(credentials: { email: string; password: string }) {
  const response = await axios.post(`${API_URL}/login`, credentials, { responseType: "text" });
  localStorage.setItem("token", response.data);
  return response.data;
}

export async function getUserInfo(token: string) {
  const response = await axios.get(`${API_URL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(response.data)
  return response.data;
}

export async function getAllUsers(token: string) {
  const response = await axios.get(`${API_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}


export async function registerUser(formData: FormData) {
  const response = await axios.post(`${API_URL}/register`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // <-- No token storage
}