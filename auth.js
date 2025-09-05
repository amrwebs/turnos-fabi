
// ⚠️ Demo: credenciales hardcodeadas. Cambiá aquí o tomalas de tu backend cuando lo tengas.
const DEMO_USER = "Fabian Allende";
const DEMO_PASS = "200924";

function setSession() {
  localStorage.setItem("fabi_auth_token", "ok");
  const expireAt = Date.now() + 24 * 60 * 60 * 1000;
  localStorage.setItem("fabi_auth_exp", String(expireAt));
}

function hasSession() {
  const token = localStorage.getItem("fabi_auth_token");
  const exp = Number(localStorage.getItem("fabi_auth_exp") || 0);
  return token === "ok" && Date.now() < exp;
}

function clearSession() {
  localStorage.removeItem("fabi_auth_token");
  localStorage.removeItem("fabi_auth_exp");
}

function guard() {
  if (!hasSession()) {
    window.location.href = "login.html";
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const u = event.target.elements["usuario"].value.trim();
  const p = event.target.elements["password"].value.trim();

  if (u === DEMO_USER && p === DEMO_PASS) {
    setSession();
    window.location.href = "admin.html";
  } else {
    const msg = document.getElementById("login-msg");
    msg.textContent = "Usuario o contraseña incorrectos";
    msg.style.color = "crimson";
  }
}

function logout() {
  clearSession();
  window.location.href = "login.html";
}

window.handleLoginSubmit = handleLoginSubmit;
window.guard = guard;
window.logout = logout;
