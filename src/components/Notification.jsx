import { useEffect } from "react";

export default function Notification({ message, isError = false, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${isError ? "error" : "success"}`}>
      {message}
    </div>
  );
}
