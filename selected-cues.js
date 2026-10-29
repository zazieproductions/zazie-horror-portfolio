/* Progressive enhancement for the selected-cue listening archive. Native
   controls remain available if JavaScript or the custom player fails. */
(() => {
  const selector = '.zp-listening-track';
  // Audio is routed through an analyser only after a successful context resume.
  // If Web Audio is unavailable (or motion is reduced), playback stays native.
  const analysers = new WeakMap();
  const animations = new WeakMap();
  let context;
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stopVisual = (audio) => {
    const frame = animations.get(audio);
    if (frame) cancelAnimationFrame(frame);
    animations.delete(audio);
    audio.closest(selector)?.classList.remove('has-visualizer');
  };
  const startVisual = (audio) => {
    const analyser = analysers.get(audio);
    const track = audio.closest(selector);
    const canvas = track?.querySelector('.zp-cue-visualizer');
    if (!analyser || !canvas || audio.paused || !audio.isConnected || reducedMotion()) return;
    const pen = canvas.getContext('2d');
    if (!pen) return;
    stopVisual(audio);
    track.classList.add('has-visualizer');
    const waveform = new Uint8Array(analyser.fftSize);
    const frequencies = new Uint8Array(analyser.frequencyBinCount);
    let previous = 0;
    const draw = (time) => {
      if (audio.paused || audio.ended || !audio.isConnected || reducedMotion()) {
        stopVisual(audio);
        return;
      }
      animations.set(audio, requestAnimationFrame(draw));
      if (time - previous < 33) return;
      previous = time;
      const width = Math.max(1, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)));
      const height = Math.max(1, Math.round(canvas.clientHeight * Math.min(window.devicePixelRatio || 1, 2)));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      analyser.getByteTimeDomainData(waveform);
      analyser.getByteFrequencyData(frequencies);
      pen.clearRect(0, 0, width, height);
      // A quiet spectral field supports the brighter, true time-domain trace.
      const bars = 44;
      const step = width / bars;
      pen.fillStyle = 'rgba(223, 53, 58, .25)';
      for (let i = 0; i < bars; i++) {
        const bin = Math.floor(Math.pow(i / bars, 1.7) * (frequencies.length - 1));
        const magnitude = frequencies[bin] / 255 * height * .72;
        pen.fillRect(i * step, (height - magnitude) / 2, Math.max(1, step - 2), magnitude);
      }
      pen.beginPath();
      for (let x = 0; x < width; x += 2) {
        const sample = waveform[Math.floor(x / width * waveform.length)];
        const y = height / 2 + (sample - 128) / 128 * height * .43;
        if (x === 0) pen.moveTo(x, y); else pen.lineTo(x, y);
      }
      pen.strokeStyle = '#ff8a80';
      pen.lineWidth = Math.max(1, width / 300);
      pen.shadowColor = '#f03c44';
      pen.shadowBlur = 8;
      pen.stroke();
      pen.shadowBlur = 0;
    };
    animations.set(audio, requestAnimationFrame(draw));
  };
  const prepareVisual = (audio) => {
    if (reducedMotion() || !audio.closest(selector)?.querySelector('.zp-cue-visualizer')?.getContext('2d')) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      context ||= new AudioContext();
      // Resume from the click gesture before connecting the media element, so
      // a blocked context can never intercept and silence ordinary playback.
      Promise.resolve(context.state === 'running' ? undefined : context.resume()).then(() => {
        if (context.state !== 'running' || audio.paused || !audio.isConnected || reducedMotion()) return;
        if (!analysers.has(audio)) {
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = .8;
          analyser.connect(context.destination);
          const source = context.createMediaElementSource(audio);
          try { source.connect(analyser); } catch (error) { source.connect(context.destination); throw error; }
          analysers.set(audio, analyser);
        }
        startVisual(audio);
      }).catch(() => {});
    } catch (_) { /* Playback still works without the optional visualizer. */ }
  };
  const format = (seconds) => {
    const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };
  const setup = () => {
    document.querySelectorAll(selector).forEach((track) => {
      const audio = track.querySelector('audio');
      const controls = track.querySelector('.zp-cue-controls');
      if (!audio || !controls || track.dataset.cueReady) return;
      track.dataset.cueReady = 'true';
      track.querySelector('.zp-cue-seek').disabled = true;
      audio.controls = false;
      audio.hidden = true;
      controls.hidden = false;
    });
  };
  const update = (audio) => {
    const track = audio.closest(selector);
    if (!track || !track.dataset.cueReady) return;
    const playing = !audio.paused && !audio.ended;
    const title = audio.getAttribute('aria-label');
    const button = track.querySelector('.zp-cue-play');
    const seek = track.querySelector('.zp-cue-seek');
    const duration = audio.duration;
    track.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${title}`);
    button.firstElementChild.textContent = playing ? 'Ⅱ' : '▶';
    track.querySelector('.zp-cue-state').textContent = playing ? 'Playing' : 'Listen';
    track.querySelector('.zp-cue-current').textContent = format(audio.currentTime);
    seek.disabled = !Number.isFinite(duration) || duration <= 0;
    seek.value = seek.disabled ? 0 : Math.round((audio.currentTime / duration) * 1000);
    seek.style.setProperty('--seek', `${Number(seek.value) / 10}%`);
    seek.setAttribute('aria-valuetext', `${format(audio.currentTime)} of ${format(duration)}`);
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.zp-cue-play');
    if (!button) return;
    const audio = button.closest(selector).querySelector('audio');
    if (audio.paused) {
      prepareVisual(audio);
      const result = audio.play();
      if (result && result.catch) result.catch(() => {
        button.closest(selector).querySelector('.zp-cue-state').textContent = 'Playback unavailable';
      });
    } else audio.pause();
  });
  document.addEventListener('input', (event) => {
    if (!event.target.matches('.zp-cue-seek')) return;
    const audio = event.target.closest(selector).querySelector('audio');
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.target.value) / 1000;
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'ended'].forEach((type) => {
    document.addEventListener(type, (event) => {
      const audio = event.target;
      if (!(audio instanceof HTMLAudioElement)) return;
      if (type === 'play') {
        // Keep the featured cues and the main reel from playing over each other.
        document.querySelectorAll('audio').forEach((other) => { if (other !== audio && !other.paused) other.pause(); });
      }
      update(audio);
      if (audio.closest(selector)) {
        if (type === 'play') startVisual(audio);
        else if (type === 'pause' || type === 'ended') stopVisual(audio);
      }
    }, true);
  });
  document.addEventListener('error', (event) => {
    const audio = event.target;
    if (!(audio instanceof HTMLAudioElement)) return;
    const track = audio.closest(selector);
    if (!track) return;
    track.querySelector('.zp-cue-controls').hidden = true;
    audio.hidden = false;
    audio.controls = true;
  }, true);
  const start = () => {
    setup();
    // React replaces the prerendered homepage after load; enhance its new
    // archive too without tying playback to React's mount timing.
    const root = document.getElementById('root');
    if (root) new MutationObserver(setup).observe(root, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
