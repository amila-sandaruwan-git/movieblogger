'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Trash2, Pencil, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
      setForm(data || {})
    }
    load()
  }, [router, supabase])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const previewUrl = URL.createObjectURL(file)
    if (type === 'avatar') {
      setAvatarFile(file)
      setAvatarPreview(previewUrl)
    } else {
      setBannerFile(file)
      setBannerPreview(previewUrl)
    }
  }

  const uploadImage = async (file: File, type: 'avatar' | 'banner') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`
    const bucket = type === 'avatar' ? 'avatars' : 'banners'

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return publicUrl
  }

  const removeImage = async (type: 'avatar' | 'banner') => {
    if (!confirm(`Remove ${type}?`)) return
    const field = type === 'avatar' ? 'avatar_url' : 'banner_url'
    
    await supabase.from('profiles').update({ [field]: null }).eq('id', profile.id)
    
    setProfile({ ...profile, [field]: null })
    setForm({ ...form, [field]: null })
    if (type === 'avatar') setAvatarFile(null)
    else setBannerFile(null)
    
    router.refresh()
  }

  const save = async () => {
    if (!profile) return
    setSaving(true)
    setError(null)
    
    try {
      let finalAvatarUrl = form.avatar_url
      let finalBannerUrl = form.banner_url

      if (avatarFile) {
        finalAvatarUrl = await uploadImage(avatarFile, 'avatar')
      }
      
      if (bannerFile) {
        finalBannerUrl = await uploadImage(bannerFile, 'banner')
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          bio: form.bio,
          facebook_url: form.facebook_url,
          instagram_url: form.instagram_url,
          twitter_url: form.twitter_url,
          linkedin_url: form.linkedin_url,
          avatar_url: finalAvatarUrl,
          banner_url: finalBannerUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      setEditing(false)
      setAvatarFile(null)
      setBannerFile(null)
      setAvatarPreview(null)
      setBannerPreview(null)
      router.refresh()
      
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setForm(profile)
    setEditing(false)
    setAvatarFile(null)
    setBannerFile(null)
    setAvatarPreview(null)
    setBannerPreview(null)
    setError(null)
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-ink-950">
        <div className="mb-skeleton h-64 !rounded-none md:h-80" />
        <div className="mb-container -mt-20 max-w-4xl space-y-6">
          <div className="mb-skeleton h-40 w-40 !rounded-full" />
          <div className="mb-skeleton h-40" />
        </div>
      </div>
    )
  }

  const socials = [
    { key: 'facebook_url', label: 'Facebook', Icon: Facebook },
    { key: 'instagram_url', label: 'Instagram', Icon: Instagram },
    { key: 'twitter_url', label: 'Twitter', Icon: Twitter },
    { key: 'linkedin_url', label: 'LinkedIn', Icon: Linkedin },
  ]

  const camBtn = 'cursor-pointer rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-gold-400 hover:text-ink-950'
  const delBtn = 'rounded-full bg-crimson-500/80 text-white backdrop-blur-md transition hover:bg-crimson-500'

  return (
    <div className="min-h-screen bg-ink-950 pb-16 text-white">
      {/* ---------- Banner ---------- */}
      <div className="relative h-64 w-full overflow-hidden bg-ink-800 md:h-80">
        {(bannerPreview || profile.banner_url) ? (
          <img
            src={bannerPreview || profile.banner_url}
            alt="Banner"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop'
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-ink-700 via-ink-800 to-gold-600/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

        {editing && (
          <div className="absolute right-4 top-4 flex gap-2">
            <label className={`${camBtn} p-3`} title="Change banner">
              <Camera size={20} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'banner')} />
            </label>
            {(form.banner_url || bannerPreview) && (
              <button onClick={() => removeImage('banner')} className={`${delBtn} p-3`} title="Remove banner">
                <Trash2 size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-container relative z-10 -mt-20 max-w-4xl">
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-crimson-500/30 bg-crimson-500/10 p-3.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ---------- Identity row ---------- */}
        <div className="mb-10 flex flex-col items-start gap-6 md:flex-row md:items-end">
          <div className="relative">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-ink-950 bg-ink-700 shadow-2xl ring-2 ring-gold-400/40 md:h-40 md:w-40">
              {(avatarPreview || profile.avatar_url) ? (
                <img
                  src={avatarPreview || profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="mb-display text-5xl font-semibold text-gold-400">
                  {profile.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {editing && (
              <div className="absolute bottom-1 right-1 flex gap-1">
                <label className={`${camBtn} p-2`} title="Change avatar">
                  <Camera size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'avatar')} />
                </label>
                {(form.avatar_url || avatarPreview) && (
                  <button onClick={() => removeImage('avatar')} className={`${delBtn} p-2`} title="Remove avatar">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 md:mb-3">
            {editing ? (
              <input
                type="text"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mb-display w-full border-b-2 border-gold-400 bg-transparent px-1 py-1 text-3xl font-semibold text-white focus:outline-none md:w-auto"
              />
            ) : (
              <h1 className="mb-display text-3xl font-semibold md:text-5xl">{profile.name}</h1>
            )}
            <p className="mt-1.5 text-sm text-gray-400">{profile.email}</p>
            {profile.role && (
              <span className="mt-2 inline-block rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-0.5 text-xs font-semibold capitalize text-gold-300">
                {profile.role}
              </span>
            )}
          </div>

          <div className="flex w-full gap-3 md:mb-3 md:w-auto">
            {editing ? (
              <>
                <button onClick={cancelEdit} className="mb-btn-ghost flex-1 md:flex-none">Cancel</button>
                <button onClick={save} disabled={saving} className="mb-btn-primary flex-1 md:flex-none">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="mb-btn-primary w-full md:w-auto">
                <Pencil size={15} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ---------- Details ---------- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="mb-surface p-6">
            <h2 className="mb-display mb-4 text-xl font-semibold">About</h2>
            {editing ? (
              <textarea
                value={form.bio || ''}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={6}
                className="mb-input resize-none"
              />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed text-gray-300">
                {profile.bio || <span className="italic text-gray-500">No bio provided yet.</span>}
              </p>
            )}
          </section>

          <section className="mb-surface p-6">
            <h2 className="mb-display mb-4 text-xl font-semibold">Social Links</h2>
            <div className="space-y-4">
              {socials.map(({ key, label, Icon }) => (
                <div key={key}>
                  <label className="mb-label flex items-center gap-2">
                    <Icon size={14} className="text-gold-400" /> {label}
                  </label>
                  {editing ? (
                    <input
                      type="url"
                      value={form[key] || ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={`https://${key.replace('_url', '')}.com/yourprofile`}
                      className="mb-input !py-2.5"
                    />
                  ) : profile[key] ? (
                    <a
                      href={profile[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-gold-400 underline-offset-2 hover:text-gold-300 hover:underline"
                    >
                      {profile[key]}
                    </a>
                  ) : (
                    <p className="text-sm italic text-gray-500">Not connected</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}