import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import { common, createLowlight } from 'lowlight';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Save,
  Send,
  Underline as UnderlineIcon,
  Undo,
  Upload,
  X
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import './post-create.css';

interface ArticleData {
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
  coverImage?: string;
  status: 'draft' | 'published';
  category_id?: number;
  content_type_id?: number;
}

// Get API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PostCreate = () => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedArticleId, setSavedArticleId] = useState<number | undefined>();

  const lowlight = createLowlight(common);

  // Get auth token
  const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'article-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'article-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: 'Tell your story...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Typography,
      CharacterCount,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      calculateReadingTime(editor.getText());
    },
  });

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    setReadingTime(minutes);
  };

  const handleAutoSave = useCallback(async () => {
    if (!editor || !title) return;

    setIsSaving(true);
    setSaveError(null);

    const articleData: ArticleData = {
      title,
      subtitle,
      content: editor.getHTML(),
      tags,
      coverImage,
      status: 'draft',
      content_type_id: 4, // Post type
      category_id: 1, // Default category
    };

    try {
      const token = getAuthToken();

      if (!token) {
        console.warn('No auth token found, skipping auto-save');
        setIsSaving(false);
        return;
      }

      let response;

      if (savedArticleId) {
        // Update existing article
        response = await axios.put(
          `${API_BASE_URL}/content/articles/${savedArticleId}`,
          articleData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create new article
        response = await axios.post(
          `${API_BASE_URL}/content/articles`,
          articleData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        // Save the article ID for future updates
        if (response.data.article_id) {
          setSavedArticleId(response.data.article_id);
        }
      }

      setLastSaved(new Date());
      console.log('✅ Article saved successfully:', response.data);

    } catch (error: any) {
      console.error('❌ Auto-save failed:', error);
      const errorMessage = error.response?.data?.detail?.message || error.message || 'Failed to save';
      setSaveError(errorMessage);

      // If unauthorized, clear the error after showing it briefly
      if (error.response?.status === 401 || error.response?.status === 403) {
        setSaveError('Please log in to save your article');
        setTimeout(() => setSaveError(null), 5000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [editor, title, subtitle, tags, coverImage, savedArticleId]);

  const handlePublish = async () => {
    if (!editor || !title) {
      alert('Please add a title before publishing');
      return;
    }

    const token = getAuthToken();

    if (!token) {
      alert('Please log in to publish your article');
      return;
    }

    const articleData: ArticleData = {
      title,
      subtitle,
      content: editor.getHTML(),
      tags,
      coverImage,
      status: 'published',
      content_type_id: 4, // Post type
      category_id: 1, // Default category
    };

    try {
      setIsSaving(true);
      setSaveError(null);

      let response;

      if (savedArticleId) {
        // Update existing article and publish
        response = await axios.put(
          `${API_BASE_URL}/content/articles/${savedArticleId}`,
          { ...articleData, status: 'published' },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create and publish new article
        response = await axios.post(
          `${API_BASE_URL}/content/articles`,
          articleData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.data.article_id) {
          setSavedArticleId(response.data.article_id);
        }
      }

      console.log('✅ Article published successfully:', response.data);
      setShowPublishDialog(false);

      // Show success message
      alert('🎉 Article published successfully!');

      // Optional: Redirect to the article page
      if (response.data.article?.url) {
        // You can use react-router navigate here if needed
        console.log('Article URL:', response.data.article.url);
      }

    } catch (error: any) {
      console.error('❌ Publish failed:', error);
      const errorMessage = error.response?.data?.detail?.message || error.message || 'Failed to publish';
      alert(`Failed to publish article: ${errorMessage}`);

      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Please log in to publish your article');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!tags.includes(tagInput.trim()) && tags.length < 5) {
        setTags([...tags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (coverImage) {
          editor?.chain().focus().setImage({ src: url }).run();
        } else {
          setCoverImage(url);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          editor?.chain().focus().setImage({ src: url }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const setLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const unsetLink = () => {
    editor?.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  };

  if (!editor) {
    return <div className="article-editor-loading">Loading editor...</div>;
  }

  return (
    <div className="article-editor-container">
      {/* Header with actions */}
      <header className="article-editor-header">
        <div className="header-left">
          <h2 className="editor-logo">Your Story</h2>
          {lastSaved && !saveError && (
            <span className="last-saved">
              {isSaving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          {saveError && (
            <span className="save-error" title={saveError}>
              ⚠️ {saveError}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={handleAutoSave}
            disabled={isSaving || !title}
            title={!title ? 'Add a title first' : 'Save draft'}
          >
            <Save size={18} />
            Save Draft
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowPublishDialog(true)}
            disabled={!title}
            title={!title ? 'Add a title first' : 'Publish article'}
          >
            <Send size={18} />
            Publish
          </button>
        </div>
      </header>

      {/* Main editor area */}
      <main className="article-editor-main">
        {/* Cover Image */}
        <div className="cover-image-section">
          {coverImage ? (
            <div className="cover-image-preview">
              <img src={coverImage} alt="Cover" />
              <button
                className="remove-cover-image"
                onClick={() => setCoverImage(undefined)}
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="cover-image-upload">
              <label htmlFor="cover-image-input" className="upload-label">
                <Upload size={24} />
                <span>Add a cover image</span>
              </label>
              <input
                id="cover-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Title Input */}
        <input
          type="text"
          className="article-title-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
        />

        {/* Subtitle Input */}
        <input
          type="text"
          className="article-subtitle-input"
          placeholder="Subtitle (optional)"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={250}
        />

        {/* Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
              title="Bold (Cmd+B)"
            >
              <Bold size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'is-active' : ''}
              title="Italic (Cmd+I)"
            >
              <Italic size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'is-active' : ''}
              title="Underline (Cmd+U)"
            >
              <UnderlineIcon size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
              title="Heading 1"
            >
              <Heading1 size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
              title="Heading 2"
            >
              <Heading2 size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
              title="Heading 3"
            >
              <Heading3 size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'is-active' : ''}
              title="Bullet List"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'is-active' : ''}
              title="Numbered List"
            >
              <ListOrdered size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'is-active' : ''}
              title="Quote"
            >
              <Quote size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'is-active' : ''}
              title="Inline Code"
            >
              <Code size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'is-active' : ''}
              title="Code Block"
            >
              {'{ }'}
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => setShowLinkInput(!showLinkInput)}
              className={editor.isActive('link') ? 'is-active' : ''}
              title="Add Link"
            >
              <LinkIcon size={18} />
            </button>
            <button onClick={addImage} title="Add Image">
              <ImageIcon size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
            >
              <Minus size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
              title="Align Left"
            >
              <AlignLeft size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
              title="Align Center"
            >
              <AlignCenter size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
              title="Align Right"
            >
              <AlignRight size={18} />
            </button>
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>
        </div>

        {/* Link Input */}
        {showLinkInput && (
          <div className="link-input-container">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && setLink()}
              autoFocus
            />
            <button onClick={setLink} className="btn-small-primary">
              Apply
            </button>
            {editor.isActive('link') && (
              <button onClick={unsetLink} className="btn-small-secondary">
                Remove
              </button>
            )}
            <button
              onClick={() => setShowLinkInput(false)}
              className="btn-small-secondary"
            >
              Cancel
            </button>
          </div>
        )}



        {/* Editor Content */}
        <div className="editor-content-wrapper">
          <EditorContent editor={editor} />
        </div>

        {/* Tags Section */}
        <div className="tags-section">
          <h3>Tags</h3>
          <div className="tags-container">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => handleRemoveTag(tag)}>
                  <X size={14} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleAddTag}
                className="tag-input"
              />
            )}
          </div>
          <p className="tag-hint">Add up to 5 tags. Press Enter to add.</p>
        </div>

        {/* Stats */}
        <div className="article-stats">
          <span>{editor.storage.characterCount.words()} words</span>
          <span>•</span>
          <span>{editor.storage.characterCount.characters()} characters</span>
          <span>•</span>
          <span>{readingTime} min read</span>
        </div>
      </main>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <div className="modal-overlay" onClick={() => setShowPublishDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Ready to publish?</h2>
            <div className="publish-preview">
              <h3>{title || 'Untitled'}</h3>
              {subtitle && <p className="preview-subtitle">{subtitle}</p>}
              <div className="preview-meta">
                <span>{readingTime} min read</span>
                {tags.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{tags.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowPublishDialog(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handlePublish}>
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreate;
