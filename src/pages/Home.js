import React, { useEffect } from "react";
import { Layout } from "antd";
import { Flex } from "antd";
import { Card } from "antd";
import { message } from "antd";
import { Tag } from "antd";
import { useState } from "@rc-component/util";

const { Header, Sider, Content, Footer } = Layout;

function Home() {
    const [tags, setTags] = React.useState(['docker', 'Java', 'k8s']);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    const [categories, setCategories] = React.useState([]);
    const fetchTags = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("http://localhost:8080/tags");
            const data = await response.json();
            const tagData = data.tags.map(tag => tag.tag_name);
            // console.log(tagData);
            setTags(tagData);
        } catch (error) {
            setError(error.message || '获取标签数据失败');
            message.error('获取标签数据失败,请检查网络设置');
        } finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            const response = await fetch("http://localhost:8080/categories");
            const data = await response.json();
            const categoryData = data.categories.map(category => category.name);
            setCategories(categoryData);
        } catch (error) {
            setError(error.message || '获取分类数据失败');
            message.error('获取分类数据失败，请检查网络设置');
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchTags();
        fetchCategories();
    }, []);
    const layoutstyle = {
        borderRadius: 8,
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        maxHeight: "100%",
        backgroundColor: "MintCream",
    };
    const headerstyle = {
        textAlig: "center",
        height: 64,
        paddingInLine: 48,
        lineHeight: "64px",
        backgroundColor: "MintCream",
    };
    const contentstyle = {
        textAlign: "center",
        minHeight: 120,
        lineHeight: "120px",
        color: "#fff",
        backgroundColor: "#0958d9",
    };
    const siderstyle = {
        textAlign: "center",
        lineHeight: "120px",
        color: "#fff",
        backgroundColor: "MintCream",
    };
    const footerstyle = {
        textAlign: "center",
        color: "#fff",
        backgroundColor: "#4096ff",
        backgroundColor: 'MintCream'
    };
    return (<Layout style={layoutstyle}>
        <Header style={headerstyle}>
            <Flex justify="space-between" align="center" height="100%">
                <span href="/">John Reeves's Blog</span>
                <Flex
                    className="menuGroup"
                    justify="space-between"
                    align="center"
                    height="100%"
                    vertical="false"
                    gap="middle"
                >
                    <div
                        className="menu"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                            width="24"
                            height="24"
                        >
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                        <span>搜索</span>
                    </div>
                    <div
                        className="menu"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <svg
                            t="1784080924680"
                            viewBox="0 0 1024 1024"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            p-id="14850"
                            width="24"
                            height="24"
                        >
                            <path
                                d="M512 97.52381c228.912762 0 414.47619 185.563429 414.47619 414.47619s-185.563429 414.47619-414.47619 414.47619S97.52381 740.912762 97.52381 512 283.087238 97.52381 512 97.52381z m0 73.142857C323.486476 170.666667 170.666667 323.486476 170.666667 512s152.81981 341.333333 341.333333 341.333333 341.333333-152.81981 341.333333-341.333333S700.513524 170.666667 512 170.666667z m185.002667 377.734095l68.851809 24.722286c-92.647619 257.80419-440.100571 257.80419-508.659809-3.072l70.753523-18.578286c49.688381 189.147429 300.007619 189.147429 369.054477-3.072zM414.47619 341.333333a48.761905 48.761905 0 0 1 48.761905 48.761905v73.142857a48.761905 48.761905 0 1 1-97.523809 0v-73.142857a48.761905 48.761905 0 0 1 48.761904-48.761905z m195.04762 0a48.761905 48.761905 0 0 1 48.761904 48.761905v73.142857a48.761905 48.761905 0 1 1-97.523809 0v-73.142857a48.761905 48.761905 0 0 1 48.761905-48.761905z"
                                p-id="14851"
                            ></path>
                        </svg>
                        <span>关于</span>
                    </div>
                </Flex>
            </Flex>
        </Header>
        <Layout>
            <Content style={contentstyle}>Content</Content>
            <Sider width="25%" style={siderstyle}>
                <Flex gap="middle" vertical align="center" >
                    <Card title="公告" style={{ width: '80%' }}>
                        <p>
                            If you don't fight for your love.What kind of love do you have?
                        </p>
                    </Card>
                    <Card title="标签" style={{ width: '80%' }}>
                        {tags.map((tag, index) => {
                            return (
                                <Tag key={tag}>{tag}</Tag>
                            );
                        })}

                    </Card>
                    <Card title="分类" style={{ width: '80%' }}>
                        {categories.map((category, index) => {
                            return (
                                <Tag key={category}>{category}</Tag>
                            );
                        })}
                    </Card>
                </Flex>
            </Sider>
        </Layout>
        <Footer style={footerstyle}>
            <p style={{color:"black"}}>To love oneself is the beginning of a lifelong romance.</p>
        </Footer>
    </Layout>)
}
export default Home;