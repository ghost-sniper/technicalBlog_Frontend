import { defaultUrlTransform } from 'react-markdown';
import request_client from './common';

export function articleImageUrl(url, key) {
  if (key === 'src' && /^\/api\/article-images\/[1-9]\d*$/.test(url)) {
    return request_client.getUri({ url: url.slice(1) });
  }
  return defaultUrlTransform(url);
}
