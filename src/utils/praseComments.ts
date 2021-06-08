import { types as t } from '@babel/core';

const scopeRegexp = /@message\.scope(?:[\t\x20])+([\w-]+)/;

const praseCommments = (
  leadingComments: readonly t.Comment[] | null
): null | {
  scope: string | undefined;
  messages: Record<string, string> | undefined;
} => {
  if (!leadingComments) {
    return null;
  }

  const scope = leadingComments
    .map(item => item.value)
    .map(item => {
      const matched = item.match(scopeRegexp);

      return matched?.[1];
    })
    .filter(Boolean)?.[0];

  const matchedList: RegExpExecArray[] = [];

  leadingComments.forEach(({ value }) => {
    const data = value.split(/\n/);

    data.forEach(item => {
      let tmp: RegExpExecArray | null;
      const messagesRegexp = /@message\.([a-z]{2}-[A-Z]{2})(?:[\t\x20])+([^\s@]+(?:\s+?[^\s@]+)*)/g;

      while ((tmp = messagesRegexp.exec(item))) {
        matchedList.push(tmp);
      }
    });
  });

  const data = matchedList.reduce((result, item) => {
    const [, locale, message] = item;

    if (!locale || !message) {
      return result;
    }

    result[locale] = message;

    return result;
  }, {} as Record<string, string>);

  return {
    scope,
    messages: Object.keys(data).length ? data : undefined,
  };
};

export default praseCommments;
