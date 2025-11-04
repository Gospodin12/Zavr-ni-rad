import axios from "axios";

const API_URL = "http://localhost:3000/books";

export const bookService = {
  async getBook(movieId: string) {
    const res = await axios.get(`${API_URL}/${movieId}`);
    return res.data;
  },

async uploadBook(file: File, movieId: string, token: string) {
  const formData = new FormData();
  console.log(movieId,file)
  formData.append("movieId", movieId); // 🔹 prvo ovo
  formData.append("file", file);       // 🔹 pa tek onda fajl
  console.log(formData)
  const res = await axios.post(`${API_URL}/add`, formData, {
    headers: {
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

  updateBookContent: async (movieId: string, htmlContent: string, token: string) => {
    return axios.put(
      `http://localhost:3000/books/update/${movieId}`,
      { content: htmlContent },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

};

