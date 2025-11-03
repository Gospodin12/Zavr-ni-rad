import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../services/authService";
import "./Navbar.css";
import { useParams } from 'react-router-dom';
import logoDirector from "../../assets/LogosNBack/klapa.webp";
import logoActor from "../../assets/LogosNBack/glumaLogo.png";
import logoSnimatelj from "../../assets/LogosNBack/camera-icon-21.png";
import logoScenograf from "../../assets/LogosNBack/scenographyLogo.png";
import logoEdit from "../../assets/LogosNBack/edit.png";
import { getUserRoleForMovie } from "../../services/movieService"; // ✅ import your new function

interface User {
  name: string;
  lastName: string;
  email: string;
  role: number;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [logo, setLogo] = useState<string>("");
  const { movieId } = useParams();
    const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    getUserInfo(token)
        .then((data) => {
          getUserRoleForMovie(token,movieId+'').then(data2 =>{
          data.role = data2.role
          setUser(data);
          switch (data.role) {
            case 1:
              setLogo(logoDirector);
              break;
            case 2:
              setLogo(logoActor);
              break;
            case 3:
              setLogo(logoSnimatelj);
              break;
            case 4:
              setLogo(logoScenograf);
              break;
            default:
              setLogo(logoEdit);
          }
        })
        .catch((err) => {
          console.error("Failed to load user info:", err);
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
          }
        });
    })
  }, [navigate]);

  const handleLogout = () => {
    navigate("/film");
  };

  const getNavbarItems = (role: number): string[] => {
    switch (role) {
      case 1:
        return [
          "Scenario",
          "Beleske",
          "Ekipa",
          "Knjiga snimanja",
          "Delovi Scenarija",
        ];
      case 2:
      case 4:
        return ["Scenario", "Beleske", "Delovi Scenarija"];
      case 3:
      case 5:
        return ["Scenario", "Beleske", "Delovi Scenarija", "Knjiga snimanja"];
      default:
        return [];
    }
  };

  return (
    <nav className="sidebar">
      {logo && <img src={logo} onClick={ () => navigate(`/${movieId}/home`)} alt="Logo" className="sidebar-logo" />}

      <ul className="sidebar-menu">
        {user &&
          getNavbarItems(user.role).map((item) => (
            <li
              key={item}
              onClick={() => navigate(`/${movieId}/${item.toLowerCase().replace(" ", "-")}`)}
            >
              {item}
            </li>
          ))}
      </ul>

      <ul className="sidebar-footer">
        <li onClick={handleLogout} className="logout-btn">
          Vrati se nazad
        </li>
      </ul>
    </nav>
  );
}
