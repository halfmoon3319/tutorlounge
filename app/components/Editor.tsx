'use client'

import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function Editor({
  content,
  onChange,
}: {
  content: string
  onChange: (html: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap-body',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // 에디터 상태를 실시간 구독 → 버튼 활성화 표시가 즉시 반영됨
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isBold: false, isItalic: false, isStrike: false,
          isH2: false, isH3: false,
          isBullet: false, isOrdered: false, isQuote: false,
        }
      }
      return {
        isBold: editor.isActive('bold'),
        isItalic: editor.isActive('italic'),
        isStrike: editor.isActive('strike'),
        isH2: editor.isActive('heading', { level: 2 }),
        isH3: editor.isActive('heading', { level: 3 }),
        isBullet: editor.isActive('bulletList'),
        isOrdered: editor.isActive('orderedList'),
        isQuote: editor.isActive('blockquote'),
      }
    },
  })

  if (!editor) return null

  return (
    <div className="tiptap-wrap">
      <div className="tiptap-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editorState?.isBold ? 'tb-btn active' : 'tb-btn'}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editorState?.isItalic ? 'tb-btn active' : 'tb-btn'}
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editorState?.isStrike ? 'tb-btn active' : 'tb-btn'}
        >
          <s>S</s>
        </button>

        <span className="tb-divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editorState?.isH2 ? 'tb-btn active' : 'tb-btn'}
        >
          제목
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editorState?.isH3 ? 'tb-btn active' : 'tb-btn'}
        >
          소제목
        </button>

        <span className="tb-divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editorState?.isBullet ? 'tb-btn active' : 'tb-btn'}
        >
          • 목록
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editorState?.isOrdered ? 'tb-btn active' : 'tb-btn'}
        >
          1. 목록
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editorState?.isQuote ? 'tb-btn active' : 'tb-btn'}
        >
          &quot; 인용
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}