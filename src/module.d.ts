declare module '@babel/helper-plugin-utils' {
  export const declare: <T extends (...args: any[]) => any>(fn: T) => T;
}

declare module 'shorthash' {
  const unique: (s: string) => string;

  module.exports = unique;
}
