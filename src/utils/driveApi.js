const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const FOLDER_NAME = 'Green Room Assessments'
let accessToken = null

function loadGsi() {
  return new Promise((resolve) => {
    if (window.google?.accounts) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

async function ensureAuth() {
  if (accessToken) return accessToken
  await loadGsi()
  return new Promise((resolve, reject) => {
    const tc = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) return reject(resp)
        accessToken = resp.access_token
        resolve(accessToken)
      },
    })
    tc.requestAccessToken()
  })
}

async function getOrCreateFolder() {
  const token = await ensureAuth()
  const search = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await search.json()
  if (data.files?.length) return data.files[0].id
  const create = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const folder = await create.json()
  return folder.id
}

export async function saveToDrive(data) {
  const token = await ensureAuth()
  const folderId = await getOrCreateFolder()
  const filename = `GR-${(data.site.name||'Assessment').replace(/\s+/g,'-')}-${data.site.date||'nodate'}.json`
  const content = JSON.stringify(data, null, 2)
  const search = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${filename}' and '${folderId}' in parents and trashed=false`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const existing = await search.json()
  if (existing.files?.length) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existing.files[0].id}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: content,
    })
    return existing.files[0].id
  }
  const meta = JSON.stringify({ name: filename, parents: [folderId] })
  const form = new FormData()
  form.append('metadata', new Blob([meta], { type: 'application/json' }))
  form.append('file', new Blob([content], { type: 'application/json' }))
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const file = await res.json()
  return file.id
}

export async function loadFromDrive(fileId) {
  const token = await ensureAuth()
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function listDriveAssessments() {
  const token = await ensureAuth()
  const folderId = await getOrCreateFolder()
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=modifiedTime desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files || []
}
