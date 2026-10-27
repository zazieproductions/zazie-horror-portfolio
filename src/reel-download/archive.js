import { Zip, ZipPassThrough, strToU8 } from 'fflate';

const README = `Zazie Productions - Horror Demo Reel\n\nOriginal music by Zazie Kanwar-Torge.\n\nDownloading these recordings does not grant a licence to use them in a project,\nor permission to redistribute or republish them. For licensing information,\nvisit https://horror.zazieproductions.com/licensing.\n`;

function throwIfAborted(signal) {
  if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
}

/**
 * Assemble the site's existing MP3s into a ZIP without uploading them anywhere
 * or keeping a second copy on the server. MP3s are already compressed, so
 * ZipPassThrough stores them unchanged. Only one response is read at a time;
 * the resulting ZIP chunks are held until the browser can save the Blob.
 */
export async function createReelArchive(tracks, { fetcher = fetch, signal, onProgress = () => {} } = {}) {
  if (!tracks.length) throw new Error('The reel has no downloadable cues.');

  const chunks = [];
  let zipError;
  let finished = false;
  const zip = new Zip((error, chunk, final) => {
    if (error) zipError = error;
    else chunks.push(chunk);
    if (final) finished = true;
  });

  try {
    throwIfAborted(signal);
    const readme = new ZipPassThrough('README.txt');
    zip.add(readme);
    readme.push(strToU8(README), true);

    for (let index = 0; index < tracks.length; index += 1) {
      const track = tracks[index];
      throwIfAborted(signal);
      onProgress({ completed: index, total: tracks.length, title: track.title });

      const response = await fetcher(track.url, { signal, credentials: 'same-origin' });
      if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) {
        throw new Error(`Could not retrieve ${track.title}.`);
      }

      const entry = new ZipPassThrough(track.name);
      zip.add(entry);
      let bytes = 0;
      if (response.body && typeof response.body.getReader === 'function') {
        const reader = response.body.getReader();
        try {
          while (true) {
            throwIfAborted(signal);
            const { value, done } = await reader.read();
            if (done) break;
            if (value?.length) {
              entry.push(value);
              bytes += value.length;
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Some older browsers expose fetch but not a readable response stream.
        const value = new Uint8Array(await response.arrayBuffer());
        throwIfAborted(signal);
        if (value.length) entry.push(value);
        bytes = value.length;
      }
      throwIfAborted(signal);
      if (!bytes) throw new Error(`The file for ${track.title} is empty.`);
      entry.push(new Uint8Array(0), true);
      if (zipError) throw zipError;
    }

    throwIfAborted(signal);
    onProgress({ completed: tracks.length, total: tracks.length, title: null });
    zip.end();
    if (zipError) throw zipError;
    // ZipPassThrough is synchronous, so end() emits the final central directory.
    if (!finished) throw new Error('The ZIP could not be completed.');
    return new Blob(chunks, { type: 'application/zip' });
  } catch (error) {
    zip.terminate();
    throw error;
  }
}
