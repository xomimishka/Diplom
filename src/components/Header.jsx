import { useState, useRef, useEffect } from "react";

import "../styles/header.scss";
import "../styles/global.scss";

import { logo, userIcon } from "../images";

export default function Header({ user, onLogout, onLogin, showLogin }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setShowMenu((prev) => !prev);

// закрытие при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    // очистка при размонтировании
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div id="header" ref={menuRef}>
      {user ? (
        <div className="elements">
          <img src={logo} alt="logo" />
          {/* <button className="text-primary-black text-primary-black">Личный кабинет</button>
          <button className="text-primary-black text-primary-black">Мои ссылки</button> */}
        </div>
      ) : (
        <div>
          <img src={logo} alt="logo" />
        </div>
      )}
      <div className="header-right">
        {user ? (
          <div className="user-menu-wrapper">
            <button
              className={`${showMenu ? "active" : ""}`}
              onClick={toggleMenu}
            >
              <img src={userIcon} alt="Профиль" />
            </button>

            {showMenu && (
              <div className="dropdown-user-menu">
                <button className="text-primary-black weight-400" onClick={onLogout}>Выход</button>
              </div>
            )}
          </div>
        ) : (
          <button className={`text-primary-black weight-400 ${showLogin ? "active" : ""}`} onClick={onLogin}>
            Вход
          </button>
        )}
      </div>
    </div>
  );
}
