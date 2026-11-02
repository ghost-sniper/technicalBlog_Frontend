import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import User from './pages/User';
import Home from './pages/Home';
import Article from './pages/Article';
import ArticleEditor from './pages/ArticleEditor';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';

let router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      { path: "article/:id/edit", Component: ArticleEditor },
      { index: true, element: <Navigate to="/home" replace /> },
      {
        path: "user",
        Component: User
      },
      {
        path: "home",
        Component: Home
      },
      {
        path: "article/:id",
        Component: Article
      }
    ]
  }

]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
