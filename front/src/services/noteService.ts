import axios from "axios";
const API_URL = "http://localhost:3000/notes";

export const noteService = {
  createNote: (data: any, token: any) =>
    axios
      .post(API_URL, data, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data),

  getNotesForUser: (token: any) =>
    axios
      .get(API_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data),

  // ✅ NEW FUNCTION — get all notes for scenario text highlighting
  getAllNotes: (token: any) =>
    axios
      .get(`${API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data),

  getMyNotes: (token: any,movieId:any) =>
    axios
      .get(`${API_URL}/mine/`+movieId, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data),

  getNoteById: (token:any,noteId:any) =>
      axios
        .get(`http://localhost:3000/notes/${noteId}`, {headers: { Authorization: `Bearer ${token}` }})
        .then((res)=> res.data)


};