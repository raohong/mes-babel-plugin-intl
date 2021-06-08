import * as sh from 'shorthash';

const genId = (message: string, scope?: string) => {
  return sh.unique(message + (scope || ''));
};

export default genId;
