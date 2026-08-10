import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useEffect } from 'react';
import { Col, Row, Typography } from 'antd';
import remarkGfm from 'remark-gfm';
import request_client from '../utils/common';
import { message } from 'antd';
import { useParams } from 'react-router-dom';

function Article() {
  const [article, setArticle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const { id } = useParams();
  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = async (articleId) => {
    try {
      console.log(request_client.defaults.baseURL);
      const response = await request_client.get(`api/article/${articleId}`);
      setArticle(response.data.message.article_content);
    } catch (error) {
      message.error('获取文章数据失败,请检查网络设置');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Row justify="center">
      <Col xs={24} sm={20} md={16} lg={12}>
        <Typography>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article}</ReactMarkdown>
        </Typography>
      </Col>
    </Row>
  );
}
export default Article;