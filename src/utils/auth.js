function checkAuth() {
  const loggedIn = localStorage.getItem("loggedIn");
  if (loggedIn !== "true") {
    window.location.href = "auth/login.html";
  }
}
