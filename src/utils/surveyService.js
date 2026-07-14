import { supabase } from './supabase.js'

// ── Auth ──────────────────────────────────────────────────
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}

// ── Surveys ───────────────────────────────────────────────
export async function listSurveys() {
  const { data, error } = await supabase
    .from('surveys')
    .select('id, site_name, site_date, issue_count, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSurvey(id) {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data.data
}

export async function saveSurveyCloud(id, surveyData) {
  const session = await getSession()
  if (!session) throw new Error('Not logged in')

  const payload = {
    user_id: session.user.id,
    site_name: surveyData.site?.name || 'Unnamed Assessment',
    site_date: surveyData.site?.date || null,
    issue_count: surveyData.issues?.length || 0,
    data: surveyData,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase.from('surveys').update(payload).eq('id', id)
    if (error) throw error
    return id
  } else {
    const { data, error } = await supabase.from('surveys').insert(payload).select('id').single()
    if (error) throw error
    return data.id
  }
}

export async function deleteSurveyCloud(id) {
  const { error } = await supabase.from('surveys').delete().eq('id', id)
  if (error) throw error
}

// ── Admin ─────────────────────────────────────────────────
const ADMIN_EMAIL = 'seafoxdan@gmail.com'

export function isAdmin(session) {
  return session?.user?.email === ADMIN_EMAIL
}

export async function listAllSurveys() {
  const { data, error } = await supabase
    .from('surveys')
    .select('id, site_name, site_date, issue_count, updated_at, user_id')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}
