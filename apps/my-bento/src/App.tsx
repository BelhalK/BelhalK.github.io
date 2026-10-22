import { useState, useEffect, useRef, useCallback } from 'react'
import { Youtube, Play, Loader2 } from 'lucide-react'
import {
  SiX, SiInstagram, SiTiktok, SiYoutube, SiGithub, SiGitlab, SiLinkedin,
  SiFacebook, SiTwitch, SiDribbble, SiMedium, SiDevdotto, SiReddit,
  SiPinterest, SiThreads, SiBluesky, SiMastodon, SiSubstack, SiPatreon,
  SiKofi, SiBuymeacoffee, SiSnapchat, SiDiscord, SiTelegram, SiWhatsapp,
} from 'react-icons/si'
import { Globe, Link as LinkIcon } from 'lucide-react'
import type { IconType } from 'react-icons'
import type { LucideIcon } from 'lucide-react'


// Types
enum BlockType {
  LINK = 'LINK',
  TEXT = 'TEXT',
  MEDIA = 'MEDIA',
  SOCIAL = 'SOCIAL',
  SOCIAL_ICON = 'SOCIAL_ICON',
  MAP = 'MAP',
  SPACER = 'SPACER'
}

type SocialPlatform = 'x' | 'instagram' | 'tiktok' | 'youtube' | 'github' | 'gitlab' | 'linkedin' | 'facebook' | 'twitch' | 'dribbble' | 'medium' | 'devto' | 'reddit' | 'pinterest' | 'threads' | 'bluesky' | 'mastodon' | 'substack' | 'patreon' | 'kofi' | 'buymeacoffee' | 'website' | 'snapchat' | 'discord' | 'telegram' | 'whatsapp' | 'custom'

interface BlockData {
  id: string
  type: BlockType
  title?: string
  content?: string
  subtext?: string
  imageUrl?: string
  mediaPosition?: { x: number; y: number }
  colSpan: number
  rowSpan: number
  color?: string
  customBackground?: string
  textColor?: string
  gridColumn?: number
  gridRow?: number
  channelId?: string
  youtubeVideoId?: string
  channelTitle?: string
  youtubeMode?: 'single' | 'grid' | 'list'
  youtubeVideos?: Array<{ id: string; title: string; thumbnail: string }>
  socialPlatform?: SocialPlatform
  socialHandle?: string
  zIndex?: number
}


