import pako from 'pako';
import base64url from 'base64url';

export const encodeObjectToBase64 = (obj) => {
  const jsonStr = JSON.stringify(obj);
  const compressed = pako.deflate(jsonStr, { to: 'string' });
  return base64url.encode(compressed);
};

export const decodeBase64ToObject = (str) => {
  const decompressed = pako.inflate(base64url.toBuffer(str), { to: 'string' });
  return JSON.parse(decompressed);
};
