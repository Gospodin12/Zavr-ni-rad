import axios from "axios";

const API_URL = "http://localhost:3000/scenarios";

export const scenarioService = {
  async getScenario(movieId: string) {
    const res = await axios.get(`${API_URL}/${movieId}`);
    return res.data;
  },

  async uploadScenario(file: File, movieId: string, token: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("movieId", movieId);
    formData.append("title", "Scenario");
    formData.append("description", "Scenario filma");

    const res = await axios.post(`${API_URL}/add`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },
};
