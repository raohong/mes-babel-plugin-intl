import { declare } from '@babel/helper-plugin-utils';
import run from './run';
import { PluginOptions } from './types';

export default declare((_: any, options: PluginOptions) => {
  return run(true, options);
});
