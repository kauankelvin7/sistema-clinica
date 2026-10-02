import { expect, test, type Page, type Route } from '@playwright/test'

const patients = [
  { id: 1, nome_completo: 'Pessoa Sintética Um', tipo_doc: 'CPF', numero_doc: '111.222.333-44', cargo: 'Analista de Teste', empresa: 'Empresa Fictícia A' },
  { id: 2, nome_completo: 'Pessoa Sintética Dois', tipo_doc: 'RG', numero_doc: 'RG-TESTE-02', cargo: 'Técnica de Teste', empresa: 'Empresa Fictícia B' },
]
const doctors = [
  { id: 1, nome_completo: 'Profissional Sintético Um', tipo_crm: 'CRM', crm: '12345', uf_crm: 'DF' },
  { id: 2, nome_completo: 'Profissional Sintético Dois', tipo_crm: 'CRO', crm: '67890', uf_crm: 'SP' },
]
const previewHtml = '<!doctype html><html><body><h1>Prévia sintética</h1></body></html>'

type MockState = {
  authenticated: boolean
  directoryStatus: number
  directory: { patients: typeof patients; doctors: typeof doctors; synced_at: string }
  directoryDelay: number
  loginRequests: Array<Record<string, unknown>>
  generateRequests: Array<Record<string, unknown>>
  syncStatus: number
}

async function mockApi(page: Page, overrides: Partial<MockState> = {}) {
  const state: MockState = {
    authenticated: false,
    directoryStatus: 200,
    directory: { patients, doctors, synced_at: '2026-10-02T12:00:00Z' },
    directoryDelay: 0,
    loginRequests: [],
    generateRequests: [],
    syncStatus: 200,
    ...overrides,
  }

  await page.context().addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'serviceWorker')
    const root = window as Window & { __openedWindows?: Array<{ url: string; target?: string; features?: string }>; __printCalls?: number }
    root.__openedWindows = []
    root.__printCalls = 0
    window.print = () => {
      const root = window.top as Window & { __printCalls?: number }
      root.__printCalls = (root.__printCalls ?? 0) + 1
    }
    window.open = (url, target, features) => {
      const root = window.top as Window & { __openedWindows?: Array<{ url: string; target?: string; features?: string }> }
      root.__openedWindows?.push({ url: String(url), target, features })
      return null
    }
  })

  await page.route('**/api/**', async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()

    if (url.pathname === '/api/auth/session' && method === 'GET') {
      return route.fulfill({ json: { authenticated: state.authenticated } })
    }
    if (url.pathname === '/api/auth/token' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>
      state.loginRequests.push(body)
      state.authenticated = body.username === 'usuario-sintetico' && body.password === 'senha-sintetica'
      return route.fulfill({ status: state.authenticated ? 200 : 401, json: { authenticated: state.authenticated } })
    }
    if (url.pathname === '/api/auth/logout' && method === 'POST') {
      state.authenticated = false
      return route.fulfill({ json: { authenticated: false } })
    }
    if (url.pathname === '/api/directory' && method === 'GET') {
      if (!state.authenticated) return route.fulfill({ status: 401, json: { detail: 'Unauthorized' } })
      if (state.directoryDelay) await new Promise((resolve) => setTimeout(resolve, state.directoryDelay))
      if (state.directoryStatus === 401) state.authenticated = false
      return route.fulfill({ status: state.directoryStatus, json: state.directoryStatus === 200 ? state.directory : { detail: 'Synthetic offline response' } })
    }
    if (url.pathname === '/api/check-duplicate') return route.fulfill({ json: { existe: false } })
    if (url.pathname === '/api/directory/sync' && method === 'POST') {
      return route.fulfill({ status: state.syncStatus, json: { ok: state.syncStatus === 200 } })
    }
    if (url.pathname === '/api/generate-html' && method === 'POST') {
      state.generateRequests.push(request.postDataJSON() as Record<string, unknown>)
      return route.fulfill({ contentType: 'text/html; charset=utf-8', body: previewHtml })
    }
    return route.fulfill({ status: 404, json: { detail: 'Unmocked synthetic test request' } })
  })

  return state
}

