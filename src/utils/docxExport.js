import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, BorderStyle, WidthType, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

const ORANGE = '00FF6B1A'
const GREEN = '002DD08C'
const RED = '00FF3D54'
const YELLOW = '00FFCA3C'
const BLUE = '003D9EFF'

const priorityColor = (p) => {
  if (p === 'Critical') return RED
  if (p === 'High') return ORANGE
  if (p === 'Medium') return YELLOW
  return BLUE
}

const h = (text, level = HeadingLevel.HEADING_1) => new Paragraph({ text, heading: level, spacing: { before: 200, after: 100 } })
const p = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: String(text || '—'), ...opts })], spacing: { after: 80 } })
const label = (text) => new TextRun({ text: text.toUpperCase() + ': ', bold: true, size: 18, color: '8A9BB0' })
const val = (text) => new TextRun({ text: String(text || '—'), size: 18 })

function metaRow(k, v) {
  return new Paragraph({ children: [label(k), val(v)], spacing: { after: 60 } })
}

function sectionHeading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: 'FF6B1A' })],
    spacing: { before: 300, after: 120 },
    border: { bottom: { color: 'FF6B1A', size: 6, style: BorderStyle.SINGLE } },
  })
}

function simpleTable(rows, headers) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ...(headers ? [new TableRow({
        children: headers.map(h => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16, color: '8A9BB0' })] })],
          shading: { fill: '161C23' },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }))
      })] : []),
      ...rows.map(row => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(cell || '—'), size: 16, color: ci === 0 && !headers ? '8A9BB0' : 'E8EDF2' })] })],
          shading: { fill: '0F1318' },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }))
      }))
    ]
  })
}

export async function exportToDocx(data) {
  const sections = []

  // Cover / meta
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'GREEN ROOM ENERGY', bold: true, size: 48, color: 'FF6B1A' })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Off-Grid Solar Site Assessment', size: 28, color: 'E8EDF2' })],
      spacing: { after: 300 },
    }),
    metaRow('Site', data.site.name),
    metaRow('Address', data.site.address),
    metaRow('Date', data.site.date),
    metaRow('Prepared By', data.site.preparedBy),
    metaRow('Client', data.site.client),
    metaRow('Phone', data.site.phone),
    metaRow('Email', data.site.email),
  )

  // System Overview
  sections.push(sectionHeading('System Overview'))
  sections.push(simpleTable([
    ['Inverter Make', data.inverter.make, 'Inverter Model', data.inverter.model],
    ['Rated kW', data.inverter.kw, 'Serial No.', data.inverter.serial],
    ['Battery Chemistry', data.battery.chemistry, 'Battery Make/Model', `${data.battery.make} ${data.battery.model}`.trim()],
    ['Battery Voltage', data.battery.voltage ? data.battery.voltage+'V' : '', 'Capacity', data.battery.ah ? data.battery.ah+'Ah' : ''],
    ['Solar Panels', data.solar.panels, 'Panel Wattage', data.solar.wattage ? data.solar.wattage+'W' : ''],
    ['Total kWp', data.solar.kwp, 'Orientation', data.solar.orientation],
    ['Generator Make', data.generator.make, 'Generator kVA', data.generator.kva],
    ['Fuel Type', data.generator.fuel, 'Hours on Meter', data.generator.hours],
  ]))

  // Issues
  sections.push(sectionHeading('Issues Register'))
  if (data.issues.length === 0) {
    sections.push(p('No issues recorded.'))
  } else {
    sections.push(simpleTable(
      data.issues.map(i => [i.id, i.priority, i.area, i.description, i.fix || '—']),
      ['ID', 'Priority', 'Area', 'Description', 'Fix']
    ))
  }

  // Remediation Plan
  sections.push(sectionHeading('Remediation Plan'))
  const phases = [
    { label: 'Phase 1 — Immediate (Critical)', items: data.issues.filter(i=>i.priority==='Critical') },
    { label: 'Phase 2 — Short Term (High)', items: data.issues.filter(i=>i.priority==='High') },
    { label: 'Phase 3 — Scheduled (Medium/Low)', items: [...data.issues.filter(i=>i.priority==='Medium'), ...data.issues.filter(i=>i.priority==='Low')] },
  ]
  phases.forEach(phase => {
    sections.push(new Paragraph({ children: [new TextRun({ text: phase.label, bold: true, size: 22, color: 'FF6B1A' })], spacing: { before: 160, after: 80 } }))
    if (phase.items.length === 0) {
      sections.push(p('No issues at this priority level.', { color: '8A9BB0' }))
    } else {
      phase.items.forEach(i => {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `${i.id} — ${i.description}`, size: 18 })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }))
        if (i.fix) sections.push(new Paragraph({
          children: [new TextRun({ text: `→ ${i.fix}`, size: 16, color: '8A9BB0' })],
          bullet: { level: 1 },
          spacing: { after: 40 },
        }))
      })
    }
  })
  if (data.remediation.notes) {
    sections.push(new Paragraph({ children: [new TextRun({ text: 'Additional Notes', bold: true, size: 20 })], spacing: { before: 120, after: 60 } }))
    sections.push(p(data.remediation.notes))
  }

  // Expected Outcomes
  sections.push(sectionHeading('Expected Outcomes'))
  sections.push(simpleTable(
    data.outcomes.map(o => [o.metric, o.current || '—', o.proposed || '—']),
    ['Metric', 'Current', 'Proposed']
  ))

  // Dashboard Integration
  sections.push(sectionHeading('Dashboard Integration'))
  sections.push(simpleTable([
    ['MQTT Broker', data.dashboard.mqtt],
    ['Remote Access URL', data.dashboard.url],
    ['Solar Assistant Version', data.dashboard.saVersion],
    ['ESP32 Nodes', data.dashboard.esp32Nodes],
    ['Integration Scope', data.dashboard.scope],
  ]))
  if (data.dashboard.notes) sections.push(p(data.dashboard.notes))

  const doc = new Document({ sections: [{ children: sections }] })
  const blob = await Packer.toBlob(doc)
  const filename = `GR-Assessment-${(data.site.name||'Site').replace(/\s+/g,'-')}-${data.site.date||'date'}.docx`
  saveAs(blob, filename)
}
