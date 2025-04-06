import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {TestPage} from "./routes/testMe.tsx";
import NotFound from "./routes/notFound.tsx";
import {HomePage} from "./routes/homePage.tsx";
import ProtectedRoute from "./auth/protectedRoute.tsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                    path="/test"
                    element={
                        <ProtectedRoute>
                            <TestPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
