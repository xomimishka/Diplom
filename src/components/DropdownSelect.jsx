import { useState, useRef, useEffect } from "react";
import { ph_caret_up_down } from "../images";
import "../styles/redactname.scss";

export default function DropdownSelect({ value, options, onChange, width, disabled }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Закрытие при клике вне
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        if (disabled) return;
        onChange(val);
        setOpen(false);
    };

    return (
        <div className="dropdown-wrapper" ref={containerRef} style={{ width }}>
            <button
                type="button"
                className={`button-time ${disabled ? "disabled" : ""}`}
                onClick={() => !disabled && setOpen(!open)}
            >
                <span>{value}</span>
                <img src={ph_caret_up_down} alt="expand" />
            </button>

            {open && !disabled && (
                <div className="dropdown-menu">
                    {options.map((opt) => (
                        <div
                            key={opt}
                            className="dropdown-item"
                            onClick={() => handleSelect(opt)}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
