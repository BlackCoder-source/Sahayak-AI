import { useState, useRef } from 'react'

type Screen = 'login' | 'language' | 'home' | 'listening' | 'results' | 'detail' | 'nomatch'

const LANGUAGES = [
  { label: 'हिंदी', name: 'Hindi', code: 'hi' },
  { label: 'English', name: 'English', code: 'en' },
  { label: 'ਪੰਜਾਬੀ', name: 'Punjabi', code: 'pa' },
  { label: 'বাংলা', name: 'Bengali', code: 'bn' },
  { label: 'தமிழ்', name: 'Tamil', code: 'ta' },
  { label: 'తెలుగు', name: 'Telugu', code: 'te' },
  { label: 'मराठी', name: 'Marathi', code: 'mr' },
  { label: 'ગુજરાતી', name: 'Gujarati', code: 'gu' },
  { label: 'ಕನ್ನಡ', name: 'Kannada', code: 'kn' },
]

// Plain-language ELI5 explanations for fallback static schemes
const ELI5_STEPS: Record<number, string[]> = {
  1: [
    'Go to the government website pmkisan.gov.in on your phone or computer. Or visit a CSC shop near you — they will help for free.',
    'On the website, find a button that says "Farmer Corner". Click it, then click "New Registration" to start.',
    'Type in your 12-digit Aadhaar number and details about your farmland. The officer at CSC can help you.',
    'Click submit. You will get a number — write it down or take a photo of it. You will need it later.',
    'After the government checks your details (takes 2–4 weeks), money will come directly to your bank account.',
  ],
  2: [
    'Walk into any bank near you, or find a Bank Mitra (a person who helps open accounts in villages).',
    'Ask for the account opening form. It is available in Hindi and regional languages too.',
    'Give them your Aadhaar card and a passport photo. That is all you need.',
    'Your account will be opened the same day — no waiting!',
    'Your RuPay debit card (like an ATM card) will arrive at your address within 7 days.',
  ],
  3: [
    'Go to pmjay.gov.in and enter your name or Aadhaar to check if you are in the list. Or call 14555 — it is free.',
    'If your name is there, go to any hospital that has a sign saying "Ayushman Bharat empanelled".',
    'Give the hospital your Aadhaar card and ration card. They will check your name on their computer.',
    'If approved, your treatment starts right away. You do NOT need to pay any money.',
    'The hospital gets the money from the government directly. You never have to worry about bills.',
  ],
}

