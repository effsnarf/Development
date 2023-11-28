// New fetch method with progress update callback
const fetchWithProgress = async (
  url: string,
  options: any,
  updateProgress: Function
) => {
  // Start the fetch and obtain a reader
  let response = await fetch(url, options);

  if (!response.body) {
    throw new Error("ReadableStream not yet supported in this browser.");
  }

  const reader = response.body.getReader();

  // Get total length
  const contentLength = +(response.headers.get("Content-Length") || 0);

  // Read the data
  let receivedLength = 0; // received that many bytes at the moment
  let chunks = []; // array of received binary chunks (comprises the body)
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    // Call the updateProgress callback function
    if (updateProgress) {
      updateProgress(receivedLength, contentLength);
    }
  }

  // Concatenate chunks into single Uint8Array
  let chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (let chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  // Decode into a string
  let result = new TextDecoder("utf-8").decode(chunksAll);

  // Parse the result and return
  return result;
};

const fetchWithAlertify = async (url: string, options: any) => {
  const alertify = (window as any).alertify;
  let alrt = null as any;
  const title = "Downloading...";
  const title2 = options.title || url;
  const started = Date.now();
  const result = await fetchWithProgress(
    url,
    options,
    (received: number, total: number) => {
      const elapsed = Date.now() - started;
      if (elapsed < 1000) return;
      const msg = `<h3>${title}</h3><p class="text-center">${received.unitifySize()}</p>`;
      if (!alrt) alrt = alertify.message(msg).delay(0);
      else alrt.setContent(msg);
    }
  );
  if (alrt) alrt.dismiss();
  return result;
};

export { fetchWithProgress, fetchWithAlertify };
