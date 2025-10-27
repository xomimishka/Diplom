import { useState, useRef, useEffect } from "react";
import "../styles/global.scss";
import "../styles/helps.scss";
import { help, telegram } from "../images";

export default function Helps() {
  const [open, setOpen] = useState(false);
  const helpRef = useRef(null);

  // закрытие при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    // очистка при размонтировании
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="help-fixed" ref={helpRef}>
      {open && (
        <div className="dropdown-help text-average-black">
          <a
            href="https://t.me/xo_Mimi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={telegram} alt="telegram" />
            Служба поддержки сайта
          </a>
        </div>
      )}
      <button
        className={`button-svg ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <img src={help} alt="help" />
      </button>
    </div>
  );
}