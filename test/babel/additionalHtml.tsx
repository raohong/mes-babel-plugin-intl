import { FormattedHtmlMessage } from 'umi';

const App = () => {
  return (
    <div>
      <FormattedHtmlMessage defaultMessage="测试 FormattedHtmlMessage" />
      <FormattedHtmlMessage defaultMessage="渲染 {total} FormattedHtmlMessage" values={{ total: 4 }} />
    </div>
  );
};
