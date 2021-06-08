import { NodePath, types as t } from '@babel/core';
import { CallExpression, JSXOpeningElement } from '@babel/types';
import { MessageDescriptor } from '../types';

export const cloneJSXOpeningElement = (
  path: NodePath<JSXOpeningElement>,
  descriptor: MessageDescriptor,
  msgAttr: t.JSXAttribute | null,
  removeDefaultMessage: boolean
) => {
  return t.jsxOpeningElement(t.jsxIdentifier((path.node.name as t.JSXIdentifier).name), [
    ...(removeDefaultMessage
      ? path.node.attributes.filter(attr => attr !== msgAttr)
      : path.node.attributes),
    t.jSXAttribute(t.jsxIdentifier('id'), t.stringLiteral(descriptor.id)),
  ]);
};

export const cloneNormalCallExpression = (
  path: NodePath<CallExpression>,
  name: string,
  descriptor: MessageDescriptor,
  msgProp: t.ObjectProperty | null,
  removeDefaultMessage: boolean
) => {
  const { node } = path;
  const args = node.arguments[0] as t.ObjectExpression;

  const pathArgs = [
    t.objectExpression([
      ...(removeDefaultMessage ? args.properties.filter(p => p !== msgProp) : args.properties),
      t.objectProperty(t.identifier('id'), t.stringLiteral(descriptor.id)),
    ]),
    ...path.node.arguments.slice(1),
  ];

  if (t.isIdentifier(node.callee)) {
    return t.callExpression(t.identifier(name), pathArgs);
  }

  const memberCallee = node.callee as t.MemberExpression;
  const object = memberCallee.object as t.Identifier;

  return t.callExpression(
    t.memberExpression(
      t.identifier(object.name),
      t.identifier((memberCallee.property as t.Identifier).name)
    ),
    pathArgs
  );
};
