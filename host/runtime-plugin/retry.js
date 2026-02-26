import { RetryPlugin } from '@module-federation/retry-plugin';

const retryPlugin = () =>
  RetryPlugin({
    retryTimes: 4,
    retryDelay: 1000,
    addQuery: ({ times, originalQuery }) => originalQuery ? `${originalQuery}&retry=${times}` : `retry=${times}`,
    onRetry: (params) => {
      console.log('onRetry', params);
    },
    onSuccess: (params) => {
      console.log('onSuccess', params);
    },
    onError: (params) => {
      console.log('onError', params);
    },
    fetchOptions: {
      method: 'GET',
    },
  });
export default retryPlugin;
