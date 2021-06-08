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
