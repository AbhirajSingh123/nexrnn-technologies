import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@/styles/index.css'
import App from './App.jsx'

// ------------------------------------------------------------
// Global resource-fail guard: koi JS/CSS chunk load na ho paye
// (naya deploy + purani khuli tab) to page EK BAAR auto-reload hota hai.
// Error message / file path user ko kabhi screen par nahi dikhta.
// ------------------------------------------------------------
const CHUNK_FAIL_RE =
  /dynamically imported module|importing a module script|failed to fetch dynamically|loading chunk|chunkloaderror|loading css chunk|\/assets\/[\w.-]+\.(js|css)/i;
const RELOAD_FLAG = 'nx_chunk_reloaded';

function reloadOnceForChunkFail() {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return; // ek hi reload - loop nahi
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    return;
  }
  window.location.reload();
}

window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e?.reason?.message || e?.reason || '');
  if (CHUNK_FAIL_RE.test(msg)) {
    e.preventDefault();
    console.error('Chunk failed to load - auto reloading once.');
    reloadOnceForChunkFail();
  }
});

window.addEventListener('error', (e) => {
  const target = e?.target;
  // sirf resource errors (script/link/img), JS runtime errors ErrorBoundary sambhalta hai
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    const src = target.src || target.href || '';
    if (/\/assets\//.test(src)) reloadOnceForChunkFail();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
