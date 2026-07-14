import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ORANGE = [255, 107, 26]
const DARK = [8, 10, 12]
const SURFACE = [15, 19, 24]
const TEXT = [232, 237, 242]
const TEXT2 = [138, 155, 176]
const GREEN = [45, 208, 140]
const RED = [255, 61, 84]
const YELLOW = [255, 202, 60]
const BLUE = [61, 158, 255]

const priorityColour = (p) => {
  if (p === 'Critical') return RED
  if (p === 'High') return ORANGE
  if (p === 'Medium') return YELLOW
  return BLUE
}

export async function exportToPDF(data) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  let y = 0

  const addPage = () => {
    doc.addPage()
    y = 20
    // Footer
    doc.setFillColor(...DARK)
    doc.rect(0, H - 12, W, 12, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT2)
    doc.text('Green Room Energy — Confidential Site Assessment', 14, H - 4)
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, W - 14, H - 4, { align: 'right' })
  }

  const checkY = (needed = 20) => { if (y + needed > H - 20) addPage() }

  // ── Cover ─────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, H, 'F')

  // Orange accent bar
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, 6, H, 'F')

  // Logo hex area
  doc.setFillColor(255, 107, 26, 30)
  doc.circle(45, 50, 22, 'F')
  doc.setFontSize(28)
  doc.setTextColor(...ORANGE)
  doc.setFont('helvetica', 'bold')
  doc.text('G', 45, 57, { align: 'center' })

  doc.setFontSize(32)
  doc.setTextColor(...TEXT)
  doc.text('Green Room', 72, 42)
  doc.setTextColor(...ORANGE)
  doc.text('Energy', 72, 54)

  doc.setFontSize(13)
  doc.setTextColor(...TEXT2)
  doc.setFont('helvetica', 'normal')
  doc.text('Off-Grid Solar Site Assessment Report', 72, 64)

  // Divider
  doc.setDrawColor(...ORANGE)
  doc.setLineWidth(0.5)
  doc.line(14, 80, W - 14, 80)

  // Meta block
  const meta = [
    ['Site', data.site.name || '—'],
    ['Address', data.site.address || '—'],
    ['Date', data.site.date || '—'],
    ['Prepared By', data.site.preparedBy || '—'],
    ['Client', data.site.client || '—'],
    ['Phone', data.site.phone || '—'],
    ['Email', data.site.email || '—'],
  ]
  let my = 95
  meta.forEach(([k, v]) => {
    doc.setFontSize(9)
    doc.setTextColor(...TEXT2)
    doc.setFont('helvetica', 'bold')
    doc.text(k.toUpperCase(), 14, my)
    doc.setTextColor(...TEXT)
    doc.setFont('helvetica', 'normal')
    doc.text(String(v), 55, my)
    my += 9
  })

  // Issue summary on cover
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  data.issues.forEach(i => counts[i.priority]++)
  const total = data.issues.length
  doc.setFontSize(11)
  doc.setTextColor(...TEXT2)
  doc.text(`${total} issue${total !== 1 ? 's' : ''} identified`, 14, my + 8)

  // Footer on cover
  doc.setFillColor(...SURFACE)
  doc.rect(0, H - 16, W, 16, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT2)
  doc.text('Green Room Energy — Confidential', 14, H - 6)
  doc.text('Page 1', W - 14, H - 6, { align: 'right' })

  // ── Page 2: System Overview ───────────────────────────
  addPage()
  doc.setFontSize(18)
  doc.setTextColor(...ORANGE)
  doc.setFont('helvetica', 'bold')
  doc.text('System Overview', 14, y)
  y += 10

  const sysRows = [
    ['Inverter Make', data.inverter.make || '—', 'Inverter Model', data.inverter.model || '—'],
    ['Rated kW', data.inverter.kw || '—', 'Serial No.', data.inverter.serial || '—'],
    ['Battery Chemistry', data.battery.chemistry || '—', 'Battery Make/Model', `${data.battery.make} ${data.battery.model}`.trim() || '—'],
    ['Battery Voltage', data.battery.voltage ? data.battery.voltage + 'V' : '—', 'Capacity', data.battery.ah ? data.battery.ah + 'Ah' : '—'],
    ['Solar Panels', data.solar.panels || '—', 'Panel Wattage', data.solar.wattage ? data.solar.wattage + 'W' : '—'],
    ['Total kWp', data.solar.kwp || '—', 'Orientation', data.solar.orientation || '—'],
    ['Generator Make', data.generator.make || '—', 'Generator kVA', data.generator.kva || '—'],
    ['Fuel Type', data.generator.fuel || '—', 'Hours on Meter', data.generator.hours || '—'],
  ]

  autoTable(doc, {
    startY: y,
    head: [],
    body: sysRows,
    styles: { fillColor: SURFACE, textColor: TEXT, fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { textColor: TEXT2, fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { textColor: TEXT2, fontStyle: 'bold', cellWidth: 40 },
      3: { cellWidth: 55 },
    },
    theme: 'plain',
  })
  y = doc.lastAutoTable.finalY + 10

  // ── Issues Register ───────────────────────────────────
  checkY(20)
  doc.setFontSize(18)
  doc.setTextColor(...ORANGE)
  doc.setFont('helvetica', 'bold')
  doc.text('Issues Register', 14, y)
  y += 10

  if (data.issues.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(...TEXT2)
    doc.text('No issues recorded.', 14, y)
    y += 10
  } else {
    autoTable(doc, {
      startY: y,
      head: [['ID', 'Priority', 'Area', 'Description', 'Fix']],
      body: data.issues.map(i => [i.id, i.priority, i.area, i.description, i.fix || '—']),
      styles: { fillColor: SURFACE, textColor: TEXT, fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [22, 28, 35], textColor: TEXT2, fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 18 },
        2: { cellWidth: 25 },
        3: { cellWidth: 70 },
        4: { cellWidth: 55 },
      },
      didDrawCell: (hookData) => {
        if (hookData.column.index === 1 && hookData.section === 'body') {
          const p = hookData.cell.raw
          const col = priorityColour(p)
          doc.setTextColor(...col)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text(p, hookData.cell.x + 2, hookData.cell.y + hookData.cell.height / 2 + 2)
        }
      },
      theme: 'plain',
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Expected Outcomes ─────────────────────────────────
  checkY(20)
  doc.setFontSize(18)
  doc.setTextColor(...ORANGE)
  doc.setFont('helvetica', 'bold')
  doc.text('Expected Outcomes', 14, y)
  y += 10

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Current', 'Proposed']],
    body: data.outcomes.map(o => [o.metric, o.current || '—', o.proposed || '—']),
    styles: { fillColor: SURFACE, textColor: TEXT, fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [22, 28, 35], textColor: TEXT2, fontSize: 8, fontStyle: 'bold' },
    didDrawCell: (hookData) => {
      if (hookData.column.index === 2 && hookData.section === 'body') {
        doc.setTextColor(...GREEN)
      }
    },
    theme: 'plain',
  })
  y = doc.lastAutoTable.finalY + 10

  // ── Remediation Notes ─────────────────────────────────
  if (data.remediation.notes) {
    checkY(20)
    doc.setFontSize(14)
    doc.setTextColor(...ORANGE)
    doc.setFont('helvetica', 'bold')
    doc.text('Additional Notes', 14, y)
    y += 8
    doc.setFontSize(10)
    doc.setTextColor(...TEXT)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(data.remediation.notes, W - 28)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 6
  }

  const filename = `GR-Assessment-${(data.site.name || 'Site').replace(/\s+/g,'-')}-${data.site.date || TODAY}.pdf`
  doc.save(filename)
}
