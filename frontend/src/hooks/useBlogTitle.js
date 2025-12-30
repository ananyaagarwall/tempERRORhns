import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export const useBlogTitle = () => {
  const { slug } = useParams();
  const [blogTitle, setBlogTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const fetchBlogTitle = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/blogs/${slug}`);
          setBlogTitle(response.data.title || 'Blog Detail');
        } catch (error) {
          console.error('Error fetching blog title:', error);
          setBlogTitle('Blog Detail');
        } finally {
          setLoading(false);
        }
      };

      fetchBlogTitle();
    } else {
      setLoading(false);
    }
  }, [slug]);

  return { blogTitle, loading };
};