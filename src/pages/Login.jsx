import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/login.scss";
import Google from "../images/Google.svg";

export default function Login({ onLoginSuccess, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState(""); // Новое состояние для повторения пароля
  const [passwordsMatch, setPasswordsMatch] = useState(true); // Состояние для проверки совпадения паролей

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const userId = urlParams.get('user_id');
    const login = urlParams.get('login');

    if (oauthSuccess && userId && login) {
      const user = {
        id: userId,
        login: decodeURIComponent(login)
      };

      console.log("OAuth success, user:", user);

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }

      // Очищаем URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onLoginSuccess]);

  // Проверка совпадения паролей при изменении
  useEffect(() => {
    if (isRegister && password && repeatPassword) {
      setPasswordsMatch(password === repeatPassword);
    }
  }, [password, repeatPassword, isRegister]);

  const handleOAuth = (provider) => {
    if (provider === 'google') {
      const clientId = "286174628911-usb958kicmo8q8jdofgpcm3osgag1952.apps.googleusercontent.com";
      const scope = encodeURIComponent("email profile");
      const state = "google_" + Date.now();

      const redirectUri = "http://localhost:5000/auth/google/callback";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;

      console.log("Redirecting to Google OAuth...");
      window.location.href = authUrl;
    }
  };

  const handleAuth = async () => {
    if (!login || !password) return alert("Введите логин и пароль");

    // Проверка совпадения паролей при регистрации
    if (isRegister && password !== repeatPassword) {
      alert("Пароли не совпадают!");
      return;
    }

    const endpoint = isRegister
      ? "http://localhost:5000/register"
      : "http://localhost:5000/login";

    try {
      const res = await axios.post(endpoint, { login, password });
      if (res.data.success) {
        if (isRegister) {
          alert("Регистрация успешна! Теперь войдите в систему.");
          setIsRegister(false);
          // Очищаем поля после успешной регистрации
          setPassword("");
          setRepeatPassword("");
        } else {
          onLoginSuccess(res.data.user);
        }
      } else {
        alert(res.data.message || "Ошибка авторизации");
      }
    } catch (err) {
      console.error("Ошибка при авторизации:", err);
      alert("Ошибка сервера");
    }
  };

  const handleBackgroundClick = (e) => {
    if (e.target.id === "login") onClose();
  };

  // Сброс полей при переключении между входом и регистрацией
  const toggleRegister = () => {
    setIsRegister(!isRegister);
    setPassword("");
    setRepeatPassword("");
    setPasswordsMatch(true);
  };

  return (
    <div id="login" onClick={handleBackgroundClick}>
      <div>
        <h2>Добро пожаловать</h2>

        <p className="signature">
          {isRegister ? "Зарегистрируйтесь" : "Авторизуйтесь"}, чтобы получить все возможности сервиса
        </p>

        {/* Блок OAuth кнопок */}
        <div className="block-login">
          <button
            className="button-website"
            onClick={() => handleOAuth('google')}
          > 
            <img src={Google} alt="Google" />
            Продолжить работу с Google
          </button>
        </div>

        <div className="divider">
          <span>или</span>
        </div>

        {/* Блок обычной авторизации */}
        <div className="block-login">
          <input
            className="input-login"
            type="text"
            placeholder="Email"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />

          <input
            className="input-login"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isRegister && (
              <input 
                className={`input-login ${!passwordsMatch && repeatPassword ? 'input-error' : ''}`}
                type="password"
                placeholder="Повторите пароль"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
          )}

          <button 
            className="button-login" 
            onClick={handleAuth}
            disabled={isRegister && !passwordsMatch} // Блокировка кнопки если пароли не совпадают
          >
            {isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </div>

        <div className="top text-primary-grey">
          {isRegister ? (
            <p>
              Уже есть аккаунт?{" "}
              <button
                className="text-primary weight-400"
                onClick={toggleRegister}
              >
                Войти
              </button>
            </p>
          ) : (
            <p>
              Нет аккаунта?{" "}
              <button
                className="text-primary weight-400"
                onClick={toggleRegister}
              >
                Зарегистрироваться
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}