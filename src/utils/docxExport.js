import { Document, Packer, Paragraph, TextRun, WidthType, BorderStyle, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

const font = 'Calibri'

const h1 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 36, color: 'FF6B1A', font })],
  spacing: { before: 400, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'FF6B1A' } },
})

const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 26, color: '333333', font })],
  spacing: { before: 280, after: 100 },
})

const row = (label, value) => new Paragraph({
  children: [
    new TextRun({ text: `${label}:  `, bold: true, size: 20, color: '555555', font }),
    new TextRun({ text: String(value || '—'), size: 20, color: '111111', font }),
  ],
  spacing: { after: 80 },
})

const blank = () => new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 80 } })

const bullet = (text, color = '222222') => new Paragraph({
  children: [new TextRun({ text, size: 19, color, font })],
  bullet: { level: 0 },
  spacing: { after: 60 },
})

const subbullet = (text, color = '666666') => new Paragraph({
  children: [new TextRun({ text, size: 18, color, font })],
  bullet: { level: 1 },
  spacing: { after: 60 },
})

const priorityColor = (p) => {
  if (p === 'Critical') return 'CC0000'
  if (p === 'High') return 'DD5500'
  if (p === 'Medium') return '997700'
  return '005599'
}

function outcomeRows(outcomes) {
  const rows = [
    new Paragraph({
      children: [
        new TextRun({ text: 'Metric', bold: true, size: 20, color: 'FFFFFF', font }),
        new TextRun({ text: '          Current', bold: true, size: 20, color: 'FFFFFF', font }),
        new TextRun({ text: '          Proposed', bold: true, size: 20, color: 'FFFFFF', font }),
      ],
      spacing: { after: 80 },
      shading: { fill: 'FF6B1A' },
    }),
    ...outcomes.map(o => new Paragraph({
      children: [
        new TextRun({ text: (o.metric || '—').padEnd(28), size: 19, font }),
        new TextRun({ text: (o.current || '—').padEnd(20), size: 19, font }),
        new TextRun({ text: o.proposed || '—', size: 19, bold: true, color: '1a7a52', font }),
      ],
      spacing: { after: 60 },
    }))
  ]
  return rows
}

