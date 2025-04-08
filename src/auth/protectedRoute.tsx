import {checkAuth} from "./checkAuth.ts";
import {AuthError} from "./AuthPage.tsx";


// @ts-ignore
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    return checkAuth() ? children : <AuthError/>;
};

export default ProtectedRoute;