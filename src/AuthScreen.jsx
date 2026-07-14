import { useState } from 'react'
import { signIn, signUp } from './utils/surveyService.js'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) { setStatus('Please enter email and password'); return }
    setLoading(true); setStatus('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setStatus('✓ Account created! Check your email to verify, then log in.')
        setMode('login')
      }
    } catch(e) { setStatus(e.message) }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{marginBottom:12}}>
            <polygon points="30,4 54,17 54,43 30,56 6,43 6,17" fill="#ff6b1a" opacity="0.15" stroke="#ff6b1a" strokeWidth="1.5"/>
            <text x="30" y="38" textAnchor="middle" fill="#ff6b1a" fontSize="22" fontWeight="700" fontFamily="sans-serif">G</text>
          </svg>
          <div style={{fontFamily:'Barlow Condensed',fontSize:28,fontWeight:700,color:'var(--text)'}}>
            Green Room <span style={{color:'var(--orange)'}}>Energy</span>
          </div>
          <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>Off-Grid Solar Site Assessment</div>
        </div>

        <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:24}}>
          <div style={{fontFamily:'Barlow Condensed',fontSize:20,fontWeight:700,marginBottom:20,color:'var(--text)'}}>
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </div>

          <div className="field" style={{marginBottom:12}}>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={e=>e.key==='Enter' && submit()} />
          </div>

          <div className="field" style={{marginBottom:20}}>
            <label>Password</label>
            <div style={{position:'relative'}}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e=>e.key==='Enter' && submit()}
                style={{paddingRight:44}}
              />
              <button
                onClick={()=>setShowPw(s=>!s)}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text2)',fontSize:16,padding:4}}
              >
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {status && (
            <div style={{marginBottom:12,fontSize:13,padding:'8px 12px',borderRadius:6,
              background: status.includes('✓') ? '#1a7a5220' : 'var(--red-dim)',
              color: status.includes('✓') ? 'var(--green)' : 'var(--red)',
              border: `1px solid ${status.includes('✓') ? 'var(--green-dim)' : 'var(--red-dim)'}`}}>
              {status}
            </div>
          )}

          <button className="btn btn-primary" style={{width:'100%',padding:12,fontSize:15}}
            onClick={submit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>

          <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--text2)'}}>
            {mode === 'login' ? (
              <>No account? <span style={{color:'var(--orange)',cursor:'pointer'}} onClick={()=>{setMode('signup');setStatus('')}}>Sign up</span></>
            ) : (
              <>Already have one? <span style={{color:'var(--orange)',cursor:'pointer'}} onClick={()=>{setMode('login');setStatus('')}}>Log in</span></>
            )}
          </div>
        </div>

        {mode === 'login' && (
          <div style={{textAlign:'center',marginTop:12,fontSize:12,color:'var(--text3)'}}>
            After signing up, check your email and click the verification link, then log in here.
          </div>
        )}
      </div>
    </div>
  )
}
