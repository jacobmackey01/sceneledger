export async function readResearchStream(body, onProgress) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result;
  function consume(line) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === "progress") onProgress(event);
    else if (event.type === "error") throw new Error(event.detail || event.error);
    else if (event.type === "result") result = event.data;
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      let newline;
      while ((newline = pending.indexOf("\n")) >= 0) {
        consume(pending.slice(0, newline));
        pending = pending.slice(newline + 1);
      }
      if (done) break;
    }
    consume(pending);
    if (!result) throw new Error("The research connection ended before a ledger arrived. Please retry later.");
    return result;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
