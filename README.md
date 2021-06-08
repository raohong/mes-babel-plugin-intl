适用 antd-pro 的一个国际化文本自动提取生成工具，免去烦人的手写 ID 和在不同 locale 文件跳转。

思路是利用 `defaultMessage` ，对没有 ID 的编译时自动生成 ID ，并提取到文件中，提供了 json 文件和 Excel 文件互转，可以在注释里手动配置翻译。

- [使用](#使用)
  - [antd-pro](#antd-pro)
- [Plugin](#plugin)
  - [BabelPlugin](#babelplugin)
    - [使用](#使用-1)
    - [配置选项](#配置选项)
  - [UmiPlugin](#umiplugin)
    - [使用](#使用-2)
    - [配置选项](#配置选项-1)
  - [CLI](#cli) - [不用 atool-l10n 翻译](#不用-atool-l10n-翻译) - [使用 atool-l10n 翻译](#使用-atool-l10n-翻译)
    - [scan](#scan)
      - [`-s --source`](#-s---source)
      - [`-d --dist`](#-d---dist)
      - [配置](#配置)
    - [transform](#transform)
      - [`-s --source`](#-s---source-1)
      - [`-d --dist`](#-d---dist-1)
      - [`-l --locale`](#-l---locale)
    - [pick](#pick)
      - [`-s --source`](#-s---source-2)
      - [`-d --dist`](#-d---dist-2)
    - [t](#t)
    - [distribute](#distribute)
      - [内置快捷函数](#内置快捷函数)

* [更新日志](./CHANGELOG.md)

# 使用

## 安装

#### yarn

`yarn add mes-babel-plugin-intl`

#### npm

`npm i mes-babel-plugin-intl`

## antd-pro

1. config.ts 配置插件 `mes-babel-plugin-intl`

   ```ts
   export default defineConfig({
     plugins: [require.resolve('mes-babel-plugin-intl')],
   });
   ```

2. 顶层目录配置 `l10n.config.js`

   ```js
   module.exports = {
     middlewares: {
       summary: ['summary?sourcePattern=i18n-messages/**/*.json'],
       process: [
         'fetchLocal?source=locales,skip',
         'metaToResult?from=defaultMessage,to=zh',
         'youdao?apiname=iamatestmanx,apikey=2137553564',
         'reduce?-autoPick,autoReduce[]=local,autoReduce[]=meta',
       ],
       emit: ['save?dest=locales'],
     },
   };
   ```

3. 开发

   ```tsx
   import { useIntl } from 'umi';

   const App = () => {
     const { formatMessage } = useIntl();

     return (
       <div>
         <p>{formatMessage({ defaultMessage: '提交' })}</p>
         <p>{formatMessage({ defaultMessage: '发送' })}</p>
       </div>
     );
   };
   ```

   也可以使用注释来配置默认的翻译 （仅使用函数有效）
   下面默认 en-US 翻译为 Submit

   ```tsx
   import { useIntl } from 'umi';

   const App = () => {
     const { formatMessage } = useIntl();

     return (
       <div>
         <p>
           {/**
            * @messagge.en-US Submit
            * @messagge.zh-TW 發送
            */
           formatMessage({ defaultMessage: '发送' })}
         </p>
       </div>
     );
   };
   ```

   使用 scope

   ```tsx
   import { useIntl } from 'umi';

   const App = () => {
     const { formatMessage } = useIntl();

     return (
       <div>
         <p>
           {/**
            * @message.scope Offer
            * @messagge.en-US Submit
            */
           formatMessage({ defaultMessage: '发送' })}
         </p>
       </div>
     );
   };
   ```

4. 导出 excel 文件

   - `mes-intl scan`
   - `mes-intl transform`

5) 翻译完毕写入 src `mes-intl distribute`

# Plugin

## BabelPlugin

利用 defaultMessage 自动生成 ID 。

### 使用

```ts
import { BabelPluginUmiMesIntl } from 'mes-babel-plugin-intl';
```

配置到 Babel Plugin 里

**.babelrc** 或者 **Webpack**

```js

{
  "plugins": [
    [
      BabelPluginUmiMesIntl,
      // options
    ]
  ]
}

```

### 配置选项

```tsx
interface PluginOptions {
  functionNames?: string[]; // 额外的 function ，内置 formatMessage
  componentNames?: string[]; // 额外的 component ， 内置 FormattedMessage
  shortcut?:
    | boolean
    | {
        functionName: string;
      }; // 是否启用内置的一个[快捷函数](#hook) ，或者快捷函数的名称
  fileLoc?: boolean; // MessaggeDescriptor 的位置 ，默认 false
  removeDefaultMessage?: boolean; // 是否去除 defaultMessage ，默认 false
}
```

内置的一个 [快捷函数](#内置快捷函数)

## UmiPlugin

### 使用

在 config.js 配置 plugins

```ts
export default {
  plugins: ['mes-babel-plugin-intl'],

  // 配置选项
  babelPluginMesIntl: {},
};
```

### 配置选项

见 [Babel Plugin Options](#配置选项)

---

## CLI

提供了一些工具，在 umi 项目里使用默认配置即可

**使用流程**

###### 不用 atool-l10n 翻译

1. `mes-intl scan`
2. `mes-intl transform`
3. `mes-intl distribute`

###### 使用 atool-l10n 翻译

1. `mes-intl scan`
2. `mes-intl t`
3. `mes-intl pick`
4. `mes-intl distribute`

### scan

提取目标路径中的所有 `.ts|tsx|js|jsx` 文件里的数据

```
mes-intl scan -s src
```

#### `-s --source`

目标路径，默认为 `src`

#### `-d --dist`

输出文件， 默认为 `./i18n-messages/data.json`

#### 配置

可以在顶层目录中自定义配置

```tsx
export interface MessageDescriptor {
  id: string;
  defaultMessage: string;
  filename?: string;
  loc?: SourceLocation;
  translatedMessage?: Record<string, string>;
  [locale: string]: any;
}

export interface PluginOptions {
  functionNames?: string[];
  componentNames?: string[];
  shortcut?:
    | boolean
    | {
        functionName: string;
      };
  fileLoc?: boolean;
  removeDefaultMessage?: boolean;
}

export interface ScanOptions extends PluginOptions {
  // 目录路径
  source?: string;
  // 输出文件
  dist?: string;
  // 自定义数据转换
  convertor?: (store: Map<string, MessageDescriptor>) => any;
}
```

### transform

将 scan 提取到的 json 文件转为 excel 文件，还会将注释里写的翻译合并

#### `-s --source`

目标路径，默认为 `./i18n-messages/data.json`

#### `-d --dist`

输出文件， 默认为 `translated.xlsx` ，默认目录 l18n.config 的输出目录，一般为 `locales`

#### `-l --locale`

默认 locale ，默认为 `zh-CN`

### pick

将 atool-110n 翻译的 json 数据转为 excel 文件，还会将注释里写的翻译合并

#### `-s --source`

目标目录，将提取其中所有 json 数据，默认为 `i18n-messages`

#### `-d --dist`

输出 excel 文件名，默认为 `translated.xlsx`

### t

翻译命令，调用 atool-l10n 翻译

### distribute

适用 umi 项目

将 excel 文件翻译的数据放到 src/locales 里

#### 内置快捷函数

```tsx
import { useCallback } from 'react';
import { useIntl } from 'umi';

export type UsedFormatMessage = {
  (defaultMessage: string, id?: string): string;
  (defaultMessage: string, query: Record<string, any>, id?: string): string;
};

const useFormatMessage = () => {
  const { formatMessage } = useIntl();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleFormatMessage = useCallback(
    ((defaultMessage: string, query: any, maybeId?: string) => {
      const rawId = typeof query === 'string' ? query : maybeId;
      const id = rawId || Date.now() + Math.random().toString(36);

      try {
        const result = formatMessage(
          {
            defaultMessage,
            id,
          },
          typeof query === 'object' ? query : undefined
        );

        return result;
      } catch (err) {
        return defaultMessage;
      }
    }) as UsedFormatMessage,
    [formatMessage]
  );

  return { formatMessage: handleFormatMessage };
};

export default useFormatMessage;
```