async function cachedPatientName(page: Page) {
  return page.evaluate(() => new Promise<string | null>((resolve) => {
    const request = indexedDB.open('sistema-clinica-directory', 1)
    request.onsuccess = () => {
      const db = request.result
      const read = db.transaction('snapshots', 'readonly').objectStore('snapshots').get('active-directory-v1')
      read.onsuccess = () => {
        db.close()
        resolve(read.result?.patients?.[0]?.nome_completo ?? null)
      }
      read.onerror = () => resolve(null)
    }
    request.onerror = () => resolve(null)
  }))
}

test('auth, remember_me, and logout', async ({ page }) => {
  const api = await mockApi(page)
  await page.goto('/')
  await expect(page.getByLabel(/Usuário/)).toBeVisible()

  await page.getByLabel(/Usuário/).fill('usuario-incorreto')
  await page.getByPlaceholder('Sua senha secreta').fill('senha-incorreta')
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível entrar')

  await page.getByLabel(/Usuário/).fill('usuario-sintetico')
  await page.getByPlaceholder('Sua senha secreta').fill('senha-sintetica')
  await page.getByLabel('Lembrar de mim neste dispositivo').check()
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click()
  await expect(page.getByRole('heading', { name: 'Nova homologação médica' })).toBeVisible()
  expect(api.loginRequests.map((body) => body.remember_me)).toEqual([false, true])
  expect(api.loginRequests.every((body) => body.username === 'usuario-incorreto' || body.username === 'usuario-sintetico')).toBe(true)

  await expect.poll(() => cachedPatientName(page)).toBe('Pessoa Sintética Um')
  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page.getByLabel(/Usuário/)).toBeVisible()
  expect(await cachedPatientName(page)).toBeNull()
})

test('401 directory response ends session and clears local directory', async ({ page }) => {
  const api = await mockApi(page, { authenticated: true })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nova homologação médica' })).toBeVisible()
  await expect.poll(() => cachedPatientName(page)).toBe('Pessoa Sintética Um')
  const patientInput = page.getByPlaceholder('Digite o nome completo do paciente')
  await patientInput.fill('Pessoa Sintética Um')
  await expect(page.getByRole('button', { name: 'Pessoa Sintética Um' })).toBeVisible()
  api.directoryStatus = 401
  await page.getByRole('button', { name: 'Atualizar cadastros' }).click()
  await expect(page.getByLabel(/Usuário/)).toBeVisible()
  expect(await cachedPatientName(page)).toBeNull()
  expect(api.authenticated).toBe(false)
})

test('patient and doctor autocomplete, modal search, and filters', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  await expect(page.getByPlaceholder('Digite o nome completo do paciente')).toBeVisible()

  const patientInput = page.getByPlaceholder('Digite o nome completo do paciente')
  await patientInput.fill('Pessoa Sintética Um')
  await page.getByRole('button', { name: 'Pessoa Sintética Um' }).click()
  await expect(page.locator('input[placeholder="000.000.000-00"]')).toHaveValue('111.222.333-44')

  await page.getByRole('button', { name: /Buscar Pacientes Cadastrados/ }).click()
  const patientDialog = page.getByRole('dialog', { name: 'Pacientes Cadastrados' })
  await patientDialog.getByRole('combobox').selectOption('RG')
  await patientDialog.getByPlaceholder('Buscar por nome, CPF ou empresa...').fill('Empresa Fictícia B')
  await expect(patientDialog.getByRole('button', { name: /Pessoa Sintética Dois/ })).toBeVisible()
  await patientDialog.getByRole('button', { name: /Pessoa Sintética Dois/ }).click()
  await expect(patientInput).toHaveValue('Pessoa Sintética Dois')
  await expect(page.locator('input[placeholder="Número do RG"]')).toHaveValue('RG-TESTE-02')

  const doctorInput = page.getByPlaceholder('Dr. Nome do Médico')
  await doctorInput.fill('Profissional Sintético Um')
  await page.getByRole('button', { name: 'Profissional Sintético Um' }).click()
  await expect(page.locator('input[placeholder="123456"]')).toHaveValue('12345')

  await page.getByRole('button', { name: /Buscar Médicos Cadastrados/ }).click()
  const doctorDialog = page.getByRole('dialog', { name: 'Médicos Cadastrados' })
  await doctorDialog.getByRole('combobox').nth(0).selectOption('CRO')
  await doctorDialog.getByRole('combobox').nth(1).selectOption('SP')
  await doctorDialog.getByPlaceholder('Buscar por nome, CRM ou especialidade...').fill('Profissional Sintético Dois')
  await expect(doctorDialog.getByRole('button', { name: /Profissional Sintético Dois/ })).toBeVisible()
  await doctorDialog.getByRole('button', { name: /Profissional Sintético Dois/ }).click()
  await expect(doctorInput).toHaveValue('Profissional Sintético Dois')
  await expect(page.locator('input[placeholder="123456"]')).toHaveValue('67890')
  await expect(page.locator('select').nth(2)).toHaveValue('SP')
})

