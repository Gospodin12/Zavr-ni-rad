import './App.css'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import PdfWordViewerPage from './pages/PdfWordViewerPage'
import MarkedPage from './pages/MarkedPage'
import HomePage from './pages/HomePage/HomePage'
import ScenarioPage from './pages/ScenarioPage/ScenarioPage'
import NotePage from './pages/NotePage/NotePage'
import TeamPage from './pages/TeamPage/TeamPage'
import BookPage from './pages/BookPage/BookPage'
import ScenarioPartPage from './pages/ScenarioPartPage/ScenarioPartPage'
import MoviePage from './pages/MoviePage/MoviePage'
import RegisterPage from './pages/RegisterPage/RegisterPage'
import AllNotePage from './pages/AllNotesPage/AllNotePage'
import ASpecificNotePage from './pages/ASpecificNotePage/ASpecificNotePage'
/*
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path='/film' element={<MoviePage/>} />
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/:movieId/home" element={<HomePage />} />
        <Route path="/:movieId/scenario" element={<ScenarioPage />} />
        <Route path="/:movieId/result" element={<NotePage />} />
        <Route path="/:movieId/ekipa" element={<TeamPage />} />
        <Route path="/:movieId/knjiga-snimanja" element={<BookPage />} />
        <Route path="/:movieId/note" element={<NotePage />} />
        <Route path="/:movieId/delovi-scenarija" element={<ScenarioPartPage />} />
        <Route path="/:movieId/register" element={<RegisterPage />} />
        <Route path="/:movieId/beleske" element={<AllNotePage />} />
        <Route path="/:movieId/beleska/:noteId" element={<ASpecificNotePage />} />
        <Route path="/:movieId/credits" element={<ASpecificNotePage />} />


        <Route path="/:movieId/viewer" element={<PdfWordViewerPage />} />
        <Route path="/marked" element={<MarkedPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App
