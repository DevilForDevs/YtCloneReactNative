import { getRandomBytes } from "./randomStringGenerator";
import 'react-native-get-random-values';

export function formatSeconds(time) {
    if (!time || isNaN(time)) return "00:00";
    const t = Math.floor(time);
    const mm = Math.floor(t / 60)
        .toString()
        .padStart(2, "0");
    const ss = Math.floor(t % 60)
        .toString()
        .padStart(2, "0");
    return `${mm}:${ss}`;
}


const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function getRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array); // now works
  return array[0] % max;
}

export function generate(alphabet, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[getRandomInt(alphabet.length)];
  }
  return result;
}

export function generateContentPlaybackNonce() {
  return generate(ALPHABET, 16);
}

export function generateTParameter() {
  return generate(ALPHABET, 12);
}
