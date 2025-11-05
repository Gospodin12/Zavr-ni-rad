import React, { useEffect, useState } from "react";
import "./MoviePage.css";
import { useNavigate } from "react-router-dom";
import pozadina from "../../assets/movies1.jpg";
import { getUserInfo } from "../../services/authService";
import {
  getMyMovies,
  addMovie,
  getNotMyMovies,
  getAllUserRolesForMovie,
} from "../../services/movieService";
import emptyPicture from "../../assets/noUser.png";
import noPictureMovie from "../../assets/noMovie.avif";
import type { User } from "../../models/User";
import { backgroundService } from "../../services/backgroundService";


type MovieData = {
  movie: {
    _id: string;
    name: string;
    picture?: string;
  };
  roles?: { role: number; character?: string }[];
};

const ROLE_NAMES: Record<number, string> = {
  1: "🎬 Režiser",
  2: "🎭 Glumac",
  3: "🎥 Snimatelj",
  4: "🎨 Scenograf",
  5: "✂️ Montažer",
};

const getRole = (role: number) => {
  const isDirector = role === 1;

  // Stilizovani objekat koji sadrži boju
  const style = {
    color: isDirector ? "green" : "red",
    fontWeight: "bold", // Opcionalno, za bolju vidljivost
  };

  return (
    <span style={style}>
      {isDirector ? "DA" : "NE"}
    </span>
  );
};

const MoviePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [movies2, setMovies2] = useState<MovieData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [searchMyMovies, setSearchMyMovies] = useState("");
  const [searchOtherMovies, setSearchOtherMovies] = useState("");
  const [filterRoleMy, setFilterRoleMy] = useState<number | "">("");
  const [filterRoleOther, setFilterRoleOther] = useState<number | "">("");

  const [newMovie, setNewMovie] = useState({
    name: "",
    description: "",
    picture: null as File | null,
    preview: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    backgroundService.changeBackground(pozadina);

    const fetchData = async () => {
      if (!token) return navigate("/login");

      try {
        const userData = await getUserInfo(token);
        setUser(userData);

        const myMovies = await getMyMovies(token);
        const notMyMovies = await getNotMyMovies(token);

        // Fetch all roles for each movie in parallel
        const myMoviesWithRoles = await Promise.all(
          myMovies.map(async (m: any) => {
            const rolesData = await getAllUserRolesForMovie(token, m.movie._id);
            return { ...m, roles: rolesData.roles || [] };
          })
        );

        const notMyMoviesWithRoles = await Promise.all(
          notMyMovies.map(async (m: any) => {
            const rolesData = await getAllUserRolesForMovie(token, m.movie._id);
            return { ...m, roles: rolesData.roles || [] };
          })
        );

        const filteredOthers = notMyMoviesWithRoles.filter(
          (m) => !myMoviesWithRoles.some((mm) => mm.movie._id === m.movie._id)
        );

        setMovies(myMoviesWithRoles);
        setMovies2(filteredOthers);
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

  const getRolesText = (roles?: { role: number; character?: string }[]) => {
    if (!roles || roles.length === 0) return "Bez uloge";
    return roles.map((r) => ROLE_NAMES[r.role] || `Uloga ${r.role}`).join(", ");
  };

  const filteredMyMovies = movies.filter((m) => {
    const matchSearch = m.movie.name
      .toLowerCase()
      .includes(searchMyMovies.toLowerCase());
    const matchRole =
      !filterRoleMy ||
      m.roles?.some((r) => r.role === filterRoleMy);
    return matchSearch && matchRole;
  });

  const filteredOtherMovies = movies2.filter((m) => {
    const matchSearch = m.movie.name
      .toLowerCase()
      .includes(searchOtherMovies.toLowerCase());
    const matchRole =
      !filterRoleOther ||
      m.roles?.some((r) => r.role === filterRoleOther);
    return matchSearch && matchRole;
  });

  if (loading) return <div className="movie-page-loading">Učitavanje...</div>;

  return (
    <div className="movie-page-container">
      <div className="app-header">
        <div className="app-description">
          <h1>🎥 ScriptShaper</h1>
          <p>
            Stvorite. Oblikujte. Upravljajte. Oslobodite svoju kreativnost i
            pretvorite svoje vizije u filmove uz intuitivni sistem koji
            pojednostavljuje svaki korak.
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
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          {user.phoneNumber && (
            <p>
              <strong>Telefon:</strong> {user.phoneNumber}
            </p>
          )}
          <p>
            <strong>Režiser:</strong> {getRole(user.role)}
          </p>
          <button onClick={() => 
          {
            localStorage.clear()
            navigate("/login")
          }
            } className="logout-movie-page">
            Vrati se
          </button>
        </div>
      )}

      {/* 🎬 MY MOVIES */}
      <div className="movies-section">
        <h2 className="movies-title">🎬 Vaši filmovi</h2>
        <div className="filter-group">
          <input
            type="text"
            className="search-bar-movies"
            placeholder="🔍 Pretraži filmove..."
            value={searchMyMovies}
            onChange={(e) => setSearchMyMovies(e.target.value)}
          />
          <select
            className="role-filter"
            value={filterRoleMy}
            onChange={(e) =>
              setFilterRoleMy(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Sve uloge</option>
            {Object.entries(ROLE_NAMES).map(([num, name]) => (
              <option key={num} value={num}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="movies-carousel-wrapper">
        <div className="movies-carousel">
          {filteredMyMovies.length === 0 ? (
            <p className="no-movies-text">Nema filmova.</p>
          ) : (
            filteredMyMovies.map((item) => (
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
                  <p>{getRolesText(item.roles)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {user?.role === 1 && (
          <button
            className="add-movie-btn next-to-cards"
            onClick={() => setShowAddModal(true)}
          >
            +
          </button>
        )}
      </div>

      {/* 🎥 OTHER MOVIES */}
      <div className="movies-section">
        <h2 className="movies-title">🎥 Tuđi filmovi</h2>
        <div className="filter-group-movies2">
          <input
            type="text"
            className="search-bar-movies"
            placeholder="🔍 Pretraži filmove..."
            value={searchOtherMovies}
            onChange={(e) => setSearchOtherMovies(e.target.value)}
          />
          <select
            className="role-filter"
            value={filterRoleOther}
            onChange={(e) =>
              setFilterRoleOther(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">Sve uloge</option>
            {Object.entries(ROLE_NAMES).map(([num, name]) => (
              <option key={num} value={num}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="movies-carousel-wrapper">
        <div className="movies-carousel">
          {filteredOtherMovies.length === 0 ? (
            <p className="no-movies-text">Nema filmova.</p>
          ) : (
            filteredOtherMovies.map((item) => (
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
                  <p>{getRolesText(item.roles)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Movie Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal modern">
            <h2>🎬 Novi film</h2>
            <form onSubmit={handleAddMovie} className="add-movie-form">
              <div className="poster-upload">
                <label htmlFor="movie-picture" className="poster-label">
                  {newMovie.preview ? (
                    <img
                      src={newMovie.preview}
                      alt="Preview"
                      className="poster-preview"
                    />
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
                onChange={(e) =>
                  setNewMovie({ ...newMovie, name: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Opis filma"
                value={newMovie.description}
                onChange={(e) =>
                  setNewMovie({ ...newMovie, description: e.target.value })
                }
              />
              <div className="modal-buttons">
                <button type="submit" className="save-btn">
                  💾 Sačuvaj
                </button>
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
