import { NavLink, Outlet, Link } from 'react-router-dom';
import { Button } from 'antd';
import { useTheme } from './theme/ThemeProvider';
function App() {
  const { mode, toggleTheme } = useTheme();
  return <div className="site-shell">
    <a href="#main-content" className="skip-link">跳转到内容</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" to="/home"><span className="brand-mark">J.</span><span>John Reeves<span className="brand-subtitle">技术与生活 · BLOG</span></span></Link>
      <nav aria-label="主导航"><NavLink to="/home">文章</NavLink><NavLink to="/user">个人中心</NavLink>
        <Button onClick={toggleTheme} aria-label={mode === 'light' ? '切换到深色主题' : '切换到明亮主题'} title={mode === 'light' ? '切换到深色主题' : '切换到明亮主题'}>{mode === 'light' ? '☾ 深色' : '☀ 明亮'}</Button>
      </nav>
    </div></header>
    <main id="main-content" className="main-content"><Outlet /></main>
    <footer className="site-footer"><span>John Reeves’s Blog</span><span>记录思考，分享成长。</span></footer>
  </div>;
}
export default App;
