import {checkAuth} from "./checkAuth.ts";
import Cookies from 'js-cookie'
import {ReactNode} from "react";

// thx typescript (not)
interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    return checkAuth() ? children : <AuthError/>;
};

export default ProtectedRoute;

export function AuthError() {
    return <>
        <p>nope, but:</p>
        <button onClick={() => Cookies.set('auth', 'password', { expires: 7, path: '/' })}>click to set!</button>
    </>
}