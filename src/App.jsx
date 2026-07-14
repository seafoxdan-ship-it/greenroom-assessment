import { useState, useEffect, useCallback } from 'react'

// ── Constants ─────────────────────────────────────────────
const AREAS = ['Inverter','Battery','Solar Array','Generator','Wiring','Distribution','Monitoring','Structure','Other']
const PRIORITIES = ['Critical','High','Medium','Low']
const PAIN_POINTS = [
  'Generator running too much','High fuel costs','Battery not lasting overnight',
  'System shutting down unexpectedly','No visibility / monitoring','Power outages affecting operations',
  'Equipment not running properly','Solar not producing enough','Batteries ageing / not holding charge',
  'No remote access or alerts'
]
const SECTIONS = ['Site Details','System Overview','Issues Register','Photo Documentation','Remediation Plan','Expected Outcomes','Dashboard Integration']
const TODAY = new Date().toISOString().slice(0,10)

const INIT = {
  site: { name:'', address:'', date:TODAY, preparedBy:'', client:'', phone:'', email:'' },
  inverter: { make:'', model:'', kw:'', serial:'', firmware:'' },
  battery: { chemistry:'LiFePO4', make:'', model:'', voltage:'', ah:'', config:'', age:'' },
  solar: { panels:'', wattage:'', strings:'', kwp:'', orientation:'', age:'', shading:'None' },
  generator: { make:'', model:'', kva:'', fuel:'Diesel', hours:'', lastService:'' },
  issues: [],
  photos: [],
  remediation: { notes:'', timeline:'' },
  outcomes: [
    { metric:'Generator Runtime', current:'', proposed:'' },
    { metric:'Fuel Cost / Month', current:'', proposed:'' },
    { metric:'Battery Autonomy', current:'', proposed:'' },
    { metric:'Solar Utilisation', current:'', proposed:'' },
    { metric:'System Uptime', current:'', proposed:'' },
    { metric:'Remote Monitoring', current:'None', proposed:'Full visibility' },
  ],
  dashboard: { mqtt:'', url:'', saVersion:'', esp32Nodes:'', scope:'', notes:'' },
}

// ── Utilities ─────────────────────────────────────────────
function deepSet(obj, path, value) {
  const keys = path.split('.')
  const result = structuredClone(obj)
  let cur = result
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
  cur[keys[keys.length - 1]] = value
  return result
}

