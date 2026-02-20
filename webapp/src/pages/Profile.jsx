import React from "react";
import { logout } from "../app/auth.js";

export default function Profile() {
  const [name, setName] = React.useState("");

  return (
    <div style={{ padding: 16 }}>
      <h2>Profile</h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        style={{ width: "100%", padding: 10, borderRadius: 10 }}
      />

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => {
            logout();
            // auth guard в App сам отправит на login после обновления authed,
            // но можно и вручную: window.location.hash = "#/login"
            window.location.hash = "#/login";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
