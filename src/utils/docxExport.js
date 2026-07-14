import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle } from 'docx'
import { TableLayoutType } from 'docx'
import { saveAs } from 'file-saver'

// A4 minus margins = 10440 twips. Label=3000, Value=7440
const COL1 = 3000
const COL2 = 7440
const b = { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' }
const allB = { top: b, bottom: b, left: b, right: b }

const cell = (text, isLabel = false, extra = {}) => new TableCell({
  width: { size: isLabel ? COL1 : COL2, type: WidthType.DXA },
  borders: allB,
  shading: isLabel ? { fill: 'F5F5F5' } : { fill: 'FFFFFF' },
  margins: { top: 100, bottom: 100, left: 150, right: 150 },
  children: [new Paragraph({
    children: [new TextRun({
      text: String(text || '—'),
      size: isLabel ? 18 : 20,
      font: 'Calibri',
      bold: isLabel,
      color: isLabel ? '666666' : '222222',
      ...extra,
    })]
  })]
})

const hdrCell = (text) => new TableCell({
  width: { size: [COL1, COL2, COL2, COL2, COL2][0] || 2088, type: WidthType.DXA },
  borders: allB,
  shading: { fill: 'FF6B1A' },
  margins: { top: 100, bottom: 100, left: 150, right: 150 },
  children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: 'Calibri', bold: true, color: 'FFFFFF' })] })]
})

function twoCol(rows) {
  return new Table({
    width: { size: 10440, type: WidthType.DXA },
    layout: TableLayoutType.FIXED, rows: rows.map(([l, v]) => new TableRow({ children: [cell(l, true), cell(v)] }))
  })
}

function heading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: 'FF6B1A', font: 'Calibri' })],
    spacing: { before: 400, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'FF6B1A' } },
  })
}

function subheading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: '333333', font: 'Calibri' })],
    spacing: { before: 240, after: 100 },
  })
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: String(text || ''), size: 20, font: 'Calibri', ...opts })],
    spacing: { after: 80 },
  })
}

function priorityColor(p) {
  if (p === 'Critical') return 'CC0000'
  if (p === 'High') return 'DD5500'
  if (p === 'Medium') return '997700'
  return '0055AA'
}

function issuesTable(issues) {
  const W = [1200, 1200, 1600, 3720, 2720]
  const headers = ['ID', 'Priority', 'Area', 'Description', 'Fix']
  const hRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      width: { size: W[i], type: WidthType.DXA },
      borders: allB,
      shading: { fill: 'FF6B1A' },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, size: 18, font: 'Calibri', bold: true, color: 'FFFFFF' })] })]
    }))
  })
  const dRows = issues.map(iss => new TableRow({
    children: [iss.id, iss.priority, iss.area, iss.description, iss.fix || '—'].map((v, i) =>
      new TableCell({
        width: { size: W[i], type: WidthType.DXA },
        borders: allB,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({
          text: String(v || '—'), size: 18, font: 'Calibri',
          color: i === 1 ? priorityColor(iss.priority) : '222222',
          bold: i === 1,
        })] })]
      })
    )
  }))
  return new Table({ width: { size: 10440, type: WidthType.DXA }, rows: [hRow, ...dRows] })
}

function outcomesTable(outcomes) {
  const W = [4000, 3220, 3220]
  const hRow = new TableRow({
    children: ['Metric', 'Current', 'Proposed'].map((h, i) => new TableCell({
      width: { size: W[i], type: WidthType.DXA },
      borders: allB,
      shading: { fill: 'FF6B1A' },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, size: 18, font: 'Calibri', bold: true, color: 'FFFFFF' })] })]
    }))
  })
  const dRows = outcomes.map(o => new TableRow({
    children: [
      new TableCell({ width: { size: W[0], type: WidthType.DXA }, borders: allB, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: o.metric || '—', size: 18, font: 'Calibri' })] })] }),
      new TableCell({ width: { size: W[1], type: WidthType.DXA }, borders: allB, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: o.current || '—', size: 18, font: 'Calibri' })] })] }),
      new TableCell({ width: { size: W[2], type: WidthType.DXA }, borders: allB, shading: { fill: 'EAFAF3' }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: o.proposed || '—', size: 18, font: 'Calibri', bold: true, color: '1a7a52' })] })] }),
    ]
  }))
  return new Table({ width: { size: 10440, type: WidthType.DXA }, rows: [hRow, ...dRows] })
}

