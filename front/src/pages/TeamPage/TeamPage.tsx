import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TeamPage.css";
import Navbar from "../Navbar/Navbar";
import noUser from "../../assets/noUser.png";
import {
  getFREEUsersForMovie,
  getUsersForMovie,
  assignUserToMovie,
} from "../../services/movieService";
import { backgroundService } from "../../services/backgroundService";

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
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [freeUsers, setFreeUsers] = useState<User[]>([]);
  const [openPopupRole, setOpenPopupRole] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<{
    user: User;
    role: number | "actors";
  } | null>(null);
  const [actorCharacter, setActorCharacter] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    backgroundService.changeBackgroundPerUser(token, movieId, navigate);
    getUsersForMovie(token + "", movieId + "").then((data) =>
      setUsers(data.users)
    );
  }, [movieId]);

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

  const handleOpenPopup = async (roleId: string) => {
    if (openPopupRole === roleId) {
      setOpenPopupRole(null);
      setFreeUsers([]);
      return;
    }
    const data = await getFREEUsersForMovie(token + "", movieId + "");
    setFreeUsers(data.users);
    setOpenPopupRole(roleId);
  };

  return (
    <div className="team-page">
      <Navbar />
      <h1 className="team-title">Filmska Ekipa</h1>

      <div className="team-grid">
        {/* CREW SECTION */}
        <div className="team-card">
          <h2>Filmska Ekipa</h2>
          {Object.entries(groupedCrew).map(([roleId, list]) => (
            <div key={roleId} className="role-section">
              <div className="role-header">
                <h3>{roleNames[Number(roleId)]}</h3>
                <button
                  className="add-btn"
                  onClick={() => handleOpenPopup(roleId)}
                >
                  +
                </button>
                {openPopupRole === roleId && (
                  <div className="popup-window">
                    <p>Dodaj {roleNames[Number(roleId)]}</p>
                    <div className="user-list-pop">
                      {freeUsers.length > 0 ? (
                        freeUsers.map((user) => (
                          <div
                            key={user._id}
                            className="user-item-pop"
                            onClick={() =>
                              setConfirmUser({ user, role: Number(roleId) })
                            }
                          >
                            <img src={user.picture || noUser} />
                            {user.name} {user.lastName}
                          </div>
                        ))
                      ) : (
                        <p>Nema slobodnih članova.</p>
                      )}
                    </div>
                    <button
                      className="button-close-pop"
                      onClick={() => setOpenPopupRole(null)}
                    >
                      Zatvori
                    </button>
                  </div>
                )}
              </div>
              <div className="role-list">
                {list.length > 0 ? (
                  list.map((r) => (
                    <div className="user-item" key={r.user._id}>
                      <img src={r.user.picture || noUser} alt="user" />
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

        {/* ACTORS SECTION */}
        <div className="team-card">
          <h2>Glumačka Postava</h2>
          <div className="role-header">
            <h3>Glumci</h3>
            <button
              className="add-btn"
              onClick={() => handleOpenPopup("actors")}
            >
              +
            </button>
            {openPopupRole === "actors" && (
              <div className="popup-window">
                <p>Dodaj Glumca</p>
                <div className="user-list-pop">
                  {freeUsers.length > 0 ? (
                    freeUsers.map((user) => (
                      <div
                        key={user._id}
                        className="user-item-pop"
                        onClick={() => setConfirmUser({ user, role: "actors" })}
                      >
                        <img src={user.picture || noUser} />
                        {user.name} {user.lastName}
                      </div>
                    ))
                  ) : (
                    <p>Nema slobodnih članova.</p>
                  )}
                </div>
                <button
                  className="button-close-pop"
                  onClick={() => setOpenPopupRole(null)}
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
                  <img src={r.user.picture || noUser} alt="actor" />
                  <div>
                    <span className="user-name">
                      {r.user.name} {r.user.lastName}
                    </span>
                    {r.character && (
                      <span className="character">
                        kao <b>{r.character}</b>
                      </span>
                    )}
                  </div>
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
          Registruj Člana
        </button>
        <button className="left-move-margin" onClick={() => navigate(`/${movieId}/credits`)}>
          Credits
        </button>

      </div>

      {confirmUser && (
        <div className="popup-confirm">
          <p>
            Dodati {confirmUser.user.name} {confirmUser.user.lastName} u{" "}
            {confirmUser.role === "actors"
              ? "glumačku postavu"
              : roleNames[confirmUser.role]}?
          </p>
          {confirmUser.role === "actors" && (
            <input
              type="text"
              placeholder="Unesi ulogu"
              value={actorCharacter}
              onChange={(e) => setActorCharacter(e.target.value)}
            />
          )}
          <div className="popup-buttons">
            <button
              className="yes-btn"
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
                const updated = await getUsersForMovie(token + "", movieId + "");
                setUsers(updated.users);
                const free = await getFREEUsersForMovie(token + "", movieId + "");
                setFreeUsers(free.users);
                setConfirmUser(null);
                setOpenPopupRole(null);
                setActorCharacter("");
              }}
            >
              ✅ Da
            </button>
            <button
              className="no-btn"
              onClick={() => setConfirmUser(null)}
            >
              ❌ Ne
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
