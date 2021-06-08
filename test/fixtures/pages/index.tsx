import React from 'react';
import useFormatMessage from '../hooks/useFormatMessage';

export default () => {
  const { formatMessage } = useFormatMessage();

  return (
    <div>
      <p>{formatMessage('测试')}</p>
      <p>
        {/**
         * @message.scope offer
         * @message.en-US Send Offer
         */
        formatMessage('发送')}
      </p>
    </div>
  );
};
