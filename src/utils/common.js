import axios from 'axios';
import { message } from 'antd';

const request_client = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/',
    timeout: 6000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

request_client.interceptors.request.use(config => {
  console.log('实际请求地址:', config.baseURL + config.url);
  return config;
});

request_client.interceptors.response.use(response => response, error => {
    // Pages with their own error dialog handle the failure once, locally.
    if (error.config?.skipGlobalError) {
        return Promise.reject(error);
    }
    const { response } = error;
    if (response) {
        const status = response.status;
        let errorMessage = '';
        switch (status) {
            case 400:
                errorMessage = '请求参数错误(400)';
                break;
            case 401:
                errorMessage = '未授权，请重新登录(401)';
                break;
            case 403:
                errorMessage = '拒绝访问(403)';
                break;
            case 404:
                errorMessage = '请求资源不存在(404)';
                break;
            case 500:
                errorMessage = '服务器内部错误(500)';
                break;
            default:
                errorMessage = response.data?.message || `请求失败 状态码(${status})!`;
        }
        message.error(errorMessage);
    } else if (error.request) {
        message.error('请求超时或网络错误，请检查网络设置!');
    } else {
        message.error('请求失败，请检查网络设置!');
    }
    return Promise.reject(error);
})
export default request_client;
