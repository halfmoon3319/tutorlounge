'use client'

import { useRef } from 'react'
import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { createClient } from '../../lib/supabase-browser'

export default function Editor({
  content,
  onChange,
}: {
  content: string
  onChange: (html: string) => void
}) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        resize: {
          enabled: true,
          minWidth: 80,
          alwaysPreserveAspectRatio: true,
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
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

  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isBold: false, isItalic: false, isStrike: false,
          isH2: false, isH3: false,
          isBullet: false, isOrdered: false, isQuote: false,
          isLeft: false, isCenter: false, isRight: false,
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
        isLeft: editor.isActive({ textAlign: 'left' }),
        isCenter: editor.isActive({ textAlign: 'center' }),
        isRight: editor.isActive({ textAlign: 'right' }),
      }
    },
  })

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 넣을 수 있어요.')
      e.target.value = ''
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('로그인이 필요합니다.')
      e.target.value = ''
      return
    }

    const extMatch = file.name.match(/\.[^.]+$/)
    const ext = extMatch ? extMatch[0] : ''
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    const filePath = `${user.id}/editor/${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      console.error('이미지 업로드 실패:', uploadError)
      alert('이미지 업로드에 실패했어요: ' + uploadError.message)
      e.target.value = ''
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    editor.chain().focus().setImage({ src: publicUrlData.publicUrl }).run()
    e.target.value = ''
  }

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
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editorState?.isLeft ? 'tb-btn active' : 'tb-btn'}
        >
          ≡ 왼쪽
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editorState?.isCenter ? 'tb-btn active' : 'tb-btn'}
        >
          ≡ 가운데
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editorState?.isRight ? 'tb-btn active' : 'tb-btn'}
        >
          ≡ 오른쪽
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

        <span className="tb-divider" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="tb-btn"
        >
          🖼️ 사진
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}