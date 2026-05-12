// Dobby Studio — Internationalisation (i18n)
// Supports: en (English), hi (Hindi), gu (Gujarati)
// Usage: import { t, setLang, getLang } from './i18n.js'

const STRINGS = {
  en: {
    // Header
    'app.name':         'Dobby Studio',
    'header.undo':      'Undo',
    'header.redo':      'Redo',
    'header.share':     'Share',
    'header.upgrade':   'Upgrade to Pro',
    // Sidebar
    'sidebar.sett':     'Sett Builder',
    'sidebar.weave':    'Weave',
    'sidebar.ts':       'Thread Size',
    'sidebar.reps':     'Repeats',
    'sidebar.presets':  'Presets',
    'sidebar.gallery':  'My Designs',
    'sidebar.save':     'Save Design',
    'sidebar.threads':  'threads / repeat',
    // Canvas
    'canvas.fabric':    'Fabric',
    'canvas.draft':     'Draft',
    'canvas.peg':       'Peg Plan',
    'canvas.drape':     '3D Drape',
    'canvas.png':       '⬇ PNG',
    'canvas.json':      '⬇ JSON',
    'canvas.wif':       '⬇ WIF',
    'canvas.pdf':       '⬇ PDF Sheet',
    'canvas.share':     '🔗 Share',
    'canvas.copied':    '✓ Copied!',
    // Chat
    'chat.placeholder': 'Describe your fabric…',
    'chat.send':        'Send',
    'chat.remaining':   'calls remaining today',
    // Status
    'status.ready':     'Ready',
    'status.threads':   'threads',
    'status.shaft':     '-shaft',
    // Login
    'login.title':      'Welcome to Dobby Studio',
    'login.google':     'Continue with Google',
    'login.demo':       'Try Demo Mode',
    'login.tagline':    'AI-powered fabric & tartan design',
    // Landing
    'landing.enter':    'Enter Studio',
    'landing.skip':     'Skip intro',
    'landing.demo':     '🎯 Request a Demo for your Mill',
    'landing.community':'Join Ravelry / Spoonflower Community',
    // Upgrade
    'upgrade.title':    'Upgrade to Dobby Pro',
    'upgrade.cta':      'Upgrade Now',
    'upgrade.dismiss':  'Maybe later',
  },
  hi: {
    'app.name':         'डॉबी स्टूडियो',
    'header.undo':      'पूर्ववत',
    'header.redo':      'फिर करें',
    'header.share':     'शेयर करें',
    'header.upgrade':   'प्रो में अपग्रेड करें',
    'sidebar.sett':     'सेट बिल्डर',
    'sidebar.weave':    'बुनाई',
    'sidebar.ts':       'धागे का आकार',
    'sidebar.reps':     'दोहराव',
    'sidebar.presets':  'प्रीसेट',
    'sidebar.gallery':  'मेरे डिज़ाइन',
    'sidebar.save':     'डिज़ाइन सेव करें',
    'sidebar.threads':  'धागे / दोहराव',
    'canvas.fabric':    'कपड़ा',
    'canvas.draft':     'ड्राफ्ट',
    'canvas.peg':       'पेग प्लान',
    'canvas.drape':     '3D ड्रेप',
    'canvas.png':       '⬇ PNG',
    'canvas.json':      '⬇ JSON',
    'canvas.wif':       '⬇ WIF',
    'canvas.pdf':       '⬇ PDF शीट',
    'canvas.share':     '🔗 शेयर',
    'canvas.copied':    '✓ कॉपी हुआ!',
    'chat.placeholder': 'अपने कपड़े का वर्णन करें…',
    'chat.send':        'भेजें',
    'chat.remaining':   'कॉल आज बाकी',
    'status.ready':     'तैयार',
    'status.threads':   'धागे',
    'status.shaft':     '-शाफ्ट',
    'login.title':      'डॉबी स्टूडियो में आपका स्वागत है',
    'login.google':     'Google से जारी रखें',
    'login.demo':       'डेमो मोड आज़माएं',
    'login.tagline':    'AI-संचालित कपड़ा डिज़ाइन',
    'landing.enter':    'स्टूडियो में प्रवेश करें',
    'landing.skip':     'छोड़ें',
    'landing.demo':     '🎯 अपनी मिल के लिए डेमो मांगें',
    'landing.community':'Ravelry / Spoonflower समुदाय से जुड़ें',
    'upgrade.title':    'डॉबी प्रो में अपग्रेड करें',
    'upgrade.cta':      'अभी अपग्रेड करें',
    'upgrade.dismiss':  'बाद में',
  },
  gu: {
    'app.name':         'ડૉબી સ્ટુડિયો',
    'header.undo':      'પૂર્વ-ક્રિયા',
    'header.redo':      'ફરીથી કરો',
    'header.share':     'શેર કરો',
    'header.upgrade':   'પ્રો માં અપગ્રેડ',
    'sidebar.sett':     'સેટ બિલ્ડર',
    'sidebar.weave':    'વણાટ',
    'sidebar.ts':       'દોરાનું કદ',
    'sidebar.reps':     'પુનરાવર્તન',
    'sidebar.presets':  'પ્રીસેટ',
    'sidebar.gallery':  'મારા ડિઝાઇન',
    'sidebar.save':     'ડિઝાઇન સાચવો',
    'sidebar.threads':  'દોરા / પુનરાવર્તન',
    'canvas.fabric':    'કાપડ',
    'canvas.draft':     'ડ્રાફ્ટ',
    'canvas.peg':       'પેગ પ્લાન',
    'canvas.drape':     '3D ડ્રેપ',
    'canvas.png':       '⬇ PNG',
    'canvas.json':      '⬇ JSON',
    'canvas.wif':       '⬇ WIF',
    'canvas.pdf':       '⬇ PDF શીટ',
    'canvas.share':     '🔗 શેર',
    'canvas.copied':    '✓ કૉપિ!',
    'chat.placeholder': 'તમારા કાપડનું વર્ણન કરો…',
    'chat.send':        'મોકલો',
    'chat.remaining':   'કૉલ આજે બાકી',
    'status.ready':     'તૈયાર',
    'status.threads':   'દોરા',
    'status.shaft':     '-શાફ્ટ',
    'login.title':      'ડૉબી સ્ટુડિયોમાં આપનું સ્વાગત છે',
    'login.google':     'Google સાથે ચાલુ રાખો',
    'login.demo':       'ડેમો મોડ અજમાવો',
    'login.tagline':    'AI-સંચાલિત કાપડ ડિઝાઇન',
    'landing.enter':    'સ્ટુડિયોમાં પ્રવેશ',
    'landing.skip':     'છોડો',
    'landing.demo':     '🎯 તમારી મિલ માટે ડેમો માગો',
    'landing.community':'Ravelry / Spoonflower સમુદાયમાં જોડાઓ',
    'upgrade.title':    'ડૉબી પ્રો માં અપગ્રેડ',
    'upgrade.cta':      'હમણાં અપગ્રેડ',
    'upgrade.dismiss':  'પછી',
  }
}

let currentLang = localStorage.getItem('dobby-lang') || 'en'

export function getLang() { return currentLang }

export function setLang(lang) {
  if (!STRINGS[lang]) return
  currentLang = lang
  localStorage.setItem('dobby-lang', lang)
  window.dispatchEvent(new CustomEvent('dobby-lang-change', { detail: lang }))
}

export function t(key) {
  return STRINGS[currentLang]?.[key] || STRINGS.en[key] || key
}

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
]
