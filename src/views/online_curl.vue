<template>
  <div class="container">
    <h2>Curl Sender</h2>

    <label class="label">Curl 输入（多行）</label>
    <textarea v-model="curlText" class="curl-input" placeholder='例如: curl -X POST "https://httpbin.org/post" -H "Content-Type: application/json" -d "{\"a\":1}"'></textarea>

    <div class="controls">
      <button @click="onSend" :disabled="loading">{{ loading ? 'Sending...' : 'Send' }}</button>
      <button @click="onParse">Parse</button>
      <button @click="onClear">Clear</button>
      <button @click="onCopyResult" :disabled="!lastResult">Copy Result</button>
    </div>

    <div class="parsed">
      <h3>Parsed Request</h3>
      <div v-if="parsed.url">
        <div><strong>URL:</strong> {{ parsed.url }}</div>
        <div><strong>Method:</strong> {{ parsed.method }}</div>
        <div><strong>Headers:</strong>
          <pre class="small-pre">{{ parsed.headers }}</pre>
        </div>
        <div v-if="parsed.body"><strong>Body:</strong>
          <pre class="small-pre">{{ parsed.body }}</pre>
        </div>
      </div>
      <div v-else>
        <em>No parsed request yet (click Parse).</em>
      </div>
    </div>

    <div class="result">
      <h3>Result</h3>
      <div v-if="error" class="error">Error: {{ error }}</div>
      <div v-if="response">
        <div><strong>Status:</strong> {{ response.status }} {{ response.statusText }}</div>
        <div><strong>Headers:</strong>
          <pre class="small-pre">{{ response.headersText }}</pre>
        </div>
        <div><strong>Body:</strong>
          <pre class="body-pre">{{ response.bodyText }}</pre>
        </div>
      </div>
      <div v-else>
        <em>No response yet.</em>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const curlText = ref('')
const parsed = ref({ url: '', method: 'GET', headers: {}, body: '' })
const loading = ref(false)
const response = ref(null)
const error = ref('')
const lastResult = ref('')

function onClear() {
  curlText.value = ''
  parsed.value = { url: '', method: 'GET', headers: {}, body: '' }
  response.value = null
  error.value = ''
  lastResult.value = ''
}

function onParse() {
  try {
    parsed.value = parseCurl(curlText.value)
    error.value = ''
  } catch (e) {
    error.value = 'Parse error: ' + e.message
  }
}

async function onSend() {
  error.value = ''
  response.value = null
  try {
    parsed.value = parseCurl(curlText.value)
  } catch (e) {
    error.value = 'Parse error: ' + e.message
    return
  }

  if (!parsed.value.url) {
    error.value = 'No URL parsed from curl input.'
    return
  }

  loading.value = true
  try {
    const opts = { method: parsed.value.method, headers: parsed.value.headers }
    if (parsed.value.body) opts.body = parsed.value.body

    const res = await fetch(parsed.value.url, opts)

    const headersObj = {}
    res.headers.forEach((v, k) => (headersObj[k] = v))

    const contentType = res.headers.get('content-type') || ''
    let bodyText = ''
    try {
      if (contentType.includes('application/json')) {
        bodyText = JSON.stringify(await res.json(), null, 2)
      } else {
        bodyText = await res.text()
      }
    } catch (e) {
      bodyText = await res.text()
    }

    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: headersObj,
      headersText: JSON.stringify(headersObj, null, 2),
      bodyText
    }

    lastResult.value = bodyText
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

function onCopyResult() {
  if (!lastResult.value) return
  navigator.clipboard.writeText(lastResult.value)
}

// Minimal curl to fetch parser. Handles: URL, -X METHOD, -H "Key: Value", -d/--data
function parseCurl(curl) {
  const out = { url: '', method: 'GET', headers: {}, body: '' }
  if (!curl || !curl.trim()) return out

  // normalize quotes
  const text = curl.replace(/\\"/g, '\"')

  // get URL (first http(s):// occurrence)
  const urlMatch = text.match(/https?:\/\/[^\s"']+/)

  if (urlMatch) out.url = urlMatch[0].replace(/"/g, '')

  // method
  const methodMatch = text.match(/-X\s+([A-Z]+)/i)
  if (methodMatch) out.method = methodMatch[1].toUpperCase()

  // headers -H "Key: Value"
  const headerRegex = /-H\s+(?:'([^']*)'|"([^"]*)"|([^\s]+))/g
  let m
  while ((m = headerRegex.exec(text)) !== null) {
    const h = m[1] || m[2] || m[3]
    const parts = h.split(/:\s*/)
    if (parts.length >= 2) {
      const key = parts.shift().trim()
      const val = parts.join(':').trim()
      out.headers[key] = val
    }
  }

  // data -d or --data-raw or --data
  const dataRegex = /(?:--data-raw|--data-binary|--data|-d)\s+(?:'([^']*)'|"([^\"]*)"|([^\s]+))/i
  const dataMatch = text.match(dataRegex)
  if (dataMatch) out.body = dataMatch[1] || dataMatch[2] || dataMatch[3] || ''

  // if body exists and no Content-Type, guess json when it looks like JSON
  if (out.body && !Object.keys(out.headers).some(k => k.toLowerCase() === 'content-type')) {
    const t = out.body.trim()
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      out.headers['Content-Type'] = 'application/json'
    }
  }

  return out
}
</script>

<style scoped>
.container{
  max-width:900px;
  margin:20px auto;
  font-family: Arial, Helvetica, sans-serif;
}
.label{display:block;margin-bottom:6px;font-weight:600}
.curl-input{width:100%;min-height:120px;padding:10px;border:1px solid #ddd;border-radius:6px;font-family:monospace}
.controls{margin:10px 0;display:flex;gap:8px}
.controls button{padding:6px 12px;border:1px solid #2b6cb0;background:#3182ce;color:white;border-radius:4px;cursor:pointer}
.controls button:disabled{opacity:0.6;cursor:not-allowed}
.parsed, .result{margin-top:14px;padding:12px;border:1px solid #eee;border-radius:6px;background:#fafafa}
.small-pre{background:#fff;padding:8px;border-radius:4px;border:1px solid #eee;font-family:monospace;white-space:pre-wrap}
.body-pre{max-height:400px;overflow:auto;background:#fff;padding:8px;border-radius:4px;border:1px solid #eee;font-family:monospace;white-space:pre-wrap}
.error{color:#b91c1c;font-weight:600}
</style>
