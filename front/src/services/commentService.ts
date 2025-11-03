import axios from "axios";

const API_URL = "http://localhost:3000/comments";

export const commentService = {
  // ✅ Get all comments for a note (ordered by date)
  getCommentsForNote: async (noteId: string, token: string) => {
    const res = await axios.get(`${API_URL}/${noteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.comments;
  },

  // ✅ Add a new comment
  addComment: async (noteId: string, text: string, token: string) => {
    const res = await axios.post(
      API_URL,
      { noteId, text },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data.comment;
  },

  // ✅ Delete a comment by ID
  deleteComment: async (commentId: string, token: string) => {
    const res = await axios.delete(`${API_URL}/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};
