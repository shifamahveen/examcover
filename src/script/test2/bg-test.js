const audioStatus = document.getElementById('audioStatus');
      
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
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

        if (volume > 10) {
        audioStatus.textContent = 'Speech Detected';
        audioStatus.className = 'text-red-600';
        } else {
        audioStatus.textContent = 'Listening (No speech detected)';
        audioStatus.className = 'text-green-600';
        }

        requestAnimationFrame(checkVolume);
    }

    checkVolume();
})
.catch(err => {
console.error('Microphone access denied:', err);
audioStatus.textContent = 'Microphone Blocked';
audioStatus.className = 'text-yellow-600';
});