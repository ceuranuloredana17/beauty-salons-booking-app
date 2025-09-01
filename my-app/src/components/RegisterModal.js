import React, { useState } from "react";
import "./RegisterModal.css";

function RegisterModal({ closeModal }) {
  const [prenume, setPrenume] = useState("");
  const [nume, setNume] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [telefon, setTelefon] = useState("");
  const [parola, setParola] = useState("");
  const [confirmaParola, setConfirmaParola] = useState("");
  const [acceptTermeni, setAcceptTermeni] = useState(false);
  const [error, setError] = useState(null);

const handleRegister = async (e) => {
  e.preventDefault();
  setError(null);

 
  if (prenume.length < 2 || nume.length < 2) {
    setError("Prenumele și numele trebuie să aibă cel puțin 2 caractere.");
    return;
  }

  if (!/^[a-zA-Z0-9_]{4,}$/.test(username)) {
    setError("Username-ul trebuie să aibă minim 4 caractere și să fie alfanumeric.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("Email invalid.");
    return;
  }

  if (!/^07\d{8}$/.test(telefon)) {
    setError("Telefonul trebuie să înceapă cu 07 și să aibă 10 cifre.");
    return;
  }

  if (parola.length < 6) {
    setError("Parola trebuie să aibă cel puțin 6 caractere.");
    return;
  }

  if (parola !== confirmaParola) {
    setError("Parolele nu se potrivesc.");
    return;
  }

  if (!acceptTermeni) {
    setError("Trebuie să accepți termenii și condițiile.");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password: parola,
        prenume,
        nume,
        telefon,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Eroare la înregistrare.");
      return;
    }

    alert("Cont creat cu succes!");
    closeModal();
  } catch (err) {
    console.error(err);
    setError("A apărut o eroare la înregistrare.");
  }
};





  return (
    <div className="modal-overlay">
      <div className="modal">
        <button className="close-btn" onClick={closeModal}>X</button>
        <h2>Înregistrare</h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Prenume"
            value={prenume}
            onChange={(e) => setPrenume(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Nume"
            value={nume}
            onChange={(e) => setNume(e.target.value)}
            required
          />
          <input
    type="text"
  placeholder="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  required
  autoComplete="off"
  />

<input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  autoComplete="off"
/>
          <input
            type="tel"
            placeholder="Telefon"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Parola"
            value={parola}
            onChange={(e) => setParola(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmă parola"
            value={confirmaParola}
            onChange={(e) => setConfirmaParola(e.target.value)}
            required
          />

          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={acceptTermeni}
              onChange={() => setAcceptTermeni(!acceptTermeni)}
            />
            <label>Am citit și accept <a href="#">Termeni și condiții</a></label>
          </div>

          <button type="submit" className="register-btn">Înregistrare</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;
