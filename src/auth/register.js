document.getElementById("registerForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const user = { username, email, password };
  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "login.html";
});
