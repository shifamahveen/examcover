// Simple timer functionality
function updateTimer() {
  const timerEl = document.getElementById('timer');
  let [minutes, seconds] = timerEl.innerText.split(':').map(Number);

  if (seconds > 0) {
    seconds--;
  } else if (minutes > 0) {
    minutes--;
    seconds = 59;
  }

  timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

// Update timer every second
setInterval(updateTimer, 1000);

// Mobile toggle functionality
document.addEventListener('DOMContentLoaded', function () {
  const questionSidebar = document.getElementById('questionSidebar');
  const questionSidebarOverlay = document.getElementById(
    'questionSidebarOverlay'
  );
  const toggleQuestionsSidebar = document.getElementById(
    'toggleQuestionsSidebar'
  );
  const toggleProctoring = document.getElementById('toggleProctoring');
  const questionSection = document.getElementById('questionSection');
  const proctoringSection = document.getElementById('proctoringSection');

  // Toggle questions sidebar
  toggleQuestionsSidebar.addEventListener('click', function () {
    if (window.getComputedStyle(questionSidebar).display === 'none') {
      questionSidebar.style.display = 'block';
      questionSidebarOverlay.style.display = 'block';
      questionSidebar.classList.add(
        'fixed',
        'top-0',
        'left-0',
        'h-full',
        'z-50'
      );
      document.body.style.overflow = 'hidden';
    } else {
      questionSidebar.style.display = 'none';
      questionSidebarOverlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  // Close sidebar when clicking overlay
  questionSidebarOverlay.addEventListener('click', function () {
    questionSidebar.style.display = 'none';
    questionSidebarOverlay.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Mobile view toggle between question and proctoring
  toggleProctoring.addEventListener('click', function () {
    if (window.innerWidth < 1024) {
      // Only apply on mobile/tablet
      if (proctoringSection.classList.contains('hidden')) {
        // Show proctoring, hide questions
        proctoringSection.classList.remove('hidden');
        proctoringSection.classList.add('block');
        questionSection.classList.add('hidden');
        toggleProctoring.innerHTML = '<i class="fas fa-book-open"></i>';
      } else {
        // Show questions, hide proctoring
        proctoringSection.classList.add('hidden');
        questionSection.classList.remove('hidden');
        toggleProctoring.innerHTML = '<i class="fas fa-video"></i>';
      }
    }
  });

  // Handle resize events
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) {
      // Reset views on desktop
      questionSection.classList.remove('hidden');
      proctoringSection.classList.remove('hidden');
      proctoringSection.classList.add('block');
      questionSidebar.classList.remove(
        'fixed',
        'top-0',
        'left-0',
        'h-full',
        'z-50'
      );
      questionSidebar.style.display = '';
      questionSidebarOverlay.style.display = 'none';
      document.body.style.overflow = '';
      toggleProctoring.innerHTML = '<i class="fas fa-video"></i>';
    } else if (window.innerWidth >= 768) {
      // Tablet view
      questionSidebar.classList.remove(
        'fixed',
        'top-0',
        'left-0',
        'h-full',
        'z-50'
      );
      questionSidebar.style.display = '';
      questionSidebarOverlay.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});

function toggleSidebar() {
  const sidebar = document.getElementById('questionSidebar');
  const mainContent = document.getElementById('mainContent');
  const svg = document.getElementById('sidebarIcon');
  const tooltip = document.getElementById('sidebarTooltip');

  const isCollapsed = sidebar.style.width === '0px' || sidebar.style.width === '';

  if (isCollapsed) {
      sidebar.style.width = '16rem';
      svg.setAttribute('transform', 'matrix(-1, 0, 0, 1, 0, 0)');
      tooltip.textContent = 'Collapse Sidebar';
  } else {
      sidebar.style.width = '0px';
      svg.setAttribute('transform', 'matrix(1, 0, 0, 1, 0, 0)');
      tooltip.textContent = 'Expand Sidebar';
  }

  mainContent.style.marginLeft = '0';
}

document.querySelectorAll('[id^="flag-question-"]').forEach(el => {
  el.addEventListener('click', function () {
    const qNum = this.dataset.question;
    logEvent(`Question ${qNum} flagged`);
  });
});

// Log option selection
document.querySelectorAll('input[type="radio"][data-question="7"]').forEach(input => {
  input.addEventListener('change', function () {
    const qNum = this.dataset.question;
    const option = this.dataset.option;
    logEvent(`Option "${option}" selected for Question ${qNum}`);
  });
});

// Handle clearing selection
document.getElementById("clear-selection-7").addEventListener("click", function () {
  const radios = document.querySelectorAll('input[name="question"]');
  radios.forEach(radio => {
      radio.checked = false;
  });
  logEvent(`Option selection cleared for Question 7`);

});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("fullscreenBtn");

  btn.addEventListener("click", () => {
    const elem = document.documentElement;

    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(); // Safari
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen(); // IE11
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const enterFullScreen = async () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      await elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      await elem.msRequestFullscreen();
    }
  };

  enterFullScreen();
});