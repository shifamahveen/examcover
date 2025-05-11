// Initialize particles.js
particlesJS('particles-js', {
  particles: {
    number: {
      value: 60,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: '#333333',
    },
    shape: {
      type: 'circle',
      stroke: {
        width: 0,
        color: '#000000',
      },
      polygon: {
        nb_sides: 5,
      },
    },
    opacity: {
      value: 0.2,
      random: false,
      anim: {
        enable: false,
        speed: 1,
        opacity_min: 0.1,
        sync: false,
      },
    },
    size: {
      value: 3,
      random: true,
      anim: {
        enable: false,
        speed: 40,
        size_min: 0.1,
        sync: false,
      },
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#555555',
      opacity: 0.2,
      width: 1,
    },
    move: {
      enable: true,
      speed: 2,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200,
      },
    },
  },
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: {
        enable: true,
        mode: 'grab',
      },
      onclick: {
        enable: true,
        mode: 'push',
      },
      resize: true,
    },
    modes: {
      grab: {
        distance: 140,
        line_linked: {
          opacity: 0.5,
        },
      },
      push: {
        particles_nb: 4,
      },
    },
  },
  retina_detect: true,
});

// Get elements
const loadButton = document.getElementById('loadButton');
const loadingState = document.getElementById('loadingState');
const testLink = document.getElementById('testLink');

// Toggle loading state on button click
loadButton.addEventListener('click', () => {
  // Check if input has value
  if (testLink.value.trim() === '') {
    testLink.classList.add('border-red-500');
    testLink.classList.add('focus:ring-red-500');

    setTimeout(() => {
      testLink.classList.remove('border-red-500');
      testLink.classList.remove('focus:ring-red-500');
    }, 1000);

    return;
  }

  // Hide button and show loading
  loadButton.classList.add('hidden');
  loadingState.classList.remove('hidden');

  // Simulate loading process
  setTimeout(() => {
    loadingState.classList.add('hidden');
    loadButton.classList.remove('hidden');

    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className =
      'mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 flex items-center';
    successDiv.innerHTML = `
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Exam successfully loaded!
        `;

    // Add success message after loading button
    loadButton.parentNode.appendChild(successDiv);

    // Remove success message after 3 seconds
    setTimeout(() => {
      successDiv.classList.add('opacity-0');
      successDiv.style.transition = 'opacity 0.5s ease';

      setTimeout(() => {
        successDiv.remove();
      }, 500);
    }, 3000);
  }, 3000); // Simulate 3 second loading time
});
