import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

const border = { style: BorderStyle.SINGLE, size: 1, color: '2a3540' }
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'ffffff' }
const allBorders = { top: border, bottom: border, left: border, right: border }
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

function heading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: 'FF6B1A', font: 'Calibri' })],
    spacing: { before: 320, after: 120 },
  })
}

function subheading(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: '444444', font: 'Calibri' })],
    spacing: { before: 160, after: 80 },
  })
}

function bodyText(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text: String(text || '—'), size: 20, font: 'Calibri', ...opts })],
    spacing: { after: 60 },
  })
}

function twoColTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: allBorders,
          shading: { fill: 'F2F2F2' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: '555555', font: 'Calibri' })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: allBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: String(value || '—'), size: 18, font: 'Calibri' })] })],
        }),
      ]
    }))
  })
}

function issuesTable(issues) {
  const headerRow = new TableRow({
    children: ['ID','Priority','Area','Description','Recommended Fix'].map(h =>
      new TableCell({
        borders: allBorders,
        shading: { fill: 'FF6B1A' },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })] })],
      })
    )
  })
  const dataRows = issues.map(i => new TableRow({
    children: [i.id, i.priority, i.area, i.description, i.fix || '—'].map((val, ci) =>
      new TableCell({
        borders: allBorders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({
          text: String(val || '—'),
          size: 16,
          font: 'Calibri',
          color: ci === 1 ? priorityHex(i.priority) : '333333',
          bold: ci === 1,
        })] })],
      })
    )
  }))
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  })
}

function outcomesTable(outcomes) {
  const headerRow = new TableRow({
    children: ['Metric','Current','Proposed'].map(h =>
      new TableCell({
        borders: allBorders,
        shading: { fill: 'FF6B1A' },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' })] })],
      })
    )
  })
  const dataRows = outcomes.map(o => new TableRow({
    children: [
      new TableCell({ borders: allBorders, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: o.metric || '—', size: 18, font: 'Calibri' })] })] }),
      new TableCell({ borders: allBorders, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: o.current || '—', size: 18, font: 'Calibri' })] })] }),
      new TableCell({ borders: allBorders, shading: { fill: 'E8F8F2' }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: o.proposed || '—', size: 18, font: 'Calibri', color: '1a7a52', bold: true })] })] }),
    ]
  }))
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  })
}

function priorityHex(p) {
  if (p === 'Critical') return 'CC0000'
  if (p === 'High') return 'CC5500'
  if (p === 'Medium') return '997700'
  return '0055AA'
}

export async function exportToDocx(data) {
  const children = []

  // Cover
  children.push(
    new Paragraph({ children: [new TextRun({ text: 'GREEN ROOM ENERGY', bold: true, size: 56, color: 'FF6B1A', font: 'Calibri' })], spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: 'Off-Grid Solar Site Assessment Report', size: 28, color: '666666', font: 'Calibri' })], spacing: { after: 400 } }),
  )

  // Site details
  children.push(heading('Site Details'))
  children.push(twoColTable([
    ['Site / Property', data.site.name],
    ['Address', data.site.address],
    ['Date', data.site.date],
    ['Prepared By', data.site.preparedBy],
    ['Client', data.site.client],
    ['Phone', data.site.phone],
    ['Email', data.site.email],
  ]))

  // System Overview
  children.push(heading('System Overview'))

  children.push(subheading('Inverter / Charger'))
  children.push(twoColTable([
    ['Make', data.inverter.make],
    ['Model', data.inverter.model],
    ['Rated kW', data.inverter.kw],
    ['Serial No.', data.inverter.serial],
    ['Firmware', data.inverter.firmware],
  ]))

  children.push(subheading('Battery Bank'))
  children.push(twoColTable([
    ['Chemistry', data.battery.chemistry],
    ['Make', data.battery.make],
    ['Model', data.battery.model],
    ['Voltage', data.battery.voltage ? data.battery.voltage + 'V' : ''],
    ['Capacity', data.battery.ah ? data.battery.ah + 'Ah' : ''],
    ['Configuration', data.battery.config],
    ['Age', data.battery.age ? data.battery.age + ' years' : ''],
  ]))

  children.push(subheading('Solar Array'))
  children.push(twoColTable([
    ['No. of Panels', data.solar.panels],
    ['Panel Wattage', data.solar.wattage ? data.solar.wattage + 'W' : ''],
    ['No. of Strings', data.solar.strings],
    ['Total kWp', data.solar.kwp],
    ['Orientation', data.solar.orientation],
    ['Age', data.solar.age ? data.solar.age + ' years' : ''],
    ['Shading', data.solar.shading],
  ]))

  children.push(subheading('Generator'))
  children.push(twoColTable([
    ['Make', data.generator.make],
    ['Model', data.generator.model],
    ['Rated kVA', data.generator.kva],
    ['Fuel Type', data.generator.fuel],
    ['Hours on Meter', data.generator.hours],
    ['Last Service', data.generator.lastService],
  ]))

  // Issues
  children.push(heading('Issues Register'))
  if (data.issues.length === 0) {
    children.push(bodyText('No issues recorded.'))
  } else {
    children.push(issuesTable(data.issues))
  }

  // Remediation Plan
  children.push(heading('Remediation Plan'))
  const phases = [
    { label: 'Phase 1 — Immediate (Critical)', items: data.issues.filter(i=>i.priority==='Critical') },
    { label: 'Phase 2 — Short Term (High)', items: data.issues.filter(i=>i.priority==='High') },
    { label: 'Phase 3 — Scheduled (Medium / Low)', items: [...data.issues.filter(i=>i.priority==='Medium'), ...data.issues.filter(i=>i.priority==='Low')] },
  ]
  phases.forEach(phase => {
    children.push(subheading(phase.label))
    if (phase.items.length === 0) {
      children.push(bodyText('No issues at this priority level.', { color: '999999' }))
    } else {
      phase.items.forEach(i => {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${i.id} — ${i.description}`, size: 18, font: 'Calibri' })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }))
        if (i.fix) children.push(new Paragraph({
          children: [new TextRun({ text: `Fix: ${i.fix}`, size: 16, color: '666666', font: 'Calibri' })],
          bullet: { level: 1 },
          spacing: { after: 40 },
        }))
      })
    }
  })
  if (data.remediation.notes) {
    children.push(subheading('Additional Notes'))
    children.push(bodyText(data.remediation.notes))
  }
  if (data.remediation.timeline) {
    children.push(bodyText('Estimated Timeline: ' + data.remediation.timeline, { bold: true }))
  }

  // Expected Outcomes
  children.push(heading('Expected Outcomes'))
  children.push(outcomesTable(data.outcomes))

  // Dashboard Integration
  children.push(heading('Dashboard Integration'))
  children.push(twoColTable([
    ['MQTT Broker', data.dashboard.mqtt],
    ['Remote Access URL', data.dashboard.url],
    ['Solar Assistant Version', data.dashboard.saVersion],
    ['ESP32 Nodes', data.dashboard.esp32Nodes],
    ['Integration Scope', data.dashboard.scope],
  ]))
  if (data.dashboard.notes) children.push(bodyText(data.dashboard.notes))

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children,
    }]
  })

  const blob = await Packer.toBlob(doc)
  const filename = `GR-Assessment-${(data.site.name||'Site').replace(/\s+/g,'-')}-${data.site.date||'date'}.docx`
  saveAs(blob, filename)
}
