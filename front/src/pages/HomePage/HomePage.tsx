import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserInfo } from "../../services/authService";
import "./HomePage.css";
import Navbar from "../Navbar/Navbar";
import {
  getAllUserRolesForMovie,
  getMovieById,
} from "../../services/movieService";
import { noteService } from "../../services/noteService";
import { backgroundService } from "../../services/backgroundService";
import noUser from "../../assets/noUser.png";

import type { User } from "../../models/User";
import type { Note } from "../../models/Note";
import type { Movie } from "../../models/Movie";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [roleText, setRoleText] = useState<string>("");
  const [characterName, setCharacterName] = useState<string | null>(null);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [movie, setMovie] = useState<Movie | null>(null);

  const navigate = useNavigate();
  const { movieId } = useParams<{ movieId: string }>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    backgroundService.changeBackgroundPerUser(token, movieId, navigate);

    // load movie
    getMovieById(token, movieId + "")
      .then((m) => setMovie(m))
      .catch((err) => console.error("Failed to load movie:", err));

    // load user info and roles
    getUserInfo(token)
      .then((u) => {
        // fetch roles for this movie
        getAllUserRolesForMovie(token, movieId + "")
          .then((rolesResp) => {
            // defensive: rolesResp may be { roles: [...] } or an array
            const rolesArray =
              Array.isArray(rolesResp) ? rolesResp : rolesResp?.roles || [];

            // map only role numbers
            const roleNums: number[] = rolesArray.map((r: any) =>
              typeof r === "object" && r.role !== undefined ? Number(r.role) : Number(r)
            );

            // attach roles to user object for convenience
            const userWithRoles = { ...u, roles: roleNums };
            setUser(userWithRoles as User);

            const roleNames: Record<number, string> = {
              1: "Režiser",
              2: "Glumac",
              3: "Snimatelj",
              4: "Scenograf",
              5: "Montažer",
            };

            if (roleNums.length > 0) {
              const roleTextList = roleNums.map((r: number) => roleNames[r] || "Nepoznata uloga");
              setRoleText(roleTextList.join(", "));
            } else {
              setRoleText("Nema uloga");
            }

            // If actor role exists, try to find its character name (rolesArray items may contain character)
            const actorEntry = rolesArray.find((entry: any) =>
              (typeof entry === "object" && Number(entry.role) === 2) || Number(entry) === 2
            );
            if (actorEntry && typeof actorEntry === "object" && actorEntry.character) {
              setCharacterName(actorEntry.character);
            } else {
              setCharacterName(null);
            }

            // Fetch notes: directors see all notes for movie, others only "my" notes
            const fetchNotesPromise = roleNums.includes(1)
              ? // use the service method that returns ALL notes for a movie
                noteService.getAllNotesForMovie(token, movieId)
              : noteService.getMyNotes(token, movieId);

            fetchNotesPromise
              .then((data) => {
                // both endpoints return an object containing notes (e.g. { success: true, notes: [...] } or { notes: [...] })
                const notesArr = data?.notes || data?.notes === undefined ? data.notes : data;
                // defensive fallback: if `notesArr` undefined and `data` is array — use it
                const finalNotes = Array.isArray(notesArr) ? notesArr : Array.isArray(data) ? data : [];
                setMyNotes(finalNotes.slice(0, 4)); // limit homepage preview to 4
              })
              .catch((err) => {
                console.error("Failed to load notes:", err);
                setMyNotes([]);
              });
          })
          .catch((err) => {
            console.error("Failed to load user roles for movie:", err);
            setUser(u as User);
            setRoleText("Nema uloga");

            // fallback: load user's own notes
            noteService
              .getMyNotes(token, movieId)
              .then((d) => setMyNotes((d?.notes || []).slice(0, 4)))
              .catch(() => setMyNotes([]));
          });
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [navigate, movieId]);

  const getPriorityClass = (priority: string) => {
    if (!priority) return "priority-low";
    if (priority.toLowerCase().includes("high")) return "priority-critical";
    if (priority.toLowerCase().includes("medium")) return "priority-medium";
    return "priority-low";
  };

  const getPriorityTextClass = (priority: string) => {
    if (!priority) return "priority-low-text";
    if (priority.toLowerCase().includes("high")) return "priority-critical-text";
    if (priority.toLowerCase().includes("medium")) return "priority-medium-text";
    return "priority-low-text";
  };

  const getPriorityText = (priority: string) => {
    if (!priority) return "Manje bitno";
    if (priority.toLowerCase().includes("high")) return "Kritično!";
    if (priority.toLowerCase().includes("medium")) return "Srednje";
    return "Manje bitno";
  };

  return (
    <div className="home-container">
      <Navbar />

      <div className="notes-section">
        {user && movie && (
          <div className="blurred-banner">
            {movie.picture !== null && movie.picture !== undefined && (
              <img src={"http://localhost:3000" + movie.picture} alt={movie.name} />
            )}
            <h1 className="welcome-text">{movie.name}</h1>
          </div>
        )}

        <h2 className="notes-title" onClick={() => navigate(`/${movieId}/beleske/`)}>
          Beleške
        </h2>

        <div className="notes-list">
          {myNotes.map((note) => (
            <div
              key={note._id}
              className={`note-card ${getPriorityClass(note.priority)}`}
              onClick={() => navigate(`/${movieId}/beleska/` + note._id)}
            >
              <img
                src={(note.createdBy && note.createdBy.picture) || noUser}
                alt={(note.createdBy && note.createdBy.name) || "Autor"}
                className="note-author-img"
              />
              <div className="note-content">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <small className="Autor-note">
                  Autor: {(note.createdBy && note.createdBy.name) || ""}{" "}
                  {(note.createdBy && note.createdBy.lastName) || ""}
                </small>
              </div>
              <div className="priority-class">
                <div className={getPriorityTextClass(note.priority)}>
                  <h5>Prioritet:</h5>
                  <p>{getPriorityText(note.priority)}</p>
                </div>
              </div>
            </div>
          ))}
          {myNotes.length === 0 && <p className="p">Nema beleški.</p>}
        </div>
      </div>

      {user && (
        <div className="user-info-wrapper">
          <div className="user-card">
            <img
              src={user.picture || "https://via.placeholder.com/150?text=User"}
              alt={`${user.name} ${user.lastName}`}
              className="user-photo-large"
            />
            <h3>
              {user.name} {user.lastName}
            </h3>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            {user.phoneNumber && (
              <p>
                <strong>Telefon:</strong> {user.phoneNumber}
              </p>
            )}
            <p>
              <strong>Uloga:</strong> {roleText}
            </p>

            {characterName && (
              <p>
                <strong>Lik:</strong> {characterName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
