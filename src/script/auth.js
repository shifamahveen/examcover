function checkAuth() {
    const loggedIn = localStorage.getItem("loggedIn");
    if (loggedIn !== "true") {
        window.location.href = "auth/login.html";
    }
}

fetch('http://localhost:3001/api/auth/auth-check', { credentials: 'include' })
    .then(res => {
        if (!res.ok) window.location.href = 'login.html';
    });

checkAuth();

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("loggedIn");
            window.location.href = "auth/login.html";
        });
    }
});