const SCHEMES = [
  {
    id: 1,
    name: 'PM Kisan Samman Nidhi',
    icon: '🌾',
    ministry: 'Ministry of Agriculture',
    matchReason: 'You qualify as a small landholding farmer',
    benefit: '₹6,000/year direct benefit',
    docs: 4,
    matchStrength: 'Strong' as 'Strong' | 'Partial',
    category: 'Farmer',
    categoryColor: 'bg-india-green-100 text-india-green-700',
    eligibility: [
      'Small or marginal farmer with land holding',
      'Indian citizen (18+ years)',
      'Not a government employee',
      'Annual income below ₹1.5 lakh',
    ],
    documents: [
      { icon: '🪪', name: 'Aadhaar Card' },
      { icon: '🏦', name: 'Bank Passbook' },
      { icon: '📄', name: 'Land Records (Khasra/Khatauni)' },
      { icon: '📱', name: 'Mobile Number (linked to Aadhaar)' },
    ],
    steps: [
      'Visit pmkisan.gov.in or nearest CSC centre',
      'Click "Farmer Corner" → New Registration',
      'Enter Aadhaar and land details',
      'Submit and note your registration number',
      'Funds credited within 2–4 weeks of approval',
    ],
    officialLink: 'https://pmkisan.gov.in',
  },
  {
    id: 2,
    name: 'Pradhan Mantri Jan Dhan Yojana',
    icon: '🏦',
    ministry: 'Ministry of Finance',
    matchReason: 'Opens a zero-balance account for unbanked citizens',
    benefit: 'Zero balance account + ₹10,000 overdraft',
    docs: 2,
    matchStrength: 'Partial' as 'Strong' | 'Partial',
    category: 'Finance',
    categoryColor: 'bg-navy-100 text-navy-700',
    eligibility: [
      'Indian citizen (10+ years)',
      'No existing bank account in your name',
      'Valid identity proof (Aadhaar acceptable)',
      'Any income level qualifies',
    ],
    documents: [
      { icon: '🪪', name: 'Aadhaar Card' },
      { icon: '📷', name: 'Passport-size photo' },
    ],
    steps: [
      'Visit any nearest bank branch or Business Correspondent',
      'Fill the account opening form (available in your language)',
      'Submit Aadhaar and photo',
      'Account opened on the same day',
      'Receive RuPay debit card within 7 days',
    ],
    officialLink: 'https://pmjdy.gov.in',
  },
  {
    id: 3,
    name: 'Ayushman Bharat PM-JAY',
    icon: '🏥',
    ministry: 'National Health Authority',
    matchReason: 'Your family is eligible for free health coverage',
    benefit: '₹5 lakh health cover per family per year',
    docs: 3,
    matchStrength: 'Strong' as 'Strong' | 'Partial',
    category: 'Health',
    categoryColor: 'bg-saffron-100 text-saffron-700',
    eligibility: [
      'Families listed in SECC 2011 data',
      'Below poverty line (BPL) card holders',
      'Annual family income below ₹5 lakh',
      'No active private health insurance',
    ],
    documents: [
      { icon: '🪪', name: 'Aadhaar Card' },
      { icon: '📋', name: 'Ration Card / SECC ID' },
      { icon: '📱', name: 'Registered Mobile Number' },
    ],
    steps: [
      'Check eligibility at pmjay.gov.in or call 14555',
      'Visit empanelled hospital with documents',
      'Hospital staff verifies eligibility online',
      'Treatment approved instantly — no cash needed',
      'Claim settled directly between hospital and govt',
    ],
    officialLink: 'https://pmjay.gov.in',
  },
]

function GovtHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex flex-col items-center justify-center w-8 h-8">
        {/* Ashoka Chakra simplified */}
        <div className="w-7 h-7 rounded-full border-2 border-navy-800 flex items-center justify-center bg-white">
          <div className="w-3 h-3 rounded-full border border-navy-800 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: '6px', color: '#1e3a8a' }}>✦</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs text-navy-900 font-semibold leading-tight font-display">सहायक AI · Sahayak AI</div>
        <div className="text-[10px] text-gray-500 leading-tight">Government of India Initiative</div>
      </div>
      <div className="ml-auto">
        <div className="h-5 w-12 rounded-sm overflow-hidden tricolor-bar opacity-90" />
      </div>
    </div>
  )
}