// ── Shared field components ───────────────────────────────
const F = ({ label, path, data, patch, type='text', options, rows }) => {
  const keys = path.split('.')
  let val = data
  for (const k of keys) val = val?.[k] ?? ''
  const onChange = e => patch(path, e.target.value)
  return (
    <div className="field">
      <label>{label}</label>
      {options ? (
        <select value={val} onChange={onChange}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : rows ? (
        <textarea rows={rows} value={val} onChange={onChange} />
      ) : (
        <input type={type} value={val} onChange={onChange} />
      )}
    </div>
  )
}

const Badge = ({ priority }) => (
  <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
)

const Divider = () => <div className="divider" />
const Empty = ({ msg }) => <div className="empty">{msg}</div>

// ── Section: Site Details ─────────────────────────────────
function SiteDetails({ data, patch }) {
  return (
    <>
      <h2 className="section-heading">📋 Site Details</h2>
      <div className="card">
        <div className="grid-2">
          <F label="Site / Property Name" path="site.name" data={data} patch={patch} />
          <F label="Date" path="site.date" data={data} patch={patch} type="date" />
          <F label="Client Name" path="site.client" data={data} patch={patch} />
          <F label="Prepared By" path="site.preparedBy" data={data} patch={patch} />
          <F label="Phone" path="site.phone" data={data} patch={patch} type="tel" />
          <F label="Email" path="site.email" data={data} patch={patch} type="email" />
        </div>
        <div style={{marginTop:12}}>
          <F label="Address" path="site.address" data={data} patch={patch} />
        </div>
      </div>
    </>
  )
}

// ── Section: System Overview ──────────────────────────────
function SystemOverview({ data, patch }) {
  return (
    <>
      <h2 className="section-heading">⚡ System Overview</h2>
      <div className="card">
        <div className="card-title">🔋 Inverter / Charger</div>
        <div className="grid-3">
          <F label="Make" path="inverter.make" data={data} patch={patch} />
          <F label="Model" path="inverter.model" data={data} patch={patch} />
          <F label="Rated kW" path="inverter.kw" data={data} patch={patch} />
          <F label="Serial No." path="inverter.serial" data={data} patch={patch} />
          <F label="Firmware" path="inverter.firmware" data={data} patch={patch} />
        </div>
      </div>
      <div className="card">
        <div className="card-title">🔋 Battery Bank</div>
        <div className="grid-3">
          <F label="Chemistry" path="battery.chemistry" data={data} patch={patch} options={['LiFePO4','AGM','Gel','Flooded Lead Acid','NMC']} />
          <F label="Make" path="battery.make" data={data} patch={patch} />
          <F label="Model" path="battery.model" data={data} patch={patch} />
          <F label="Voltage (V)" path="battery.voltage" data={data} patch={patch} />
          <F label="Capacity (Ah)" path="battery.ah" data={data} patch={patch} />
          <F label="Configuration" path="battery.config" data={data} patch={patch} />
          <F label="Age (years)" path="battery.age" data={data} patch={patch} />
        </div>
      </div>
      <div className="card">
        <div className="card-title">☀️ Solar Array</div>
        <div className="grid-3">
          <F label="No. of Panels" path="solar.panels" data={data} patch={patch} />
          <F label="Panel Wattage (W)" path="solar.wattage" data={data} patch={patch} />
          <F label="No. of Strings" path="solar.strings" data={data} patch={patch} />
          <F label="Total kWp" path="solar.kwp" data={data} patch={patch} />
          <F label="Orientation" path="solar.orientation" data={data} patch={patch} options={['North','NE','NW','East','West','N/E/W Split','Other']} />
          <F label="Age (years)" path="solar.age" data={data} patch={patch} />
          <F label="Shading" path="solar.shading" data={data} patch={patch} options={['None','Minor','Moderate','Severe']} />
        </div>
      </div>
      <div className="card">
        <div className="card-title">⛽ Generator</div>
        <div className="grid-3">
          <F label="Make" path="generator.make" data={data} patch={patch} />
          <F label="Model" path="generator.model" data={data} patch={patch} />
          <F label="Rated kVA" path="generator.kva" data={data} patch={patch} />
          <F label="Fuel Type" path="generator.fuel" data={data} patch={patch} options={['Diesel','Petrol','LPG','Natural Gas']} />
          <F label="Hours on Meter" path="generator.hours" data={data} patch={patch} />
          <F label="Last Service" path="generator.lastService" data={data} patch={patch} type="date" />
        </div>
      </div>
    </>
  )
}

// ── Section: Issues Register ──────────────────────────────
function IssuesRegister({ data, setData }) {
  const [filter, setFilter] = useState('All')
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ priority:'High', area:'Inverter', description:'', fix:'', grSolution:'' })

  const issues = data.issues
  const counts = PRIORITIES.reduce((a,p) => ({ ...a, [p]: issues.filter(i=>i.priority===p).length }), {})
  const filtered = filter === 'All' ? issues : issues.filter(i => i.priority === filter)

  const resetForm = () => setForm({ priority:'High', area:'Inverter', description:'', fix:'', grSolution:'' })

  const addIssue = () => {
    if (!form.description.trim()) return
    const id = `ISS-${String(issues.length + 1).padStart(3,'0')}`
    setData(d => ({ ...d, issues: [...d.issues, { ...form, id }] }))
    resetForm()
  }

  const deleteIssue = (id) => setData(d => ({ ...d, issues: d.issues.filter(i=>i.id!==id) }))

  const saveEdit = () => {
    setData(d => ({ ...d, issues: d.issues.map(i => i.id===editId ? { ...form, id: editId } : i) }))
    setEditId(null)
    resetForm()
  }

  const startEdit = (issue) => {
    setEditId(issue.id)
    setForm({ priority: issue.priority, area: issue.area, description: issue.description, fix: issue.fix || '', grSolution: issue.grSolution || '' })
  }

  const sf = (k,v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <h2 className="section-heading">⚠️ Issues Register</h2>
      <div className="card">
        <div className="stats-bar">
          {['All',...PRIORITIES].map(p => {
            const count = p==='All' ? issues.length : counts[p]
            const cls = p==='All' ? '' : `badge-${p.toLowerCase()}`
            return (
              <div key={p} className={`stat-chip ${cls} ${filter===p?'active':''}`} onClick={()=>setFilter(p)}>
                <span>{p}</span><strong>{count}</strong>
              </div>
            )
          })}
        </div>

        <div className="card" style={{background:'var(--surface2)'}}>
          <div className="card-title">+ {editId ? 'Edit' : 'Add'} Issue</div>
          <div className="grid-2" style={{marginBottom:8}}>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={e=>sf('priority',e.target.value)}>
                {PRIORITIES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Area</label>
              <select value={form.area} onChange={e=>sf('area',e.target.value)}>
                {AREAS.map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{marginBottom:8}}>
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={e=>sf('description',e.target.value)} placeholder="What is the issue?" />
          </div>
          <div className="field" style={{marginBottom:8}}>
            <label>Recommended Fix</label>
            <textarea rows={2} value={form.fix} onChange={e=>sf('fix',e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div className="field" style={{marginBottom:12}}>
            <label>Green Room Solution</label>
            <textarea rows={2} value={form.grSolution} onChange={e=>sf('grSolution',e.target.value)} placeholder="How GR Energy solves this..." />
          </div>
          <div style={{display:'flex',gap:8}}>
            {editId ? (
              <>
                <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
                <button className="btn btn-ghost" onClick={()=>{setEditId(null);resetForm()}}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={addIssue}>Add Issue</button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? <Empty msg="No issues recorded yet" /> : filtered.map(issue => (
          <div key={issue.id} className={`issue-card ${issue.priority.toLowerCase()}`}>
            <div className="issue-header">
              <span className="issue-id">{issue.id}</span>
              <Badge priority={issue.priority} />
              <span style={{fontSize:12,color:'var(--text2)'}}>{issue.area}</span>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>startEdit(issue)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={()=>deleteIssue(issue.id)}>Delete</button>
              </div>
            </div>
            <div style={{fontSize:14,marginBottom:6}}>{issue.description}</div>
            {issue.fix && <div style={{fontSize:13,color:'var(--text2)',marginBottom:4}}>🔧 {issue.fix}</div>}
            {issue.grSolution && <div style={{fontSize:13,color:'var(--green)'}}>✅ {issue.grSolution}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Section: Photo Documentation ──────────────────────────
function PhotoCapture({ data, setData }) {
  const addPhoto = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setData(d => ({ ...d, photos: [...d.photos, { id: Date.now()+Math.random(), src: ev.target.result, caption:'', area:'General' }] }))
      }
      reader.readAsDataURL(file)
    })
  }

  const updatePhoto = (id, key, val) => {
    setData(d => ({ ...d, photos: d.photos.map(p => p.id===id ? { ...p, [key]: val } : p) }))
  }

  const removePhoto = (id) => setData(d => ({ ...d, photos: d.photos.filter(p => p.id !== id) }))

  return (
    <>
      <h2 className="section-heading">📷 Photo Documentation</h2>
      <div className="card">
        <label className="btn btn-secondary" style={{cursor:'pointer',display:'inline-flex'}}>
          📷 Add Photos
          <input type="file" accept="image/*" multiple capture="environment" style={{display:'none'}} onChange={addPhoto} />
        </label>
        {data.photos.length === 0 ? <Empty msg="No photos added yet — tap to capture or select from gallery" /> : (
          <div className="photo-grid">
            {data.photos.map(photo => (
              <div key={photo.id} className="photo-item">
                <img src={photo.src} alt={photo.caption} />
                <input
                  type="text"
                  value={photo.caption}
                  onChange={e => updatePhoto(photo.id, 'caption', e.target.value)}
                  placeholder="Caption..."
                  style={{marginTop:4,fontSize:12}}
                />
                <select value={photo.area} onChange={e => updatePhoto(photo.id, 'area', e.target.value)} style={{marginTop:4,fontSize:12}}>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
                <button className="btn btn-danger btn-sm" style={{marginTop:4,width:'100%'}} onClick={()=>removePhoto(photo.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Section: Remediation Plan ─────────────────────────────
function RemediationPlan({ data, patch }) {
  const byPriority = (p) => data.issues.filter(i => i.priority === p)
  const phases = [
    { label:'Phase 1 — Immediate (Critical)', cls:'phase-1', items: byPriority('Critical') },
    { label:'Phase 2 — Short Term (High)', cls:'phase-2', items: byPriority('High') },
    { label:'Phase 3 — Scheduled (Medium / Low)', cls:'phase-3', items: [...byPriority('Medium'), ...byPriority('Low')] },
  ]
  return (
    <>
      <h2 className="section-heading">🛠 Remediation Plan</h2>
      <div className="card">
        {phases.map(phase => (
          <div key={phase.label} className={`phase-card ${phase.cls}`}>
            <div className="phase-title">{phase.label}</div>
            {phase.items.length === 0
              ? <div style={{fontSize:13,color:'var(--text3)'}}>No issues at this priority level</div>
              : phase.items.map(issue => (
                <div key={issue.id} style={{marginBottom:8,fontSize:14}}>
                  <strong>{issue.id}</strong> — {issue.description}
                  {issue.fix && <div style={{fontSize:13,color:'var(--text2)',marginLeft:8}}>→ {issue.fix}</div>}
                </div>
              ))
            }
          </div>
        ))}
        <Divider />
        <F label="Additional Notes" path="remediation.notes" data={data} patch={patch} rows={3} />
        <div style={{marginTop:8}}>
          <F label="Estimated Timeline" path="remediation.timeline" data={data} patch={patch} />
        </div>
      </div>
    </>
  )
}

// ── Section: Expected Outcomes ────────────────────────────
function ExpectedOutcomes({ data, setData }) {
  const update = (i, key, val) => {
    setData(d => {
      const outcomes = [...d.outcomes]
      outcomes[i] = { ...outcomes[i], [key]: val }
      return { ...d, outcomes }
    })
  }
  const addRow = () => setData(d => ({ ...d, outcomes: [...d.outcomes, { metric:'', current:'', proposed:'' }] }))

  return (
    <>
      <h2 className="section-heading">📈 Expected Outcomes</h2>
      <div className="card">
        <table className="outcomes-table">
          <thead>
            <tr>
              <th>Metric</th><th>Current</th><th>Proposed</th>
            </tr>
          </thead>
          <tbody>
            {data.outcomes.map((row, i) => (
              <tr key={i}>
                <td><input type="text" value={row.metric} onChange={e=>update(i,'metric',e.target.value)} /></td>
                <td><input type="text" value={row.current} onChange={e=>update(i,'current',e.target.value)} /></td>
                <td><input type="text" className="proposed" value={row.proposed} onChange={e=>update(i,'proposed',e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost btn-sm" style={{marginTop:12}} onClick={addRow}>+ Add Row</button>
      </div>
    </>
  )
}

// ── Section: Dashboard Integration ───────────────────────
function DashboardIntegration({ data, patch }) {
  return (
    <>
      <h2 className="section-heading">📡 Dashboard Integration</h2>
      <div className="card">
        <div className="grid-2">
          <F label="MQTT Broker" path="dashboard.mqtt" data={data} patch={patch} />
          <F label="Remote Access URL" path="dashboard.url" data={data} patch={patch} />
          <F label="Solar Assistant Version" path="dashboard.saVersion" data={data} patch={patch} />
          <F label="ESP32 Nodes" path="dashboard.esp32Nodes" data={data} patch={patch} />
        </div>
        <div style={{marginTop:8}}>
          <F label="Integration Scope" path="dashboard.scope" data={data} patch={patch} />
        </div>
        <div style={{marginTop:8}}>
          <F label="Notes" path="dashboard.notes" data={data} patch={patch} rows={3} />
        </div>
      </div>
    </>
  )
}

// ── Export Modal ──────────────────────────────────────────
function ExportModal({ data, onClose }) {
  const [status, setStatus] = useState('')

  const exportPDF = async () => {
    setStatus('Generating PDF...')
    try {
      const { exportToPDF } = await import('./utils/pdfExport.js')
      await exportToPDF(data)
      setStatus('PDF downloaded!')
    } catch(e) { setStatus('PDF error: ' + e.message) }
  }

  const exportDocx = async () => {
    setStatus('Generating DOCX...')
    try {
      const { exportToDocx } = await import('./utils/docxExport.js')
      await exportToDocx(data)
      setStatus('DOCX downloaded!')
    } catch(e) { setStatus('DOCX error: ' + e.message) }
  }

  const saveDrive = async () => {
    setStatus('Saving to Google Drive...')
    try {
      const { saveToDrive } = await import('./utils/driveApi.js')
      await saveToDrive(data)
      setStatus('Saved to Google Drive!')
    } catch(e) { setStatus('Drive error: ' + e.message) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Export Assessment</h2>
        {status && <div style={{marginBottom:12,fontSize:13,color:'var(--green)'}}>{status}</div>}
        <div className="export-options">
          <button className="export-btn" onClick={exportPDF}>
            <span className="export-btn-icon">📄</span>
            <div className="export-btn-text">
              <strong>PDF Report</strong>
              <span>Branded report for client</span>
            </div>
          </button>
          <button className="export-btn" onClick={exportDocx}>
            <span className="export-btn-icon">📝</span>
            <div className="export-btn-text">
              <strong>Word Document</strong>
              <span>Editable .docx file</span>
            </div>
          </button>
          <button className="export-btn" onClick={saveDrive}>
            <span className="export-btn-icon">☁️</span>
            <div className="export-btn-text">
              <strong>Save to Google Drive</strong>
              <span>Sync assessment data</span>
            </div>
          </button>
        </div>
        <button className="btn btn-ghost" style={{marginTop:16,width:'100%'}} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

// ── Client Questionnaire ──────────────────────────────────
function ClientQuestionnaire() {
  const [form, setForm] = useState({
    painPoints:[], generatorHrs:'', fuelCost:'', systemAge:'', location:'', name:'', phone:'', email:'', notes:''
  })
  const [submitted, setSubmitted] = useState(false)

  const togglePain = (p) => setForm(f => ({
    ...f,
    painPoints: f.painPoints.includes(p) ? f.painPoints.filter(x=>x!==p) : [...f.painPoints, p]
  }))

  const submit = async () => {
    if (!form.name || !form.phone) { alert('Please enter your name and phone number'); return }
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="mode-screen">
      <div className="mode-logo">
        <div style={{fontSize:48,marginBottom:16}}>✅</div>
        <h1>Thank <span>You!</span></h1>
        <p>Your information has been received. A Green Room Energy technician will be in touch shortly.</p>
      </div>
    </div>
  )

  return (
    <div className="app" style={{paddingTop:24}}>
      <h2 className="section-heading">🌿 Tell Us About Your System</h2>
      <div className="card">
        <div className="card-title">What problems are you experiencing?</div>
        <div className="pain-points-grid">
          {PAIN_POINTS.map(p => (
            <label key={p} className={`pain-option ${form.painPoints.includes(p)?'selected':''}`}>
              <input type="checkbox" checked={form.painPoints.includes(p)} onChange={()=>togglePain(p)} />
              {form.painPoints.includes(p) ? '✓ ' : ''}{p}
            </label>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title">System Information</div>
        <div className="grid-2">
          <div className="field">
            <label>Generator hrs/day</label>
            <input type="number" value={form.generatorHrs} onChange={e=>setForm(f=>({...f,generatorHrs:e.target.value}))} />
          </div>
          <div className="field">
            <label>Fuel cost/month ($)</label>
            <input type="number" value={form.fuelCost} onChange={e=>setForm(f=>({...f,fuelCost:e.target.value}))} />
          </div>
          <div className="field">
            <label>System age</label>
            <select value={form.systemAge} onChange={e=>setForm(f=>({...f,systemAge:e.target.value}))}>
              <option value="">Select...</option>
              {['Less than 1 year','1–3 years','3–5 years','5–10 years','10+ years'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Location / Property</label>
            <input type="text" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Your Contact Details</div>
        <div className="grid-2">
          <div className="field">
            <label>Name *</label>
            <input type="text" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          </div>
          <div className="field">
            <label>Phone *</label>
            <input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          </div>
        </div>
        <div className="field" style={{marginTop:8}}>
          <label>Additional Notes</label>
          <textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        </div>
      </div>
      <button className="btn btn-primary" style={{width:'100%',padding:'14px',fontSize:16}} onClick={submit}>
        Submit Enquiry
      </button>
    </div>
  )
}

// ── Mode Select ───────────────────────────────────────────
function ModeSelect({ onSelect }) {
  return (
    <div className="mode-screen">
      <div className="mode-logo">
        <svg width="60" height="60" viewBox="0 0 60 60" style={{marginBottom:12}}>
          <polygon points="30,4 54,17 54,43 30,56 6,43 6,17" fill="#ff6b1a" opacity="0.15" stroke="#ff6b1a" strokeWidth="1.5"/>
          <text x="30" y="38" textAnchor="middle" fill="#ff6b1a" fontSize="22" fontWeight="700" fontFamily="sans-serif">G</text>
        </svg>
        <h1>Green Room <span>Energy</span></h1>
        <p>Off-Grid Solar Site Assessment</p>
      </div>
      <div className="mode-cards">
        <div className="mode-card" onClick={()=>onSelect('tech')}>
          <div className="icon">🔧</div>
          <h2>Technician</h2>
          <p>Full site assessment & documentation</p>
        </div>
        <div className="mode-card" onClick={()=>onSelect('client')}>
          <div className="icon">🌿</div>
          <h2>Client</h2>
          <p>Quick enquiry & pain point survey</p>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────
const STORAGE_KEY = 'gr-assessment-v1'

export default function App() {
  const [mode, setMode] = useState(null)
  const [section, setSection] = useState(0)
  const [data, setData] = useState(INIT)
  const [showExport, setShowExport] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setData(JSON.parse(saved))
    } catch(e) {}
  }, [])

  // Auto-save
  useEffect(() => {
    if (mode !== 'tech') return
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(''), 2000)
      } catch(e) {}
    }, 1000)
    return () => clearTimeout(timer)
  }, [data, mode])

  const patch = useCallback((path, value) => {
    setData(d => deepSet(d, path, value))
  }, [])

  const hasData = data.site.name || data.issues.length > 0

  const renderSection = () => {
    switch(section) {
      case 0: return <SiteDetails data={data} patch={patch} />
      case 1: return <SystemOverview data={data} patch={patch} />
      case 2: return <IssuesRegister data={data} setData={setData} />
      case 3: return <PhotoCapture data={data} setData={setData} />
      case 4: return <RemediationPlan data={data} patch={patch} />
      case 5: return <ExpectedOutcomes data={data} setData={setData} />
      case 6: return <DashboardIntegration data={data} patch={patch} />
      default: return null
    }
  }

  if (!mode) return <ModeSelect onSelect={setMode} />
  if (mode === 'client') return <ClientQuestionnaire />

  return (
    <>
      <div className="header">
        <div className="header-logo">
          <svg width="32" height="32" viewBox="0 0 60 60">
            <polygon points="30,4 54,17 54,43 30,56 6,43 6,17" fill="#ff6b1a" opacity="0.2" stroke="#ff6b1a" strokeWidth="1.5"/>
            <text x="30" y="38" textAnchor="middle" fill="#ff6b1a" fontSize="20" fontWeight="700" fontFamily="sans-serif">G</text>
          </svg>
          <span className="header-title">Green Room <span>Energy</span></span>
        </div>
        <div className="header-actions">
          <span className={`save-indicator ${saveStatus}`}>{saveStatus === 'saved' ? '✓ Saved' : '●'}</span>
          <button className="btn btn-secondary btn-sm" onClick={()=>setMode(null)}>← Back</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowExport(true)}>Export</button>
        </div>
      </div>

      <div className="app">
        <nav className="section-nav">
          {SECTIONS.map((s,i) => (
            <button key={s} className={`nav-btn ${section===i?'active':''}`} onClick={()=>setSection(i)}>
              {s}
            </button>
          ))}
        </nav>

        {renderSection()}

        <div style={{display:'flex',justifyContent:'space-between',marginTop:24,gap:8}}>
          {section > 0 && <button className="btn btn-ghost" onClick={()=>setSection(s=>s-1)}>← Previous</button>}
          {section < SECTIONS.length-1 && <button className="btn btn-primary" style={{marginLeft:'auto'}} onClick={()=>setSection(s=>s+1)}>Next →</button>}
        </div>
      </div>

      {showExport && <ExportModal data={data} onClose={()=>setShowExport(false)} />}
    </>
  )
}
