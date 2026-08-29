import { useState, useEffect, useCallback } from 'react';
import {
  fetchBlogCategories,
  fetchBlogPosts,
  fetchBlogPostBySlug,
} from '@/data/blogRepo';

export function useBlogCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchBlogCategories().then((data) => {
      if (active) {
        setCategories(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}

export function useBlogPosts(category = 'all', search = '') {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBlogPosts({ category, search });
      setPosts(data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    load();
  }, [load]);

  return { posts, loading, refetch: load };
}

export function useBlogPost(slug) {
  const [post, setPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const [prevPost, setPrevPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchBlogPostBySlug(slug)
      .then((res) => {
        if (active) {
          if (!res.post) {
            setError(new Error('Post not found'));
          } else {
            setPost(res.post);
            setNextPost(res.nextPost);
            setPrevPost(res.prevPost);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return { post, nextPost, prevPost, loading, error };
}
