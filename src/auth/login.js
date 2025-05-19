if (localStorage.getItem("loggedIn") === "true") {
  window.location.href = "../index.html";
}

document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.email === email && user.password === password) {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "../index.html";
  } else {
    alert("Invalid credentials");
  }
});
