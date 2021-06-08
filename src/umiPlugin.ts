import { IApi } from '@umijs/types';
import { UmiPluginKey } from './config';
import plugin from './plugin';

export default (api: IApi) => {
  api.describe({
    key: UmiPluginKey,
    config: {
      default: undefined,
      schema(joi) {
        return joi.object({
          functionNames: joi.array().items(joi.string()),
          componentNames: joi.array().items(joi.string()),
          fileLoc: joi.boolean(),
          removeDefaultMessage: joi.boolean(),
          shortcut: [
            joi.boolean(),
            joi.object({
              functionName: joi.string(),
            }),
          ],
        });
      },
    },
  });

  api.modifyBabelOpts(babelOpts => {
    babelOpts.plugins.push([plugin, api?.config?.[UmiPluginKey]]);

    return babelOpts;
  });
};
