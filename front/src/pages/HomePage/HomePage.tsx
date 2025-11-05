import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../services/authService";
import "./HomePage.css";
import Navbar from "../Navbar/Navbar";
import { getAllUserRolesForMovie, getUserRoleForMovie } from "../../services/movieService"; // ✅ import your new function
import { useParams } from 'react-router-dom';
import { getMovieById } from "../../services/movieService"; // ✅ import your new function
import { noteService } from "../../services/noteService"; // ✅ import your noteService
import noUser from "../../assets/noUser.png";

import type { User } from "../../models/User";
import type { Note } from "../../models/Note";
import type { Movie } from "../../models/Movie";
import { backgroundService } from "../../services/backgroundService";


export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [roleText, setRoleText] = useState<string>("");
  const [myNotes, setMyNotes] = useState<Note[]>([]); // 👈 store notes

  const navigate = useNavigate();
  const { movieId } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {


    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }  
    backgroundService.changeBackgroundPerUser(token,movieId,navigate)
    getMovieById(token,movieId+'').then(data=>{
      setMovie(data)
    })
getUserInfo(token)
  .then((data) => {
    getAllUserRolesForMovie(token, movieId + "").then((data2) => {
      console.log("User roles:", data2);
      data.roles = data2.roles.map((r: any) => r.role); // e.g. [1, 3]

      setUser(data);

      const roleNames: Record<number, string> = {
        1: "Režiser",
        2: "Glumac",
        3: "Snimatelj",
        4: "Scenograf",
        5: "Montažer",
      };

      if (data.roles.length > 0) {
        const roleTextList = data.roles.map((r: number) => roleNames[r] || "Nepoznata uloga");
        setRoleText(roleTextList.join(", "));
      } else {
        setRoleText("Nema uloga");
      }
    });
  })
  .catch((err) => {
    console.error("Failed to load user info:", err);
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  });

      
      if (token) {
      noteService.getMyNotes(token,movieId)
        .then((data) => {
          // Limit to max 4 notes
          setMyNotes(data.notes.slice(0, 4));
        })
        .catch((err) => console.error("Failed to load notes:", err));
    }
  }, [navigate]);

  
  const getPriorityClass = (priority: string) => {
    if (priority.toLowerCase().includes("high")) return "priority-critical";
    if (priority.toLowerCase().includes("medium")) return "priority-medium";
    return "priority-low";
  };

  const getPriorityTextClass = (priority: string) => {
    if (priority.toLowerCase().includes("high"))
      return "priority-critical-text";
    if (priority.toLowerCase().includes("medium"))
      return "priority-medium-text";
    return "priority-low-text";
  };
  const getPriorityText = (priority: string) => {
    if (priority.toLowerCase().includes("high"))
      return "Kritično!";
    if (priority.toLowerCase().includes("medium"))
      return "Srednje";
    return "Manje bitno";
  };


  return (
    <div className="home-container">
      <Navbar />

      <div className="notes-section">
        {user && movie && (
          <div
            className="blurred-banner"
          >
            {movie.picture!==null &&(<img src={"http://localhost:3000"+movie?.picture}></img>)}
            <h1 className="welcome-text">{movie.name} 
               {/*<div className="description-home-page">
                {movie.description}
              </div>*/}
            </h1>
            
          </div>
        )}       
        <h2 className="notes-title" 
        onClick={()=>  navigate(`/${movieId}/beleske/`)}>
          Beleške
          </h2>
        <div className="notes-list">
          {myNotes.map((note) => (
            <div
              key={note._id}
              className={`note-card ${getPriorityClass(note.priority)}`}
              onClick={() => navigate(`/${movieId}/beleska/` + note._id )}
            > 
              <img
                src={note.createdBy.picture || noUser}
                alt={note.createdBy.name}
                className="note-author-img"
              />
              <div className="note-content">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
                <small className="Autor-note">Autor: {note.createdBy.name+" "+note.createdBy.lastName}</small>
              </div>
              <div className={`priority-class`}>
                <div className={`${getPriorityTextClass(note.priority)}`}>
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
          </div>
        </div>
      )}
    </div>
  );
}
