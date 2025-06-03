import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NotFound } from "./routes/notFound.tsx";
import { HomePage } from "./routes/home/homePage.tsx";
import { AuthPage } from "./routes/auth/authPage.tsx";
import { ChatPage } from "./routes/c/chatPage.tsx";

import "./app.css";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/auth" element={<AuthPage/>}/>
                <Route path="/c" element={<ChatPage/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
