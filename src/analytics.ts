type AnalyticsChoice='granted'|'denied';
type Gtag=(...args:unknown[])=>void;
declare global {
  interface Window {dataLayer?:unknown[];gtag?:Gtag}
}
const measurementId=(import.meta.env.VITE_GA_MEASUREMENT_ID||'').trim();
const analyticsHost=(import.meta.env.VITE_ANALYTICS_HOST||'overlaps-time.vercel.app').trim();
export const ANALYTICS_CHOICE_KEY='overlap-analytics-choice';
const eventNames=['city_added','availability_saved','availability_copied','calendar_connected'] as const;
export type AnalyticsEvent=typeof eventNames[number];
let started=false;
let consentGranted=false;

export function analyticsConfigured():boolean {
  return import.meta.env.PROD && /^G-[A-Z0-9]{4,}$/.test(measurementId) && window.location.hostname===analyticsHost;
}
export function readAnalyticsChoice():AnalyticsChoice|null {
  try {const value=localStorage.getItem(ANALYTICS_CHOICE_KEY);return value==='granted'||value==='denied'?value:null;}catch{return null;}
}
function pageContext() {
  let referrer='';
  try {const parsed=new URL(document.referrer);if(parsed.protocol==='https:'||parsed.protocol==='http:')referrer=parsed.origin+'/';}catch{/* Direct visit. */}
  return {page_location:window.location.origin+'/',page_referrer:referrer,page_title:'Overlap — Free Time Zone Meeting Planner & World Clock'};
}
function disableFlag(disabled:boolean) {
  (window as unknown as Record<string,unknown>)[`ga-disable-${measurementId}`]=disabled;
}
function clearAnalyticsCookies() {
  for(const cookie of document.cookie.split(';')) {
    const name=cookie.trim().split('=')[0];
    if(name==='_ga'||name.startsWith('_ga_'))document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}
export function startAnalytics() {
  if(!analyticsConfigured()||started)return;
  consentGranted=true;
  started=true;
  disableFlag(false);
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(..._args:unknown[]){window.dataLayer!.push(arguments);};
  const gtag=window.gtag;
  gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  gtag('consent','update',{analytics_storage:'granted'});
  gtag('set',{...pageContext(),allow_google_signals:false,allow_ad_personalization_signals:false,ads_data_redaction:true,url_passthrough:false});
  gtag('js',new Date());
  gtag('config',measurementId,{...pageContext(),send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'none',cookie_flags:'SameSite=Lax;Secure',cookie_expires:60*60*24*180,cookie_update:false});
  gtag('event','page_view',{...pageContext(),send_to:measurementId});
  const script=document.createElement('script');
  script.id='overlap-google-analytics';
  script.async=true;
  script.referrerPolicy='origin';
  script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
}
export function saveAnalyticsChoice(choice:AnalyticsChoice) {
  try{localStorage.setItem(ANALYTICS_CHOICE_KEY,choice);}catch{/* Apply to this visit when storage is unavailable. */}
  if(choice==='granted'){startAnalytics();return;}
  stopAnalytics();
}
export function stopAnalytics() {
  consentGranted=false;
  disableFlag(true);
  clearAnalyticsCookies();
  document.getElementById('overlap-google-analytics')?.remove();
  // A reload unloads Google's event listeners too. App data remains in browser storage.
  if(started)window.location.reload();
}
export function trackAnalyticsEvent(event:AnalyticsEvent) {
  if(!analyticsConfigured()||!consentGranted||!started||!eventNames.includes(event))return;
  // No values from calendars, city searches, saved slots, or form fields are accepted.
  window.gtag?.('event',event,{...pageContext(),send_to:measurementId});
}
