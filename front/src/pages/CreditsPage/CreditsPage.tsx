import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreditsPage.css";
import { getUsersForMovie } from "../../services/movieService";
import Navbar from "../Navbar/Navbar";

type User = {
  _id: string;
  name: string;
  lastName: string;
};

type UserRole = {
  user: User;
  role: number;
  character?: string | null;
};

export default function CreditsPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movieName, setMovieName] = useState("Film");
  const [credits, setCredits] = useState<{ title: string; names: string[] }[]>([]);
  const [showTitle, setShowTitle] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadCredits = async () => {
      const res = await getUsersForMovie(token + "", movieId + "");
      const crewRoles = {
        1: "Režiser",
        2: "Glumac",
        3: "Snimatelj",
        4: "Scenograf",
        5: "Montažer",
      };

      const grouped: Record<string, string[]> = {};
      res.users.forEach((u: UserRole) => {
            const role = crewRoles[u.role as keyof typeof crewRoles] || "Član ekipe";
        if (!grouped[role]) grouped[role] = [];
        grouped[role].push(
          u.role === 2 && u.character
            ? `${u.user.name} ${u.user.lastName} kao ${u.character}`
            : `${u.user.name} ${u.user.lastName}`
        );
      });

      const finalCredits = Object.entries(grouped).map(([title, names]) => ({
        title,
        names,
      }));

      setCredits(finalCredits);
      setMovieName(res.movieName || "Film");
    };

    loadCredits();

    // Fade out title after 3 seconds
    const timeout = setTimeout(() => setShowTitle(false), 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="credits-container">
      <Navbar />
      <div className="credits-overlay">
        {showTitle ? (
          <div className="movie-title">{movieName}</div>
        ) : (
          <div className="scrolling-credits">
            {credits.map((section, i) => (
              <div className="credits-section" key={i}>
                <h2>{section.title}</h2>
                {section.names.map((name, j) => (
                  <p key={j}>{name}</p>
                ))}
              </div>
            ))}
            <p className="end-text">KRAJ 🎬</p>
          </div>
        )}
      </div>
    </div>
  );
}
