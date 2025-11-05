import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserInfo } from "../../services/authService";
import "./Navbar.css";

import logoDirector from "../../assets/LogosNBack/klapa.webp";
import logoActor from "../../assets/LogosNBack/glumaLogo.png";
import logoSnimatelj from "../../assets/LogosNBack/camera-icon-21.png";
import logoScenograf from "../../assets/LogosNBack/scenographyLogo.png";
import logoEdit from "../../assets/LogosNBack/edit.png";

import { getAllUserRolesForMovie, getMAINUserRoleForMovie, getUserRoleForMovie } from "../../services/movieService";
import type { User } from "../../models/User";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<number[]>([]);
  const [logo, setLogo] = useState<string>();
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<number>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    getUserInfo(token)
      .then(async (data) => {
          const mainRole = await getMAINUserRoleForMovie(token,movieId+"")
          setUser(data);
          console.log(mainRole)

          if(mainRole==1)
            setLogo(logoDirector)
          else if(mainRole==2)
            setLogo(logoActor)
          else if(mainRole==3)
            setLogo(logoSnimatelj)
          else if(mainRole==4)
            setLogo(logoScenograf)
          else
            setLogo(logoEdit)
          
          setRole(mainRole)
      })
      .catch((err) => {
        console.error("Failed to load user info:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
  }, [movieId, navigate]);

  const handleLogout = () => {
    navigate("/film");
  };

  // Available menu items per role
  const getNavbarItemsForRole = (): string[] => {
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
      {logo && (
        <img
          src={logo}
          onClick={() => navigate(`/${movieId}/home`)}
          alt="Logo"
          className="sidebar-logo"
        />
      )}

      <ul className="sidebar-menu">
        {user &&
          getNavbarItemsForRole().map((item) => (
            <li
              key={item}
              onClick={() =>
                navigate(`/${movieId}/${item.toLowerCase().replace(" ", "-")}`)
              }
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
