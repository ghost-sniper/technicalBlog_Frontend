import { message } from 'antd';
import request_client from './common';

jest.mock('axios', () => ({
    create: jest.fn(() => ({
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
}));
jest.mock('antd', () => ({ message: { error: jest.fn() } }));

const rejectResponse = request_client.interceptors.response.use.mock.calls[0][1];

test('lets the login page display its own dialog without a global toast', async () => {
    const error = {
        config: { skipGlobalError: true },
        response: { status: 401, data: { code: 40102, message: '用户密码错误' } },
    };
    await expect(rejectResponse(error)).rejects.toBe(error);
    expect(message.error).not.toHaveBeenCalled();
});

test('still displays global errors for other requests', async () => {
    const error = { config: {}, response: { status: 500 } };
    await expect(rejectResponse(error)).rejects.toBe(error);
    expect(message.error).toHaveBeenCalledWith('服务器内部错误(500)');
});
