import { FormattedMessage } from 'umi';
import useFormatMessage from './useFormatMessage';

const App = () => {
  const { formatMessage } = useFormatMessage();
  const intl = useIntl();

  return (
    <div>
      <p>
        {/**
         * @message.en-US Test
         */
        formatMessage('测试')}
      </p>
      <p>
        {/**
         * @message.scope test
         * @message.en-US Test Function
         */
        formatMessage('测试')}
      </p>
      <p>{formatMessage('已选择 {total} 项', { total: 0 })}</p>

      <br />

      <p>
        {intl.formatMessage({
          defaultMessage: '默认 formatMessage',
        })}
      </p>

      <p>
        {intl.formatMessage(
          {
            defaultMessage: '当前数量 : {total}',
          },
          { total: 5 }
        )}
      </p>

      {/**
       * @message.en-US 哈哈哈
       */}
      <FormattedMessage defaultMessage="测试 FormattedMessage" />
      <FormattedMessage defaultMessage="渲染 {total} FormattedMessage" values={{ total: 4 }} />
    </div>
  );
};
