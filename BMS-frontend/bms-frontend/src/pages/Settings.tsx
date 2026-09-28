import React, { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as settingsApi from '../api/settings'
import * as telegramApi from '../api/telegram'
import * as sitesApi from '../api/sites'
import * as buildingsApi from '../api/buildings'
import { Building2, Landmark, Gavel, ClipboardList, Upload, Save, Percent, Calendar, FileText, Image as ImageIcon, Bot, MessageCircle, Plus, Trash2, Send, Radio } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

import { getSignature, saveSignature } from '../api/users'

type TelegramScopeType = 'GLOBAL' | 'SITE' | 'BUILDING'
type TelegramPurpose = 'GENERAL' | 'ANNOUNCEMENTS' | 'MAINTENANCE' | 'FINANCE' | 'LEASES'

export default function Settings() {
  const toast = useToast()
  const { refreshSettings } = useSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form States
  const [companyName, setCompanyName] = useState('')
  const [tinNumber, setTinNumber] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [vatRate, setVatRate] = useState(0.15)
  const [withholdingRate, setWithholdingRate] = useState(0.02)
  const [lateFee, setLateFee] = useState(2.0)
  const [lateFeeType, setLateFeeType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE')
  const [lateFeeFlat, setLateFeeFlat] = useState(0.0)
  const [lateFeeGrace, setLateFeeGrace] = useState(0)
  const [penaltyPct, setPenaltyPct] = useState(0.0)
  const [escalationPct, setEscalationPct] = useState(0.0)
  const [defaultDuration, setDefaultDuration] = useState(12)
  const [logoPath, setLogoPath] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  // New visual states
  const [primaryColor, setPrimaryColor] = useState('#4F46E5')
  const [secondaryColor, setSecondaryColor] = useState('#1E293B')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [signatoryName, setSignatoryName] = useState('')
  const [signatoryTitle, setSignatoryTitle] = useState('')

  // Telegram integration
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramBotUsername, setTelegramBotUsername] = useState('')
  const [telegramBotConfigured, setTelegramBotConfigured] = useState(false)
  const [telegramWebhookSecret, setTelegramWebhookSecret] = useState('')
  const [telegramAnnouncements, setTelegramAnnouncements] = useState(true)
  const [telegramPrivate, setTelegramPrivate] = useState(false)
  const [telegramTargets, setTelegramTargets] = useState<any[]>([])
  const [telegramSavingTarget, setTelegramSavingTarget] = useState(false)
  const [telegramTesting, setTelegramTesting] = useState(false)
  const [telegramTargetScope, setTelegramTargetScope] = useState<TelegramScopeType>('GLOBAL')
  const [telegramTargetScopeId, setTelegramTargetScopeId] = useState('')
  const [telegramTargetTitle, setTelegramTargetTitle] = useState('')
  const [telegramTargetChatId, setTelegramTargetChatId] = useState('')
  const [telegramTargetPurpose, setTelegramTargetPurpose] = useState<TelegramPurpose>('ANNOUNCEMENTS')
  const [sites, setSites] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])

  const [companySealPath, setCompanySealPath] = useState('')
  const [companySealFile, setCompanySealFile] = useState<File | null>(null)
  const [companySealPreview, setCompanySealPreview] = useState('')

  const [headerImagePath, setHeaderImagePath] = useState('')
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null)
  const [headerImagePreview, setHeaderImagePreview] = useState('')

  const [footerImagePath, setFooterImagePath] = useState('')
  const [footerImageFile, setFooterImageFile] = useState<File | null>(null)
  const [footerImagePreview, setFooterImagePreview] = useState('')

  // Signature drawing canvas
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [sigPngPath, setSigPngPath] = useState('')

  useEffect(() => {
    loadSettings()
    loadSignature()
    loadTelegramTargets()
    loadTelegramScopes()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const data = await settingsApi.getSettings()
      if (data) {
        setCompanyName(data.company_name || '')
        setTinNumber(data.tin_number || '')
        setVatNumber(data.vat_number || '')
        setVatRate(Number(data.vat_rate) || 0.15)
        setWithholdingRate(Number(data.withholding_rate) || 0.02)
        setLateFee(Number(data.late_fee_percentage) || 2.0)
        setLateFeeType(data.late_fee_type || 'PERCENTAGE')
        setLateFeeFlat(Number(data.late_fee_flat_amount) || 0)
        setLateFeeGrace(Number(data.late_fee_grace_period_days) || 0)
        setPenaltyPct(Number(data.early_termination_penalty_pct) || 0)
        setEscalationPct(Number(data.rent_escalation_pct) || 0)
        setDefaultDuration(Number(data.default_lease_duration_months) || 12)
        setLogoPath(data.logo_path || '')
        setPrimaryColor(data.primary_color || '#4F46E5')
        setSecondaryColor(data.secondary_color || '#1E293B')
        setFontFamily(data.font_family || 'Inter')
        setCompanyAddress(data.company_address || '')
        setCompanyPhone(data.company_phone || '')
        setCompanyEmail(data.company_email || '')
        setSignatoryName(data.authorized_signatory_name || '')
        setSignatoryTitle(data.authorized_signatory_title || '')
        setCompanySealPath(data.company_seal_path || '')
        setHeaderImagePath(data.header_image_path || '')
        setFooterImagePath(data.footer_image_path || '')
        setTelegramEnabled(!!data.telegram_enabled)
        setTelegramBotUsername(data.telegram_bot_username || '')
        setTelegramBotConfigured(!!data.telegram_bot_configured)
        setTelegramWebhookSecret(data.telegram_webhook_secret || '')
        setTelegramAnnouncements(data.telegram_send_announcements !== false)
        setTelegramPrivate(!!data.telegram_send_private_notifications)
      }
    } catch (e: any) {
      toast.addToast('Failed to load system settings', 'error')
    } finally { setLoading(false) }
  }

  async function loadTelegramTargets() {
    try {
      const data = await telegramApi.listTelegramTargets()
      setTelegramTargets(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load Telegram targets', e)
    }
  }

  async function loadTelegramScopes() {
    try {
      const [siteData, buildingData] = await Promise.all([
        sitesApi.listSites(),
        buildingsApi.listBuildings({ page: 1, per_page: 500 }),
      ])
      setSites(Array.isArray(siteData) ? siteData : siteData?.data || [])
      setBuildings(Array.isArray(buildingData) ? buildingData : buildingData?.data || [])
    } catch (e) {
      console.error('Failed to load Telegram scope options', e)
    }
  }

  async function loadSignature() {
    try {
      const res = await getSignature()
      if (res) {
        setSigPngPath(res.signature_png_path)
      }
    } catch (e) {
      console.error(e)
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleSealChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setCompanySealFile(file)
      const reader = new FileReader()
      reader.onload = () => setCompanySealPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleHeaderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setHeaderImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setHeaderImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleFooterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFooterImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setFooterImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  // Drawing pad handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e293b'

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const submitSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const base64 = canvas.toDataURL('image/png')
    try {
      const res = await saveSignature({ signature_png_base64: base64 })
      setSigPngPath(res.signature_png_path)
      toast.addToast('Drawn signature saved!', 'success')
      clearCanvas()
    } catch (err) {
      toast.addToast('Failed to save drawn signature', 'error')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.updateSettings({
        company_name: companyName, tin_number: tinNumber, vat_number: vatNumber,
        vat_rate: vatRate, withholding_rate: withholdingRate, late_fee_percentage: lateFee,
        late_fee_type: lateFeeType, late_fee_flat_amount: lateFeeFlat, late_fee_grace_period_days: lateFeeGrace,
        early_termination_penalty_pct: penaltyPct, rent_escalation_pct: escalationPct,
        default_lease_duration_months: defaultDuration, logo: logoFile || undefined,
        primary_color: primaryColor, secondary_color: secondaryColor, font_family: fontFamily,
        company_address: companyAddress, company_phone: companyPhone, company_email: companyEmail,
        authorized_signatory_name: signatoryName, authorized_signatory_title: signatoryTitle,
        telegram_enabled: telegramEnabled,
        telegram_bot_token: telegramBotToken || undefined,
        telegram_bot_username: telegramBotUsername,
        telegram_webhook_secret: telegramWebhookSecret,
        telegram_send_announcements: telegramAnnouncements,
        telegram_send_private_notifications: telegramPrivate,
        company_seal: companySealFile || undefined,
        header_image: headerImageFile || undefined,
        footer_image: footerImageFile || undefined,
      })
      toast.addToast('System configuration updated', 'success')
      setLogoFile(null); setLogoPreview('')
      setCompanySealFile(null); setCompanySealPreview('')
      setHeaderImageFile(null); setHeaderImagePreview('')
      setFooterImageFile(null); setFooterImagePreview('')
      setTelegramBotToken('')
      await refreshSettings()
      loadSettings()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Update failed', 'error')
    } finally { setSaving(false) }
  }

  async function handleTestTelegramBot() {
    setTelegramTesting(true)
    try {
      const res = await telegramApi.testTelegramBot()
      if (res?.username) setTelegramBotUsername(res.username)
      toast.addToast(`Telegram bot connected${res?.username ? `: @${res.username}` : ''}`, 'success')
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Telegram bot test failed', 'error')
    } finally {
      setTelegramTesting(false)
    }
  }

  async function handleAddTelegramTarget() {
    setTelegramSavingTarget(true)
    try {
      await telegramApi.createTelegramTarget({
        scope_type: telegramTargetScope,
        scope_id: telegramTargetScope === 'GLOBAL' ? null : telegramTargetScopeId,
        title: telegramTargetTitle,
        chat_id: telegramTargetChatId,
        purpose: telegramTargetPurpose,
        is_active: true,
      })
      toast.addToast('Telegram group target added', 'success')
      setTelegramTargetScope('GLOBAL')
      setTelegramTargetScopeId('')
      setTelegramTargetTitle('')
      setTelegramTargetChatId('')
      setTelegramTargetPurpose('ANNOUNCEMENTS')
      loadTelegramTargets()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to add Telegram group', 'error')
    } finally {
      setTelegramSavingTarget(false)
    }
  }

  async function handleDeleteTelegramTarget(id: string) {
    try {
      await telegramApi.deleteTelegramTarget(id)
      toast.addToast('Telegram group target removed', 'success')
      loadTelegramTargets()
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Failed to remove Telegram group', 'error')
    }
  }

  async function handleTestTelegramTarget(id: string) {
    try {
      const res = await telegramApi.testTelegramTarget(id)
      toast.addToast(res?.ok ? 'Telegram test message sent' : (res?.error || 'Telegram test failed'), res?.ok ? 'success' : 'error')
    } catch (e: any) {
      toast.addToast(e?.response?.data?.message || 'Telegram test failed', 'error')
    }
  }

  function getTelegramScopeName(target: any) {
    if (target.scope_type === 'GLOBAL') return 'Global'
    if (target.scope_type === 'SITE') return sites.find(s => s.id === target.scope_id)?.name || 'Site'
    if (target.scope_type === 'BUILDING') return buildings.find(b => b.id === target.scope_id)?.name || 'Building'
    return target.scope_type
  }

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || 'https://bms.skylinkict.com'

  return (
    <PageLayout
      title="Global Settings"
      subtitle="Configure organization identity, tax policies, and default lease parameters."
    >
      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-600 animate-spin" /></div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8 pb-20 max-w-6xl">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: IDENTITIY & LOGO */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Building2 size={16} className="text-indigo-500" /> Organization Logo
                </h3>

                <div className="relative group">
                  <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4" />
                    ) : logoPath ? (
                      <img src={`${apiBase}${logoPath}`} alt="Current" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center text-slate-300">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-wider">No Logo Uploaded</p>
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-all rounded-2xl">
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                      <Upload size={18} className="text-indigo-600" />
                    </div>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-4 text-center">Recommend 512x512px SVG or transparent PNG.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ClipboardList size={16} className="text-emerald-500" /> Profile Summary
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Vendor</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{companyName || 'Not Set'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax ID (TIN)</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{tinNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAT Reg.</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{vatNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CORE FORMS */}
            <div className="lg:col-span-2 space-y-8">
              {/* Organization Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Legal Identity</h3>
                    <p className="text-sm text-slate-500 font-medium">Core business information used for invoicing and contracts.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Company Legal Name <span className="text-red-500">*</span></label>
                    <input required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">TIN Number <span className="text-red-500">*</span></label>
                    <input required value={tinNumber} onChange={e => setTinNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">VAT Number <span className="text-red-500">*</span></label>
                    <input required value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Taxation & Rates</h3>
                    <p className="text-sm text-slate-500 font-medium">Define automatic calculation values for your transactions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">VAT Rate (Decimal)</label>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{(vatRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" step="0.01" min="0" max="1" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Withholding Rate</label>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{(withholdingRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" step="0.01" min="0" max="1" value={withholdingRate} onChange={e => setWithholdingRate(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document & Branding Style Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Document branding & Styling</h3>
                    <p className="text-sm text-slate-500 font-medium">Design automated templates, company seal, header/footer banners, and manager signatures.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Colors & Font */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Accent Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 border rounded-xl cursor-pointer" />
                        <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 bg-slate-50 border rounded-xl px-3 text-sm font-mono font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Secondary Accent Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-10 border rounded-xl cursor-pointer" />
                        <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 bg-slate-50 border rounded-xl px-3 text-sm font-mono font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Primary PDF Font</label>
                      <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 h-10 text-sm font-bold">
                        <option value="Inter">Inter (Sans-Serif)</option>
                        <option value="Times-Roman">Times New Roman (Serif)</option>
                        <option value="Courier">Courier (Monospace)</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Info for Header Fallbacks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Corporate Address</label>
                      <textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} rows={2} className="w-full bg-slate-50 border rounded-xl p-3 text-sm" placeholder="Addis Ababa, Ethiopia" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Phone</label>
                        <input type="text" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm" placeholder="+251-911-123456" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Corporate Email</label>
                        <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-2 text-sm" placeholder="info@company.com" />
                      </div>
                    </div>
                  </div>

                  {/* Signatory Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Authorized Signatory Name</label>
                      <input type="text" value={signatoryName} onChange={e => setSignatoryName(e.target.value)} className="w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm" placeholder="Mussa K." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Authorized Signatory Title</label>
                      <input type="text" value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} className="w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-2 text-sm" placeholder="General Manager" />
                    </div>
                  </div>

                  {/* Visual Layout Banners Upload Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Header Image */}
                    <div className="p-4 border border-dashed rounded-2xl text-center">
                      <p className="text-xs font-bold text-slate-500 mb-2">Header Image Banner</p>
                      <div className="w-full aspect-[4/1] bg-slate-100 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                        {headerImagePreview ? (
                          <img src={headerImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : headerImagePath ? (
                          <img src={`${apiBase}${headerImagePath}`} alt="Current" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400">No Header Banner</span>
                        )}
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all">
                        <Upload size={12} />
                        Choose Banner
                        <input type="file" accept="image/*" onChange={handleHeaderChange} className="hidden" />
                      </label>
                    </div>

                    {/* Footer Image */}
                    <div className="p-4 border border-dashed rounded-2xl text-center">
                      <p className="text-xs font-bold text-slate-500 mb-2">Footer Image Banner</p>
                      <div className="w-full aspect-[4/1] bg-slate-100 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                        {footerImagePreview ? (
                          <img src={footerImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : footerImagePath ? (
                          <img src={`${apiBase}${footerImagePath}`} alt="Current" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-slate-400">No Footer Banner</span>
                        )}
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all">
                        <Upload size={12} />
                        Choose Banner
                        <input type="file" accept="image/*" onChange={handleFooterChange} className="hidden" />
                      </label>
                    </div>

                    {/* Company Seal */}
                    <div className="p-4 border border-dashed rounded-2xl text-center">
                      <p className="text-xs font-bold text-slate-500 mb-2">Official Company Seal</p>
                      <div className="w-full aspect-[4/1] bg-slate-100 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                        {companySealPreview ? (
                          <img src={companySealPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                        ) : companySealPath ? (
                          <img src={`${apiBase}${companySealPath}`} alt="Current" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-[10px] text-slate-400">No Seal Uploaded</span>
                        )}
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all">
                        <Upload size={12} />
                        Choose Seal
                        <input type="file" accept="image/*" onChange={handleSealChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Drawn Signature Canvas Pad */}
                  <div className="p-6 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <Save size={16} className="text-indigo-500" /> Authorized Manager Signature Pad
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-2">Draw Signature (Use mouse or touch pad):</p>
                        <canvas
                          ref={canvasRef}
                          width={300}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="bg-white rounded-xl border border-slate-200 cursor-crosshair w-full max-w-[300px] h-[120px]"
                        />
                        <div className="flex gap-2 mt-3">
                          <button type="button" onClick={clearCanvas} className="px-3 py-1.5 text-xs bg-slate-200 hover:bg-slate-300 font-bold rounded-lg transition-all">Clear Canvas</button>
                          <button type="button" onClick={submitSignature} disabled={!hasSignature} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all disabled:opacity-50">Save Drawing</button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-center items-center border border-dashed rounded-xl p-4 bg-white dark:bg-slate-800">
                        <p className="text-xs font-bold text-slate-400 mb-2">Current Active Signature Image:</p>
                        {sigPngPath ? (
                          <img src={`${apiBase}${sigPngPath}`} alt="Saved Signature" className="max-h-[80px] object-contain border p-1 rounded bg-white" />
                        ) : (
                          <span className="text-xs font-bold text-rose-500">No Signature Image Configured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Telegram Integration Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
                      <Bot size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Telegram Integration</h3>
                      <p className="text-sm text-slate-500 font-medium">Configure customer-specific bot settings and multiple Telegram groups.</p>
                    </div>
                  </div>
                  <a
                    href="/telegram-notifications-setup-manual.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100"
                  >
                    <FileText size={15} /> Manual
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Enable Telegram</span>
                      <span className="block text-xs text-slate-400 mt-1">Allow BMS to send Telegram notifications.</span>
                    </span>
                    <input type="checkbox" checked={telegramEnabled} onChange={e => setTelegramEnabled(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-indigo-600" />
                  </label>

                  <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Announcements</span>
                      <span className="block text-xs text-slate-400 mt-1">Send Communication Hub broadcasts to groups.</span>
                    </span>
                    <input type="checkbox" checked={telegramAnnouncements} onChange={e => setTelegramAnnouncements(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-indigo-600" />
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bot Token {telegramBotConfigured && <span className="text-emerald-600 normal-case tracking-normal">(configured)</span>}</label>
                    <input
                      type="password"
                      value={telegramBotToken}
                      onChange={e => setTelegramBotToken(e.target.value)}
                      placeholder={telegramBotConfigured ? 'Leave blank to keep existing token' : 'Paste token from @BotFather'}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Bot Username</label>
                    <div className="flex gap-2">
                      <input
                        value={telegramBotUsername}
                        onChange={e => setTelegramBotUsername(e.target.value)}
                        placeholder="BmsBot"
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                      <button type="button" onClick={handleTestTelegramBot} disabled={telegramTesting || !telegramEnabled} className="px-4 rounded-2xl bg-cyan-600 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-40">
                        <Radio size={14} /> Test
                      </button>
                    </div>
                  </div>

                  <label className="md:col-span-2 flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span>
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Private Tenant Telegram</span>
                      <span className="block text-xs text-slate-400 mt-1">Send private notifications to users who connect Telegram from their profile.</span>
                    </span>
                    <input type="checkbox" checked={telegramPrivate} onChange={e => setTelegramPrivate(e.target.checked)} className="h-5 w-5 rounded border-slate-300 text-indigo-600" />
                  </label>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Webhook Secret</label>
                    <input
                      value={telegramWebhookSecret}
                      onChange={e => setTelegramWebhookSecret(e.target.value)}
                      placeholder="Random secret used in /telegram/webhook/:secret"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">Use this when registering the Telegram webhook URL. Example: /telegram/webhook/your-secret.</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-5">
                    <MessageCircle size={18} className="text-cyan-600" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Telegram Groups</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
                    <select value={telegramTargetScope} onChange={e => { setTelegramTargetScope(e.target.value as TelegramScopeType); setTelegramTargetScopeId('') }} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold">
                      <option value="GLOBAL">Global</option>
                      <option value="SITE">Site</option>
                      <option value="BUILDING">Building</option>
                    </select>

                    {telegramTargetScope === 'SITE' ? (
                      <select value={telegramTargetScopeId} onChange={e => setTelegramTargetScopeId(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold">
                        <option value="">Select site</option>
                        {sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}
                      </select>
                    ) : telegramTargetScope === 'BUILDING' ? (
                      <select value={telegramTargetScopeId} onChange={e => setTelegramTargetScopeId(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold">
                        <option value="">Select building</option>
                        {buildings.map((building: any) => <option key={building.id} value={building.id}>{building.name}</option>)}
                      </select>
                    ) : (
                      <div className="hidden md:block" />
                    )}

                    <input value={telegramTargetTitle} onChange={e => setTelegramTargetTitle(e.target.value)} placeholder="Group title" className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold" />
                    <input value={telegramTargetChatId} onChange={e => setTelegramTargetChatId(e.target.value)} placeholder="Telegram chat ID" className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold" />
                    <select value={telegramTargetPurpose} onChange={e => setTelegramTargetPurpose(e.target.value as TelegramPurpose)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold">
                      <option value="ANNOUNCEMENTS">Announcements</option>
                      <option value="GENERAL">General</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="FINANCE">Finance</option>
                      <option value="LEASES">Leases</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTelegramTarget}
                    disabled={telegramSavingTarget || !telegramTargetTitle || !telegramTargetChatId || (telegramTargetScope !== 'GLOBAL' && !telegramTargetScopeId)}
                    className="mb-5 px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-40"
                  >
                    <Plus size={14} /> Add Telegram Group
                  </button>

                  <div className="space-y-2">
                    {telegramTargets.length === 0 ? (
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest py-6 text-center border border-dashed rounded-2xl">No Telegram groups configured</div>
                    ) : telegramTargets.map((target: any) => (
                      <div key={target.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{target.title}</div>
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            {target.scope_type} - {getTelegramScopeName(target)} - {target.purpose} - {target.chat_id}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleTestTelegramTarget(target.id)} className="px-3 py-2 text-xs font-bold rounded-xl bg-cyan-50 text-cyan-700 flex items-center gap-1">
                            <Send size={13} /> Test
                          </button>
                          <button type="button" onClick={() => handleDeleteTelegramTarget(target.id)} className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 flex items-center gap-1">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lease Policy Section */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                    <Gavel size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lease Enforcement</h3>
                    <p className="text-sm text-slate-500 font-medium">Standardized terms and penalty procedures for tenant management.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Late Fee Type</label>
                    <select value={lateFeeType} onChange={e => setLateFeeType(e.target.value as 'PERCENTAGE' | 'FLAT')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all">
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      {lateFeeType === 'PERCENTAGE' ? 'Daily Late Fee (%)' : 'Daily Late Fee (Flat)'}
                    </label>
                    {lateFeeType === 'PERCENTAGE' ? (
                      <input type="number" step="0.1" min="0" value={lateFee} onChange={e => setLateFee(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                    ) : (
                      <input type="number" step="0.01" min="0" value={lateFeeFlat} onChange={e => setLateFeeFlat(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                    )}
                    <p className="text-[10px] text-slate-400 mt-2">Applied to outstanding balance per day after grace period.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Grace Period (Days)</label>
                    <input type="number" min="0" step="1" value={lateFeeGrace} onChange={e => setLateFeeGrace(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all" />
                    <p className="text-[10px] text-slate-400 mt-2">Days after due date before penalties start.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Default Duration (Months)</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" min="1" step="1" value={defaultDuration} onChange={e => setDefaultDuration(parseInt(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Termination Penalty (%)</label>
                    <input type="number" step="0.1" min="0" value={penaltyPct} onChange={e => setPenaltyPct(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-400 mt-2">% of remaining total rent charged as penalty fee.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Rent Escalation (%)</label>
                    <input type="number" step="0.1" min="0" value={escalationPct} onChange={e => setEscalationPct(parseFloat(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-400 mt-2">Standard annual percentage increase for renewals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FLOAT BAR FOR SAVE */}
          <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs sm:max-w-sm px-4 z-40">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold py-3 sm:py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'UPDATING...' : 'PUBLISH CHANGES'}
            </button>
          </div>
        </form>
      )}
    </PageLayout>
  )
}
