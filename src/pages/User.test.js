import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import User from './User';
import E2EE from '@chatereum/react-e2ee';
import request_client from '../utils/common';

jest.mock('@chatereum/react-e2ee', () => ({ encryptPlaintext: jest.fn() }));
jest.mock('../utils/common', () => ({ get: jest.fn(), post: jest.fn() }));

const nativeGetComputedStyle = window.getComputedStyle.bind(window);
// jsdom does not provide the browser task queue used by Ant Design Form.
global.MessageChannel = class {
    constructor() {
        this.port1 = { onmessage: null };
        this.port2 = { postMessage: data => setTimeout(() => this.port1.onmessage?.({ data }), 0) };
    }
};

beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false, media: query, addListener: jest.fn(), removeListener: jest.fn(),
        addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
    }));
    jest.spyOn(window, 'getComputedStyle').mockImplementation(element => nativeGetComputedStyle(element));
});

afterAll(() => jest.restoreAllMocks());

beforeEach(() => {
    jest.clearAllMocks();
    request_client.get.mockResolvedValue({ data: 'public-key' });
    E2EE.encryptPlaintext.mockResolvedValue({ cipher_text: 'ciphertext', aes_key: 'wrapped-key', iv: 'iv' });
});

async function submitLogin() {
    await act(async () => { render(<User />); });
    fireEvent.change(screen.getByPlaceholderText('请输入邮箱或手机号'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /登\s*陆/ }));
}

test.each([
    [40101, '用户不存在'],
    [40301, '用户账号已被冻结，请联系管理员'],
    [40102, '用户密码错误'],
    [50001, '登录服务暂时不可用，请稍后重试'],
])('shows the backend message for login error %i once', async (code, message) => {
    request_client.post.mockRejectedValue({ response: { data: { code, message } } });
    await submitLogin();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(message)).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(request_client.post).toHaveBeenCalledTimes(1);
    expect(request_client.post).toHaveBeenCalledWith('api/login', {
        username: 'test@example.com', public_key: 'public-key', password: 'ciphertext', aes_key: 'wrapped-key', iv: 'iv',
    }, { skipGlobalError: true });
});

test('shows a network error when no response is received', async () => {
    request_client.post.mockRejectedValue(new Error('Network Error'));
    await submitLogin();
    expect(within(await screen.findByRole('dialog')).getByText('请求超时或网络错误，请检查网络设置')).toBeInTheDocument();
});

test('does not send a login request after encryption fails', async () => {
    E2EE.encryptPlaintext.mockRejectedValue(new Error('Invalid key'));
    await submitLogin();
    expect(within(await screen.findByRole('dialog')).getByText('加密密码失败，请刷新页面后重试')).toBeInTheDocument();
    expect(request_client.post).not.toHaveBeenCalled();
});

test('validates required fields before sending a login request', async () => {
    await act(async () => { render(<User />); });
    fireEvent.click(screen.getByRole('button', { name: /登\s*陆/ }));
    await screen.findByText('请输入邮箱或手机号');
    expect(request_client.post).not.toHaveBeenCalled();
    expect(E2EE.encryptPlaintext).not.toHaveBeenCalled();
});

test('shows success without an error dialog on a successful login', async () => {
    request_client.post.mockResolvedValue({ data: { id: 1 } });
    await submitLogin();
    await waitFor(() => expect(screen.getByText('登录成功')).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