// Social platforms config
const SOCIAL_PLATFORMS: Record<string, { icon: IconType | LucideIcon; brandColor: string; buildUrl: (h: string) => string }> = {
  x: { icon: SiX, brandColor: '#000000', buildUrl: (h) => `https://x.com/${h}` },
  instagram: { icon: SiInstagram, brandColor: '#E4405F', buildUrl: (h) => `https://instagram.com/${h}` },
  tiktok: { icon: SiTiktok, brandColor: '#000000', buildUrl: (h) => `https://tiktok.com/@${h}` },
  youtube: { icon: SiYoutube, brandColor: '#FF0000', buildUrl: (h) => `https://youtube.com/@${h}` },
  github: { icon: SiGithub, brandColor: '#181717', buildUrl: (h) => `https://github.com/${h}` },
  gitlab: { icon: SiGitlab, brandColor: '#FC6D26', buildUrl: (h) => `https://gitlab.com/${h}` },
  linkedin: { icon: SiLinkedin, brandColor: '#0A66C2', buildUrl: (h) => `https://linkedin.com/in/${h}` },
  facebook: { icon: SiFacebook, brandColor: '#1877F2', buildUrl: (h) => `https://facebook.com/${h}` },
  twitch: { icon: SiTwitch, brandColor: '#9146FF', buildUrl: (h) => `https://twitch.tv/${h}` },
  dribbble: { icon: SiDribbble, brandColor: '#EA4C89', buildUrl: (h) => `https://dribbble.com/${h}` },
  medium: { icon: SiMedium, brandColor: '#000000', buildUrl: (h) => `https://medium.com/@${h}` },
  devto: { icon: SiDevdotto, brandColor: '#0A0A0A', buildUrl: (h) => `https://dev.to/${h}` },
  reddit: { icon: SiReddit, brandColor: '#FF4500', buildUrl: (h) => `https://reddit.com/user/${h}` },
  pinterest: { icon: SiPinterest, brandColor: '#BD081C', buildUrl: (h) => `https://pinterest.com/${h}` },
  threads: { icon: SiThreads, brandColor: '#000000', buildUrl: (h) => `https://threads.net/@${h}` },
  bluesky: { icon: SiBluesky, brandColor: '#0085FF', buildUrl: (h) => `https://bsky.app/profile/${h}` },
  mastodon: { icon: SiMastodon, brandColor: '#6364FF', buildUrl: (h) => h },
  substack: { icon: SiSubstack, brandColor: '#FF6719', buildUrl: (h) => `https://${h}.substack.com` },
  patreon: { icon: SiPatreon, brandColor: '#FF424D', buildUrl: (h) => `https://patreon.com/${h}` },
  kofi: { icon: SiKofi, brandColor: '#FF5E5B', buildUrl: (h) => `https://ko-fi.com/${h}` },
  buymeacoffee: { icon: SiBuymeacoffee, brandColor: '#FFDD00', buildUrl: (h) => `https://buymeacoffee.com/${h}` },
  snapchat: { icon: SiSnapchat, brandColor: '#FFFC00', buildUrl: (h) => `https://snapchat.com/add/${h}` },
  discord: { icon: SiDiscord, brandColor: '#5865F2', buildUrl: (h) => h },
  telegram: { icon: SiTelegram, brandColor: '#26A5E4', buildUrl: (h) => `https://t.me/${h}` },
  whatsapp: { icon: SiWhatsapp, brandColor: '#25D366', buildUrl: (h) => `https://wa.me/${h}` },
  website: { icon: Globe, brandColor: '#6B7280', buildUrl: (h) => h.startsWith('http') ? h : `https://${h}` },
  custom: { icon: LinkIcon, brandColor: '#6B7280', buildUrl: (h) => h },
}

// Format follower count: 220430 → "220k", 1500000 → "1.5M"
const formatFollowerCount = (count: number | undefined): string => {
  if (count === undefined || count === null) return ''
  if (count < 1000) return String(count)
  if (count < 1000000) {
    const k = count / 1000
    return k >= 100 ? `${Math.round(k)}k` : `${k.toFixed(k % 1 === 0 ? 0 : 1)}k`
  }
  const m = count / 1000000
  return m >= 100 ? `${Math.round(m)}M` : `${m.toFixed(m % 1 === 0 ? 0 : 1)}M`
}


// Tilt effect hook
const useTiltEffect = (isEnabled = true) => {
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({})
  const elementRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEnabled || !elementRef.current) return
    const rect = elementRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10
    const glareX = (x / rect.width) * 100
    const glareY = (y / rect.height) * 100
    const shadowX = rotateY * 1.5
    const shadowY = rotateX * -1.5
    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: `${shadowX}px ${shadowY}px 25px rgba(0,0,0,0.15), 0 8px 30px rgba(0,0,0,0.1)`,
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      '--glare-x': `${glareX}%`,
      '--glare-y': `${glareY}%`,
    } as React.CSSProperties)
  }, [isEnabled])

  const handleMouseLeave = useCallback(() => {
    if (!isEnabled) return
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
    })
  }, [isEnabled])

  return { elementRef, tiltStyle, handleMouseMove, handleMouseLeave }
}


