import { NodePath, PluginObj, types as t } from '@babel/core';
import { CallExpression, JSXOpeningElement } from '@babel/types';
import { codeFrameColumns } from '@babel/code-frame';
import genId from './utils/id';
import { cloneJSXOpeningElement, cloneNormalCallExpression } from './utils/ast';
import praseCommments from './utils/praseComments';
import { MessageDescriptor, PluginOptions } from './types';
import { CalleeFunctionNames, ComponentNames, ShortcutFunctionName } from './config';

function createJSXMessageDescriptor(
  path: NodePath<JSXOpeningElement>,
  writeMode: boolean = true,
  removeDefaultMessage: boolean = false
) {
  const { attributes } = path.node;

  const descriptor = {} as MessageDescriptor;
  let msgAttr: t.JSXAttribute | null = null;

  attributes.forEach(attr => {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && t.isStringLiteral(attr.value)) {
      const value = attr.value.value?.trim();
      const name = attr.name.name;

      if (name === 'id') {
        descriptor.id = value;
      } else if (name === 'defaultMessage') {
        msgAttr = attr;
        descriptor.defaultMessage = value;
      }
    }
  });

  if (descriptor.defaultMessage) {
    if (!descriptor.id) {
      descriptor.id = genId(descriptor.defaultMessage);
      if (writeMode) {
        // 原地加上 id
        path.replaceWith(cloneJSXOpeningElement(path, descriptor, msgAttr, removeDefaultMessage));
        path.skip();
      }
    } else if (removeDefaultMessage) {
      path.replaceWith(cloneJSXOpeningElement(path, descriptor, msgAttr, true));
      path.skip();
    }

    return descriptor;
  }

  return null;
}

function createFunctionMessageDescriptor(
  path: NodePath<CallExpression>,
  shortcut: false | string,
  writeMode: boolean = true,
  removeDefaultMessage: boolean = false
) {
  const { node } = path;
  const name = t.isIdentifier(node.callee)
    ? node.callee.name
    : ((node.callee as t.MemberExpression).property as t.Identifier).name!;
  const args = node.arguments[0];
  const restArgs = node.arguments[1];
  const maybeIdArgs = node.arguments[2];
  const descriptor = {} as MessageDescriptor;

  let msgProp: t.ObjectProperty | null = null;
  let hasQuery = false;

  const translatedMessage = praseCommments(node.leadingComments);

  if (
    t.isIdentifier(node.callee) &&
    typeof shortcut === 'string' &&
    name === shortcut &&
    t.isStringLiteral(args) &&
    args.value.trim()
  ) {
    descriptor.defaultMessage = args.value.trim();

    if (
      t.isStringLiteral(restArgs) ||
      (t.isObjectExpression(restArgs) && restArgs.properties.length > 0)
    ) {
      hasQuery = t.isObjectExpression(restArgs) && restArgs.properties.length > 0;
      descriptor.id = t.isStringLiteral(restArgs)
        ? restArgs.value.trim()
        : t.isStringLiteral(maybeIdArgs)
        ? (maybeIdArgs as t.StringLiteral).value.trim()
        : '';
    }

    if (translatedMessage?.messages) {
      descriptor.translatedMessage = translatedMessage.messages;
    }

    if (!descriptor.id) {
      descriptor.id = genId(descriptor.defaultMessage, translatedMessage?.scope);

      if (writeMode) {
        path.replaceWith(
          t.callExpression(t.identifier(name), [
            args,
            ...(hasQuery
              ? [restArgs, t.stringLiteral(descriptor.id)]
              : [t.stringLiteral(descriptor.id)]),
          ])
        );
        path.skip();
      }
    }

    return descriptor;
  }

  if (!t.isObjectExpression(args)) {
    return null;
  }

  args.properties.forEach(prop => {
    if (!t.isObjectProperty(prop)) {
      return;
    }

    const { key, value } = prop;

    if (t.isIdentifier(key) && t.isStringLiteral(value)) {
      const val = value.value.trim();
      if (key.name === 'id') {
        descriptor.id = val;
      } else if (key.name === 'defaultMessage') {
        descriptor.defaultMessage = val;
        msgProp = prop;
      }
    }
  });

  if (translatedMessage?.messages) {
    descriptor.translatedMessage = translatedMessage?.messages;
  }

  if (descriptor.defaultMessage) {
    if (!descriptor.id) {
      descriptor.id = genId(descriptor.defaultMessage, translatedMessage?.scope);

      // insert id
      if (writeMode) {
        path.replaceWith(
          cloneNormalCallExpression(path, name, descriptor, msgProp, removeDefaultMessage)
        );
        path.skip();
      }
    } else if (removeDefaultMessage) {
      path.replaceWith(cloneNormalCallExpression(path, name, descriptor, msgProp, true));
      path.skip();
    }

    return descriptor;
  }

  return null;
}

