import fs from 'fs';

import decodeXor, { generateKey } from '@src/utils/decodeXor';

describe('generateKey', () => {
  it('generates key', () => {
    const url = 'https://streaming-ebook.books.com.tw/V1.0/Streaming/book/E2685A/7408643/META-INF/container.xml';
    const downloadToken = '6583ceVRQYfpG5+OM/JhAw/pNHyJQSet0wYsBYKHrHRLROk9U3oWDMrIsvq4MWn0ZwWt2ykDPF+MxMxTEYYheDA39UYYl5bI3UlRFoxtvfj+FtaF7wSELJZToydPw0rcpyu8GS/PoZw98Rm3dsYQVqSBrLyzFxSdnAB0gmSlQWKe0YvA3z0gtOuRGxzIpS590j/AThNI8N0XLP0viDD41UQqkXTn4yX/urRvVuw6q/uVCOUzgG4FWmXvWn950SOSsz8SuDD+WhaBVk7W2L0yK0R+TNbflEjUrXrxZrpjQOtXzlPLFKzVZNH5pm6stmmo+kqbKpvhLAIrYC4lUoq2bzfZCS65GaLkLwes7BJ97ZFcfhLDFhKLeGSFWv2+2GcMsNcxPwlTBHZi8affRTIMBvAqphKcv/H+c4N1WJgLtDS7G2KAXO4n0Mdf5t8TlAl4Snr0bOwwpbEl56X7ZJ9XHQudnw1B7tlaoZ/oyw74AtHDACmP3VUiwL2OGZYhXXhfyR9ACMCL/G9K6DwFAyidQPl0xifB7tlaoZ/oywZEjOCJfvFbGtVs5Ifpnyqw+w9Fp5xzHYRF1WoWNfCJcWewNCCKGHd442qOW6fRZ13acuRg6QwcIiSrGuAmDo0OZG7+Wc/GHtMxTFPMhWwdluDFo20Ysp3tq6/NxuP3zOhiifOWpQQ1fxR7vYY8LZ7/ZVBdexe3zV3yvRAOlhw5djCQx+8ycbRFshMbC2yI7Ll/j8H2L7eVo9eJNqWrrH9K0YJCFaAYWp5oYULMdCS/aNCbRUIFtTBdd8wtSPvKxy5oYULMdCS/ZNURQggoZdY70YG1ZMBUkFoAJSAxjMbA5aZOFsiTw8H8PCX4Oz2QvbxEHD6U6QoCrI7/uf0iTK/NjsSSJ5ucorypLi3rCU9yIR5mGmSy/YPQ8/P960tg7xP/rACv8lxdBUHR2AKfwuZg==';
    const key = generateKey(url, downloadToken);
    const expectedKey = [99, 221, 234, 190, 117, 9, 16, 0, 224, 242, 36, 139, 71, 178, 197, 213,
      17, 203, 167, 30, 214, 223, 230, 160, 69, 135, 148, 130, 53, 37, 192, 59];

    expect(key).toEqual(expectedKey);
  });
});

describe('decodeXor', () => {
  it('decodes content by xor', () => {
    const key = [41, 199, 90, 11, 138, 182, 119, 242, 203, 98, 65, 29, 193, 151, 152, 218, 249, 2,
      189, 222, 64, 81, 30, 252, 69, 235, 236, 240, 49, 4, 192, 195];
    const encryptedContent = fs.readFileSync('test/fixtures/decodeXor/encryptedBody');
    const expectedContent = fs.readFileSync('test/fixtures/decodeXor/decodedBody');

    expect(decodeXor(key, encryptedContent)).toEqual(expectedContent);
  });
});
