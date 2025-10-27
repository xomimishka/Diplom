import { useState, useEffect } from "react";
import RootLayout from "./layouts/RootLayout";
import GuestPage from "./pages/GuestPage";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // При монтировании компонента пробуем загрузить пользователя из localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Обновляем localStorage при изменении пользователя
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const handleLoginToggle = () => setShowLogin((prev) => !prev);
  const handleLoginClose = () => setShowLogin(false);
  const handleLoginSuccess = (userData) => {
    setUser(userData); // также localStorage обновится через useEffect
    setShowLogin(false);
  };

  useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const oauthSuccess = urlParams.get('oauth_success');
  const userId = urlParams.get('user_id');
  const login = urlParams.get('login');

  if (oauthSuccess && userId && login) {
    setUser({ id: userId, login: decodeURIComponent(login) });
    localStorage.setItem("user", JSON.stringify({ id: userId, login: decodeURIComponent(login) }));
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}, []);


  return (
    <RootLayout
      user={user}
      onLogin={handleLoginToggle}
      onLogout={() => setUser(null)}
      showLogin={showLogin}
    >
      {!user ? <GuestPage /> : <HomePage user={user} />}

      {showLogin && (
        <>
          <div id="login-overlay" onClick={handleLoginClose}></div>
          <Login onLoginSuccess={handleLoginSuccess} onClose={handleLoginClose} />
        </>
      )}
    </RootLayout>
  );
}
