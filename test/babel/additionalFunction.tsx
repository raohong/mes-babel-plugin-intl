import { useIntl } from 'umi';

const App = () => {
  const { formatMessage } = useIntl();

  const fake = formatMessage;

  return (
    <div>
      <p>
        {formatMessage({
          defaultMessage: '默认 formatMessage',
        })}
      </p>

      <p>
        {fake(
          {
            defaultMessage: '当前数量 : {total}',
          },
          { total: 5 }
        )}
      </p>
    </div>
  );
};