export async function exportToDocx(data) {
  const ch = []

  // Cover
  ch.push(
    new Paragraph({ children: [new TextRun({ text: 'GREEN ROOM ENERGY', bold: true, size: 72, color: 'FF6B1A', font })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: 'Off-Grid Solar Site Assessment Report', size: 28, color: '888888', font })], spacing: { after: 600 } }),
  )

  // Site Details
  ch.push(h1('Site Details'))
  ch.push(row('Site / Property', data.site.name))
  ch.push(row('Address', data.site.address))
  if (data.site.lat) ch.push(row('GPS Coordinates', `${data.site.lat}, ${data.site.lng}`))
  ch.push(row('Date', data.site.date))
  ch.push(row('Prepared By', data.site.preparedBy))
  ch.push(row('Client', data.site.client))
  ch.push(row('Phone', data.site.phone))
  ch.push(row('Email', data.site.email))

  // System Overview
  ch.push(h1('System Overview'))

  ch.push(h2('Inverter / Charger'))
  ch.push(row('Make', data.inverter.make))
  ch.push(row('Model', data.inverter.model))
  ch.push(row('Rated kW', data.inverter.kw))
  ch.push(row('Serial No.', data.inverter.serial))
  ch.push(row('Firmware', data.inverter.firmware))
  ch.push(blank())

  ch.push(h2('Battery Bank'))
  ch.push(row('Chemistry', data.battery.chemistry))
  ch.push(row('Make', data.battery.make))
  ch.push(row('Model', data.battery.model))
  ch.push(row('Voltage', data.battery.voltage ? data.battery.voltage + 'V' : ''))
  ch.push(row('Capacity', data.battery.ah ? data.battery.ah + 'Ah' : ''))
  ch.push(row('Configuration', data.battery.config))
  ch.push(row('Age', data.battery.age ? data.battery.age + ' years' : ''))
  ch.push(blank())

  ch.push(h2('Solar Array'))
  ch.push(row('No. of Panels', data.solar.panels))
  ch.push(row('Panel Wattage', data.solar.wattage ? data.solar.wattage + 'W' : ''))
  ch.push(row('No. of Strings', data.solar.strings))
  ch.push(row('Total kWp', data.solar.kwp))
  ch.push(row('Orientation', data.solar.orientation))
  ch.push(row('Azimuth', data.solar.azimuth ? data.solar.azimuth + '°' : ''))
  ch.push(row('Tilt Angle', data.solar.tilt ? data.solar.tilt + '°' : ''))
  ch.push(row('Age', data.solar.age ? data.solar.age + ' years' : ''))
  ch.push(row('Shading', data.solar.shading))
  ch.push(blank())

  ch.push(h2('Generator'))
  ch.push(row('Make', data.generator.make))
  ch.push(row('Model', data.generator.model))
  ch.push(row('Rated kVA', data.generator.kva))
  ch.push(row('Fuel Type', data.generator.fuel))
  ch.push(row('Hours on Meter', data.generator.hours))
  ch.push(row('Last Service', data.generator.lastService))

  // Issues
  ch.push(h1('Issues Register'))
  if (data.issues.length === 0) {
    ch.push(new Paragraph({ children: [new TextRun({ text: 'No issues recorded.', size: 20, color: '999999', font })], spacing: { after: 80 } }))
  } else {
    data.issues.forEach(i => {
      ch.push(new Paragraph({
        children: [
          new TextRun({ text: `${i.id}  `, bold: true, size: 20, font }),
          new TextRun({ text: `[${i.priority}]  `, bold: true, size: 20, color: priorityColor(i.priority), font }),
          new TextRun({ text: `${i.area}  —  `, size: 20, color: '666666', font }),
          new TextRun({ text: i.description, size: 20, font }),
        ],
        spacing: { before: 120, after: 60 },
      }))
      if (i.fix) ch.push(subbullet(`Fix: ${i.fix}`))
      if (i.grSolution) ch.push(subbullet(`GR Solution: ${i.grSolution}`, '1a7a52'))
    })
  }

  // Remediation Plan
  ch.push(h1('Remediation Plan'))
  const phases = [
    { label: 'Phase 1 — Immediate (Critical)', items: data.issues.filter(i=>i.priority==='Critical'), color: 'CC0000' },
    { label: 'Phase 2 — Short Term (High)', items: data.issues.filter(i=>i.priority==='High'), color: 'DD5500' },
    { label: 'Phase 3 — Scheduled (Medium / Low)', items: [...data.issues.filter(i=>i.priority==='Medium'), ...data.issues.filter(i=>i.priority==='Low')], color: '997700' },
  ]
  phases.forEach(phase => {
    ch.push(h2(phase.label))
    if (phase.items.length === 0) {
      ch.push(new Paragraph({ children: [new TextRun({ text: 'No issues at this priority level.', size: 19, color: '999999', font })], spacing: { after: 80 } }))
    } else {
      phase.items.forEach(i => {
        ch.push(bullet(`${i.id} — ${i.description}`))
        if (i.fix) ch.push(subbullet(`Fix: ${i.fix}`))
      })
    }
  })
  if (data.remediation.notes) {
    ch.push(h2('Additional Notes'))
    ch.push(new Paragraph({ children: [new TextRun({ text: data.remediation.notes, size: 20, font })], spacing: { after: 80 } }))
  }
  if (data.remediation.timeline) {
    ch.push(row('Estimated Timeline', data.remediation.timeline))
  }

  // Expected Outcomes
  ch.push(h1('Expected Outcomes'))
  ch.push(...outcomeRows(data.outcomes))

  // Dashboard Integration
  ch.push(h1('Dashboard Integration'))
  ch.push(row('MQTT Broker', data.dashboard.mqtt))
  ch.push(row('Remote Access URL', data.dashboard.url))
  ch.push(row('Solar Assistant Version', data.dashboard.saVersion))
  ch.push(row('ESP32 Nodes', data.dashboard.esp32Nodes))
  ch.push(row('Integration Scope', data.dashboard.scope))
  if (data.dashboard.notes) ch.push(row('Notes', data.dashboard.notes))

  // Photo list (no images in docx - list captions only)
  if (data.photos.length > 0) {
    ch.push(h1('Photo Documentation'))
    ch.push(new Paragraph({ children: [new TextRun({ text: `${data.photos.length} photo(s) captured during assessment:`, size: 20, font })], spacing: { after: 120 } }))
    data.photos.forEach((p, i) => {
      ch.push(bullet(`Photo ${i+1}: ${p.caption || 'No caption'} (${p.area})`))
    })
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: ch,
    }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `GR-Assessment-${(data.site.name||'Site').replace(/\s+/g,'-')}-${data.site.date||'date'}.docx`)
}
