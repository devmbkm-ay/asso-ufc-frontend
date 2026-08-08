'use client'

import { useRef, useState } from 'react'
import { Paperclip, CheckCircle2, Loader2 } from 'lucide-react'

export function ProofUpload({
  proofUrl,
  onUpload,
}: {
  proofUrl?: string | null
  onUpload: (file: File) => Promise<unknown>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      await onUpload(file)
    } catch {
      setError('Échec de l’envoi')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  if (proofUrl) {
    return (
      <a
        href={proofUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-success hover:underline"
      >
        <CheckCircle2 size={12} />
        Preuve jointe
      </a>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
      >
        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
        {isUploading ? 'Envoi…' : 'Joindre une preuve'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
