import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { noteService } from "../../services/noteService";
import { commentService } from "../../services/commentService";
import "./ASpecificNotePage.css";
import noUser from "../../assets/noUser.png";
import { backgroundService } from "../../services/backgroundService";
export default function ASpecificNotePage() {
  const { noteId, movieId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  const [note, setNote] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }  
    backgroundService.changeBackgroundPerUser(token,movieId,navigate)
    const fetchData = async () => {
      try {
        if (!noteId) return;
        const noteData = await noteService.getNoteById(token, noteId);
        const commentsData = await commentService.getCommentsForNote(noteId, token);
        setNote(noteData.note || noteData);
        setComments(commentsData);
      } catch (err) {
        console.error("❌ Error fetching note or comments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [noteId, token]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const comment = await commentService.addComment(noteId!, newComment, token);
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      console.error("❌ Error adding comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId, token);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("❌ Error deleting comment:", err);
    }
  };

  if (loading) return <div>Učitavanje...</div>;
  if (!note) return <div>Beleška nije pronađena.</div>;

  const priorityColors: any = {
    high: { text: "Kritično", color: "#dc3545" },
    medium: { text: "Srednje", color: "#ffc107" },
    low: { text: "Malo", color: "#28a745" },
  };
  const getPriorityClass = (priority: string) => {
    if (priority.toLowerCase().includes("high")) return "priority-critical-note-one";
    if (priority.toLowerCase().includes("medium")) return "priority-medium-note-one";
    return "priority-low-note-one";
  };
  const priority = priorityColors[note.priority?.toLowerCase()] || priorityColors.low;
  //box-shadow: 0 0 25px 5px rgba(255, 0, 0, 0.6);

  return (
    <div className="one-note-container-comment">
      <Navbar />

      <div className="note-content-comment" style={
        { 
          borderColor: priority.color 
        }
        }>
        {/* Title + Creator */}
        <div className="note-header">
          <h1>{note.title}</h1>
          <div className="creator-info">
            <img
              src={note.createdBy?.picture || noUser}
              alt={note.createdBy?.name}
              className="creator-pic"
            />
            <div className="creator-name">
              <strong>{note.createdBy?.name} {note.createdBy?.lastName}</strong>
            </div>
          </div>
        </div>

        {/* Priority badge */}
        <div
          className="priority-badge"
          style={{ backgroundColor: priority.color }}
        >
          {priority.text}
        </div>

        {/* Main note content */}
        <div className="note-text">
          <h2>Tekst</h2> {/* DODATO: Naslov "Tekst" */}
          <p className="note-main-text"><i>,,{note.text}''</i></p>
        </div>

        <div className="note-details">
          <p><strong>Opis:</strong> {note.description}</p>
          <p><strong>Kategorija:</strong> {note.category}</p>
          <p><strong>Strana:</strong> {note.page}</p>
        </div>

        {/* Assigned Users */}
{/* Assigned Users */}
        <div className="assigned-users">
        <h3>Dodeljeni članovi</h3>
          <div className="assigned-list">
            {note.assignedTo?.length > 0 ? ( // Check if there are assigned users
              note.assignedTo.map((u: any) => (
                <div key={u._id} className="assigned-user-card">
                  <img src={u.picture || noUser} alt={u.name} />
                  <span>{u.name} {u.lastName}</span>
                </div>
              ))
            ) : (
          <p>Nema dodeljenih članova.</p> // Display this if the array is empty
          )}
          </div>
        </div>

        {/* Comments */}
        <div className="comments-section">
          <h2>Komentari</h2>

          {comments.length === 0 ? (
            <p>Nema komentara još.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="comment-card-full">
                <div className="comment-user">
                  <img src={c._user_id?.picture || noUser} alt={c._user_id?.name} />
                  <div>
                    <strong>{c._user_id?.name} {c._user_id?.lastName}</strong>
                  </div>
                </div>
                <p className="comment-text">{c.text}</p>
                <p className="comment-date">{new Date(c.createdAt).toLocaleString("sr-RS")}</p>

                {c._user_id?._id === JSON.parse(atob(token.split(".")[1])).id && (
                  <button
                    className="delete-comment-btn"
                    onClick={() => handleDeleteComment(c._id)}
                  >
                    Obriši
                  </button>
                )}
              </div>
            ))
          )}

          {/* Add Comment */}
          <div className="MoveDown">
            <div className="add-comment">
              <textarea
                placeholder="Napiši komentar..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={handleAddComment}>Pošalji</button>
              <div className="bottom-link">
                <button
                  onClick={() => {
                    // Save text & page info for highlighting
                    localStorage.setItem(
                      "highlightData",
                      JSON.stringify({
                        movieId,
                        text: note.text,
                        page: note.page,
                      })
                    );

                    // Open scenario in a new tab
                    navigate(`/${movieId}/scenario`);
                  }}
                >
                  Pogledaj scenario
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Link to Scenario */}

      </div>
    </div>
  );
}
