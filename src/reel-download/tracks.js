/** Read the downloadable cues from the same archive visitors see on /reel. */
export function readReelTracks(document) {
  const rows = [...document.querySelectorAll('#cues details.faq-item')];
  if (!rows.length) throw new Error('The reel cue list is unavailable.');

  const tracks = rows.map((row, index) => {
    const link = row.querySelector('a[data-cue-download]');
    const audio = row.querySelector('audio');
    const notes = row.querySelector('a.inline-link');
    const url = link?.getAttribute('href');
    const filename = link?.getAttribute('download');
    const title = notes?.textContent.trim().replace(/^Cue notes:\s*/, '');

    // Refuse to create a partial or misleading ZIP if the page markup drifts.
    if (!url || !/^\/audio\/track-\d{2}\.mp3$/.test(url) || audio?.getAttribute('src') !== url ||
        !filename || !/^[a-z0-9-]+\.mp3$/.test(filename) || !title) {
      throw new Error(`Cue ${index + 1} is missing its downloadable MP3.`);
    }
    return { url, title, name: `${String(index + 1).padStart(2, '0')} - ${filename}` };
  });

  if (new Set(tracks.map((track) => track.url)).size !== tracks.length ||
      new Set(tracks.map((track) => track.name)).size !== tracks.length) {
    throw new Error('The reel cue list contains duplicate files.');
  }
  return tracks;
}
