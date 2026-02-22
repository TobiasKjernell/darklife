import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import WelcomePage from "./pages/WelcomePage"
import MapPage from "./pages/MapPage"


function App() {

  return (

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>

  )
}

export default App