function checkRepeatedDescriptor(
  path: NodePath<t.JSXOpeningElement> | NodePath<t.CallExpression>,
  descriptor: MessageDescriptor,
  storage: Map<string, MessageDescriptor[]>
) {
  const prev = storage.get(descriptor.id);

  if (prev?.length) {
    prev.forEach(item => {
      if (item.defaultMessage !== descriptor.defaultMessage) {
        const result = codeFrameColumns(path.hub.getCode()!, path.node.loc!);

        console.log('There are duplicate id, different messages:');
        console.log(`ID:             ${item.id}`);
        console.log(`defaultMessage: ${item.defaultMessage}`);
        console.log(result);
      }
    });
  }
}

function run(
  writeMode: boolean,
  options: PluginOptions,
  storage?: Map<string, Map<string, MessageDescriptor[]>>
): PluginObj {
  const componentNames = ComponentNames.concat(options.componentNames || []);
  const functionNames = CalleeFunctionNames.concat(options.functionNames || []);
  const shortcut =
    'shortcut' in options
      ? typeof options.shortcut === 'boolean' && options.shortcut
        ? ShortcutFunctionName
        : typeof options.shortcut === 'object'
        ? options.shortcut.functionName
        : ''
      : ShortcutFunctionName;

  return {
    pre() {
      if (storage) {
        storage.set(this.filename, new Map());
      }
    },
    visitor: {
      JSXOpeningElement(path, file) {
        const { name } = path.node;
        const { filename } = file;

        if (t.isJSXIdentifier(name) && componentNames.includes(name.name)) {
          const descriptor = createJSXMessageDescriptor(
            path,
            writeMode,
            options.removeDefaultMessage
          );

          if (descriptor && storage) {
            if (options.fileLoc) {
              descriptor.filename = filename;
              descriptor.loc = path.node.loc!;
            }

            const container = storage.get(filename)!;

            checkRepeatedDescriptor(path, descriptor, container);

            if (container.has(descriptor.id)) {
              container.get(descriptor.id)?.push(descriptor);
            } else {
              container.set(descriptor.id, [descriptor]);
            }
          }
        }
      },
      CallExpression(path, file) {
        const { callee } = path.node;
        const { filename } = file;

        if (
          (t.isIdentifier(callee) && functionNames.includes(callee.name)) ||
          (t.isMemberExpression(callee) &&
            t.isIdentifier(callee.property) &&
            t.isIdentifier(callee.object) &&
            functionNames.includes(callee.property.name))
        ) {
          const descriptor = createFunctionMessageDescriptor(
            path,
            shortcut,
            writeMode,
            options.removeDefaultMessage
          );

          if (descriptor && storage) {
            if (options.fileLoc) {
              descriptor.filename = filename;
              descriptor.loc = path.node.loc!;
            }

            const container = storage.get(filename)!;

            checkRepeatedDescriptor(path, descriptor, container);

            if (container.has(descriptor.id)) {
              container.get(descriptor.id)?.push(descriptor);
            } else {
              container.set(descriptor.id, [descriptor]);
            }
          }
        }
      },
    },
  };
}

export default run;
