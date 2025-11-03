import React, { useEffect, useState } from "react";
import "./NotePage.css";
import Navbar from "../Navbar/Navbar";
import { useNavigate, useParams } from "react-router-dom";
import { getAllUsers, getUserInfo } from "../../services/authService";
import { noteService } from "../../services/noteService";
import { getUserRoleForMovie, getUsersForMovie } from "../../services/movieService";
import { backgroundService } from "../../services/backgroundService";

export default function NotePage() {
  const [selectedText, setSelectedText] = useState<any>(null);
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { movieId } = useParams();

  const ROLE_CATEGORIES: Record<number, string[]> = {
    1: ["Scenario", "Rezija", "Gluma", "Snimanje", "Montaza", "Scenografija"],
    2: ["Gluma"],
    3: ["Snimanje", "Scenografija"],
    4: ["Scenografija"],
    5: ["Montaza", "Snimanje"],
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Režiser";
      case 2:
        return "Glumac";
      case 3:
        return "Snimatelj";
      case 4:
        return "Scenograf";
      case 5:
        return "Montažer";
      default:
        return "Nepoznata uloga";
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }  
    backgroundService.changeBackgroundPerUser(token,movieId,navigate)
    async function fetchData() {
      const textData = localStorage.getItem("selectedText");
      if (textData) setSelectedText(JSON.parse(textData));

      if (token) {
        const userInfo = await getUserInfo(token);
        getUserRoleForMovie(token,movieId+'').then(data2 =>{
            console.log(userInfo)
            userInfo.role = data2.role
            setUser(userInfo);
        })


        let allUsers = await getUsersForMovie(token,movieId+'');
        allUsers = allUsers.users
        const transformedUsers = allUsers.map((item: any) => ({
          ...item.user,
          role: item.role,
        }));        
        console.log(transformedUsers)
        setUsers(transformedUsers);
      }
    }
    fetchData();
  }, [token]);

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    if (!userId) return;

    const selected = users.find((u) => u._id === userId);
    if (selected && !selectedUsers.some((u) => u._id === selected._id)) {
      setSelectedUsers([...selectedUsers, selected]);
    }
  };

  const removeUser = (id: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== id));
  };

  const handleSave = async () => {
    if (!selectedText || !description || !category || !title) {
      alert("Molimo popunite sva polja.");
      return;
    }

    let assigned = [...selectedUsers];
    const director = users.find((u) => u.role === 1);
    if (director && !assigned.some((u) => u._id === director._id)) {
      assigned.push(director);
    }

    try {
      const noteData = {
        title:title,
        text: selectedText.text,
        quote: selectedText.text,
        page: selectedText.page,
        location: selectedText.location,
        priority: priority.toLowerCase(),
        description,
        category,
        assignedTo: assigned.map((u) => u._id),
        _film_id: movieId,
      };

      await noteService.createNote(noteData, token);
      alert("Beleška uspešno sačuvana!");
      navigate(`/${movieId}/scenario`);
    } catch (err) {
      console.error(err);
      alert("Greška pri čuvanju beleške");
    }
  };

  if (!selectedText) {
    return (
      <div className="note-container">
        <Navbar />
        <div className="note-card-new">
          <h2>Nema selektovanog teksta.</h2>
          <button className="back-btn" onClick={() => navigate(`/${movieId}/scenario`)}>
            ← Nazad
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="note-container">
      <Navbar />
      
      <div className="note-card-new">
        <h1 className="note-title">Nova beleška</h1>

        <div className="selected-text-box">
          <p className="selected-text">„{selectedText.text}“</p>
          <p className="text-meta">
            <strong>Strana:</strong> {selectedText.page}
          </p>
        </div>
        <div className="form-group">
          <label>Naziv</label>
          <input
            placeholder="Dodaj naziv beleške..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          ></input>
        </div>
        <div className="form-group">
          <label>Prioritet</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={`priority-select ${priority.toLowerCase()}`}
          >
            <option value="Low">Nizak</option>
            <option value="Medium">Srednji</option>
            <option value="High">Visok</option>
          </select>
        </div>

        <div className="form-group">
          <label>Kategorija</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSelectedUsers([]); // ✅ briše sve dodeljene korisnike pri promeni kategorije
            }}
            disabled={!user}
          >
            <option value="">-- Izaberi kategoriju --</option>
            {user &&
              ROLE_CATEGORIES[user.role].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label>Dodeli članove tima</label>
          <select onChange={handleUserSelect} value="">
            <option value="">-- Izaberi člana --</option>
            {users
              .filter(
                (u) =>
                  category &&
                  ROLE_CATEGORIES[u.role]?.includes(category) &&
                  !selectedUsers.some((sel) => sel._id === u._id)
              )
              .map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} {u.lastName} ({getRoleName(u.role)})
                </option>
              ))}
          </select>

          <div className="selected-users">
            {selectedUsers.map((u) => (
              <div key={u._id} className="user-tag">
                {u.name} {u.lastName}
                <button className="remove-btn" onClick={() => removeUser(u._id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Opis beleške</label>
          <textarea
            placeholder="Dodaj opis ili objašnjenje..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div className="button-row">
          <button className="back-btn" onClick={() => navigate(`/${movieId}/scenario`)}>
            ← Nazad
          </button>
          <button className="save-btn" onClick={handleSave}>
            💾 Sačuvaj belešku
          </button>
        </div>
      </div>
    </div>
  );
}
