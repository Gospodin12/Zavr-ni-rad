import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RegisterPage.css";
import audicija from "../../assets/audicija.png";
import Navbar from "../Navbar/Navbar";
import { registerUser } from "../../services/authService";
import axios from "axios";
import { backgroundService } from "../../services/backgroundService";
const API_URL = "http://localhost:3000/movies";
export default function RegisterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

    
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: "",
    character: "",
  });

  const [picture, setPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const { movieId } = useParams();

    useEffect(() => {
      if (!token) {
        navigate("/login");
        return;
      }
      backgroundService.changeBackgroundPerUser(token,movieId,navigate)
      return () => {
        backgroundService.cleanBackground();
      };
    }, []);

  const roles = [
    { value: 1, label: "Režiser" },
    { value: 2, label: "Glumac" },
    { value: 3, label: "Snimatelj" },
    { value: 4, label: "Scenograf" },
    { value: 5, label: "Montažer" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage("");
  setLoading(true);

  try {
    const data = new FormData();
    data.append("name", formData.name);
    data.append("lastName", formData.lastName);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("phoneNumber", formData.phoneNumber);
    data.append("role", formData.role);
    if (formData.role === "2" && formData.character)
      data.append("character", formData.character);
    if (picture) data.append("picture", picture);

    // ✅ 1. Register new user
    const registerRes = await axios.post('http://localhost:3000/auth/register', data, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const newUser = registerRes.data.user; // 👈 get the newly created user
    const userId = newUser._id;             // 👈 extract ID

    console.log(userId,newUser,formData.role,formData.character)
    await axios.post(
      `http://localhost:3000/movies/${movieId}/assign-role`,
      {
        userId: userId,
        role: formData.role,
        character: formData.character || null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // 👈 use your logged-in director's token
        },
      }
    );

    // ✅ 3. Go back to team page
    navigate(`/${movieId}/ekipa`);
  } catch (err: any) {
    console.error(err);
    setErrorMessage("Registracija ili dodela uloge nije uspela!");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="register-container">
      <Navbar />
      <div className="register-overlay">
        <div className="register-card">
          <div className="register-title-container">
            <h1 className="register-subtitle">
              <img src={audicija} alt="audicija" /> Registracija
            </h1>
          </div>

          <form onSubmit={handleRegister}>
            <div className="register-picture-preview" onClick={handlePictureClick}>
              {preview ? (
                <img src={preview} alt="preview" className="register-picture-img" />
              ) : (
                <div className="register-picture-placeholder">Klikni da dodaš sliku</div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handlePictureChange}
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="name">Ime</label>
              <input
                id="name"
                type="text"
                placeholder="Unesi ime"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="lastName">Prezime</label>
              <input
                id="lastName"
                type="text"
                placeholder="Unesi prezime"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Unesi email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="password">Lozinka</label>
              <input
                id="password"
                type="password"
                placeholder="Unesi lozinku"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="phoneNumber">Telefon</label>
              <input
                id="phoneNumber"
                type="text"
                placeholder="Unesi broj telefona"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="role">Pozicija</label>
              <select id="role" value={formData.role} onChange={handleChange} required>
                <option value="">Izaberi ulogu</option>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.role === "2" && (
              <div className="register-form-group">
                <label htmlFor="character">Uloga u filmu</label>
                <input
                  id="character"
                  type="text"
                  placeholder="Unesi ulogu u filmu"
                  value={formData.character}
                  onChange={handleChange}
                />
              </div>
            )}

            <button type="submit" className="register-login-btn" disabled={loading}>
              {loading ? "Dodavanje..." : "Dodaj člana"}
            </button>

            {errorMessage && (
              <div className="register-error-message">{errorMessage}</div>
            )}
            {successMessage && (
              <div className="register-success-message">{successMessage}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
