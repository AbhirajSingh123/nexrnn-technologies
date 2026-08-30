import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { BLOG_CATEGORIES as STATIC_CATEGORIES, BLOG_POSTS as STATIC_POSTS } from './blog';
import { calculateReadingTime, slugify } from '@/utils/blogUtils';

function mapCategoryRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

function mapPostRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    categorySlug: row.category_slug,
    categoryName: row.blog_categories?.name || row.category_name || row.category_slug,
    excerpt: row.excerpt,
    content: row.content,
    blogCode: row.blog_code || '',
    views: row.views ?? 0,
    coverImageUrl: row.cover_image_url,
    ctaText: row.cta_text || '',
    ctaUrl: row.cta_url || '',
    authorName: row.author_name,
    authorRole: row.author_role,
    authorBio: row.author_bio || '',
    tags: row.tags ?? [],
    readingTime: row.reading_time || calculateReadingTime(row.content),
    isPublished: row.is_published,
    publishedAt: row.published_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all categories
 */
export async function fetchBlogCategories() {
  if (!isSupabaseConfigured) return STATIC_CATEGORIES;

  try {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data?.length) return STATIC_CATEGORIES;
    return data.map(mapCategoryRow);
  } catch {
    return STATIC_CATEGORIES;
  }
}

/**
 * Fetch published blog posts across all categories, or filtered by category.
 * Chronological order: latest published first.
 */
export async function fetchBlogPosts({ category = 'all', search = '' } = {}) {
  if (!isSupabaseConfigured) {
    let posts = [...STATIC_POSTS];
    if (category && category !== 'all') {
      posts = posts.filter((p) => p.categorySlug === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    // Chronological order: latest published first
    return posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  try {
    let query = supabase
      .from('blog_posts')
      .select('*, blog_categories(name)')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category_slug', category);
    }

    const { data, error } = await query;
    if (error || !data?.length) {
      let posts = [...STATIC_POSTS];
      if (category && category !== 'all') {
        posts = posts.filter((p) => p.categorySlug === category);
      }
      return posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    let results = data.map(mapPostRow);
    if (search && search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return results;
  } catch {
    return STATIC_POSTS;
  }
}

/**
 * Fetch a single blog post by slug.
 * Also retrieves nextPost and prevPost in OVERALL chronological order across all categories.
 */
export async function fetchBlogPostBySlug(slug) {
  if (!slug) return { post: null, nextPost: null, prevPost: null };

  // 1. Get all published posts in overall chronological order (latest first)
  const allPosts = await fetchBlogPosts({ category: 'all' });
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);

  if (currentIndex === -1) {
    return { post: null, nextPost: null, prevPost: null };
  }

  const post = allPosts[currentIndex];

  // In latest-first order:
  // prevPost is chronologically newer (earlier index in latest-first array)
  // nextPost is chronologically next/older, or if at end, loops or takes adjacent
  const nextPost =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : allPosts[0] || null;
  const prevPost =
    currentIndex > 0 ? allPosts[currentIndex - 1] : allPosts[allPosts.length - 1] || null;

  return { post, nextPost, prevPost };
}

/**
 * Admin: Fetch all blog posts (including drafts)
 */
export async function fetchAdminBlogPosts() {
  if (!isSupabaseConfigured) return STATIC_POSTS;

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, blog_categories(name)')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPostRow);
}

/**
 * Admin: Fetch single blog post by ID
 */
export async function fetchAdminBlogPostById(id) {
  if (!isSupabaseConfigured) {
    const found = STATIC_POSTS.find((p) => p.id === id || p.slug === id);
    return found ? { ...found } : null;
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPostRow(data) : null;
}

/**
 * Admin: Save blog post (insert or update)
 */
export async function saveBlogPost(formData, id = null) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    title: formData.title.trim(),
    slug: formData.slug.trim() || slugify(formData.title),
    category_slug: formData.category_slug,
    excerpt: formData.excerpt.trim(),
    content: formData.content,
    cover_image_url: formData.cover_image_url || '',
    cta_text: formData.cta_text || '',
    cta_url: formData.cta_url || '',
    author_name: formData.author_name || 'NexRNN Team',
    author_role: formData.author_role || 'Digital Growth Specialists',
    author_bio: formData.author_bio || '',
    tags: Array.isArray(formData.tags)
      ? formData.tags
      : (formData.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    reading_time:
      formData.reading_time || calculateReadingTime(formData.content),
    is_published: Boolean(formData.is_published),
    published_at: formData.published_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (id && id !== 'new') {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapPostRow(data);
  } else {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapPostRow(data);
  }
}

/**
 * Admin: Delete blog post
 */
export async function deleteBlogPost(id) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Public: blog views +1 (per session, BlogDetail se call hota hai)
 * RPC secure hai - sirf views counter badalta hai, kuch aur nahi.
 */
export async function incrementBlogViews(slug) {
  if (!isSupabaseConfigured || !slug) return;
  try {
    await supabase.rpc('increment_blog_views', { p_slug: slug });
  } catch {
    /* view count fail ho to article render pe koi asar nahi */
  }
}

/**
 * Admin: Upload image to blog-assets bucket
 */
export async function uploadBlogImage(file) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  // 10MB se badi image allow nahi (Supabase free limit + site speed)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image is too large. Please use an image under 10 MB.');
  }

  const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `posts/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/png',
    });

  if (uploadError) {
    // Real reason admin ko dikhaye taaki fix kar sake
    throw new Error(uploadError.message || 'Upload failed. Check bucket policies.');
  }

  const { data } = supabase.storage.from('blog-assets').getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Could not get public URL for the uploaded image.');
  }
  return data.publicUrl;
}
