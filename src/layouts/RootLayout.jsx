import React from "react";
import Header from "../components/Header";
import Helps from "../components/Helps";
import "../styles/global.scss";

export default function RootLayout({ user, onLogin, onLogout, children, showLogin }) {
  return (
    <div>
      <Header user={user} onLogin={onLogin} onLogout={onLogout} showLogin={showLogin} />
      <main className="root">{children}</main>
      <Helps />
    </div>
  );
}