test('validation, exact generation payload, preview, single auto-print, and download', async ({ page }) => {
  const api = await mockApi(page, { authenticated: true })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Gerar Declaração' })).toBeVisible()
  await page.getByRole('button', { name: 'Gerar Declaração' }).click()
  await expect(page.getByRole('heading', { name: 'Campos Obrigatórios Pendentes' })).toBeVisible()
  expect(api.generateRequests).toHaveLength(0)
  await page.getByRole('button', { name: 'Entendi, vou preencher' }).click()

  await page.getByPlaceholder('Digite o nome completo do paciente').fill('Pessoa Sintética Payload')
  await page.locator('input[placeholder="000.000.000-00"]').fill('11122233344')
  await page.getByPlaceholder('Ex: Analista de Sistemas, Motorista').fill('Cargo Sintético')
  await page.getByPlaceholder('Ex: Empresa XYZ Ltda').fill('Empresa Fictícia Payload')
  await page.locator('input[type="date"]').fill('2026-01-02')
  await page.getByPlaceholder('Ex: 3 dias').fill('3')
  await page.getByLabel('Não Informado').check()
  await page.getByPlaceholder('Dr. Nome do Médico').fill('Profissional Sintético Payload')
  await page.getByPlaceholder('123456').fill('98765')
  await page.getByRole('button', { name: 'Gerar Declaração' }).click()

  await expect(page.getByText('Pré-visualização do Documento')).toBeVisible()
  await expect(page.frameLocator('iframe[title="Pré-visualização do documento"]').getByRole('heading', { name: 'Prévia sintética' })).toBeVisible()
  await page.waitForTimeout(400)
  expect(await page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls ?? 0)).toBe(1)
  const downloadEvent = page.waitForEvent('download')
  await page.getByTitle('Baixar como HTML').click()
  expect((await downloadEvent).suggestedFilename()).toBe('atestado_Pessoa_Sintetica_Payload.html')
  expect(api.generateRequests).toEqual([{
    paciente: {
      nome: 'Pessoa Sintética Payload',
      tipo_documento: 'CPF',
      numero_documento: '111.222.333-44',
      cargo: 'Cargo Sintético',
      empresa: 'Empresa Fictícia Payload',
    },
    atestado: {
      data_atestado: '2026-01-02',
      dias_afastamento: 3,
      cid: '',
      cid_nao_informado: true,
      tipo_atestado: 'saude',
    },
    medico: {
      nome: 'Profissional Sintético Payload',
      tipo_registro: 'CRM',
      numero_registro: '98765',
      uf_registro: 'DF',
    },
  }])
})