function LoginScreen({ onLogin, onGuest }: { onLogin: () => void; onGuest: () => void }) {
  const [phone, setPhone] = useState('')
  const [digits, setDigits] = useState(['', '', '', ''])
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)
  const boxRefs = useRef<(HTMLInputElement | null)[]>([])

  const otp = digits.join('')

  const handleDigitChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = ch
    setDigits(next)
    if (ch && i < 3) boxRefs.current[i + 1]?.focus()
  }

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      boxRefs.current[i - 1]?.focus()
    }
  }

  const startResendTimer = () => {
    setResendTimer(30)
    const id = setInterval(() => {
      setResendTimer(t => { if (t <= 1) { clearInterval(id); return 0 } return t - 1 })
    }, 1000)
  }

  const handleSendOtp = () => {
    if (phone.length < 10) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('otp')
      setDigits(['', '', '', ''])
      startResendTimer()
      setTimeout(() => boxRefs.current[0]?.focus(), 100)
    }, 1200)
  }

  const handleVerify = () => {
    if (otp.length < 4) return
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 1000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      {/* Top decorative band */}
      <div className="h-1.5 tricolor-bar" />

      {/* Hero section */}
      <div className="bg-navy-900 px-5 pt-10 pb-10 relative overflow-hidden">
        {/* subtle pattern circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-saffron-400 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border border-saffron-300 flex items-center justify-center">
                <span style={{ fontSize: '8px', color: '#fb923c' }}>✦</span>
              </div>
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl text-white mb-1">
            सहायक AI
          </h1>
          <p className="text-navy-300 text-sm mb-1">Sahayak AI</p>
          <p className="text-navy-400 text-xs">Your Government Scheme Assistant</p>

          {/* Trust badges */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs text-saffron-400 font-semibold bg-white/10 px-3 py-1 rounded-full">
              🇮🇳 Govt. of India
            </span>
            <span className="text-xs text-india-green-400 font-semibold bg-white/10 px-3 py-1 rounded-full">
              🔒 Secure Login
            </span>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 px-4 -mt-5">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5">

          {step === 'phone' ? (
            <>
              <h2 className="font-display font-bold text-lg text-gray-900 mb-1">Login with Mobile</h2>
              <p className="text-sm text-gray-500 mb-5">We'll send a 4-digit OTP to verify you</p>

              {/* Phone input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  📱 Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-semibold text-gray-700 gap-1.5 flex-shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length < 10 || loading}
                className="w-full bg-saffron-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-display font-bold text-base py-4 rounded-2xl transition-all active:scale-[0.98] shadow-md disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <><span>📨</span> Send OTP</>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('phone')}
                className="flex items-center gap-1.5 text-navy-600 text-sm font-medium mb-4"
              >
                ← Change number
              </button>
              <h2 className="font-display font-bold text-lg text-gray-900 mb-1">Enter OTP</h2>
              <p className="text-sm text-gray-500 mb-1">
                Sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
              </p>
              <p className="text-xs text-india-green-600 font-medium mb-5">✅ OTP sent successfully</p>

              {/* OTP boxes — each is a real focusable input */}
              <div className="flex gap-3 justify-center mb-6">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { boxRefs.current[i] = el }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                    className={`w-14 h-14 rounded-2xl border-2 text-center text-2xl font-bold font-display transition-colors focus:outline-none ${
                      d
                        ? 'border-saffron-400 bg-saffron-50 text-saffron-700'
                        : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-saffron-400 focus:bg-saffron-50/40'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={otp.length < 4 || loading}
                className="w-full bg-india-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-display font-bold text-base py-4 rounded-2xl transition-all active:scale-[0.98] shadow-md disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <><span>✅</span> Verify &amp; Login</>
                )}
              </button>

              <button
                disabled={resendTimer > 0}
                onClick={() => { setDigits(['', '', '', '']); startResendTimer(); setTimeout(() => boxRefs.current[0]?.focus(), 50) }}
                className="w-full text-center text-sm mt-3 py-2 font-medium disabled:text-gray-400 text-navy-600"
              >
                🔄 {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Alternative logins */}
          <div className="space-y-2.5">
            <button className="w-full flex items-center gap-3 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 active:scale-[0.98] transition-transform hover:bg-gray-50">
              <span className="text-xl">🪪</span>
              <span>Login with Aadhaar OTP</span>
              <span className="ml-auto text-xs text-gray-400">→</span>
            </button>
            <button
              onClick={onGuest}
              className="w-full flex items-center gap-3 border border-dashed border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-500 active:scale-[0.98] transition-transform hover:bg-gray-50"
            >
              <span className="text-xl">👤</span>
              <span>Continue as Guest</span>
              <span className="ml-auto text-xs text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-center text-xs text-gray-400 mt-4 px-4 leading-relaxed">
          🔒 Your data is safe. We never share personal info. Compliant with IT Act 2000.
        </p>
      </div>

      <div className="py-4" />
    </div>
  )
}

function LanguageScreen({ onSelect }: { onSelect: (lang: typeof LANGUAGES[0]) => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      <GovtHeader />
      {/* Hero */}
      <div className="px-5 pt-8 pb-6 text-center">
        <div className="inline-flex items-center gap-1.5 bg-india-green-50 text-india-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-india-green-200">
          <span>🇮🇳</span>
          <span>Official Govt Scheme Assistant</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-900 leading-tight mb-2">
          अपनी भाषा चुनें
        </h1>
        <p className="text-base text-gray-600">Choose your language to begin</p>
      </div>

      {/* Language Grid */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect(lang)}
              className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl shadow-sm border border-gray-100 py-4 px-2 active:scale-95 transition-transform hover:border-saffron-400 hover:shadow-md group min-h-[72px]"
            >
              <span className="text-xl font-semibold text-gray-900 leading-tight group-hover:text-saffron-600 transition-colors">
                {lang.label}
              </span>
              <span className="text-[11px] text-gray-400 font-body">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="mt-auto px-5 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span>🔒</span> Secure & Private</span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="flex items-center gap-1"><span>📋</span> 500+ Schemes</span>
          <span className="w-px h-3 bg-gray-200" />
          <span className="flex items-center gap-1"><span>✅</span> Free to Use</span>
        </div>
      </div>
    </div>
  )
}

function HomeScreen({ lang, onMic, onType, onChip }: {
  lang: typeof LANGUAGES[0]
  onMic: () => void
  onType: () => void
  onChip: (text: string) => void
}) {
  const chips = [
    '🌾 Farmer schemes',
    '👩 Women benefits',
    '📚 Student loans',
    '🏥 Health cover',
    '🏠 Housing scheme',
    '👴 Senior citizen',
  ]

  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      <GovtHeader />

      {/* Greeting */}
      <div className="px-5 pt-7 pb-4">
        <h1 className="font-display font-bold text-2xl text-gray-900 leading-tight">
          नमस्ते! 👋
        </h1>
        <p className="text-base text-gray-600 mt-1">
          Which government scheme are you looking for?
        </p>
      </div>

      {/* Big Mic Button */}
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          {/* Outer pulse rings */}
          <div className="absolute inset-0 rounded-full bg-saffron-400/20 scale-125 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full bg-saffron-400/10 scale-150" />
          <button
            onClick={onMic}
            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 shadow-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all hover:shadow-2xl"
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H8v2h8v-2h-3v-1.06A9 9 0 0 0 21 12v-2h-2z"/>
            </svg>
            <span className="text-white text-xs font-semibold font-display">TAP TO SPEAK</span>
          </button>
        </div>
        <p className="mt-5 text-sm text-gray-500 text-center">
          बोलिए — Speak in {lang.name}
        </p>
        <button
          onClick={onType}
          className="mt-2 text-navy-600 text-sm underline underline-offset-2 font-medium active:text-navy-800 transition-colors"
        >
          ✏️ Type instead
        </button>
      </div>

      {/* Example chips */}
      <div className="px-5 pb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Try asking about</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => onChip(chip)}
              className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 font-medium active:scale-95 transition-transform hover:border-saffron-400 hover:bg-saffron-50 shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom helpline */}
      <div className="mt-auto px-5 py-4 bg-navy-50 border-t border-navy-100 mx-4 mb-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base">📞</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-navy-900">Need help? Call helpline</p>
            <p className="text-sm font-bold text-navy-700">1800-11-4000 (Free)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ListeningScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      <GovtHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Waveform */}
        <div className="flex items-end gap-1.5 h-16 mb-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="wave-bar w-2 rounded-full bg-saffron-500"
              style={{ height: '8px', animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        <div className="w-24 h-24 rounded-full bg-saffron-500/10 border-4 border-saffron-400 flex items-center justify-center mb-6 animate-pulse">
          <svg className="w-10 h-10 text-saffron-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H8v2h8v-2h-3v-1.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
        </div>

        <h2 className="font-display font-bold text-xl text-gray-900 text-center mb-2">
          Listening…
        </h2>
        <p className="text-base text-gray-500 text-center max-w-xs">
          Speak clearly. I'm understanding what you're saying.
        </p>
        <p className="mt-2 text-sm text-india-green-600 font-medium text-center">
          🔊 सुन रहा हूँ...
        </p>

        <button
          onClick={onDone}
          className="mt-12 px-8 py-3 rounded-full border-2 border-gray-300 text-gray-600 font-semibold text-base active:scale-95 transition-transform"
        >
          Stop &amp; Search
        </button>
      </div>
    </div>
  )
}

function MatchStrengthPill({ strength }: { strength?: 'Strong' | 'Partial' }) {
  if (!strength) return null
  return strength === 'Strong' ? (
    <span className="flex items-center gap-1 text-[10px] font-bold text-india-green-700 bg-india-green-50 border border-india-green-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-india-green-500 inline-block" />
      Strong match
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
      Partial match
    </span>
  )
}

function ResultsScreen({
  schemes,
  query,
  isFallback,
  onScheme,
  onBack,
}: {
  schemes: typeof SCHEMES
  query: string
  isFallback: boolean
  onScheme: (scheme: typeof SCHEMES[0]) => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      <GovtHeader />

      {/* Degraded mode banner */}
      {isFallback && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-base">📶</span>
          <p className="text-xs text-amber-800 font-medium">Showing saved results — live data unavailable</p>
        </div>
      )}

      {/* Search recap */}
      <div className="px-4 pt-3 pb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-navy-600 text-sm font-medium mb-3">
          <span>←</span> Back
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-saffron-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22H8v2h8v-2h-3v-1.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
          <span className="text-gray-700 text-sm font-medium flex-1">"{query || 'General schemes'}"</span>
          <span className="text-xs text-gray-400">Edit</span>
        </div>
      </div>

      {/* Results header */}
      <div className="px-5 pt-1 pb-2 flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-gray-900">{schemes.length} Schemes Found</h2>
          <p className="text-sm text-india-green-600 font-medium">✅ Matched to your profile</p>
        </div>
        <div className="bg-india-green-100 rounded-full px-3 py-1">
          <span className="text-india-green-700 text-xs font-semibold">Best Match First</span>
        </div>
      </div>

      {/* Scheme cards */}
      <div className="px-4 pb-6 flex flex-col gap-3 overflow-y-auto scrollbar-hide">
        {schemes.map((scheme: any, idx: number) => (
          <button
            key={scheme.id}
            onClick={() => onScheme(scheme)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left active:scale-[0.98] transition-transform hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${scheme.categoryColor}`}>
                {scheme.category}
              </span>
              <div className="flex items-center gap-1.5">
                <MatchStrengthPill strength={scheme.matchStrength} />
                {idx === 0 && (
                  <span className="text-xs font-bold text-saffron-600 bg-saffron-50 border border-saffron-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⭐ Best
                  </span>
                )}
              </div>
            </div>

            <h3 className="font-display font-bold text-base text-gray-900 leading-tight mb-1">
              {scheme.icon} {scheme.name}
            </h3>
            <p className="text-xs text-gray-500 mb-2">{scheme.ministry}</p>

            <div className="bg-india-green-50 rounded-xl px-3 py-2 mb-3">
              <p className="text-sm text-india-green-800 font-medium leading-snug">
                ✅ {scheme.matchReason}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy-700">{scheme.benefit}</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  📄 {scheme.docs} docs
                </span>
                <span className="text-xs font-bold text-saffron-600 bg-saffron-50 px-3 py-1.5 rounded-full border border-saffron-200">
                  Apply →
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full overflow-hidden tricolor-bar flex-shrink-0" />
              <span className="text-[10px] text-gray-400 font-medium">Official Government Scheme</span>
            </div>
          </button>
        ))}

        <button
          className="text-center text-navy-600 text-sm py-2 underline underline-offset-2"
          onClick={onBack}
        >
          🔍 Not what you're looking for? Try again
        </button>
      </div>
    </div>
  )
}

