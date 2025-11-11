import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import { noteService } from "../../services/noteService";
import { getMovieById, getUserRoleForMovie } from "../../services/movieService";
import "./AllNotePage.css";
import { backgroundService } from "../../services/backgroundService";

export default function AllNotePage() {
  const { movieId } = useParams();
  const [notes, setNotes] = useState<any[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<any[]>([]);
  const [movie, setMovie] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<number[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const ROLE_CATEGORIES: Record<number, string[]> = {
    1: ["Scenario", "Rezija", "Gluma", "Snimanje", "Montaza", "Scenografija"],
    2: ["Scenario", "Gluma"],
    3: ["Scenario", "Snimanje", "Scenografija"],
    4: ["Scenario", "Scenografija"],
    5: ["Scenario", "Montaza", "Snimanje"],
  };

  const getPriorityClass = (priority: string) => {
    if (priority?.toLowerCase().includes("high")) return "priority-critical";
    if (priority?.toLowerCase().includes("medium")) return "priority-medium";
    return "priority-low";
  };

  const getPriorityTextClass = (priority: string) => {
    if (priority?.toLowerCase().includes("high")) return "priority-critical-text";
    if (priority?.toLowerCase().includes("medium")) return "priority-medium-text";
    return "priority-low-text";
  };

  const getPriorityText = (priority: string) => {
    if (priority?.toLowerCase().includes("high")) return "Kritično!";
    if (priority?.toLowerCase().includes("medium")) return "Srednje";
    return "Manje bitno";
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    backgroundService.changeBackgroundPerUser(token, movieId, navigate);

    async function fetchData() {
      if (!token) return;
      try {
        const movieData = await getMovieById(token + "", movieId + "");
        setMovie(movieData);

        const rolesData = await getUserRoleForMovie(token, movieId + "");
        const roles = Array.isArray(rolesData)
          ? rolesData.map((r: any) => r.role)
          : [rolesData.role];
        setUserRoles(roles);

        let data;
        if (roles.includes(1)) {
          // Director → fetch ALL notes for the movie
          data = await noteService.getAllNotesForMovie(token, movieId);
        } else {
          // Others → fetch only their notes
          data = await noteService.getMyNotes(token, movieId);
        }
        setNotes(data.notes);
        setFilteredNotes(data.notes);
      } catch (err) {
        console.error("❌ Error loading notes or roles:", err);
      }
    }

    fetchData();
  }, [token, movieId]);

  // ✅ Filter logic
  useEffect(() => {
    let filtered = notes;

    // Only categories allowed by user roles
    const allowedCategories = Array.from(
      new Set(userRoles.flatMap((r) => ROLE_CATEGORIES[r] || []))
    );

    if (!userRoles.includes(1)) {
      filtered = filtered.filter(
        (n) =>
          allowedCategories.includes(n.category) ||
          allowedCategories.length === 0 // fallback for admins or undefined
      );
    }

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== "") {
      filtered = filtered.filter((n) => n.category === filterCategory);
    }

    if (filterPriority !== "") {
      filtered = filtered.filter((n) =>
        n.priority.toLowerCase().includes(filterPriority.toLowerCase())
      );
    }

    setFilteredNotes(filtered);
  }, [searchTerm, filterCategory, filterPriority, notes, userRoles]);

  // ✅ Dropdown options only for allowed categories
  const allowedCategories = Array.from(
    new Set(userRoles.flatMap((r) => ROLE_CATEGORIES[r] || []))
  );

  return (
    <div className="all-notes-container">
      <Navbar />

      <div className="notes-section-all">
        <h1 className="notes-title-all">Sve beleške</h1>

        {/* ✅ Filter Bar */}
        <div className="filters-all">
          <input
            type="text"
            placeholder="🔍 Pretraži po naslovu ili opisu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Sve kategorije</option>
            {allowedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">Svi prioriteti</option>
            <option value="high">Visok</option>
            <option value="medium">Srednji</option>
            <option value="low">Nizak</option>
          </select>
        </div>

        {/* ✅ Notes List */}
        <div className="notes-list-all">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className={`note-card-all ${getPriorityClass(note.priority)}`}
              onClick={() => navigate(`/${movieId}/beleska/${note._id}`)}
            >
              <img
                src={note.createdBy?.picture || "https://via.placeholder.com/100"}
                alt={note.createdBy?.name}
                className="note-author-img-all"
              />
              <div className="note-content-all">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <small className="Autor-note-all">
                  <strong>Kategorija:</strong> {note.category}
                  <strong className="AutorRight">Autor:</strong>{" "}
                  {note.createdBy?.name} {note.createdBy?.lastName}
                </small>
              </div>
              <div className="priority-class-all">
                <div className={getPriorityTextClass(note.priority)}>
                  <h5>Prioritet:</h5>
                  <p>{getPriorityText(note.priority)}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <p className="no-notes-message">
              Nema beleški koje odgovaraju filterima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
