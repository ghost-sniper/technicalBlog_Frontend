import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useEffect } from 'react';
import { Col, Row ,Typography} from 'antd';
import remarkGfm from 'remark-gfm';
function Article() {
  const [article, setArticle] = React.useState(null);
  useEffect(() => {
    fetch('http://localhost:8600/article/1')
      .then(response => response.json())
      .then(data => setArticle(data.article_content))
      .catch(error => console.error('Error fetching article:', error));
  }, []);

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