import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFound from "./routes/notFound.tsx";
import { HomePage } from "./routes/homePage.tsx";
import { AuthPage } from "./routes/authPage.tsx";
import { TestPage } from "./routes/testMe.tsx";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/auth" element={<AuthPage/>}/>
                <Route path="/test" element={<TestPage/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