// Block component
const Block = ({ block }: { block: BlockData }) => {
  const { elementRef, tiltStyle, handleMouseMove, handleMouseLeave } = useTiltEffect(true)
  const [videos, setVideos] = useState(block.youtubeVideos || [])
  const [loading, setLoading] = useState(false)
  const mediaPos = block.mediaPosition || { x: 50, y: 50 }

  useEffect(() => {
    if (block.type === BlockType.SOCIAL && block.channelId && !block.youtubeVideos?.length) {
      setLoading(true)
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${block.channelId}`
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`
      fetch(proxyUrl).then(r => r.text()).then(text => {
        const parser = new DOMParser()
        const xml = parser.parseFromString(text, 'text/xml')
        const entries = Array.from(xml.querySelectorAll('entry'))
        const vids = entries.slice(0, 4).map(e => {
          const id = e.getElementsByTagName('yt:videoId')[0]?.textContent || ''
          const title = e.getElementsByTagName('title')[0]?.textContent || ''
          return { id, title, thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg` }
        })
        if (vids.length) setVideos(vids)
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [block.channelId, block.youtubeVideos, block.type])

  const getBorderRadius = () => {
    const minDim = Math.min(block.colSpan, block.rowSpan)
    if (minDim <= 1) return '0.5rem'
    if (minDim <= 2) return '0.625rem'
    if (minDim <= 3) return '0.75rem'
    return '0.875rem'
  }
  const borderRadius = getBorderRadius()

  const gridStyle: React.CSSProperties = {}
  if (block.gridColumn !== undefined) {
    gridStyle.gridColumnStart = block.gridColumn
    gridStyle.gridColumnEnd = block.gridColumn + block.colSpan
  }
  if (block.gridRow !== undefined) {
    gridStyle.gridRowStart = block.gridRow
    gridStyle.gridRowEnd = block.gridRow + block.rowSpan
  }

  const handleClick = () => {
    let url = block.content
    if (block.type === BlockType.SOCIAL && block.socialPlatform && block.socialHandle) {
      url = SOCIAL_PLATFORMS[block.socialPlatform]?.buildUrl(block.socialHandle)
    } else if (block.channelId) {
      url = `https://youtube.com/channel/${block.channelId}`
    }
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const isYoutube = block.type === BlockType.SOCIAL && block.channelId
  const activeVideoId = block.youtubeVideoId || videos[0]?.id
  const isRichYT = isYoutube && activeVideoId && block.youtubeMode !== 'grid' && block.youtubeMode !== 'list'
  const isYTGrid = isYoutube && (block.youtubeMode === 'grid' || block.youtubeMode === 'list')
  const isLinkImg = block.type === BlockType.LINK && block.imageUrl

  if (block.type === BlockType.SPACER) return <div style={{ borderRadius, ...gridStyle }} className="h-full" />

  if (block.type === BlockType.SOCIAL_ICON) {
    const platform = SOCIAL_PLATFORMS[block.socialPlatform || 'custom']
    const Icon = platform?.icon
    const url = block.socialHandle ? platform?.buildUrl(block.socialHandle) : ''
    return (
      <a href={url || undefined} target="_blank" rel="noopener noreferrer" onClick={handleClick}
        className={`bento-item relative h-full ${block.color || 'bg-white'} flex items-center justify-center shadow-sm border border-gray-100 hover:shadow-md transition-all`}
        style={{ borderRadius, ...gridStyle, ...(block.customBackground ? { background: block.customBackground } : {}) }}>
        {Icon && <span style={{ color: platform.brandColor }}><Icon size={24} /></span>}
      </a>
    )
  }

  if (isYTGrid) {
    return (
      <div onClick={handleClick} style={{ borderRadius, ...gridStyle, ...(block.customBackground ? { background: block.customBackground } : {}) }}
        className={`bento-item group cursor-pointer h-full ${block.color || 'bg-white'} ring-1 ring-black/5 shadow-sm hover:shadow-xl transition-all`}>
        <div className="w-full h-full flex flex-col p-2 md:p-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center"><Youtube size={12} /></div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[10px] md:text-xs font-bold text-gray-900 truncate">{block.channelTitle || 'YouTube'}</h3>
              <span className="text-[8px] text-gray-400">Latest videos</span>
            </div>
          </div>
          {loading ? <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" size={16} /></div> : (
            <div className="flex-1 grid grid-cols-2 gap-1 overflow-hidden">
              {videos.slice(0, 4).map((v, i) => (
                <a key={i} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="relative overflow-hidden rounded bg-gray-100 group/vid">
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover/vid:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity">
                      <Play size={10} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  let bgStyle: React.CSSProperties = block.customBackground ? { background: block.customBackground } : {}
  if (isRichYT) bgStyle = { backgroundImage: `url(https://img.youtube.com/vi/${activeVideoId}/maxresdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }
  else if (isLinkImg && block.imageUrl) bgStyle = { backgroundImage: `url(${block.imageUrl})`, backgroundSize: 'cover', backgroundPosition: `${mediaPos.x}% ${mediaPos.y}%` }

  return (
    <div onClick={handleClick} style={{ ...gridStyle }} className="cursor-pointer h-full transform-gpu">
      <div ref={elementRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ ...bgStyle, borderRadius, ...tiltStyle, width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        className={`bento-item group relative overflow-hidden w-full h-full ${!block.customBackground && !isLinkImg && !isRichYT ? (block.color || 'bg-white') : ''} ${block.textColor || 'text-gray-900'} ring-1 ring-black/5 shadow-sm transition-all`}>
        <div className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,255,255,0.25) 0%, transparent 60%)' }} />
        {(isRichYT || isLinkImg) && (block.title || block.subtext) && (
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-0" />
        )}
        <div className="w-full h-full relative z-10">
          {block.type === BlockType.MEDIA && block.imageUrl ? (
            <div className="w-full h-full relative overflow-hidden">
              {/\.(mp4|webm|ogg|mov)$/i.test(block.imageUrl) ? (
                <video src={block.imageUrl} className="full-img" style={{ objectPosition: `${mediaPos.x}% ${mediaPos.y}%` }} autoPlay loop muted playsInline />
              ) : (
                <img src={block.imageUrl} alt={block.title || ''} className="full-img" style={{ objectPosition: `${mediaPos.x}% ${mediaPos.y}%` }} />
              )}
              {block.title && <div className="media-overlay"><p className="media-title text-sm">{block.title}</p>{block.subtext && <p className="media-subtext">{block.subtext}</p>}</div>}
            </div>
          ) : block.type === BlockType.MAP ? (
            <div className="w-full h-full relative bg-gray-100 overflow-hidden">
              <iframe width="100%" height="100%" className="opacity-95 grayscale-[20%] group-hover:grayscale-0 transition-all"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(block.content || 'Paris')}&t=&z=13&ie=UTF8&iwloc=&output=embed`} loading="lazy" sandbox="allow-scripts allow-same-origin" />
              {block.title && <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent"><p className="font-semibold text-white text-sm">{block.title}</p></div>}
            </div>
          ) : isRichYT ? (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={16} className="text-white ml-0.5" fill="white" />
                </div>
              </div>
              {(block.channelTitle || block.title) && <div className="absolute bottom-0 left-0 right-0 p-3"><h3 className="font-semibold text-white text-sm drop-shadow-lg">{block.channelTitle || block.title}</h3></div>}
            </div>
          ) : (
            <div className="p-3 h-full flex flex-col justify-between">
              {block.type === BlockType.SOCIAL && block.socialPlatform && (() => {
                const platform = SOCIAL_PLATFORMS[block.socialPlatform]
                const Icon = platform?.icon
                return Icon ? (
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${block.textColor === 'text-white' || isLinkImg ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-100'}`}
                    style={{ color: block.textColor === 'text-brand' ? platform.brandColor : undefined }}>
                    <Icon size={14} />
                  </div>
                ) : null
              })()}
              <div className={block.type === BlockType.TEXT ? 'flex flex-col justify-center h-full' : 'mt-auto'}>
                <h3 className={`font-bold leading-tight ${isLinkImg ? 'text-white drop-shadow-lg' : ''}`}>{block.title}</h3>
                {block.subtext && <p className={`text-xs mt-1 ${isLinkImg ? 'text-white/80' : 'opacity-60'}`}>{block.subtext}</p>}
                {block.type === BlockType.TEXT && block.content && <p className="opacity-70 mt-2 text-sm whitespace-pre-wrap">{block.content}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// Profile data
const profile = {"name":"Belhal's Bento","bio":"Principal Data Scientist across Nike's core domains","avatarUrl":"https://picsum.photos/200/200","theme":"light","primaryColor":"blue","showBranding":true,"analytics":{"enabled":false,"supabaseUrl":""},"socialAccounts":[]}
const blocks: BlockData[] = [{"id":"bento_1792630129681_7zqfu2lsv","type":"SOCIAL","title":"My Page","subtext":"Personal Page","content":"https://belhal.com/","colSpan":3,"rowSpan":3,"gridColumn":1,"gridRow":1,"color":"bg-gray-900","textColor":"text-white","socialPlatform":"custom","socialHandle":"https://belhal.com/"},{"id":"bento_1792630129681_d951sbqm7","type":"SOCIAL","title":"X","subtext":"@BelhalK","content":"https://x.com/BelhalK","colSpan":1,"rowSpan":3,"gridColumn":4,"gridRow":1,"color":"bg-orange-500","textColor":"text-white","socialPlatform":"x","socialHandle":"BelhalK"},{"id":"bento_1792630129681_dc921ziam","type":"LINK","title":"My Closet","subtext":"Belhal's wardrobe","content":"https://belhals-closet.web.app/","colSpan":2,"rowSpan":3,"gridColumn":5,"gridRow":1,"color":"bg-amber-400","textColor":"text-gray-900"},{"id":"bento_1792630129681_kedhwlu54","type":"SOCIAL","title":"Instagram","subtext":"@belhal","content":"https://www.instagram.com/belhal/","colSpan":1,"rowSpan":3,"gridColumn":1,"gridRow":4,"color":"bg-pink-500","textColor":"text-white","socialPlatform":"instagram","socialHandle":"belhal"},{"id":"bento_1792630129681_zgsoull28","type":"LINK","title":"Google Scholar","subtext":"My publications","content":"https://scholar.google.com/citations?hl=en&user=Xh_OIWkAAAAJ","colSpan":2,"rowSpan":3,"gridColumn":2,"gridRow":4,"color":"bg-blue-500","textColor":"text-white"},{"id":"bento_1792630129681_54g3kse44","type":"SOCIAL","title":"LinkedIn","subtext":"belhal-karimi","content":"https://www.linkedin.com/in/belhal-karimi/","colSpan":1,"rowSpan":3,"gridColumn":4,"gridRow":4,"color":"bg-gray-100","customBackground":"#0A66C2","textColor":"text-white","socialPlatform":"linkedin","socialHandle":"belhal-karimi"},{"id":"bento_1792630129681_qmmmn58xg","type":"SOCIAL","title":"GitHub","subtext":"@BelhalK","content":"https://github.com/BelhalK","colSpan":2,"rowSpan":3,"gridColumn":5,"gridRow":4,"color":"bg-gray-900","customBackground":"#24292E","textColor":"text-white","socialPlatform":"youtube","socialHandle":"BelhalK"},{"id":"bento_1792630129681_9pko7bxol","type":"LINK","title":"Sesame Therapy","subtext":"Sesame surfaces six evidence-based modalities gives you shared tools with your client.","content":"https://sesame-therapy.web.app/","colSpan":3,"rowSpan":3,"gridColumn":1,"gridRow":7,"color":"bg-emerald-500","customBackground":"#5C7A63","textColor":"text-white"},{"id":"bento_1792630129681_gze7z6cvd","type":"LINK","title":"Taitris","subtext":"An entire influencer marketing team, for the price of software","content":"https://taitris-4f9dd.web.app/","colSpan":2,"rowSpan":3,"gridColumn":4,"gridRow":7,"color":"bg-white","customBackground":"#4F46E5","textColor":"text-white"},{"id":"bento_1792630129681_186c1zyoy","type":"LINK","title":"ZenTag","subtext":"Bricks For Alex","content":"https://apps.apple.com/us/app/zentag/id6811635319 ","colSpan":1,"rowSpan":3,"gridColumn":6,"gridRow":7,"color":"bg-violet-500","textColor":"text-white"}]

// Analytics hook (uses Edge Function - no API keys exposed)
const useAnalytics = () => {
  const sessionStart = useRef(Date.now())
  const maxScroll = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0
      maxScroll.current = Math.max(maxScroll.current, scrollPercent)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const config = profile.analytics
    if (!config?.enabled || !config?.supabaseUrl) return

    const track = async (eventType: 'page_view' | 'click', extra: { blockId?: string; destinationUrl?: string } = {}) => {
      const utm = new URLSearchParams(window.location.search)
      const payload = {
        siteId: '',
        event: eventType,
        blockId: extra.blockId,
        destinationUrl: extra.destinationUrl,
        pageUrl: window.location.href,
        referrer: document.referrer || undefined,
        utm: {
          source: utm.get('utm_source') || undefined,
          medium: utm.get('utm_medium') || undefined,
          campaign: utm.get('utm_campaign') || undefined,
          term: utm.get('utm_term') || undefined,
          content: utm.get('utm_content') || undefined,
        },
        language: navigator.language,
        screenW: window.screen?.width,
        screenH: window.screen?.height,
      }
      // Use Edge Function endpoint (secure - no API keys needed)
      const endpoint = config.supabaseUrl.replace(/\/+$/, '') + '/functions/v1/openbento-analytics-track'
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    }

    track('page_view')

    // Note: session_end is not supported by the Edge Function, only page_view and click
    // If you need session tracking, extend the Edge Function
  }, [])
}


// Mobile layout helper - calculates responsive grid spans
const getMobileLayout = (block: BlockData) => ({
  colSpan: block.colSpan >= 5 ? 2 : 1,
  rowSpan: block.colSpan >= 3 && block.colSpan < 5 ? Math.max(block.rowSpan, 2) : block.rowSpan
})

// Sort blocks for mobile
const sortedBlocks = [...blocks].sort((a, b) => {
  const aRow = a.gridRow ?? 999
  const bRow = b.gridRow ?? 999
  const aCol = a.gridColumn ?? 999
  const bCol = b.gridColumn ?? 999
  if (aRow !== bRow) return aRow - bRow
  return aCol - bCol
})

export default function App() {
  useAnalytics()

  const avatarStyle = { borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '4px solid #ffffff' }
  const bgStyle: React.CSSProperties = { backgroundColor: '#f8fafc' }

  return (
    <div className="min-h-screen font-sans" style={bgStyle}>
      
      <div className="relative z-10">

        {/* Desktop Layout */}
        <div className="hidden lg:flex">
          <div className="fixed left-0 top-0 w-[420px] h-screen flex flex-col justify-center items-start px-12">
            <div className="w-40 h-40 overflow-hidden bg-gray-100 mb-8" style={avatarStyle}>
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">{profile.name}</h1>
            <p className="text-base text-gray-500 font-medium whitespace-pre-wrap max-w-xs">{profile.bio}</p>
            
          </div>
          <div className="ml-[420px] flex-1 p-12">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gridAutoRows: '64px' }}>
              {blocks.map(block => <Block key={block.id} block={block} />)}
            </div>
          </div>
        </div>


        {/* Mobile Layout - 2 columns adaptive */}
        <div className="lg:hidden">
          <div className="p-4 pt-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-4 overflow-hidden bg-gray-100" style={avatarStyle}>
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">{profile.name}</h1>
            <p className="text-sm text-gray-500 font-medium whitespace-pre-wrap max-w-xs">{profile.bio}</p>
            
          </div>
          <div className="p-4">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gridAutoRows: '80px', gap: '12px' }}>
              {sortedBlocks.map(block => {
                const mobile = getMobileLayout(block)
                return (
                  <div key={block.id} style={{ gridColumn: `span ${mobile.colSpan}`, gridRow: `span ${mobile.rowSpan}` }}>
                    <Block block={{ ...block, gridColumn: undefined, gridRow: undefined }} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>


        <footer className="w-full py-10 text-center">
          <p className="text-sm text-gray-400 font-medium">
            Made with <span className="text-red-400">♥</span> using{' '}
            <a href="https://github.com/yoanbernabeu/openbento" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-violet-500 transition-colors">OpenBento</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
