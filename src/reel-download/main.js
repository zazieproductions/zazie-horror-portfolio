import { createReelArchive } from './archive.js';
import { readReelTracks } from './tracks.js';

/** Progressively enhance the reel page; individual MP3 links need no script. */
export function initReelDownload(document, env = globalThis, makeArchive = createReelArchive) {
  const card = document.querySelector('[data-reel-download-card]');
  if (!card) return;
  const start = card.querySelector('[data-reel-download]');
  const cancel = card.querySelector('[data-reel-cancel]');
  const save = card.querySelector('[data-reel-save]');
  const progress = card.querySelector('[data-reel-progress]');
  const status = card.querySelector('[data-reel-status]');
  if (!start || !cancel || !save || !progress || !status) return;

  // Keep the normal individual-download link visible if an API or script is
  // unavailable. Never expose a button that cannot do anything.
  if (typeof env.fetch !== 'function' || typeof env.AbortController !== 'function' ||
      typeof env.Blob !== 'function' || typeof env.URL?.createObjectURL !== 'function') {
    status.textContent = 'The ZIP needs a modern browser. You can download individual MP3s below.';
    return;
  }

  let tracks;
  try {
    tracks = readReelTracks(document);
  } catch (_) {
    status.textContent = 'The ZIP is unavailable right now. You can download individual MP3s below.';
    return;
  }

  let controller;
  let objectUrl;
  start.hidden = false;
  progress.max = tracks.length;

  cancel.addEventListener('click', () => {
    if (!controller) return;
    cancel.disabled = true;
    status.textContent = 'Cancelling download…';
    controller.abort();
  });

  start.addEventListener('click', async () => {
    if (controller) return;
    controller = new env.AbortController();
    const signal = controller.signal;
    let currentTitle = '';
    start.disabled = true;
    start.textContent = 'Preparing ZIP…';
    cancel.hidden = false;
    cancel.disabled = false;
    save.hidden = true;
    progress.value = 0;
    progress.hidden = false;
    status.textContent = 'Preparing your reel. Keep this page open.';

    try {
      const archive = await makeArchive(tracks, {
        signal,
        fetcher: env.fetch.bind(env),
        onProgress: ({ completed, total, title }) => {
          progress.value = completed;
          currentTitle = title || '';
          status.textContent = title
            ? `Preparing ${completed + 1} of ${total}: ${title}…`
            : 'Finishing your ZIP…';
        },
      });
      if (signal.aborted) throw new DOMException('Download cancelled', 'AbortError');
      if (objectUrl) env.URL.revokeObjectURL(objectUrl);
      objectUrl = env.URL.createObjectURL(archive);
      save.href = objectUrl;
      save.hidden = false;
      start.hidden = true;
      cancel.hidden = true;
      status.textContent = 'Your ZIP is ready. If the download did not start, select Save ZIP.';
      save.focus();
      // Some browsers require another gesture after an async operation; the
      // visible Save ZIP link remains available if this automatic click fails.
      try { save.click(); } catch (_) { /* The visitor can use Save ZIP. */ }
    } catch (error) {
      progress.hidden = true;
      cancel.hidden = true;
      start.disabled = false;
      if (signal.aborted || error?.name === 'AbortError') {
        start.textContent = 'Download demo reel (ZIP)';
        status.textContent = 'Download cancelled. No ZIP was saved.';
      } else {
        start.textContent = 'Try ZIP download again';
        status.textContent = `Could not prepare the ZIP${currentTitle ? ` while fetching ${currentTitle}` : ''}. Check your connection and try again, or download individual MP3s below.`;
      }
      start.focus();
    } finally {
      controller = undefined;
    }
  });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initReelDownload(document, window);
}
