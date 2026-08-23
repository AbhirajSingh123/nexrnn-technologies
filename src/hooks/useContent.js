import { useEffect, useState } from 'react';
import { fetchClientReviews } from '@/data/clientReviewsRepo';
import { fetchPortfolio } from '@/data/portfolioRepo';
import { fetchTestimonials } from '@/data/testimonialsRepo';

function useAsyncList(fetchFn) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchFn().then((data) => {
      if (active) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { items, loading };
}

export function useClientReviews() {
  return useAsyncList(fetchClientReviews);
}

export function usePortfolio() {
  return useAsyncList(fetchPortfolio);
}

export function useTestimonials() {
  return useAsyncList(fetchTestimonials);
}
