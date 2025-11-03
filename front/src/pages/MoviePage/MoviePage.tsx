import React, { useEffect, useState, useRef } from "react";
import "./MoviePage.css";
import { useNavigate } from "react-router-dom";
import pozadina from "../../assets/movies1.jpg";
import { getUserInfo } from "../../services/authService";
import { getMyMovies, addMovie,getNotMyMovies } from "../../services/movieService";
import emptyPicture from "../../assets/noUser.png";
import noPictureMovie from "../../assets/noMovie.avif";

import type { User } from "../../models/User";
import type { MovieRole } from "../../models/MovieRole";
import { backgroundService } from "../../services/backgroundService";

const MoviePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [movies, setMovies] = useState<MovieRole[]>([]);
  const [movies2, setMovies2] = useState<MovieRole[]>([]);

  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMovie, setNewMovie] = useState({
    name: "",
    description: "",
    picture: null as File | null,
    preview: "",
  });
    const [newMovie2, setNewMovie2] = useState({
    name: "",
    description: "",
    picture: null as File | null,
    preview: "",
  });
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem("token");
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  useEffect(() => {
    backgroundService.changeBackground(pozadina)
    return () => {
      backgroundService.cleanBackground()
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return navigate("/login");
      try {
        const userData = await getUserInfo(token);
        setUser(userData);

        const movieData = await getMyMovies(token);
        setMovies(movieData);

        const movieData2 = await getNotMyMovies(token);
        setMovies2(movieData2);
      } catch (err) {
        console.error("Greška:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovie.name.trim()) return alert("Naziv filma je obavezan!");

    try {
      const created = await addMovie(
        token!,
        newMovie.name,
        newMovie.description,
        newMovie.picture || undefined
      );
      setShowAddModal(false);
      setNewMovie({ name: "", description: "", picture: null, preview: "" });     

      navigate(`/${created.movie._id}/home/`);
    } catch (err) {
      console.error("Greška pri dodavanju filma:", err);
      alert("Greška pri dodavanju filma!");
    }
  };

  const getRoleName = (role: number) => {
    switch (role) {
      case 1:
        return "🎬 Režiser";
      default:
        return "Nije Režiser";
    }
  };

useEffect(() => {
  const setupDragScroll = (container: HTMLDivElement) => {
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
      container.classList.add("active");
    };

    const onMouseLeave = () => {
      isDown = false;
      container.classList.remove("active");
    };

    const onMouseUp = () => {
      isDown = false;
      container.classList.remove("active");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // scroll speed
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
    };
  };

  // apply to all carousels
  document.querySelectorAll(".movies-carousel").forEach((el) => {
    setupDragScroll(el as HTMLDivElement);
  });
}, []);


  if (loading) return <div className="movie-page-loading">Učitavanje...</div>;

  return (
    <div className="movie-page-container">
      <div className="app-header">
        <div className="app-description">
          <h1>🎥 ScriptShaper</h1>
          <p>Vaši Filmski Projekti: Lakoća, Elegancija i Potpuna Kontrola 
            Stvorite. Oblikujte. Upravljajte. Bez Napora. Oslobodite svoju kreativnost i 
            pretvorite svoje vizije u filmove uz intuitivni sistem dizajniran da pojednostavi i 
            uzdigne svaki aspekt vašeg filmskog projekta, od prve iskre ideje do završne premijere.
        </p>

</div>


      </div>
        {user && (
          <div className="user-card-movie">
            <img
              src={user.picture ? user.picture : emptyPicture}
              alt={`${user.name} ${user.lastName}`}
              className="user-photo-large-movie"
            />
            <h3>
              {user.name} {user.lastName}
            </h3>
            <p><strong>Email:</strong> {user.email}</p>
            {user.phoneNumber && <p><strong>Telefon:</strong> {user.phoneNumber}</p>}
            <p><strong>Uloga:</strong> {getRoleName(user.role)}</p>
            <button onClick={handleLogout}  className="logout-movie-page">Odjavi se</button>
          </div>
        )}
      <div className="movies-section">
        <h2 className="movies-title">🎬 Vaši filmovi</h2>
      </div>

      <div className="movies-carousel-wrapper">
        <div className="movies-carousel" ref={scrollRef}>
          {movies.length === 0 ? (
            <p className="no-movies-text">Još uvek nemate nijedan film.</p>
          ) : (
            movies.map((item) => (
              <div
                className="movie-tile"
                key={item.movie._id}
                onClick={() => navigate(`/${item.movie._id}/home`)}
              >
                <img
                  src={
                    item.movie.picture
                      ? `http://localhost:3000${item.movie.picture}`
                      : noPictureMovie
                  }
                  alt={item.movie.name}
                />
                <div className="movie-info-overlay">
                  <h3>{item.movie.name}</h3>
                  <p>{getRoleName(item.role)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {user?.role === 1 && (
          <button className="add-movie-btn next-to-cards" onClick={() => setShowAddModal(true)}>
            +
          </button>
        )}
      </div>
      <div className="movies-section">
        <h2 className="movies-title">🎬 Tuđi filmovi</h2>
      </div>

      <div className="movies-carousel-wrapper">
        <div className="movies-carousel" ref={scrollRef}>
          {movies2.length === 0 ? (
            <p className="no-movies-text">Još uvek nemate nijedan film.</p>
          ) : (
            movies2.map((item) => (
              <div
                className="movie-tile"
                key={item.movie._id}
                onClick={() => navigate(`/${item.movie._id}/home`)}
              >
                <img
                  src={
                    item.movie.picture
                      ? `http://localhost:3000${item.movie.picture}`
                      : noPictureMovie
                  }
                  alt={item.movie.name}
                />
                <div className="movie-info-overlay">
                  <h3>{item.movie.name}</h3>
                  <p>{getRoleName(item.role)}</p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal modern">
            <h2>🎬 Novi film</h2>
            <form onSubmit={handleAddMovie} className="add-movie-form">
            <div className="poster-upload">
                <label htmlFor="movie-picture" className="poster-label">
                {newMovie.preview ? (
                    <img src={newMovie.preview} alt="Preview" className="poster-preview" />
                ) : (
                    <div className="poster-placeholder">
                    📸 <span>Dodaj sliku</span>
                    </div>
                )}
                </label>
                <input
                id="movie-picture"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewMovie({
                    ...newMovie,
                    picture: file,
                    preview: file ? URL.createObjectURL(file) : "",
                    });
                }}
                />
            </div>

            <input
                type="text"
                placeholder="Naziv filma"
                value={newMovie.name}
                onChange={(e) => setNewMovie({ ...newMovie, name: e.target.value })}
                required
            />
            <textarea
                placeholder="Opis filma"
                value={newMovie.description}
                onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
            />
            <div className="modal-buttons">
                <button type="submit" className="save-btn">💾 Sačuvaj</button>
                <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="cancel-btn"
                >
                ✖ Otkaži
                </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePage;
