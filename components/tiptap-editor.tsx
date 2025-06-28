
'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2 } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="border border-input bg-transparent rounded-md p-1 flex flex-wrap gap-1 mb-2">
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
}

export const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit.configure()],
    content: content,
    editorProps: {
      attributes: {
        class: 'rounded-md border min-h-[400px] border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ProseMirror',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="flex flex-col justify-stretch min-h-[250px]">
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
    </div>
  )
}
