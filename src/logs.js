document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");
  const modal = document.getElementById("mediaModal");
  const mediaContainer = document.getElementById("mediaContainer");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      contents.forEach(c => c.classList.add("hidden"));
      document.getElementById(tab.dataset.tab).classList.remove("hidden");

      tabs.forEach(t => t.classList.remove("border-b-2", "border-blue-500"));
      tab.classList.add("border-b-2", "border-blue-500");
    });
  });

  tabs[0].click(); // Default tab

  fetch("http://localhost:3000/logs")
    .then(res => res.json())
    .then(data => {
      renderItems(data.snapshots, "snapshots", "snapshot");
      renderItems(data.videos, "videos", "video");
    });

      // Load activity logs
  fetch("http://localhost:3000/logs/activity")
    .then(res => res.text())
    .then(logText => {
      const logsContainer = document.getElementById("logs");
      logsContainer.innerHTML = `
        <pre class="whitespace-pre-wrap bg-gray-100 p-4 rounded max-h-[400px] overflow-auto text-sm text-gray-700">${logText}</pre>
      `;
    })
    .catch(err => {
      document.getElementById("logs").innerHTML = `<p class="text-red-500">Failed to load logs</p>`;
      console.error('Error loading logs:', err);
    });


  function renderItems(items, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "mb-3 p-4 bg-gray-50 rounded shadow hover:bg-gray-100 cursor-pointer";

      div.innerHTML = `<p class="font-semibold">${index + 1}. ${item}</p>`;
      div.addEventListener("click", () => {
        const url = `http://localhost:3000/${type === "snapshot" ? "snapshots" : "videos"}/${item}`;
        mediaContainer.innerHTML = type === "snapshot"
          ? `<img src="${url}" class="max-w-full rounded" />`
          : `<video src="${url}" controls class="w-full rounded"></video>`;
        modal.classList.remove("hidden");
      });

      container.appendChild(div);
    });
  }
});
