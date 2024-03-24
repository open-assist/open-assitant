async function digestMessage(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

export async function genSystemFingerprint(seed?: number) {
  const hash = await digestMessage(`open-assistant-${seed}`);
  return `fp_${hash.slice(0, 10)}`;
}
