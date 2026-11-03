import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ArticleEditor from './ArticleEditor';
import request_client from '../utils/common';
import { useNavigate } from 'react-router-dom';
jest.mock('../utils/common', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn() }));
jest.mock('react-router-dom', () => ({ useParams: () => ({ id: '1' }), useNavigate: jest.fn() }));
jest.mock('react-markdown', () => ({ children }) => <div>{children}</div>);
jest.mock('remark-gfm', () => () => {});
global.MessageChannel = class { constructor() { this.port1 = { onmessage: null }; this.port2 = { postMessage: data => setTimeout(() => this.port1.onmessage?.({ data }), 0) }; } };
const nativeStyle = window.getComputedStyle.bind(window);
const original = { id: 1, article_title: '原始标题', article_content: '# 原始正文', prospectus: '摘要', update_time: '2026-01-01T00:00:00' };
beforeEach(() => {
  useNavigate.mockReturnValue(jest.fn());
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  jest.spyOn(window, 'getComputedStyle').mockImplementation(element => nativeStyle(element));
  request_client.get.mockResolvedValue({ data: original });
});
afterAll(() => jest.restoreAllMocks());
test('previews edited Markdown and saves using the original version', async () => {
  request_client.put.mockResolvedValue({ data: { ...original, article_content: '# 新正文', update_time: '2026-01-02T00:00:00' } });
  await act(async () => { render(<ArticleEditor />); });
  fireEvent.change(screen.getByLabelText('Markdown 正文'), { target: { value: '# 新正文' } });
  expect(within(screen.getByRole('region', { name: 'Markdown 实时预览' })).getByText('# 新正文')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
  await waitFor(() => expect(request_client.put).toHaveBeenCalledWith('api/article/1/edit', { article_title: '原始标题', article_content: '# 新正文', prospectus: '摘要', tags: [], expected_update_time: original.update_time }, { skipGlobalError: true }));
  expect(await screen.findByText('文章已保存')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '保存修改' })).toBeDisabled();
});
test('inserts an uploaded image at the cursor and saves its Markdown link', async () => {
  const url = '/api/article-images/42';
  request_client.post.mockResolvedValue({ data: { url } });
  const content = `# 原始正文\n\n![图片](${url})\n\n\n末尾`;
  request_client.put.mockResolvedValue({ data: { ...original, article_content: content } });
  await act(async () => { render(<ArticleEditor />); });
  const editor = screen.getByLabelText('Markdown 正文');
  fireEvent.change(editor, { target: { value: '# 原始正文\n末尾' } });
  editor.setSelectionRange(6, 6);
  const file = new File(['png'], 'picture.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('上传图片'), { target: { files: [file] } });
  await waitFor(() => expect(editor).toHaveValue(content));
  expect(request_client.post).toHaveBeenCalledWith('api/article/1/images', file, expect.any(Object));
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
  await waitFor(() => expect(request_client.put).toHaveBeenCalledWith(
    'api/article/1/edit', expect.objectContaining({ article_content: content }), expect.any(Object),
  ));
});

test('does not expose the editor when permission is denied', async () => {
  request_client.get.mockRejectedValue({ response: { status: 403, data: { message: '你没有这篇文章的编辑权限' } } });
  await act(async () => { render(<ArticleEditor />); });
  expect(screen.getByText('你没有这篇文章的编辑权限')).toBeInTheDocument();
  expect(screen.queryByLabelText('Markdown 正文')).not.toBeInTheDocument();
  expect(request_client.put).not.toHaveBeenCalled();
});
test('preserves local edits when a concurrent change causes conflict', async () => {
  request_client.put.mockRejectedValue({ response: { status: 409, data: { message: '文章已被更新，请先备份当前内容，再重新加载' } } });
  await act(async () => { render(<ArticleEditor />); });
  fireEvent.change(screen.getByLabelText('Markdown 正文'), { target: { value: '未保存的内容' } });
  fireEvent.click(screen.getByRole('button', { name: '保存修改' }));
  await screen.findByText('文章已被更新，请先备份当前内容，再重新加载');
  expect(screen.getByLabelText('Markdown 正文')).toHaveValue('未保存的内容');
});
test('asks before discarding unsaved edits', async () => {
  await act(async () => { render(<ArticleEditor />); });
  fireEvent.change(screen.getByLabelText('文章标题'), { target: { value: '尚未保存' } });
  fireEvent.click(screen.getByRole('button', { name: '返回文章' }));
  expect(within(await screen.findByRole('dialog')).getByRole('button', { name: '继续编辑' })).toBeInTheDocument();
});
