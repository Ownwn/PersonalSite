import Cookies from 'js-cookie'

export const checkAuth = () => {
    const cookie = Cookies.get("auth")
    return cookie != undefined && cookie.startsWith("password")
};