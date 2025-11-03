import axios from "axios";

const API_URL = "http://localhost:3000/books";

export const bookService = {
  async getBook(movieId: string) {
    const res = await axios.get(`${API_URL}/${movieId}`);
    return res.data;
  },

  async uploadBook(file: File, movieId: string, token: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("movieId", movieId);
    formData.append("title", "Book");
    formData.append("description", "Knjiga filma");

    const res = await axios.post(`${API_URL}/add`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  // ✅ Create an empty book (no file upload)
  async createEmptyBook(movieId: string, token: string) {
    const res = await axios.post(
      `${API_URL}/create-empty`,
      { movieId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },
};
