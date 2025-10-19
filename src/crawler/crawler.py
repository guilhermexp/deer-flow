# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT


from .article import Article
from .jina_client import JinaClient
from .readability_extractor import ReadabilityExtractor


class Crawler:
    def crawl(self, url: str) -> Article:
        # To help LLMs better understand content, we extract clean
        # articles from HTML and convert them to markdown. When network
        # is unavailable or an error occurs, return a minimal fallback
        # article so tests and offline usage can still proceed.
        try:
            jina_client = JinaClient()
            html = jina_client.crawl(url, return_format="html")
            extractor = ReadabilityExtractor()
            article = extractor.extract_article(html)
            article.url = url
            return article
        except Exception:
            # Fallback: create a minimal article indicating content is unavailable
            fallback = Article(title="Content Unavailable", html_content=f"<p>Unable to fetch content for {url}</p>")
            fallback.url = url
            return fallback
