import React, { useEffect, useState, useRef, useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/ToastProvider'
import * as docApi from '../api/documents'
import { listLeases } from '../api/leases'
import { listTenants } from '../api/tenants'
import { listBuildings } from '../api/buildings'
import { getSettings } from '../api/settings'
import {
  FileText, Upload, History, Filter,
  AlertCircle, CheckCircle2, FileJson,
  Calendar, Trash2, Clock, Wand2,
  GripVertical, Plus
} from 'lucide-react'

type Tab = 'browse' | 'history' | 'templates'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'browse', label: 'Upload & Browse', icon: Upload },
  { key: 'templates', label: 'Contract Templates', icon: FileJson },
  { key: 'history', label: 'Version History', icon: History },
]

const MODULE_TYPES = ['lease', 'tenant', 'maintenance', 'payment', 'building']
const CATEGORIES = ['CONTRACT', 'ID', 'RECEIPT', 'INSURANCE', 'OTHER']

export default function Documents() {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('browse')

  // Upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadModuleType, setUploadModuleType] = useState('lease')
  const [uploadModuleId, setUploadModuleId] = useState('')
  const [uploadCategory, setUploadCategory] = useState('OTHER')
  const [uploadExpiry, setUploadExpiry] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [templateContent, setTemplateContent] = useState('')
  const [uploading, setUploading] = useState(false)

  // Visual Document Builder states
  const [editorMode, setEditorMode] = useState<'visual' | 'raw'>('visual')
  const [themeColor, setThemeColor] = useState('#4F46E5')
  const [selectedFont, setSelectedFont] = useState('Helvetica')
  const [docFileName, setDocFileName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [blocks, setBlocks] = useState<any[]>([])
  const [activeInspectIdx, setActiveInspectIdx] = useState<number | null>(null)
  const [globalSettings, setGlobalSettings] = useState<any>(null)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  // A4 preview scaling — measure wrapper width and scale the 595px paper to fit
  const a4WrapperRef = useRef<HTMLDivElement>(null)
  const [a4Scale, setA4Scale] = useState(1)

  useEffect(() => {
    const el = a4WrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setA4Scale(Math.min(w / 595, 1))
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedTemplate, isCreatingTemplate])

  // Resolve backend asset URLs (images saved as /uploads/... need the API host prefix)
  const apiBase = ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:9888').replace(/\/$/, '')
  const resolveAssetUrl = (path?: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path
    return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`
  }

  // Load global branding settings
  useEffect(() => {
    getSettings().then(res => setGlobalSettings(res)).catch(console.error)
  }, [])

  // Synchronize visual options to JSON template content string
  useEffect(() => {
    if (!isTemplate) return
    const json = JSON.stringify({
      theme: { primaryColor: themeColor, fontFamily: selectedFont, padding: '30' },
      structure: blocks
    }, null, 2)
    setTemplateContent(json)
  }, [isTemplate, themeColor, selectedFont, blocks])

  // Search / Browse
  const [docs, setDocs] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterName, setFilterName] = useState('')

  // Contract Generation
  const [genLeaseId, setGenLeaseId] = useState('')
  const [genTemplateId, setGenTemplateId] = useState('')
  const [generating, setGenerating] = useState(false)

  // History
  const [historyDocId, setHistoryDocId] = useState('')
  const [versions, setVersions] = useState<any[]>([])
  const [histLoading, setHistLoading] = useState(false)

  // Lookups
  const [allLeases, setAllLeases] = useState<any[]>([])
  const [allTenants, setAllTenants] = useState<any[]>([])
  const [allBuildings, setAllBuildings] = useState<any[]>([])

  useEffect(() => {
    loadDocuments()
  }, [tab, filterType, filterCategory])

  useEffect(() => {
    listLeases({ page: 1, per_page: 500 }).then(res => setAllLeases(res || [])).catch(console.error)
    listTenants({ page: 1, per_page: 500 }).then(res => setAllTenants(res?.data || res || [])).catch(console.error)
    listBuildings({ page: 1, per_page: 500 }).then(res => setAllBuildings(res?.data || res || [])).catch(console.error)
  }, [])

  const moduleIdOptions = useMemo(() => {
    switch (uploadModuleType) {
      case 'lease': return allLeases.map(l => ({ value: l.id, label: `Lease #${l.id.slice(0, 8)} — ${l.tenant?.first_name || 'N/A'}` }))
      case 'tenant': return allTenants.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
      case 'building': return allBuildings.map(b => ({ value: b.id, label: b.name }))
      default: return []
    }
  }, [uploadModuleType, allLeases, allTenants, allBuildings])

  async function loadDocuments() {
    setDocsLoading(true)
    try {
      const filters: any = {}
      if (filterType) filters.module_type = filterType
      if (filterCategory) filters.category = filterCategory
      if (filterName) filters.file_name = filterName
      if (tab === 'templates') filters.is_template = true

      const data = await docApi.searchDocuments(filters)
      setDocs(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.addToast('Failed to load documents', 'error')
    } finally { setDocsLoading(false) }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile && !isTemplate) { toast.addToast('Select a file', 'error'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      if (uploadFile) formData.append('file', uploadFile)
      formData.append('module_type', uploadModuleType)
      formData.append('module_id', uploadModuleId)
      formData.append('category', uploadCategory)
      if (uploadExpiry) formData.append('expiry_date', uploadExpiry)
      if (isTemplate) {
        formData.append('is_template', 'true')
        formData.append('template_content', templateContent)
      }

      await docApi.uploadDocument(formData)
      toast.addToast('Document processed', 'success')
      resetForm()
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Operation failed', 'error')
    } finally { setUploading(false) }
  }

  function resetForm() {
    setUploadFile(null)
    setUploadModuleId('')
    setUploadExpiry('')
    setIsTemplate(false)
    setTemplateContent('')
    setSelectedTemplate(null)
    setIsCreatingTemplate(false)
    setBlocks([])
    setActiveInspectIdx(null)
    setDocFileName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleGenerate() {
    if (!genLeaseId || !genTemplateId) return
    setGenerating(true)
    try {
      await docApi.generateContract({ lease_id: genLeaseId, template_id: genTemplateId })
      toast.addToast('Contract generated successfully!', 'success')
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Contract generation failed', 'error')
    } finally { setGenerating(false) }
  }

  const getExpiryStatus = (date: string) => {
    if (!date) return null
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-50 border-rose-100' }
    if (days < 30) return { label: `Expires in ${days}d`, color: 'text-amber-600 bg-amber-50 border-amber-100' }
    return { label: `Valid (${days}d)`, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    try {
      await docApi.deleteDocument(id)
      toast.addToast('Document deleted', 'success')
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Delete failed', 'error')
    }
  }

  async function handlePromoteAndVerify(doc: any) {
    if (!doc || !doc.id || !doc.module_id) { toast.addToast('Cannot verify this document', 'error'); return }
    try {
      // Determine tenant id and type
      const tenantId = doc.module_type === 'tenant' ? doc.module_id : null
      if (!tenantId) { toast.addToast('Document is not linked to a tenant', 'error'); return }
      // map category or use PRIMARY_ID by default
      const dtype = (doc.category && ['ID', 'PRIMARY_ID', 'PASSPORT'].includes(doc.category)) ? doc.category : 'PRIMARY_ID'
      await docApi.promoteToTenantAndVerify(doc.id, { tenant_id: tenantId, type: dtype })
      toast.addToast('Document promoted and verified', 'success')
      loadDocuments()
    } catch (e: any) {
      console.error('Promote+verify failed', e)
      toast.addToast('Operation failed', 'error')
    }
  }

  function handleSelectTemplate(doc: any) {
    if (!doc.is_template) return
    setSelectedTemplate(doc)
    setIsTemplate(true)
    setUploadFile(null)
    setUploadCategory(doc.category || 'OTHER')
    setDocFileName(doc.file_name || '')
    if (doc.expiry_date) {
      try {
        setUploadExpiry(new Date(doc.expiry_date).toISOString().split('T')[0])
      } catch (e) {
        setUploadExpiry('')
      }
    } else {
      setUploadExpiry('')
    }
    setUploadModuleType(doc.module_type || 'lease')
    setUploadModuleId(doc.module_id || '')
    
    if (doc.template_content) {
      setTemplateContent(doc.template_content)
      try {
        const parsed = JSON.parse(doc.template_content)
        const theme = parsed.theme || {}
        if (theme.primaryColor) setThemeColor(theme.primaryColor)
        if (theme.fontFamily) setSelectedFont(theme.fontFamily)
        
        const structure = parsed.structure || []
        setBlocks(structure)
        setEditorMode('visual')
        toast.addToast(`Loaded template: ${doc.file_name}`, 'success')
      } catch (e) {
        setBlocks([])
        setEditorMode('raw')
        toast.addToast(`Loaded raw template content`, 'success')
      }
    }
  }

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx) return
    
    const newBlocks = [...blocks]
    const draggedItem = newBlocks[draggedIdx]
    newBlocks.splice(draggedIdx, 1)
    newBlocks.splice(idx, 0, draggedItem)
    setDraggedIdx(idx)
    setBlocks(newBlocks)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
  }

  const handleAddBlock = (type: string) => {
    let newBlock: any = { type }
    if (type === 'header_image') {
      newBlock.maxHeight = 80
      newBlock.objectFit = 'contain'
    } else if (type === 'footer_image') {
      newBlock.maxHeight = 50
      newBlock.objectFit = 'contain'
    } else if (type === 'title') {
      newBlock.text = 'New Section Title'
      newBlock.align = 'center'
    } else if (type === 'paragraph') {
      newBlock.text = 'Enter your custom template paragraphs text here. Supports dynamic tags like {{tenant_name}}.'
      newBlock.align = 'left'
    } else if (type === 'table') {
      newBlock.style = 'bordered'
      newBlock.rows = [
        { label: 'Item Number', value: '{{unit_number}}' },
        { label: 'Rent Amount', value: '{{rent_amount}}' }
      ]
    } else if (type === 'signatures') {
      newBlock.layout = 'double_sign_seal'
      newBlock.sealSize = 60
      newBlock.approvedBy = {
        title: 'Lessor Sign-off',
        showSeal: true,
        showSignature: true
      }
    }
    setBlocks([...blocks, newBlock])
    setActiveInspectIdx(blocks.length)
    toast.addToast(`Added ${type.toUpperCase()} component`, 'success')
  }

  const handleCreateTemplate = () => {
    setIsCreatingTemplate(true)
    setIsTemplate(true)
    setUploadFile(null)
    setUploadCategory('CONTRACT')
    setDocFileName('New Document Template.json')
    setUploadModuleType('lease')
    setUploadModuleId('default')
    setBlocks([
      { type: 'header_image', maxHeight: 80, objectFit: 'contain' },
      { type: 'title', text: 'Document Custom Title', align: 'center' },
      { type: 'paragraph', text: 'We hereby agree to the terms in unit {{unit_number}} for tenant {{tenant_name}}.', align: 'left' },
      { type: 'table', rows: [{ label: 'Rent Due', value: '{{rent_amount}}' }] },
      { type: 'signatures', layout: 'double_sign_seal', sealSize: 60 },
      { type: 'footer_image', maxHeight: 50, objectFit: 'contain' }
    ])
    setActiveInspectIdx(1)
  }

  async function handleSaveTemplateWrapper(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault()
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('module_type', uploadModuleType)
      formData.append('module_id', uploadModuleId)
      formData.append('category', uploadCategory)
      if (uploadExpiry) formData.append('expiry_date', uploadExpiry)
      formData.append('is_template', 'true')
      formData.append('template_content', templateContent)
      formData.append('file_name', docFileName || `${uploadCategory}_Template.json`)

      await docApi.uploadDocument(formData)
      toast.addToast('Template saved successfully', 'success')
      resetForm()
      loadDocuments()
    } catch (e: any) {
      toast.addToast('Failed to save template', 'error')
    } finally { setUploading(false) }
  }

  function renderWorkstation() {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedTemplate(null); setIsCreatingTemplate(false); resetForm(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900/80 rounded-xl text-xs font-bold transition-all text-slate-800 dark:text-slate-200"
            >
              ← Back to List
            </button>
            <div className="text-left">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {isCreatingTemplate ? 'Creating Dynamic Template' : `Editing Layout: ${selectedTemplate?.file_name}`}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Drag components to arrange and preview A4 outputs in real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  editorMode === 'visual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Visual Designer
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('raw')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  editorMode === 'raw' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                JSON Config
              </button>
            </div>

            <button
              onClick={handleSaveTemplateWrapper}
              disabled={uploading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-bold text-xs rounded-xl shadow-md"
            >
              {uploading ? 'Processing...' : 'Save Template'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm text-left">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Branding & Parameters</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Template Name</label>
                  <input
                    type="text"
                    placeholder="Lease Agreement Template"
                    value={docFileName}
                    onChange={e => setDocFileName(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-xs"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Theme Accent Color</label>
                  <div className="flex gap-2 items-center mt-1">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={e => setThemeColor(e.target.value)}
                      className="w-10 h-9 rounded border cursor-pointer bg-transparent border-slate-200"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={e => setThemeColor(e.target.value)}
                      className="flex-1 p-2 border rounded-xl text-xs font-mono dark:bg-slate-900 dark:text-white border-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Primary Font Family</label>
                  <select
                    value={selectedFont}
                    onChange={e => setSelectedFont(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-xs"
                  >
                    <option value="Helvetica">Helvetica (Sans-Serif)</option>
                    <option value="Times-Roman">Times New Roman (Serif)</option>
                    <option value="Courier">Courier (Monospace)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Module Type</label>
                  <select
                    value={uploadModuleType}
                    onChange={e => setUploadModuleType(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-xs"
                  >
                    {MODULE_TYPES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Expiry Date</label>
                  <input
                    type="date"
                    value={uploadExpiry}
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm text-left">
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-6 border-b pb-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Layout Builder Blocks</h4>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => handleAddBlock('header_image')} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/60 rounded border text-[10px] font-bold text-slate-700 dark:text-slate-300">+ Header</button>
                  <button onClick={() => handleAddBlock('title')} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-900/60 rounded border text-[10px] font-bold text-slate-700 dark:text-slate-300">+ Title</button>
                  <button onClick={() => handleAddBlock('paragraph')} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 rounded border text-[10px] font-bold text-slate-700 dark:text-slate-300">+ Paragraph</button>
                  <button onClick={() => handleAddBlock('table')} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 rounded border text-[10px] font-bold text-slate-700 dark:text-slate-300">+ Table</button>
                  <button onClick={() => handleAddBlock('signatures')} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 rounded border text-[10px] font-bold text-slate-700 dark:text-slate-300">+ Signatures</button>
                  <button onClick={() => handleAddBlock('footer_image')} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 rounded border text-[10px] font-bold text-slate-700 dark:text-slate-300">+ Footer</button>
                </div>
              </div>

              {editorMode === 'raw' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">JSON Template Config String</label>
                  <textarea
                    value={templateContent}
                    onChange={e => {
                      setTemplateContent(e.target.value)
                      try {
                        const parsed = JSON.parse(e.target.value)
                        if (parsed.structure) setBlocks(parsed.structure)
                      } catch (err) {}
                    }}
                    className="w-full h-80 p-4 border rounded-2xl text-xs font-mono bg-slate-50 dark:bg-slate-900 dark:text-white border-none"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {blocks.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 border-2 border-dashed rounded-2xl font-bold text-xs">
                      No blocks in this layout. Click buttons above to add visual blocks!
                    </div>
                  ) : (
                    blocks.map((block, idx) => {
                      const isExpanded = activeInspectIdx === idx
                      const isDragging = draggedIdx === idx
                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`border rounded-2xl shadow-sm transition-all duration-200 ${
                            isDragging
                              ? 'opacity-50 scale-[0.97] border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/20'
                              : 'bg-slate-50/20 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                          }`}
                        >
                          <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setActiveInspectIdx(isExpanded ? null : idx)}>
                            <div className="flex items-center gap-3">
                              <div className="cursor-grab text-slate-400 hover:text-slate-600"><GripVertical size={16} /></div>
                              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{block.type.replace('_', ' ')}</span>
                              {!isExpanded && block.text && (
                                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px] hidden sm:inline" title="Click to edit">
                                  — {block.text.slice(0, 40)}{block.text.length > 40 ? '…' : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!isExpanded && (
                                <span className="text-[9px] text-slate-400 font-bold hidden sm:inline">Click to edit</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBlocks(blocks.filter((_, i) => i !== idx))
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 rounded-b-2xl text-xs text-left">
                              {block.type === 'title' && (
                                <div className="space-y-2">
                                  <label className="font-bold text-slate-500">Title Text</label>
                                  <input
                                    type="text"
                                    value={block.text || ''}
                                    onChange={(e) => {
                                      const next = [...blocks]
                                      next[idx].text = e.target.value
                                      setBlocks(next)
                                    }}
                                    className="w-full p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                  />
                                  <label className="font-bold text-slate-500 block mt-2">Alignment</label>
                                  <select
                                    value={block.align || 'center'}
                                    onChange={(e) => {
                                      const next = [...blocks]
                                      next[idx].align = e.target.value
                                      setBlocks(next)
                                    }}
                                    className="p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                  >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                              )}

                              {block.type === 'paragraph' && (
                                <div className="space-y-2">
                                  <label className="font-bold text-slate-500">Body Text</label>
                                  <textarea
                                    value={block.text || ''}
                                    onChange={(e) => {
                                      const next = [...blocks]
                                      next[idx].text = e.target.value
                                      setBlocks(next)
                                    }}
                                    rows={4}
                                    className="w-full p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                  />
                                  <label className="font-bold text-slate-500 block mt-2">Alignment</label>
                                  <select
                                    value={block.align || 'left'}
                                    onChange={(e) => {
                                      const next = [...blocks]
                                      next[idx].align = e.target.value
                                      setBlocks(next)
                                    }}
                                    className="p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                  >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                              )}

                              {block.type === 'table' && (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <label className="font-bold text-slate-500">Table Rows Bindings</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = [...blocks]
                                        next[idx].rows = [...(next[idx].rows || []), { label: 'New Field', value: '{{tenant_name}}' }]
                                        setBlocks(next)
                                      }}
                                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                                    >
                                      + Add Row
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(block.rows || []).map((row: any, rowIdx: number) => (
                                      <div key={rowIdx} className="flex gap-2 items-center">
                                        <input
                                          type="text"
                                          value={row.label}
                                          onChange={(e) => {
                                            const next = [...blocks]
                                            next[idx].rows[rowIdx].label = e.target.value
                                            setBlocks(next)
                                          }}
                                          className="w-1/2 p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                                        />
                                        <select
                                          value={row.value}
                                          onChange={(e) => {
                                            const next = [...blocks]
                                            next[idx].rows[rowIdx].value = e.target.value
                                            setBlocks(next)
                                          }}
                                          className="w-1/2 p-1.5 border rounded-lg bg-white dark:bg-slate-800 text-xs"
                                        >
                                          <option value="{{receipt_number}}">Receipt Number</option>
                                          <option value="{{invoice_number}}">Invoice Number</option>
                                          <option value="{{tenant_name}}">Tenant Name</option>
                                          <option value="{{unit_number}}">Unit Number</option>
                                          <option value="{{payment_amount}}">Payment Amount</option>
                                          <option value="{{rent_amount}}">Rent Amount</option>
                                          <option value="{{lease_start}}">Lease Start</option>
                                          <option value="{{lease_end}}">Lease End</option>
                                          <option value="{{date}}">Current Date</option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const next = [...blocks]
                                            next[idx].rows = next[idx].rows.filter((_: any, i: number) => i !== rowIdx)
                                            setBlocks(next)
                                          }}
                                          className="text-rose-500 hover:text-rose-700 text-sm font-bold"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {block.type === 'signatures' && (
                                <div className="space-y-4">
                                  <div>
                                    <label className="font-bold text-slate-500">Signatures Style Layout</label>
                                    <select
                                      value={block.layout || 'double_sign_seal'}
                                      onChange={(e) => {
                                        const next = [...blocks]
                                        next[idx].layout = e.target.value
                                        next[idx].approvedBy = {
                                          title: e.target.value === 'single_seal' ? 'Authorized Seal' : 'Lessor Sign-off',
                                          showSeal: true,
                                          showSignature: e.target.value === 'double_sign_seal'
                                        }
                                        setBlocks(next)
                                      }}
                                      className="w-full p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white mt-1"
                                    >
                                      <option value="single_seal">Corporate Seal Only (Receipts)</option>
                                      <option value="double_sign_seal">Seal + Hand Signature Slot (Leases)</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="font-bold text-slate-500 flex items-center justify-between">
                                      <span>Seal Size</span>
                                      <span className="text-indigo-600 font-mono">{block.sealSize || 60}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min="30"
                                      max="120"
                                      value={block.sealSize || 60}
                                      onChange={(e) => {
                                        const next = [...blocks]
                                        next[idx].sealSize = Number(e.target.value)
                                        setBlocks(next)
                                      }}
                                      className="w-full mt-1 accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5">
                                      <span>30px</span>
                                      <span>120px</span>
                                    </div>
                                  </div>

                                  {globalSettings?.company_seal_path && (
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                      <label className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block mb-2">Seal Preview</label>
                                      <div className="flex items-center justify-center">
                                        <img
                                          src={resolveAssetUrl(globalSettings.company_seal_path)}
                                          alt="Seal"
                                          className="object-contain opacity-80"
                                          style={{ width: `${block.sealSize || 60}px`, height: `${block.sealSize || 60}px` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {(block.type === 'header_image' || block.type === 'footer_image') && (
                                <div className="space-y-3">
                                  <p className="text-slate-400 italic">
                                    Displays the {block.type === 'header_image' ? 'Header Banner' : 'Footer Banner'} uploaded in Settings.
                                  </p>
                                  <div>
                                    <label className="font-bold text-slate-500 flex items-center justify-between">
                                      <span>Image Height</span>
                                      <span className="text-indigo-600 font-mono">{block.maxHeight || (block.type === 'header_image' ? 80 : 50)}px</span>
                                    </label>
                                    <input
                                      type="range"
                                      min="20"
                                      max="200"
                                      value={block.maxHeight || (block.type === 'header_image' ? 80 : 50)}
                                      onChange={(e) => {
                                        const next = [...blocks]
                                        next[idx].maxHeight = Number(e.target.value)
                                        setBlocks(next)
                                      }}
                                      className="w-full mt-1 accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5">
                                      <span>20px</span>
                                      <span>200px</span>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="font-bold text-slate-500">Fit Mode</label>
                                    <select
                                      value={block.objectFit || 'contain'}
                                      onChange={(e) => {
                                        const next = [...blocks]
                                        next[idx].objectFit = e.target.value
                                        setBlocks(next)
                                      }}
                                      className="w-full mt-1 p-2 border rounded-xl bg-white dark:bg-slate-800 dark:text-white"
                                    >
                                      <option value="contain">Contain (show entire image)</option>
                                      <option value="cover">Cover (fill area, may crop)</option>
                                      <option value="fill">Stretch to fill</option>
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center sticky top-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Live A4 Preview</h4>
            <div ref={a4WrapperRef} className="w-full max-w-[500px]" style={{ aspectRatio: '1 / 1.414' }}>
              <div
                style={{
                  width: '595px',
                  height: '842px',
                  transform: `scale(${a4Scale})`,
                  transformOrigin: 'top center',
                  fontFamily: selectedFont === 'Times-Roman' ? 'Times New Roman, serif' : selectedFont === 'Courier' ? 'Courier New, monospace' : 'Inter, sans-serif'
                }}
                className="bg-white border border-slate-200 shadow-xl rounded-sm text-slate-800 text-left flex flex-col"
              >
                <div className="flex-1 flex flex-col justify-between p-12">
              <div className="space-y-6 flex-1 flex flex-col justify-start">
                {blocks.map((block, idx) => {
                  if (block.type === 'header_image') {
                    return (
                      <div key={idx} className="border-b pb-4 border-slate-100">
                        {globalSettings?.header_image_path ? (
                          <img
                            src={resolveAssetUrl(globalSettings.header_image_path)}
                            alt="Header"
                            className="w-full"
                            style={{
                              maxHeight: `${block.maxHeight || 80}px`,
                              objectFit: (block.objectFit || 'contain') as any
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            {globalSettings?.logo_path ? (
                              <img src={resolveAssetUrl(globalSettings.logo_path)} alt="Logo" className="w-12 h-12 object-contain" />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">Logo</div>
                            )}
                            <div className="text-left">
                              <h4 className="font-extrabold text-xs" style={{ color: themeColor }}>{globalSettings?.company_name || 'BMS'}</h4>
                              <p className="text-[8px] text-slate-400">{globalSettings?.company_address || 'Addis Ababa, Ethiopia'}</p>
                              <p className="text-[8px] text-slate-400">TIN: {globalSettings?.tin_number || 'N/A'} | VAT: {globalSettings?.vat_number || 'N/A'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (block.type === 'title') {
                    return (
                      <h2
                        key={idx}
                        className="text-sm font-black tracking-tight mt-2"
                        style={{
                          color: themeColor,
                          textAlign: block.align === 'left' ? 'left' : block.align === 'right' ? 'right' : 'center'
                        }}
                      >
                        {block.text || 'Section Header'}
                      </h2>
                    )
                  }

                  if (block.type === 'paragraph') {
                    const renderTextWithTokens = (text: string) => {
                      if (!text) return 'Enter body paragraph text...';
                      const parts = text.split(/(\{\{[a-zA-Z0-9_]+\}\})/);
                      return parts.map((part, i) => {
                        if (part.startsWith('{{') && part.endsWith('}}')) {
                          const tokenName = part.slice(2, -2).replace('_', ' ').toUpperCase();
                          return (
                            <span key={i} className="inline-block mx-0.5 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[8px] font-bold text-indigo-600 uppercase">
                              {tokenName}
                            </span>
                          );
                        }
                        return part;
                      });
                    };

                    return (
                      <p
                        key={idx}
                        className="text-[9px] text-slate-600 leading-relaxed font-normal text-left"
                        style={{
                          textAlign: block.align === 'left' ? 'left' : block.align === 'right' ? 'right' : 'center'
                        }}
                      >
                        {renderTextWithTokens(block.text)}
                      </p>
                    )
                  }

                  if (block.type === 'table') {
                    return (
                      <div key={idx} className="border rounded-xl overflow-hidden mt-2" style={{ borderColor: themeColor }}>
                        <table className="w-full text-left border-collapse text-[9px]">
                          <thead>
                            <tr style={{ backgroundColor: themeColor + '15' }}>
                              <th className="p-2 font-bold border-b text-slate-700" style={{ borderColor: themeColor + '30' }}>Description Label</th>
                              <th className="p-2 font-bold border-b text-slate-700" style={{ borderColor: themeColor + '30' }}>Binding Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(block.rows || []).map((row: any, rIdx: number) => (
                              <tr key={rIdx} className="border-b border-slate-100">
                                <td className="p-2 font-semibold text-slate-700">{row.label}</td>
                                <td className="p-2">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border text-[8px] font-bold text-slate-500 uppercase">
                                    {row.value.slice(2, -2).replace('_', ' ')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }

                  if (block.type === 'signatures') {
                    const sealPx = block.sealSize || 60
                    return (
                      <div key={idx} className="flex justify-between items-end mt-6 pt-3">
                        {block.layout === 'double_sign_seal' ? (
                          <>
                            <div className="text-center w-1/3">
                              {globalSettings?.company_seal_path ? (
                                <img
                                  src={resolveAssetUrl(globalSettings.company_seal_path)}
                                  className="object-contain mx-auto opacity-80"
                                  style={{ width: `${sealPx}px`, height: `${sealPx}px` }}
                                />
                              ) : (
                                <div
                                  className="rounded-full border-2 border-dashed border-slate-200 mx-auto flex items-center justify-center text-[7px] font-bold text-slate-300"
                                  style={{ width: `${sealPx}px`, height: `${sealPx}px` }}
                                >SEAL</div>
                              )}
                              <div className="border-t border-slate-200 mt-2 pt-1 text-[7px] font-bold text-slate-400 uppercase">Corporate Seal</div>
                            </div>
                            <div className="text-center w-1/3">
                              <div className="flex items-center justify-center font-mono italic text-indigo-600 text-xs" style={{ height: `${sealPx}px` }}>Signature</div>
                              <div className="border-t border-slate-200 mt-2 pt-1 text-[7px] font-bold text-slate-400 uppercase">{block.approvedBy?.title || 'Lessor Sign-off'}</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center w-full">
                            {globalSettings?.company_seal_path ? (
                              <img
                                src={resolveAssetUrl(globalSettings.company_seal_path)}
                                className="object-contain mx-auto opacity-80"
                                style={{ width: `${sealPx}px`, height: `${sealPx}px` }}
                              />
                            ) : (
                              <div
                                className="rounded-full border-2 border-dashed border-slate-200 mx-auto flex items-center justify-center text-[7px] font-bold text-slate-300"
                                style={{ width: `${sealPx}px`, height: `${sealPx}px` }}
                              >SEAL</div>
                            )}
                            <div className="border-t border-slate-200 mt-2 pt-1 text-[7px] font-bold text-slate-400 uppercase">{block.approvedBy?.title || 'Authorized Seal'}</div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  return null
                })}
              </div>

              {blocks.some(b => b.type === 'footer_image') && (
                <div className="border-t pt-2 mt-4 border-slate-100 text-center">
                  {globalSettings?.footer_image_path ? (
                    <img
                      src={resolveAssetUrl(globalSettings.footer_image_path)}
                      alt="Footer"
                      className="w-full"
                      style={{
                        maxHeight: `${(blocks.find(b => b.type === 'footer_image')?.maxHeight) || 50}px`,
                        objectFit: (blocks.find(b => b.type === 'footer_image')?.objectFit || 'contain') as any
                      }}
                    />
                  ) : (
                    <p className="text-[7px] text-slate-400 font-bold">{globalSettings?.company_name || 'BMS'} | Document generated securely</p>
                  )}
                </div>
              )}
            </div>
            </div>
            </div>
          </div>
          </div>
        </div>
    )
  }

  return (
    <PageLayout title="Document Center" subtitle="Automated contract generation and document lifecycle management">
      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full sm:w-fit mb-8">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${tab === t.key
                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <t.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'templates' && (selectedTemplate || isCreatingTemplate) ? (
        renderWorkstation()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <Upload className="text-indigo-500" size={20} />
              {isTemplate ? 'New Template' : 'Upload Document'}
            </h3>
            <form onSubmit={handleUpload} className="space-y-4">
              {!isTemplate && (
                <div
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 break-all px-2">
                    {uploadFile ? uploadFile.name : 'Click to upload document'}
                  </p>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={isTemplate}
                  onChange={e => setIsTemplate(e.target.checked)}
                  className="rounded text-indigo-600 bg-white"
                />
                <span className="text-sm font-bold">Mark as Contract Template</span>
              </div>

               {isTemplate && (
                <div className="space-y-4 border p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorMode('raw')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        editorMode === 'raw' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Raw JSON Config
                    </button>
                  </div>

                  <textarea
                    placeholder="Paste JSON template configuration..."
                    className="w-full p-4 border rounded-2xl h-40 text-sm font-mono dark:bg-slate-900 dark:text-white"
                    value={templateContent}
                    onChange={e => setTemplateContent(e.target.value)}
                  />

                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center">
                    <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                      Want to visually design this template?
                    </p>
                    <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mb-3">
                      Use the drag-and-drop workstation to arrange blocks, configure properties, and preview the A4 layout in real-time.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('templates')
                        handleCreateTemplate()
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Open Visual Designer →
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Expiry Date</label>
                  <input
                    type="date"
                    value={uploadExpiry}
                    onChange={e => setUploadExpiry(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Module Type</label>
                  <select
                    value={uploadModuleType}
                    onChange={e => setUploadModuleType(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  >
                    {MODULE_TYPES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Module ID <span className="text-red-500">*</span></label>
                  <select
                    value={uploadModuleId}
                    onChange={e => setUploadModuleId(e.target.value)}
                    className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 border-none dark:text-white font-bold text-sm"
                  >
                    <option value="">Select ID</option>
                    {moduleIdOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm sm:text-base"
              >
                {uploading ? 'Processing...' : isTemplate ? 'Save Template' : 'Upload Document'}
              </button>
            </form>
          </div>

          {tab === 'templates' && (
            <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:border-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-indigo-100 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-400">
                <Wand2 size={20} />
                Generate Contract
              </h3>
              <div className="space-y-4">
                <select
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold text-sm"
                  value={genLeaseId}
                  onChange={e => setGenLeaseId(e.target.value)}
                >
                  <option value="">Select Lease</option>
                  {allLeases.map(l => <option key={l.id} value={l.id}>Lease #{l.id.slice(0, 8)}</option>)}
                </select>
                <select
                  className="w-full p-3 border rounded-xl bg-white dark:bg-slate-800 dark:text-white font-bold text-sm"
                  value={genTemplateId}
                  onChange={e => setGenTemplateId(e.target.value)}
                >
                  <option value="">Select Template</option>
                  {docs.filter(d => d.is_template).map(t => <option key={t.id} value={t.id}>{t.file_name}</option>)}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !genLeaseId || !genTemplateId}
                  className="w-full py-3.5 sm:py-4 bg-white dark:bg-slate-800 text-indigo-600 border-2 border-indigo-600 rounded-2xl font-black hover:bg-indigo-50 transition-all disabled:opacity-50 text-sm sm:text-base"
                >
                  {generating ? 'Generating...' : 'Magic Generate'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 text-left">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {tab === 'templates' ? 'Active Templates' : 'Document Library'}
              </h3>
              <div className="flex flex-col xs:flex-row gap-2">
                {tab === 'templates' && (
                  <button
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
                  >
                    + Create Template
                  </button>
                )}
                <input
                  placeholder="Search filename..."
                  className="p-2.5 text-xs bg-slate-50 dark:bg-slate-900 rounded-lg border-none dark:text-white flex-1"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                />
                <select
                  className="p-2.5 text-xs bg-slate-50 dark:bg-slate-900 rounded-lg border-none dark:text-white font-bold"
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {docsLoading ? (
              <div className="py-20 text-center animate-pulse text-indigo-600">Scanning library...</div>
            ) : docs.length === 0 ? (
              <div className="py-20 text-center text-slate-400">No documents found matching criteria.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map(doc => {
                  const expiry = getExpiryStatus(doc.expiry_date)
                  return (
                    <div key={doc.id} onClick={() => doc.is_template && handleSelectTemplate(doc)} className={`group p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all ${doc.is_template ? 'cursor-pointer hover:shadow-sm' : ''}`}>
                      <div className="flex items-start justify-between text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600">
                            {doc.is_template ? <FileJson size={20} /> : <FileText size={20} />}
                          </div>
                          <div>
                            <h4 className="font-bold truncate max-w-[150px]">{doc.file_name}</h4>
                            <p className="text-xs text-slate-500">{doc.category} • v{doc.version}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {expiry && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${expiry.color}`}>
                              {expiry.label}
                            </span>
                          )}
                          <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(doc.id)} className="p-2 bg-white dark:bg-slate-800 text-rose-500 rounded-lg shadow-sm hover:bg-rose-50"><Trash2 size={14} /></button>
                            {doc.module_type === 'tenant' && (
                              <button onClick={() => handlePromoteAndVerify(doc)} className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600 flex items-center gap-2 px-3">
                                <CheckCircle2 size={14} /> Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </PageLayout>
  )
}