test('preferences persist and directory cache survives offline refresh; empty/error states render', async ({ page }) => {
  const api = await mockApi(page, { authenticated: true, directoryDelay: 800 })
  await page.goto('/')
  await expect(page.getByText('Sincronizando cadastros')).toBeVisible()
  const patientInput = page.getByPlaceholder('Digite o nome completo do paciente')
  await expect(patientInput).toBeVisible()
  await patientInput.fill('Pessoa Sintética Um')
  await expect(page.getByRole('button', { name: 'Pessoa Sintética Um' })).toBeVisible()
  await expect(page.getByText('Cadastros sincronizados')).toBeVisible()
  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  await page.getByRole('button', { name: 'Emerald Health' }).click()
  await page.getByRole('button', { name: 'English (US)' }).click()
  await page.getByRole('button', { name: 'Modo Escuro' }).click()
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(page.getByRole('heading', { name: 'Homologation System' })).toBeVisible()
  expect(await page.evaluate(() => ({
    language: localStorage.getItem('app_language'),
    palette: localStorage.getItem('app_palette'),
    theme: localStorage.getItem('theme'),
  }))).toEqual({ language: 'en', palette: 'emerald', theme: 'dark' })

  api.directoryStatus = 503
  await page.reload()
  await expect(page.getByRole('heading', { name: 'New medical homologation' })).toBeVisible()
  await expect(page.getByText('Busca instantânea pelo cache local')).toBeVisible()
  const englishPatientInput = page.getByPlaceholder('Enter patient full name')
  await englishPatientInput.fill('Pessoa Sintética Um')
  await expect(page.getByRole('button', { name: 'Pessoa Sintética Um' })).toBeVisible()

  await page.getByTitle('Alternar organização do formulário').click()
  expect(await page.evaluate(() => localStorage.getItem('layout_mode'))).toBe('vertical')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'New medical homologation' })).toBeVisible()
  await expect(page.locator('.workspace-grid')).toHaveCount(0)
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => ({ language: localStorage.getItem('app_language'), palette: localStorage.getItem('app_palette') })))
    .toEqual({ language: 'en', palette: 'emerald' })

  api.directoryStatus = 200
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.getByText('Cadastros sincronizados')).toBeVisible()

  const browser = page.context().browser()
  if (!browser) throw new Error('Expected browser-backed test context')
  const emptyContext = await browser.newContext()
  const emptyPage = await emptyContext.newPage()
  await mockApi(emptyPage, { authenticated: true, directory: { patients: [], doctors: [], synced_at: '2026-10-02T12:00:00Z' } })
  await emptyPage.goto('/')
  await expect(emptyPage.getByText('Cadastros sincronizados')).toBeVisible()
  await expect(emptyPage.getByText('0 pacientes · 0 médicos')).toBeVisible()

  const errorContext = await browser.newContext()
  const errorPage = await errorContext.newPage()
  await mockApi(errorPage, { authenticated: true, directoryStatus: 503 })
  await errorPage.goto('/')
  await expect(errorPage.getByText('Base temporariamente indisponível')).toBeVisible()
  await emptyContext.close()
  await errorContext.close()
})

test('official CRM, CRO, and RMS consultations retain targets and external fallback', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.route(/^https:\/\/(portal\.cfm\.org\.br|website\.cfo\.org\.br|maismedicos\.saude\.gov\.br)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Synthetic council fixture</title>' })
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nova homologação médica' })).toBeVisible()

  const registerType = page.locator('select').nth(1)
  const consultations = [
    ['CRM', 'https://portal.cfm.org.br/busca-medicos/'],
    ['CRO', 'https://website.cfo.org.br/profissionais-cadastrados/'],
    ['RMS', 'https://maismedicos.saude.gov.br/new/web/app.php/maismedicos/rms'],
  ] as const

  for (const [type, url] of consultations) {
    await registerType.selectOption(type)
    await page.getByRole('button', { name: `Consultar Registro ${type}` }).click()
    await expect(page.getByRole('heading', { name: `Consulta Oficial: ${type}` })).toBeVisible()
    const iframe = page.getByTitle(`Consulta ${type}`)
    await expect(iframe).toHaveAttribute('src', url)
    await expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups')
    await page.getByRole('button', { name: 'Abrir Janela Externa' }).click()
    const openedWindows = await page.evaluate(() => (window as Window & { __openedWindows?: Array<{ url: string; target?: string; features?: string }> }).__openedWindows)
    expect(openedWindows?.at(-1)).toMatchObject({ url, target: '_blank' })
    expect(openedWindows?.at(-1)?.features).toContain('width=1000')
    await expect(page.getByRole('heading', { name: `Consulta Oficial: ${type}` })).toHaveCount(0)
  }
})
