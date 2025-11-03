import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TeamPage.css";
import Navbar from "../Navbar/Navbar";
import noUser  from "../../assets/noUser.png";
import { getFREEUsersForMovie, getUsersForMovie,assignUserToMovie } from "../../services/movieService";
import axios from "axios";
import { backgroundService } from "../../services/backgroundService";

const API_URL = "http://localhost:3000/movies";

type User = {
  _id: string;
  name: string;
  lastName: string;
  picture?: string;
};

type UserRole = {
  user: User;
  role: number;
  character?: string | null;
};

export default function TeamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRole[]>([]);
  const { movieId } = useParams();
  const [freeUsers, setFreeUsers] = useState<User[]>([]);
  
  // 👇 Added popup state
  const [openPopupRole, setOpenPopupRole] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const [confirmUser, setConfirmUser] = useState<{
    user: User;
    role: number | "actors";
  } | null>(null);

// State for optional actor character input
const [actorCharacter, setActorCharacter] = useState("");
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }  
    backgroundService.changeBackgroundPerUser(token,movieId,navigate)
    getUsersForMovie(token + "", movieId + "").then((data) => {
      setUsers(data.users);
    });

  }, [id]);

  const crewRoles = [1, 3, 4, 5];
  const crew = users.filter((u) => crewRoles.includes(u.role));
  const actors = users.filter((u) => u.role === 2);

  const groupedCrew = {
    1: crew.filter((u) => u.role === 1),
    3: crew.filter((u) => u.role === 3),
    4: crew.filter((u) => u.role === 4),
    5: crew.filter((u) => u.role === 5),
  };

  const roleNames: Record<number, string> = {
    1: "Režiser",
    3: "Snimatelj",
    4: "Scenograf",
    5: "Montažer",
  };

  return (
    <>
      <div className="team-container">
        <Navbar />
        <h1 className="team-title">Ekipa</h1>

        <div className="team-columns">
          {/* LEFT - CREW */}
          <div className="team-card">
            {Object.entries(groupedCrew).map(([roleId, list]) => (
              <div key={roleId} className="role-section">
                <div className="role-header" style={{ position: "relative" }}>
                  <h3>{roleNames[Number(roleId)]}</h3>
<div>
    <button
        className="add-btn"
        onClick={() => {
            // Toggle the popup and fetch data
            setOpenPopupRole(openPopupRole === roleId ? null : roleId);
            
            // Only fetch data if we are opening the popup for this role
            if (openPopupRole !== roleId) {
                getFREEUsersForMovie(token + "", movieId + "")
                    .then((data) => {
                        setFreeUsers(data.users);
                        console.log(data.users);
                    })
                    .catch(error => {
                        console.error("Error fetching free users:", error);
                        // Optional: Handle error state for the UI
                    });
            } else {
                // Clear users if we are closing the popup
                setFreeUsers([]); 
            }
        }}
    >
        +
    </button>

    {/* 👇 POPUP appears next to + */}
    {/* Crew Popup */}
    {openPopupRole === roleId && (
      <div className="popup-window">
        <p>Dodaj {roleNames[Number(roleId)]}</p>
        <div className="user-list-pop">
          {freeUsers && freeUsers.length > 0 ? (
            freeUsers.map((user) => (
              <div
                key={user._id}
                className="user-item-pop"
                onClick={() => setConfirmUser({ user, role: Number(roleId) })}
              >
                <img src={user.picture || noUser} />
                {user.name + " " + user.lastName}
              </div>
            ))
          ) : (
            <p>Nema slobodnih članova.</p>
          )}
        </div>
        <button
          className="button-close-pop"
          onClick={() => {
            setOpenPopupRole(null);
            setFreeUsers([]);
          }}
        >
          Zatvori
        </button>
      </div>
    )}
    </div>
                </div>

                <div className="role-list">
                  {list.length > 0 ? (
                    list.map((r) => (
                      <div className="user-item" key={r.user._id}>
                        <img
                          src={r.user.picture || noUser}
                          alt={`${r.user.name}`}
                        />
                        <span>
                          {r.user.name} {r.user.lastName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="empty">Nema članova</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT - ACTORS */}
          <div className="team-card">
            <div className="role-header" style={{ position: "relative" }}>
              <h3>Glumci</h3>
              <button
                className="add-btn"
                onClick={() =>
                  setOpenPopupRole(openPopupRole === "actors" ? null : "actors")
                }
              >
                +
              </button>

            {/* Actors Popup */}
            {openPopupRole === "actors" && (
              <div className="popup-window">
                <p>Dodaj glumca</p>
                <div className="user-list-pop">
                  {freeUsers && freeUsers.length > 0 ? (
                    freeUsers.map((user) => (
                      <div
                        key={user._id}
                        className="user-item-pop"
                        onClick={() => setConfirmUser({ user, role: "actors" })}
                      >
                        <img src={user.picture || noUser} />
                        {user.name + " " + user.lastName}
                      </div>
                    ))
                  ) : (
                    <p>Nema slobodnih članova.</p>
                  )}
                </div>
                <button
                  className="button-close-pop"
                  onClick={() => {
                    setOpenPopupRole(null);
                    setFreeUsers([]);
                  }}
                >
                  Zatvori
                </button>
              </div>
            )}
            </div>
            <div className="role-list">
              {actors.length > 0 ? (
                actors.map((r) => (
                  <div className="user-item" key={r.user._id}>
                    <img
                      src={r.user.picture || noUser}
                      alt={`${r.user.name}`}
                    />
                    <span>
                      {r.user.name} {r.user.lastName}
                      {": "}
                      {r.character && (
                        <span className="character">
                          <b>{r.character}</b>
                        </span>
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="empty">Nema glumaca</p>
              )}
            </div>
          </div>
        </div>

        <div className="bottom-buttons">
          <button onClick={() => navigate(`/${movieId}/register`)}>
            Register
          </button>
        </div>
      </div>



      {confirmUser && (
        <div className="popup-confirm">
          <p>
            Dodati {confirmUser.user.name} {confirmUser.user.lastName} u{" "}
            {confirmUser.role === "actors"
              ? "glumc"
              : roleNames[confirmUser.role]}e
            ?
          </p>

          {/* Show character input only for actors */}
          {confirmUser.role === "actors" && (
            <input
              type="text"
              placeholder="Unesi karakter"
              value={actorCharacter}
              onChange={(e) => setActorCharacter(e.target.value)}
            />
          )}

          <div className="popup-buttons">
            <button
              onClick={async () => {
                const roleNumber =
                  confirmUser.role === "actors" ? 2 : confirmUser.role;
                await assignUserToMovie(
                  token + "",
                  movieId + "",
                  confirmUser.user._id,
                  roleNumber,
                  confirmUser.role === "actors" ? actorCharacter : undefined
                );

                // Refresh lists
                getUsersForMovie(token + "", movieId + "").then((data) =>
                  setUsers(data.users)
                );
                getFREEUsersForMovie(token + "", movieId + "").then((data) =>
                  setFreeUsers(data.users)
                );

                // Close all popups
                setConfirmUser(null);
                setOpenPopupRole(null);
                setActorCharacter("");
              }}
            >
              Yes
            </button>
            <button
              onClick={() => {
                setConfirmUser(null);
                setActorCharacter("");
              }}
            >
              No
            </button>
          </div>
        </div>
      )}

    </>
  );
}
