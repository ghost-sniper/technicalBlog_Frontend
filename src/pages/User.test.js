import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import User from './User';
import E2EE from '@chatereum/react-e2ee';
import request_client from '../utils/common';

jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }));

jest.mock('@chatereum/react-e2ee', () => ({ encryptPlaintext: jest.fn() }));
jest.mock('../utils/common', () => ({ get: jest.fn(), post: jest.fn() }));

global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

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

const profileData = { user: { id: 1, username: '作者甲', email: 'author@example.com', user_level: 2, introduction: '分享工程实践', create_time: '2026-01-01T00:00:00' }, articles: [{ id: 10, article_title: '我的技术笔记', prospectus: '关于工程实践', view_type: 'public', view_count: 12, like_count: 2 }], count: 1 };

test('shows the personal homepage after successful login', async () => {
    request_client.post.mockImplementation(async () => { request_client.get.mockResolvedValue({ data: profileData }); return { data: { id: 1 } }; });
    await submitLogin();
    await waitFor(() => expect(request_client.post).toHaveBeenCalled());
    request_client.get.mockResolvedValue({ data: profileData });
    expect(await screen.findByRole('heading', { name: '个人主页' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('restores the session and shows profile information and authored articles', async () => {
    request_client.get.mockResolvedValue({ data: profileData });
    await act(async () => { render(<User />); });
    expect(await screen.findByRole('heading', { name: '个人主页' })).toBeInTheDocument();
    expect(screen.getByText('author@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '我的技术笔记' })).toHaveAttribute('href', '/article/10');
    fireEvent.change(screen.getByRole('textbox', { name: '搜索我的文章' }), { target: { value: '不存在的文章' } });
    expect(screen.getByText('没有找到匹配的文章')).toBeInTheDocument();
});

test('shows an empty state for an author without articles', async () => {
    request_client.get.mockResolvedValue({ data: { ...profileData, articles: [], count: 0 } });
    await act(async () => { render(<User />); });
    expect(await screen.findByText('你还没有创建文章')).toBeInTheDocument();
});

test('returns to the login form after logout', async () => {
    request_client.get.mockResolvedValue({ data: profileData });
    request_client.post.mockResolvedValue({});
    await act(async () => { render(<User />); });
    fireEvent.click(await screen.findByRole('button', { name: '退出登录' }));
    expect(await screen.findByRole('button', { name: /登\s*陆/ })).toBeInTheDocument();
    expect(request_client.post).toHaveBeenCalledWith('api/logout', {}, { skipGlobalError: true });
});

test('shows admin tag management and protects tags associated with articles', async () => {
    request_client.get.mockImplementation(async url => ({ data: url === 'api/admin/tags' ? { tags: [{ id: 1, tag_name: 'docker', article_count: 3 }, { id: 2, tag_name: 'Java', article_count: 0 }] } : { ...profileData, can_manage_tags: true } }));
    request_client.post.mockResolvedValue({ data: { message: '标签已保存' } });
    await act(async () => { render(<User />); });
    expect(await screen.findByRole('heading', { name: '标签管理' })).toBeInTheDocument();
    const row = await screen.findByRole('row', { name: /docker/ });
    expect(within(row).getByRole('button', { name: /删\s*除/ })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: '管理标签名称' }), { target: { value: 'Python' } });
    fireEvent.click(screen.getByRole('button', { name: '新增标签' }));
    await waitFor(() => expect(request_client.post).toHaveBeenCalledWith('api/admin/tags', { tag_name: 'Python' }, { skipGlobalError: true }));
});