export async function exportToDocx(data) {
  const ch = []

  // Cover
  ch.push(
    new Paragraph({ children: [new TextRun({ text: 'GREEN ROOM ENERGY', bold: true, size: 64, color: 'FF6B1A', font: 'Calibri' })], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: 'Off-Grid Solar Site Assessment Report', size: 28, color: '888888', font: 'Calibri' })], spacing: { after: 500 } }),
  )

  ch.push(heading('Site Details'))
  ch.push(twoCol([
    ['Site / Property', data.site.name],
    ['Address', data.site.address],
    ['Date', data.site.date],
    ['Prepared By', data.site.preparedBy],
    ['Client', data.site.client],
    ['Phone', data.site.phone],
    ['Email', data.site.email],
  ]))

  ch.push(heading('System Overview'))
  ch.push(subheading('Inverter / Charger'))
  ch.push(twoCol([
    ['Make', data.inverter.make], ['Model', data.inverter.model],
    ['Rated kW', data.inverter.kw], ['Serial No.', data.inverter.serial],
    ['Firmware', data.inverter.firmware],
  ]))
  ch.push(subheading('Battery Bank'))
  ch.push(twoCol([
    ['Chemistry', data.battery.chemistry], ['Make', data.battery.make],
    ['Model', data.battery.model], ['Voltage', data.battery.voltage ? data.battery.voltage+'V' : ''],
    ['Capacity', data.battery.ah ? data.battery.ah+'Ah' : ''], ['Configuration', data.battery.config],
    ['Age', data.battery.age ? data.battery.age+' years' : ''],
  ]))
  ch.push(subheading('Solar Array'))
  ch.push(twoCol([
    ['No. of Panels', data.solar.panels], ['Panel Wattage', data.solar.wattage ? data.solar.wattage+'W' : ''],
    ['No. of Strings', data.solar.strings], ['Total kWp', data.solar.kwp],
    ['Orientation', data.solar.orientation], ['Age', data.solar.age ? data.solar.age+' years' : ''],
    ['Shading', data.solar.shading],
  ]))
  ch.push(subheading('Generator'))
  ch.push(twoCol([
    ['Make', data.generator.make], ['Model', data.generator.model],
    ['Rated kVA', data.generator.kva], ['Fuel Type', data.generator.fuel],
    ['Hours on Meter', data.generator.hours], ['Last Service', data.generator.lastService],
  ]))

  ch.push(heading('Issues Register'))
  if (data.issues.length === 0) {
    ch.push(para('No issues recorded.', { color: '999999' }))
  } else {
    ch.push(issuesTable(data.issues))
  }

  ch.push(heading('Remediation Plan'))
  const phases = [
    { label: 'Phase 1 — Immediate (Critical)', items: data.issues.filter(i=>i.priority==='Critical') },
    { label: 'Phase 2 — Short Term (High)', items: data.issues.filter(i=>i.priority==='High') },
    { label: 'Phase 3 — Scheduled (Medium / Low)', items: [...data.issues.filter(i=>i.priority==='Medium'), ...data.issues.filter(i=>i.priority==='Low')] },
  ]
  phases.forEach(phase => {
    ch.push(subheading(phase.label))
    if (phase.items.length === 0) {
      ch.push(para('No issues at this priority level.', { color: '999999' }))
    } else {
      phase.items.forEach(i => {
        ch.push(new Paragraph({ children: [new TextRun({ text: `${i.id} — ${i.description}`, size: 20, font: 'Calibri' })], bullet: { level: 0 }, spacing: { after: 60 } }))
        if (i.fix) ch.push(new Paragraph({ children: [new TextRun({ text: `Fix: ${i.fix}`, size: 18, font: 'Calibri', color: '666666' })], bullet: { level: 1 }, spacing: { after: 60 } }))
        if (i.grSolution) ch.push(new Paragraph({ children: [new TextRun({ text: `GR Solution: ${i.grSolution}`, size: 18, font: 'Calibri', color: '1a7a52' })], bullet: { level: 1 }, spacing: { after: 60 } }))
      })
    }
  })
  if (data.remediation.notes) { ch.push(subheading('Additional Notes')); ch.push(para(data.remediation.notes)) }
  if (data.remediation.timeline) ch.push(para('Estimated Timeline: ' + data.remediation.timeline, { bold: true }))

  ch.push(heading('Expected Outcomes'))
  ch.push(outcomesTable(data.outcomes))

  ch.push(heading('Dashboard Integration'))
  ch.push(twoCol([
    ['MQTT Broker', data.dashboard.mqtt], ['Remote Access URL', data.dashboard.url],
    ['Solar Assistant Version', data.dashboard.saVersion], ['ESP32 Nodes', data.dashboard.esp32Nodes],
    ['Integration Scope', data.dashboard.scope],
  ]))
  if (data.dashboard.notes) ch.push(para(data.dashboard.notes))

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: ch,
    }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `GR-Assessment-${(data.site.name||'Site').replace(/\s+/g,'-')}-${data.site.date||'date'}.docx`)
}
