import { readFileSync } from 'fs';

export const getFileContent = (name: string) => readFileSync(name).toString();

export const escapeUnicode = (str: string) =>
  str
    .split('')
    .map(item =>
      item.charCodeAt(0) < 256
        ? item
        : `\\u${item
            .charCodeAt(0)
            .toString(16)
            .toUpperCase()}`
    )
    .join('');
