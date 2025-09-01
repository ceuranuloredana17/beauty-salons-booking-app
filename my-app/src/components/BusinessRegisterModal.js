import React, { useState } from "react";
import "./BusinessRegisterModal.css";

export default function BusinessRegisterModal({ close }) {
  const [prenume, setPrenume] = useState("");
  const [nume, setNume] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);


 const handleSubmit = async (e) => {
  e.preventDefault();
  setError(""); 

  if (prenume.length < 2 || nume.length < 2) {
    setError("Prenumele și numele trebuie să aibă cel puțin 2 caractere");
    return;
  }

  const usernameRegex = /^[a-zA-Z0-9_]{4,}$/;
  if (!usernameRegex.test(username)) {
    setError("Username-ul trebuie să aibă minim 4 caractere și să fie alfanumeric");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Email invalid");
    return;
  }

  const phoneRegex = /^07\d{8}$/;
  if (!phoneRegex.test(telefon)) {
    setError("Telefonul trebuie să înceapă cu 07 și să aibă 10 cifre");
    return;
  }

  if (password.length < 6) {
    setError("Parola trebuie să aibă cel puțin 6 caractere");
    return;
  }

  if (password !== confirmPassword) {
    setError("Parolele nu se potrivesc");
    return;
  }

  if (!acceptedTerms) {
    setError("Trebuie să accepți termenii și condițiile");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/api/business/register", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prenume, nume, username, email, telefon, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Eroare la înregistrare");

    alert(data.message);
    close();
  } catch (err) {
    setError(err.message);
  }
};


  return (
    <div className="modal-overlay">
      <div className="modal business-modal">
        <button className="close-btn" onClick={close}>×</button>
        <h2>Creare cont Business</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            placeholder="Prenume"
            value={prenume}
            onChange={e => setPrenume(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nume"
            value={nume}
            onChange={e => setNume(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="tel"
            placeholder="Telefon"
            value={telefon}
            onChange={e => setTelefon(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Parolă"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmă parola"
            value={confirmPassword}
            onChange={e => setConfirm(e.target.value)}
            required
          />
     <div className="terms-checkbox">
  <input
    type="checkbox"
    id="business-terms"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
  />
  <label htmlFor="business-terms">
    Sunt de acord cu <a href="#" className="terms-link">termenii și condițiile</a>
  </label>
</div>


          <button type="submit" className="register-btn">
            Înregistrare
          </button>
        </form>
      </div>
    </div>
  );
}
