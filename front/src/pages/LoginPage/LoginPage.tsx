import { useEffect, useState } from "react";
import { login } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import logo from "../../assets/LogosNBack/klapa.webp";    
import pozadina from "../../assets/pozadina.webp"; 
import { backgroundService } from "../../services/backgroundService";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  

useEffect(() => {

  backgroundService.changeBackground(pozadina)
  return () => {
    backgroundService.cleanBackground();
  };
}, []);


  const handleLogin = async () => {
    setErrorMessage("");
    try {
      await login({ email: username, password });
      navigate("/film");
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Pogrešan email ili lozinka!");
    }
  };

  return (
    
    <div
      className="login-container"
      
    >
      <div className="login-overlay">
        <div className="login-card">
          <div className="title-container">
            <img src={logo} alt="Logo" className="title-logo" />
            <p className="subtitle">Prijavi se i uđi u svet režije</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="form-group">
              <label htmlFor="username">Email</label>
              <input
                id="username"
                type="text"
                placeholder="Unesi email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Lozinka</label>
              <input
                id="password"
                type="password"
                placeholder="Unesi lozinku"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Uloguj se
            </button>

            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
