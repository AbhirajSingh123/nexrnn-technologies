import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Loader2, Wand2, Upload, Eye, Edit3 } from 'lucide-react';
import {
  fetchAdminBlogPostById,
  saveBlogPost,
  uploadBlogImage,
  fetchBlogCategories,
} from '@/data/blogRepo';
import { ADMIN_ROUTES } from '@/constants/adminRoutes';
import { slugify, calculateReadingTime } from '@/utils/blogUtils';
import { DEFAULT_AUTHOR_BIO } from '@/data/blog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const inputClass =
  'w-full border-2 border-secondary/20 focus:border-primary px-4 py-2.5 text-sm outline-none transition-colors bg-white';
const labelClass = 'block text-xs font-bold text-secondary uppercase tracking-wide mb-2';

const emptyForm = {
  title: '',
  slug: '',
  category_slug: 'digital-marketing',
  cover_image_url: '',
  cta_text: '',
  cta_url: '',
  excerpt: '',
  content: '',
  author_name: 'Abhiraj Singh',
  author_role: 'Founder & Lead Strategist',
  author_bio: DEFAULT_AUTHOR_BIO,
  tags: '',
  reading_time: '',
  is_published: true,
  published_at: new Date().toISOString().slice(0, 16),
};

export default function AdminBlogPostForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Cover image URL badalne par error state reset karo
  useEffect(() => {
    setImgError(false);
  }, [form.cover_image_url]);

  useEffect(() => {
    fetchBlogCategories().then((cats) => {
      setCategories(cats);
      if (isNew && cats.length > 0) {
        setForm((prev) => ({ ...prev, category_slug: cats[0].slug }));
      }
    });
  }, [isNew]);

  useEffect(() => {
    if (isNew) return;
    const load = async () => {
      try {
        const data = await fetchAdminBlogPostById(id);
        if (!data) {
          toast.error('Blog post not found.');
          navigate(ADMIN_ROUTES.blogPosts);
          return;
        }
        // IMPORTANT: repo camelCase fields deta hai (coverImageUrl etc),
        // form snake_case use karta hai (cover_image_url etc).
        // Pehle yahan direct spread hota tha, isliye edit page par
        // cover image / category / author blank ho jaate the.
        setForm({
          ...emptyForm,
          title: data.title || '',
          slug: data.slug || '',
          category_slug: data.categorySlug || 'digital-marketing',
          cover_image_url: data.coverImageUrl || '',
          cta_text: data.ctaText || '',
          cta_url: data.ctaUrl || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          author_name: data.authorName || 'Abhiraj Singh',
          author_role: data.authorRole || 'Founder & Lead Strategist',
          author_bio: data.authorBio || DEFAULT_AUTHOR_BIO,
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
          reading_time: data.readingTime || '',
          is_published: data.isPublished !== false,
          published_at: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : '',
        });
      } catch {
        toast.error('Failed to load blog post.');
        navigate(ADMIN_ROUTES.blogPosts);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Auto update reading time when content changes
      if (name === 'content') {
        updated.reading_time = calculateReadingTime(value);
      }

      return updated;
    });
  };

  const handleGenerateSlug = () => {
    if (!form.title) {
      toast.warning('Enter a title first.');
      return;
    }
    setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadBlogImage(file);
      setForm((prev) => ({ ...prev, cover_image_url: url }));
      toast.success('Cover image uploaded successfully!');
    } catch (err) {
      // Real reason dikhaye taaki admin samajh sake kya galat hua
      toast.error(`Image upload failed: ${err?.message || 'Check Supabase storage setup.'}`);
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // same file dobara select kar sake
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    const currentSlug = form.slug.trim() || slugify(form.title);
    if (!currentSlug) {
      toast.error('Slug is required.');
      return;
    }

    if (!form.content.trim()) {
      toast.error('Article content is required.');
      return;
    }

    setSaving(true);
    try {
      await saveBlogPost(
        {
          ...form,
          slug: currentSlug,
          reading_time: form.reading_time || calculateReadingTime(form.content),
          published_at: form.published_at
            ? new Date(form.published_at).toISOString()
            : new Date().toISOString(),
        },
        isNew ? null : id
      );

      toast.success(isNew ? 'Blog post published!' : 'Blog post updated!');
      navigate(ADMIN_ROUTES.blogPosts);
    } catch (err) {
      toast.error(err.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <Link
        to={ADMIN_ROUTES.blogPosts}
        className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-secondary mb-4 uppercase tracking-wider"
      >
        <ArrowLeft size={14} /> Back to Blog Posts
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl text-secondary">
          {isNew ? 'New Blog Post' : 'Edit Blog Post'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-secondary !px-4 !py-2 text-xs"
          >
            {previewMode ? (
              <>
                <Edit3 size={14} /> Edit Mode
              </>
            ) : (
              <>
                <Eye size={14} /> Preview
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card-base bg-white p-6 sm:p-8 space-y-5">
          {/* Title */}
          <div>
            <label className={labelClass}>Article Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. How to Scale Your Local Business with Google Ads"
              required
              className={inputClass}
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>URL Slug *</label>
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <Wand2 size={12} /> Auto-generate from Title
              </button>
            </div>
            <div className="flex items-center">
              <span className="bg-accent border-2 border-r-0 border-secondary/20 px-3 py-2.5 text-xs text-muted font-mono select-none">
                /blog/
              </span>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="how-to-scale-local-business"
                required
                className={`${inputClass} font-mono text-xs`}
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select
                name="category_slug"
                value={form.category_slug}
                onChange={handleChange}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Publication Date</label>
              <input
                type="datetime-local"
                name="published_at"
                value={form.published_at}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className={labelClass}>Cover Image URL (or upload)</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="cover_image_url"
                value={form.cover_image_url}
                onChange={handleChange}
                placeholder="https://... (full URL with https://) or use Upload button"
                className={`${inputClass} flex-1`}
              />
              <label className="btn-secondary !px-4 !py-2.5 text-xs cursor-pointer shrink-0">
                <Upload size={14} />
                {uploadingImage ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              {form.cover_image_url && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, cover_image_url: '' }))}
                  className="px-3 py-2.5 text-xs font-bold text-red-600 border-2 border-red-200 hover:bg-red-50 transition-colors shrink-0"
                  title="Remove image"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted mt-1.5">
              Tip: The URL must start with <b>https://</b>. Uploaded images are{' '}
              stored in the Supabase <code>blog-assets</code> bucket.
            </p>

            {form.cover_image_url && !imgError && (
              <div className="mt-3 relative w-40 aspect-video border-2 border-secondary overflow-hidden bg-secondary/5">
                <img
                  src={form.cover_image_url}
                  alt="Cover preview"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {form.cover_image_url && imgError && (
              <div className="mt-3 border-2 border-red-300 bg-red-50 p-3 max-w-md">
                <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                  ⚠ Image load nahi ho paayi
                </p>
                <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                  URL check karo — pura address <b>https://</b> se shuru hona chahiye aur
                  image publicly accessible honi chahiye (private/broken link par site
                  visitors ko image nahi dikhegi).
                </p>
                <p className="text-[10px] text-red-500 mt-1 break-all font-mono">
                  {form.cover_image_url}
                </p>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className={labelClass}>Short Excerpt / Summary *</label>
            <textarea
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              rows={3}
              placeholder="A short, catchy summary shown on blog cards and search engine previews (1-2 sentences)..."
              required
              className={inputClass}
            />
          </div>

          {/* Content (Editor or Preview) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Article Content (Markdown supported) *</label>
              <span className="text-xs text-muted">
                Supports ## Heading 2, ### Heading 3, **bold**, - bullet points, {'>'} quotes
              </span>
            </div>

            {previewMode ? (
              <div className="p-6 bg-accent border-2 border-secondary/20 min-h-[300px] prose prose-sm max-w-none text-secondary">
                <div className="whitespace-pre-wrap leading-relaxed">{form.content}</div>
              </div>
            ) : (
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={14}
                placeholder="Write your article content here in markdown format...&#10;&#10;## Introduction&#10;Start with a hook...&#10;&#10;### Key Points&#10;- Point 1&#10;- Point 2"
                required
                className={`${inputClass} font-mono text-xs`}
              />
            )}
          </div>

          {/* Author Details & Reading Time */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Author Name</label>
              <input
                type="text"
                name="author_name"
                value={form.author_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Author Role</label>
              <input
                type="text"
                name="author_role"
                value={form.author_role}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Reading Time</label>
              <input
                type="text"
                name="reading_time"
                value={form.reading_time || calculateReadingTime(form.content)}
                onChange={handleChange}
                placeholder="e.g. 5 min read"
                className={inputClass}
              />
            </div>
          </div>

          {/* Author Bio (About the Author card ka paragraph) */}
          <div>
            <label className={labelClass}>Author Bio (About the Author paragraph)</label>
            <textarea
              name="author_bio"
              value={form.author_bio}
              onChange={handleChange}
              rows={3}
              placeholder="Author ke baare mein 1-3 lines... ye blog ke end mein 'About the Author' card mein dikhega."
              className={inputClass}
            />
            <p className="text-[11px] text-muted mt-1.5">
              This paragraph appears at the end of the article below the author
              name &amp; role. Leave empty to use the default bio.
            </p>
          </div>

          {/* Call-to-Action Link (Optional) */}
          <div className="border-2 border-dashed border-secondary/20 p-4 sm:p-5 bg-accent/40">
            <label className={labelClass}>
              Call-to-Action Link (Optional) &mdash; blog ke end mein button
            </label>
            <p className="text-xs text-muted mb-3 leading-relaxed">
              Optionally add a button shown at the end of this article, linking the
              reader to any page (course, service, contact, or any website link)
              &mdash; set the button text and URL below. Leave empty to hide it.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Button Text
                </label>
                <input
                  type="text"
                  name="cta_text"
                  value={form.cta_text}
                  onChange={handleChange}
                  placeholder="e.g. Enroll Now / Book Free Consultation"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5">
                  Button Link (URL)
                </label>
                <input
                  type="text"
                  name="cta_url"
                  value={form.cta_url}
                  onChange={handleChange}
                  placeholder="e.g. /course ya https://wa.me/919999999999"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Internal page links like <code>/course</code> or <code>/services</code> work,
              as well as full external links like <code>https://...</code> (opens in a new tab).
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Google Ads, PPC, SEO, Lucknow"
              className={inputClass}
            />
          </div>

          {/* Published Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="is_published" className="text-sm font-semibold text-secondary cursor-pointer">
              Published immediately (uncheck to save as draft)
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary !px-8">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isNew ? 'Publish Article' : 'Save Changes'}
          </button>
          <Link to={ADMIN_ROUTES.blogPosts} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
