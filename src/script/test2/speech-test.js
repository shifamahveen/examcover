import SpeechToText from 'speech-to-text';

const audioStatus = document.getElementById('audioStatus');

navigator.mediaDevices.getUserMedia({ audio: true })
.then(stream => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(stream);
  analyser.fftSize = 2048;
  const dataArray = new Uint8Array(analyser.fftSize);
  microphone.connect(analyser);

  function checkVolume() {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = dataArray[i] - 128;
      sum += val * val;
    }
    const volume = Math.sqrt(sum / dataArray.length);

    if (volume > 20) {
      audioStatus.textContent = 'Speech Detected';
      audioStatus.className = 'text-red-600';
      logViolation('speech', 'Speech detected');
    } else {
      audioStatus.textContent = 'Listening...';
      audioStatus.className = 'text-green-600';
    }

    requestAnimationFrame(checkVolume);
  }

  checkVolume();

  const onAnythingSaid = text => {
    console.log('Interim:', text);
  };

  const onFinalised = text => {
    console.log('Final:', text);
  };

  const onEndEvent = () => {
    listener.startListening();
  };

  let listener;
  try {
    listener = new SpeechToText(onFinalised, onEndEvent, onAnythingSaid);
    listener.startListening();
  } catch (err) {
    console.error('SpeechToText init error:', err.message);
    audioStatus.textContent = 'SpeechToText Init Error';
    audioStatus.className = 'text-yellow-600';
  }

})
.catch(err => {
  console.error('Microphone access denied:', err);
  audioStatus.textContent = 'Microphone Blocked';
  audioStatus.className = 'text-yellow-600';
});