function DetailScreen({
  scheme,
  onBack,
}: {
  scheme: any
  onBack: () => void
}) {
  const [eli5Step, setEli5Step] = useState<number | null>(null)
  const [eli5Mode, setEli5Mode] = useState(false)
  const [reminderToast, setReminderToast] = useState(false)

  const handleReminder = () => {
    setReminderToast(true)
    setTimeout(() => setReminderToast(false), 3500)
  }

  // ELI5 plain explanations — use preloaded for static schemes, else derive from step text
  const getEli5 = (i: number): string => {
    const preloaded = ELI5_STEPS[scheme.id as keyof typeof ELI5_STEPS]
    if (preloaded && preloaded[i]) return preloaded[i]
    return `In simple words: ${scheme.steps[i]}. If you are unsure, ask the nearest government office or CSC centre for help — it is free.`
  }

  const shareChecklist = () => {
    const docs = (scheme.documents as { icon: string; name: string }[])
      .map((d, i) => `${i + 1}. ${d.icon} ${d.name}`)
      .join('%0A')
    const msg = `📋 *Documents for ${scheme.name}*%0A%0A${docs}%0A%0A🔗 Apply: ${scheme.officialLink}`
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      <GovtHeader />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-navy-600 text-sm font-medium mb-3">
          <span>←</span> Results
        </button>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-saffron-100 flex items-center justify-center flex-shrink-0 text-2xl">
            {scheme.icon || '🏛️'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scheme.categoryColor}`}>
                {scheme.category}
              </span>
              <MatchStrengthPill strength={scheme.matchStrength} />
            </div>
            <h1 className="font-display font-bold text-lg text-gray-900 leading-tight">
              {scheme.name}
            </h1>
            <p className="text-xs text-gray-500">{scheme.ministry}</p>
          </div>
        </div>

        {/* Benefit highlight */}
        <div className="mt-3 bg-india-green-600 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-white font-bold text-base">{scheme.benefit}</p>
            <p className="text-india-green-100 text-xs">Direct government benefit</p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-2 w-10 rounded-sm overflow-hidden tricolor-bar" />
          <span className="text-[10px] text-gray-400 font-medium">Official Government Scheme · Verified Source</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-8 pt-4 space-y-4">

        {/* Eligibility */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-display font-bold text-base text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-india-green-100 flex items-center justify-center text-sm">✅</span>
            You are Eligible If…
          </h2>
          <div className="space-y-2.5">
            {(scheme.eligibility as string[]).map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-india-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Documents + WhatsApp share */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center text-sm">📄</span>
              Documents Needed ({scheme.docs})
            </h2>
            <button
              onClick={shareChecklist}
              className="flex items-center gap-1.5 bg-india-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform shadow-sm"
            >
              <span>📲</span> Share
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(scheme.documents as { icon: string; name: string }[]).map((doc, i) => (
              <div key={i} className="flex items-center gap-2 bg-navy-50 rounded-xl px-3 py-2.5 border border-navy-100">
                <span className="text-xl">{doc.icon}</span>
                <span className="text-xs font-medium text-navy-800 leading-tight">{doc.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">Tap Share to send this list via WhatsApp</p>
        </section>

        {/* Step-by-step guide with ELI5 */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-saffron-100 flex items-center justify-center text-sm">📋</span>
              How to Apply
            </h2>
            <button
              onClick={() => { setEli5Mode(!eli5Mode); setEli5Step(null) }}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                eli5Mode
                  ? 'bg-navy-600 text-white border-navy-600'
                  : 'bg-white text-navy-600 border-navy-200 hover:bg-navy-50'
              }`}
            >
              🧒 {eli5Mode ? 'Simple ON' : 'Explain simply'}
            </button>
          </div>
          {eli5Mode && (
            <div className="bg-navy-50 rounded-xl px-3 py-2 mb-3 border border-navy-100">
              <p className="text-xs text-navy-700">🧒 <strong>Easy mode ON</strong> — Tap each step to see a plain-language explanation.</p>
            </div>
          )}
          <div className="space-y-2">
            {(scheme.steps as string[]).map((step: string, i: number) => (
              <div key={i}>
                <button
                  className="w-full text-left"
                  onClick={() => eli5Mode ? setEli5Step(eli5Step === i ? null : i) : undefined}
                >
                  <div className={`flex items-start gap-3 p-2 rounded-xl transition-colors ${
                    eli5Mode ? 'hover:bg-saffron-50 cursor-pointer' : ''
                  }`}>
                    <div className="w-7 h-7 rounded-full bg-saffron-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-snug pt-0.5">{step}</p>
                      {eli5Mode && eli5Step === i && (
                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <p className="text-xs text-amber-900 leading-relaxed">🧒 {getEli5(i)}</p>
                        </div>
                      )}
                      {eli5Mode && eli5Step !== i && (
                        <p className="text-[10px] text-saffron-500 mt-0.5">Tap to explain simply ↓</p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Official link */}
        <div className="bg-navy-900 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-base">Apply Online</p>
            <p className="text-navy-300 text-xs mt-0.5">Official Government Portal</p>
          </div>
          <a
            href={scheme.officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-saffron-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Open →
          </a>
        </div>

        {/* Re-check over time card (Product Thinking Feature) */}
        <div className="bg-white rounded-2xl border border-dashed border-navy-200 p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⏰</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-navy-900 leading-tight">Criteria or Income Changed?</h3>
              <p className="text-xs text-gray-500">Schemes and thresholds update every financial cycle.</p>
            </div>
          </div>
          <button
            onClick={handleReminder}
            className="w-full bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-200 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99]"
          >
            <span>🔔</span> Remind me to re-check eligibility in 6 months
          </button>
        </div>

        {/* SMS / Offline Access Footnote */}
        <div className="px-1 py-1 text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            📱 No smartphone? This scheme can be verified via SMS / IVR toll-free at <span className="font-semibold text-gray-600">1800-11-4000</span>
          </p>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {reminderToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-900 text-white text-xs font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-navy-700 animate-bounce">
          <span className="text-base">✅</span>
          <span>Reminder set! We'll prompt you to re-verify in 6 months.</span>
        </div>
      )}

      {/* Sticky CTA */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 safe-area-bottom">
        <button className="w-full bg-india-green-600 text-white font-display font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform shadow-lg flex items-center justify-center gap-2">
          <span>🚀</span> Apply for This Scheme
        </button>
      </div>
    </div>
  )
}

function NoMatchScreen({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-warm-bg screen-enter">
      <GovtHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-saffron-50 rounded-full flex items-center justify-center mb-6 text-5xl">
          🤔
        </div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-3">
          No exact match found
        </h2>
        <p className="text-base text-gray-600 max-w-xs leading-relaxed">
          Don't worry! Try describing your situation differently, or speak to a helpline officer.
        </p>

        <div className="mt-8 w-full space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-saffron-500 text-white font-display font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform shadow flex items-center justify-center gap-2"
          >
            <span>🎙️</span> Try Speaking Again
          </button>
          <button
            onClick={onBack}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 font-display font-semibold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <span>✏️</span> Rephrase My Question
          </button>
        </div>

        {/* Helpline */}
        <div className="mt-8 bg-navy-50 border border-navy-100 rounded-2xl p-4 w-full">
          <p className="text-sm font-semibold text-navy-900 mb-1">📞 Talk to a real person</p>
          <p className="text-xl font-bold text-navy-700 mb-1">1800-11-4000</p>
          <p className="text-xs text-gray-500">Toll-free · Mon–Sat · 8 AM – 8 PM · All languages</p>
        </div>

        <p className="mt-6 text-xs text-gray-400 max-w-xs">
          Over 500 schemes are listed. A human officer can help find what you need.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0])
  const [selectedScheme, setSelectedScheme] = useState<typeof SCHEMES[0] | null>(null)
  const [schemes, setSchemes] = useState<typeof SCHEMES>(SCHEMES)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFallback, setIsFallback] = useState(false)

  const handleLanguageSelect = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang)
    setScreen('home')
  }

  const handleMic = () => setScreen('listening')
  const handleType = () => setScreen('results')
  const handleChip = async (text: string) => {
    setQuery(text)
    setScreen('listening')
    setIsLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || ''
      const response = await fetch(`${apiBase}/api/schemes/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: selectedLang.name })
      })

      const data = await response.json()
      const parsedSchemes = data.schemes && data.schemes.length > 0 ? data.schemes : SCHEMES

      setIsFallback(!data.schemes || data.schemes.length === 0)
      setSchemes(parsedSchemes)
      setScreen('results')
    } catch (error) {
      console.error('Backend call failed, using fallback:', error)
      setIsFallback(true)
      setSchemes(SCHEMES)
      setScreen('results')
    } finally {
      setIsLoading(false)
    }
  }
    const handleListeningDone = () => setScreen('results')

  const handleScheme = (scheme: typeof SCHEMES[0]) => {
    setSelectedScheme(scheme)
    setScreen('detail')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      {/* Mobile frame */}
      <div
        className="relative bg-warm-bg overflow-hidden shadow-2xl"
        style={{
          width: '375px',
          minHeight: '812px',
          maxHeight: '90vh',
          borderRadius: '40px',
          border: '8px solid #1a1a2e',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Status bar */}
        <div className="bg-white flex items-center justify-between px-6 py-2 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-800">9:41</span>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3 text-gray-800" fill="currentColor" viewBox="0 0 24 16">
              <rect x="0" y="10" width="3" height="6" rx="1"/>
              <rect x="5" y="6" width="3" height="10" rx="1"/>
              <rect x="10" y="2" width="3" height="14" rx="1"/>
              <rect x="15" y="0" width="3" height="16" rx="1"/>
            </svg>
            <svg className="w-4 h-3 text-gray-800" fill="currentColor" viewBox="0 0 25 12">
              <path d="M12.5 0C7.2 0 2.5 2.2 0 5.7l2.3 2.3C4.3 5.5 8.2 3.5 12.5 3.5S20.7 5.5 22.7 8L25 5.7C22.5 2.2 17.8 0 12.5 0z"/>
              <path d="M12.5 5.5c-3.6 0-6.8 1.5-9 3.9l2.3 2.3c1.7-1.9 4.2-3 6.7-3s5 1.1 6.7 3l2.3-2.3c-2.2-2.4-5.4-3.9-9-3.9z"/>
              <circle cx="12.5" cy="12" r="2"/>
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-2.5 rounded-sm border border-gray-700 relative flex items-center px-0.5">
                <div className="h-1.5 bg-india-green-500 rounded-sm" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-auto scrollbar-hide">
          {screen === 'login' && (
          <LoginScreen
            onLogin={() => setScreen('language')}
            onGuest={() => setScreen('language')}
          />
        )}
        {screen === 'language' && (
            <LanguageScreen onSelect={handleLanguageSelect} />
          )}
          {screen === 'home' && (
            <HomeScreen
              lang={selectedLang}
              onMic={handleMic}
              onType={handleType}
              onChip={handleChip}
            />
          )}
          {screen === 'listening' && (
            <ListeningScreen onDone={handleListeningDone} />
          )}
          {screen === 'results' && (
            <ResultsScreen
              schemes={schemes}
              query={query}
              isFallback={isFallback}
              onScheme={handleScheme}
              onBack={() => setScreen('home')}
            />
          )}
          {screen === 'detail' && selectedScheme && (
            <DetailScreen
              scheme={selectedScheme}
              onBack={() => setScreen('results')}
            />
          )}
          {screen === 'nomatch' && (
            <NoMatchScreen
              onRetry={handleMic}
              onBack={() => setScreen('home')}
            />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bg-white/90 backdrop-blur-md border-t border-gray-100 py-2 px-4 flex items-center justify-around flex-shrink-0 z-50">
          {[
            { id: 'login', icon: '👤', label: 'Profile' },
            { id: 'language', icon: '🌐', label: 'Language' },
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'results', icon: '📋', label: 'Schemes' },
            { id: 'detail', icon: 'ℹ️', label: 'Details' }
          ].map((tab) => {
            const isActive = screen === tab.id || (tab.id === 'results' && screen === 'listening') || (tab.id === 'results' && screen === 'nomatch');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'detail' && !selectedScheme) setSelectedScheme(schemes[0] || SCHEMES[0])
                  setScreen(tab.id as Screen)
                }}
                className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-300 ease-out active:scale-95 ${
                  isActive 
                    ? 'text-saffron-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-saffron-50 rounded-xl -z-10 animate-fade-in" />
                )}
                <span className={`text-xl transition-transform duration-300 ${isActive ? '-translate-y-1 scale-110' : 'translate-y-0.5'}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-semibold absolute bottom-1 transition-all duration-300 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
