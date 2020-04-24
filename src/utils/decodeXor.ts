import md5 from 'crypto-js/md5';
import encHex from 'crypto-js/enc-hex';
import sha256 from 'crypto-js/sha256';

function hexToBytes(hex: string): number[] {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }

  return bytes;
}

export const generateKey = (url: string, downloadToken: string): number[] => {
  const filePath = decodeURIComponent(url.match(/https:\/\/(.*?\/){3}.*?(?<restPart>\/.+)/).groups.restPart);
  const md5Chars = md5(filePath).toString(encHex).split('');
  let partition = 0;
  for (let i = 0; i < md5Chars.length; i += 4) {
    const hex = [md5Chars[i], md5Chars[i + 1], md5Chars[i + 2], md5Chars[i + 3]].join('');
    partition += parseInt(hex, 16);
    partition %= 64;
  }
  const decodedHex = sha256(
    `${downloadToken.substring(0, partition)}${filePath}${downloadToken.substring(partition)}`,
  ).toString(encHex);

  return hexToBytes(decodedHex);
};

const decodeXor = (key: number[], content: ArrayBuffer): Buffer => {
  const typedContent = new Uint8Array(content);

  // eslint-disable-next-line no-bitwise
  let result = typedContent.map((byte, idx) => byte ^ key[idx % key.length]);
  if (result[0] === 239 && result[1] === 187 && result[2] === 191) {
    result = result.slice(3);
  }

  return Buffer.from(result);
};

export default decodeXor;
