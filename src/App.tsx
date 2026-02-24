import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import WelcomePage from "./pages/WelcomePage"
import MapPage from "./pages/MapPage"
import LoginPage from "./pages/LoginPage"
import ProtectedRoute from "./components/ProtectedRoute"
import AppLayout from "./components/AppLayout"


function App() {

  return (

    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<WelcomePage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/map" element={<MapPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>

  )
}

export default App
