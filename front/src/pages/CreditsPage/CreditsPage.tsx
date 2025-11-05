import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreditsPage.css";
import { getMovieById, getUsersForMovie } from "../../services/movieService";

import type { User } from "../../models/User";
import type { MovieRole } from "../../models/MovieRole";



export default function CreditsPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movieName, setMovieName] = useState("Film");
  const [credits, setCredits] = useState<{ title: string; names: string[] }[]>([]);
  const [showTitle, setShowTitle] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [scrolling, setScrolling] = useState(true);

  const token = localStorage.getItem("token");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const posRef = useRef<number>(window.innerHeight);
  const scrollingRef = useRef<boolean>(scrolling);
  const speedRef = useRef<number>(speed);

  useEffect(() => {
    scrollingRef.current = scrolling;
  }, [scrolling]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    let mounted = true;
    const loadCredits = async () => {
      try {
        const res = await getUsersForMovie(token + "", movieId + "");
        if (!mounted) return;
        const crewRoles = {
          2: "Uloge",
          1: "Režija",
          3: "Fotografija",
          4: "Scenografija",
          5: "Montaža",
        };
        const grouped: Record<string, string[]> = {};
        res.users.forEach((u: MovieRole) => {
          const role = crewRoles[u.role as keyof typeof crewRoles] || "Član ekipe";
          if (!grouped[role]) grouped[role] = [];
          grouped[role].push(
            u.role === 2 && u.character
              ? `${u.user.name} ${u.user.lastName} - ${u.character}`
              : `${u.user.name} ${u.user.lastName}`
          );
        });
        const finalCredits = Object.entries(grouped).map(([title, names]) => ({
          title,
          names,
        }));

        setCredits(finalCredits);
        const movie = await getMovieById(token+'',movieId+'')
        setMovieName('"'+movie.name+'"' || '"Film"');
      } catch (e) {
        console.error("Failed to load credits", e);
      }
    };
    loadCredits();

    // Fade title in and out
    const t = setTimeout(() => setShowTitle(false), 5000);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [movieId, token]);

  useEffect(() => {
    const goFullscreen = async () => {
      try {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) await elem.requestFullscreen();
      } catch {}
    };
    goFullscreen();
    return () => {
        // Exit fullscreen when the component unmounts (user navigates away)
        // Use document.exitFullscreen() to safely leave fullscreen mode.
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        } catch (e) {
            console.error("Failed to exit fullscreen:", e);
        }
    };
}, []);

useEffect(() => {
  const resetPos = () => {
    posRef.current = window.innerHeight * 0.95; // start slightly above the bottom
    if (scrollRef.current)
      scrollRef.current.style.transform = `translateY(${posRef.current}px)`;
  };
  if (!showTitle) resetPos();
  const id = setTimeout(resetPos, 100);
  return () => clearTimeout(id);
}, [credits, showTitle]);


  // RAF Loop
 useEffect(() => {
  let mounted = true;

  const step = () => {
    if (!mounted) return;
    const isScrolling = scrollingRef.current;
    const currentSpeed = speedRef.current;

    if (scrollRef.current && isScrolling) {


      const delta = 0.5 * currentSpeed;
      posRef.current -= delta;

      scrollRef.current.style.transform = `translateY(${posRef.current}px)`;
      console.log(posRef.current,scrollRef.current.style.height,window.innerHeight)

      if (posRef.current < -window.innerHeight ) {
        posRef.current = window.innerHeight * 0.95; // start slightly above the bottom
        scrollRef.current.style.transform = `translateY(${posRef.current}px)`;
      }
    }

    rafIdRef.current = requestAnimationFrame(step);
  };

  rafIdRef.current = requestAnimationFrame(step);
  return () => {
    mounted = false;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
  };
}, []);


  useEffect(() => {
    const onResize = () => {
      posRef.current = window.innerHeight;
      if (scrollRef.current)
        scrollRef.current.style.transform = `translateY(${posRef.current}px)`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Handlers
  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    speedRef.current = val;
  };

  const handleToggleScroll = () => {
    setScrolling((prev) => {
      const next = !prev;
      scrollingRef.current = next;
      return next;
    });
  };

const handleSkip = (amount: number) => {
  if (!scrollRef.current) return;

  posRef.current += amount;
  scrollRef.current.style.transform = `translateY(${posRef.current}px)`;
};

 return (
  <div className="credits-container">
    <div className="credits-overlay">
      {/* Left controls */}
      {!showTitle && (
        <div className="controls">
          🎞️ Brzina:
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          />
          <span>{speed.toFixed(1)}x</span>
          <button onClick={handleToggleScroll}>
            {scrolling ? "⏸️ Pauziraj" : "▶️ Nastavi"}
          </button>
          <button
            onClick={() => {
              posRef.current = window.innerHeight;
              if (scrollRef.current)
                scrollRef.current.style.transform = `translateY(${posRef.current}px)`;
            }}
          >
            🔁 Restart
          </button>
        <button onClick={() => handleSkip(150)}>⏪ Nazad</button>
        <button onClick={() => handleSkip(-150)}>⏩ Napred</button>

        </div>
      )}

      {/* Right side back button */}
      <button className="back-btn2" onClick={() => navigate(-1)}>
        ⬅️ Nazad
      </button>

      {/* Centered content */}
      {showTitle ? (
        <div className="movie-title">{movieName}</div>
      ) : (
        <div className="scrolling-credits" ref={scrollRef}>
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
