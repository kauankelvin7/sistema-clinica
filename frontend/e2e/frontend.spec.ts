import { expect, test, type Page, type Route } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const browserDiagnostics = new WeakMap<Page, { pageErrors: string[]; consoleErrors: string[] }>()

test.beforeEach(({ page }) => {
  const diagnostics = { pageErrors: [] as string[], consoleErrors: [] as string[] }
  browserDiagnostics.set(page, diagnostics)
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text())
  })
})

test.afterEach(async ({ page }, testInfo) => {
  const diagnostics = browserDiagnostics.get(page)
  if (!diagnostics) return
  await testInfo.attach('browser-diagnostics.json', {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json',
  })
  expect(diagnostics.pageErrors, 'Uncaught browser errors').toEqual([])
})

const palettes = [
  ['Garnet Burgundy', 'garnet'],
  ['Emerald Slate', 'emerald'],
  ['Midnight Blue', 'sapphire'],
  ['Amber Gold', 'amber'],
  ['Graphite Sand', 'graphite'],
] as const
const viewports = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]

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

    if (url.pathname === '/api/document-models' && method === 'GET') return route.fulfill({ json: [] })
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
  await expect(page.getByRole('option', { name: 'Pessoa Sintética Um' })).toBeVisible()
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
  await page.getByRole('option', { name: 'Pessoa Sintética Um' }).click()
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
  await page.getByRole('option', { name: 'Profissional Sintético Um' }).click()
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
  await expect(page.getByRole('button', { name: 'Gerar e imprimir' })).toBeVisible()
  await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
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
  await page.getByRole('button', { name: 'Gerar e imprimir' }).click()

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
  await expect(page.getByRole('option', { name: 'Pessoa Sintética Um' })).toBeVisible()
  await expect(page.getByText('Cadastros sincronizados')).toBeVisible()
  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  await page.getByRole('button', { name: 'Emerald Slate' }).click()
  await page.getByRole('button', { name: 'English (US)' }).click()
  await page.getByTestId('theme-dark').click()
  await page.getByTestId('settings-close').click()
  await expect(page.getByRole('heading', { name: 'Homologation System' })).toBeVisible()
  expect(await page.evaluate(() => ({
    language: localStorage.getItem('app_language'),
    palette: localStorage.getItem('app_palette'),
    theme: localStorage.getItem('theme'),
  }))).toEqual({ language: 'en', palette: 'emerald', theme: 'dark' })

  api.directoryStatus = 503
  await page.reload()
  await expect(page.getByRole('heading', { name: 'New medical homologation' })).toBeVisible()
  await expect(page.getByText('Records available on this device')).toBeVisible()
  const englishPatientInput = page.getByPlaceholder('Enter patient full name')
  await englishPatientInput.fill('Pessoa Sintética Um')
  await expect(page.getByRole('option', { name: 'Pessoa Sintética Um' })).toBeVisible()

  await page.locator('.layout-toggle').click()
  expect(await page.evaluate(() => localStorage.getItem('layout_mode'))).toBe('vertical')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'New medical homologation' })).toBeVisible()
  await expect(page.locator('.workspace-grid')).toHaveCount(0)
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => ({ language: localStorage.getItem('app_language'), palette: localStorage.getItem('app_palette') })))
    .toEqual({ language: 'en', palette: 'emerald' })

  api.directoryStatus = 200
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.getByText('Records updated from server')).toBeVisible()

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
    const iframe = page.getByTitle(`Consulta Oficial ${type}`)
    await expect(iframe).toHaveAttribute('src', url)
    await expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups')
    await page.getByRole('button', { name: 'Abrir Janela Externa' }).click()
    const openedWindows = await page.evaluate(() => (window as Window & { __openedWindows?: Array<{ url: string; target?: string; features?: string }> }).__openedWindows)
    expect(openedWindows?.at(-1)).toMatchObject({ url, target: '_blank' })
    expect(openedWindows?.at(-1)?.features).toContain('width=1000')
    await expect(page.getByRole('heading', { name: `Consulta Oficial: ${type}` })).toHaveCount(0)
  }
})

test('keyboard selection, dialog focus, and mobile drawer preserve form state', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.setViewportSize({ width: 375, height: 850 })
  await page.goto('/')
  const patient = page.getByRole('combobox', { name: 'Nome Completo do Paciente' })
  await patient.fill('Pessoa Sintética Um')
  await expect(patient).toHaveAttribute('aria-expanded', 'true')
  await patient.press('ArrowDown')
  await expect(page.getByRole('option', { name: 'Pessoa Sintética Um' })).toHaveAttribute('aria-selected', 'true')
  await patient.press('Enter')
  await expect(patient).toHaveValue('Pessoa Sintética Um')
  await patient.fill('Pessoa Sintética')
  await patient.press('Escape')
  await expect(patient).toHaveAttribute('aria-expanded', 'false')

  await page.getByPlaceholder('Ex: 3 dias').fill('4')
  await page.locator('input[type="date"]').fill('2026-02-03')
  await page.getByPlaceholder('Digite o código ou descrição (Ex: J00, gripe, dor)').fill('J00')
  const menuButton = page.getByRole('button', { name: 'Abrir navegação' })
  await menuButton.click()
  const navigation = page.getByRole('dialog', { name: 'Navegação principal' })
  await expect(navigation).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  expect(await navigation.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(navigation).toHaveCount(0)
  await expect(menuButton).toBeFocused()

  await menuButton.click()
  await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: 'Pacientes' }).click()
  const patientDialog = page.getByRole('dialog', { name: 'Pacientes Cadastrados' })
  await expect(patientDialog.getByPlaceholder('Buscar por nome, CPF ou empresa...')).toBeFocused()
  await patientDialog.getByRole('button', { name: /Pessoa Sintética Dois/ }).click()
  await expect(patient).toHaveValue('Pessoa Sintética Dois')
  await expect(page.getByPlaceholder('Ex: 3 dias')).toHaveValue('4')
  await expect(page.locator('input[type="date"]')).toHaveValue('2026-02-03')
  await expect(page.getByPlaceholder('Digite o código ou descrição (Ex: J00, gripe, dor)')).toHaveValue('J00')

  await page.getByPlaceholder('Dr. Nome do Médico').fill('Profissional Sintético Dois')
  await page.getByPlaceholder('Dr. Nome do Médico').press('ArrowDown')
  await page.getByPlaceholder('Dr. Nome do Médico').press('Enter')
  await page.getByPlaceholder('Ex: Empresa XYZ Ltda').fill('Empresa Preservada')
  await page.getByPlaceholder('Dr. Nome do Médico').fill('Profissional Sintético Um')
  await menuButton.click()
  await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: 'Médicos' }).click()
  const doctorDialog = page.getByRole('dialog', { name: 'Médicos Cadastrados' })
  await doctorDialog.getByRole('button', { name: /Profissional Sintético Um/ }).click()
  await expect(page.getByPlaceholder('Dr. Nome do Médico')).toHaveValue('Profissional Sintético Um')
  await expect(page.getByPlaceholder('Ex: Empresa XYZ Ltda')).toHaveValue('Empresa Preservada')
  await expect(patient).toHaveValue('Pessoa Sintética Dois')
  await expect(page.getByPlaceholder('Ex: 3 dias')).toHaveValue('4')
})

test('settings, header theme, and palette stay synchronized after reload', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  const settings = page.getByRole('dialog', { name: 'Configurações do Sistema' })
  await expect(settings).toBeVisible()
  await settings.getByRole('button', { name: 'Emerald Slate' }).click()
  await settings.getByRole('button', { name: 'Modo Escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('.sidebar-palette')).toContainText('Emerald Slate')
  await page.keyboard.press('Escape')
  await expect(settings).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Abrir configurações' })).toBeFocused()

  await page.getByTitle('Alternar Tema Claro/Escuro').click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Nova homologação médica' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.locator('.sidebar-palette')).toContainText('Emerald Slate')
  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  await expect(page.getByRole('button', { name: 'Emerald Slate' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('settings-close').click()
})

test('responsive overflow matrix: nine widths, five palettes, two themes', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  const issues: string[] = []

  for (const [paletteLabel, paletteKey] of palettes) {
    await page.getByRole('button', { name: 'Abrir configurações' }).click()
    await page.getByRole('button', { name: paletteLabel, exact: true }).last().click()
    await page.getByTestId('settings-close').click()
    expect(await page.evaluate(() => localStorage.getItem('app_palette'))).toBe(paletteKey)

    for (const theme of ['light', 'dark'] as const) {
      const currentTheme = await page.locator('html').evaluate((html) => html.classList.contains('dark') ? 'dark' : 'light')
      if (currentTheme !== theme) await page.getByTitle('Alternar Tema Claro/Escuro').click()
      await expect.poll(() => page.locator('html').evaluate((html) => html.classList.contains('dark') ? 'dark' : 'light')).toBe(theme)

      for (const width of viewports) {
        await page.setViewportSize({ width, height: 900 })
        const overflowing = await page.evaluate(() => {
          const visible = (element: Element | null): element is HTMLElement => Boolean(element && getComputedStyle(element).display !== 'none')
          return [document.documentElement, document.body, document.querySelector('.clinic-main'), document.querySelector('.workspace-grid'), document.querySelector('.clinic-sidebar--desktop')]
            .filter(visible)
            .filter((element) => element.scrollWidth > element.clientWidth + 1)
            .map((element) => `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''} ${element.scrollWidth}>${element.clientWidth}`)
        })
        if (overflowing.length) issues.push(`${width}px ${paletteKey}/${theme}: ${overflowing.join(', ')}`)

        if (width < 1024) {
          await page.getByRole('button', { name: 'Abrir navegação' }).click()
          const navOverflow = await page.getByRole('dialog', { name: 'Navegação principal' }).locator('.clinic-sidebar')
            .evaluate((element) => element.scrollWidth > element.clientWidth + 1)
          if (navOverflow) issues.push(`${width}px ${paletteKey}/${theme}: mobile navigation overflows`)
          await page.keyboard.press('Escape')
        }
      }
    }
  }

  expect(issues, `Responsive overflow findings (${issues.length}):\n${issues.join('\n')}`).toEqual([])
})

test('custom models save, reload, fill CPF, emit, and preserve homologation', async ({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept())
  await mockApi(page, { authenticated: true })
  type Model = { id: string; name: string; title: string; body: string; fields: Array<{ key: string; label: string }>; revision: number; updated_at: string }
  const stored: Model[] = []
  let conflict = false
  let generationFails = false
  const emitted: Array<{ revision: number; values: Record<string, string> }> = []
  await page.route('**/api/document-models**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') return route.fulfill({ json: stored })
    const payload = request.postDataJSON()
    if (request.url().endsWith('/generate')) {
      emitted.push(payload)
      return generationFails ? route.fulfill({ status: 503, json: { detail: 'Synthetic unavailable' } })
        : route.fulfill({ contentType: 'text/html', body: '<!doctype html><h1>Modelo sintético emitido</h1><p>111.222.333-44</p>' })
    }
    if (conflict && stored[0]) {
      stored[0] = { ...stored[0], name: 'Modelo atualizado em outra sessão', revision: stored[0].revision + 1 }
      conflict = false
    }
    const existing = stored[0]
    if (existing && payload.revision !== existing.revision) {
      return route.fulfill({ status: 409, json: { detail: 'Synthetic revision conflict' } })
    }
    const model = { ...payload, id: existing?.id || '123e4567-e89b-42d3-a456-426614174000', revision: (existing?.revision || 0) + 1, updated_at: '2026-10-02T12:00:00Z' }
    stored.splice(0, stored.length, model)
    return route.fulfill({ status: existing ? 200 : 201, json: model })
  })
  await page.goto('/')
  await page.getByPlaceholder('Ex: Empresa XYZ Ltda').fill('Empresa preservada ao abrir modelos')
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Modelos', exact: true }).click()
  await expect(page.getByText('Você ainda não criou modelos.')).toBeVisible()
  await page.getByRole('button', { name: 'Novo modelo', exact: true }).click()
  await page.getByLabel('Nome do modelo').fill('Modelo de aptidão')
  await page.getByLabel('Título do documento').fill('APTIDÃO FÍSICA')
  await page.getByLabel('Texto do modelo').fill('Texto de teste para {{nome}}. CPF: {{cpf}}. Cargo: {{cargo}}.')
  await page.getByLabel('{{nome}}', { exact: true }).fill('Nome')
  await page.getByLabel('{{cargo}}', { exact: true }).fill('Cargo')
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Modelo de aptidão' })).toBeVisible()
  expect(stored[0].fields).toEqual([{ key: 'nome', label: 'Nome' }, { key: 'cpf', label: 'CPF' }, { key: 'cargo', label: 'Cargo' }])
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Nova homologação', exact: true }).click()
  await expect(page.getByPlaceholder('Ex: Empresa XYZ Ltda')).toHaveValue('Empresa preservada ao abrir modelos')
  await page.locator('.model-shortcuts summary').click()
  await page.getByRole('region', { name: 'Seus modelos' }).getByRole('button', { name: 'Modelo de aptidão', exact: true }).click()
  await page.getByRole('button', { name: 'Emitir documento', exact: true }).click()
  expect(emitted).toHaveLength(0)
  await page.getByLabel('Nome', { exact: true }).fill('Pessoa Sintética')
  await page.getByLabel('CPF', { exact: true }).fill('11122233344')
  await expect(page.getByLabel('CPF', { exact: true })).toHaveValue('111.222.333-44')
  await page.getByLabel('Cargo', { exact: true }).fill('Vigilante sintético')
  generationFails = true
  await page.getByRole('button', { name: 'Emitir documento', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Seus dados foram mantidos')
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Pessoa Sintética')
  generationFails = false
  await page.getByRole('button', { name: 'Emitir documento', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Pré-visualização do Documento' })).toBeVisible()
  expect(emitted.at(-1)).toEqual({ revision: 1, values: { nome: 'Pessoa Sintética', cpf: '111.222.333-44', cargo: 'Vigilante sintético' } })
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar como HTML' }).click()
  expect((await download).suggestedFilename()).toBe('APTIDAO_FISICA.html')
  await page.getByRole('button', { name: 'Fechar pré-visualização' }).click()
  await page.getByRole('button', { name: 'Voltar aos modelos' }).click()
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await page.getByLabel('Nome do modelo').fill('Modelo renomeado sintético')
  conflict = true
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('outra sessão')
  await expect(page.getByLabel('Nome do modelo')).toHaveValue('Modelo renomeado sintético')
  await expect(page.getByLabel('Título do documento')).toHaveValue('APTIDÃO FÍSICA')
  expect(stored[0].revision).toBe(2)
  await page.getByRole('button', { name: 'Voltar aos modelos' }).click()
  await page.getByRole('button', { name: 'Atualizar lista', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Modelo atualizado em outra sessão' })).toBeVisible()
  await page.getByRole('article').getByRole('button', { name: 'Editar', exact: true }).click()
  await expect(page.getByLabel('Nome do modelo')).toHaveValue('Modelo atualizado em outra sessão')
  await expect(page.getByLabel('Título do documento')).toHaveValue('APTIDÃO FÍSICA')
  await page.getByLabel('Nome do modelo').fill('Modelo final sintético')
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click()
  await page.reload()
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Modelos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Modelo final sintético' })).toBeVisible()
  expect(stored[0].title).toBe('APTIDÃO FÍSICA')
  expect(stored[0].revision).toBe(3)
})

test('sticky actions leave focused form controls reachable', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 850 })
    for (const id of ['patient-name', 'patient-company', 'certificate-days', 'doctor-name', 'doctor-register-number']) {
      const control = page.locator(`#${id}`)
      await control.focus()
      const geometry = await control.evaluate((element) => ({
        control: { top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom },
        headerBottom: document.querySelector('.clinic-topbar')!.getBoundingClientRect().bottom,
        footerTop: document.querySelector('.clinic-footer')!.getBoundingClientRect().top,
      }))
      expect(geometry.control.top, `${width}px ${id} under header`).toBeGreaterThanOrEqual(geometry.headerBottom)
      expect(geometry.control.bottom, `${width}px ${id} under footer`).toBeLessThanOrEqual(geometry.footerTop)
    }
  }
})

test('login fits all widths and saved palettes without authentication', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  const issues: string[] = []
  for (const [, key] of palettes) {
    for (const theme of ['light', 'dark']) {
      await page.evaluate(({ key, theme }) => {
        localStorage.setItem('app_palette', key)
        localStorage.setItem('theme', theme)
      }, { key, theme })
      await page.reload()
      await expect(page.getByRole('button', { name: 'Entrar no Sistema' })).toBeVisible()
      expect(await page.locator('html').evaluate((html) => html.classList.contains('dark'))).toBe(theme === 'dark')
      for (const width of viewports) {
        await page.setViewportSize({ width, height: 900 })
        const overflow = await page.evaluate(() => [document.documentElement, document.body, document.querySelector('.login-panel')!]
          .some((element) => element.scrollWidth > element.clientWidth + 1))
        if (overflow) issues.push(`${width}px ${key}/${theme}`)
      }
    }
  }
  expect(issues).toEqual([])
})

test('overlays fit all supported widths and themes', async ({ page }) => {
  test.setTimeout(180_000)
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  const issues: string[] = []
  const checkDialog = async (context: string) => {
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const findings = await dialog.evaluate((element) => {
      const panel = element.firstElementChild as HTMLElement
      const rect = panel.getBoundingClientRect()
      return {
        overflow: element.scrollWidth > element.clientWidth + 1 || panel.scrollWidth > panel.clientWidth + 1,
        outside: rect.left < -1 || rect.right > innerWidth + 1,
        closeTargets: [...element.querySelectorAll('button[aria-label^="Fechar"]')].map((button) => {
          const { width, height } = button.getBoundingClientRect()
          return width >= 44 && height >= 44
        }),
      }
    })
    if (findings.overflow || findings.outside || findings.closeTargets.some((target) => !target)) {
      issues.push(`${context}: ${JSON.stringify(findings)}`)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  }
  for (const [label, key] of palettes) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Abrir configurações' }).click()
    await page.getByRole('button', { name: label, exact: true }).last().click()
    await page.getByTestId('settings-close').click()
    for (const theme of ['light', 'dark']) {
      const dark = await page.locator('html').evaluate((html) => html.classList.contains('dark'))
      if (dark !== (theme === 'dark')) await page.getByTitle('Alternar Tema Claro/Escuro').click()
      for (const width of viewports) {
        await page.setViewportSize({ width, height: 900 })
        const context = `${width}px ${key}/${theme}`
        await page.getByRole('button', { name: 'Abrir configurações' }).click()
        await checkDialog(`${context} settings`)
        await page.locator('.record-picker').first().click()
        await checkDialog(`${context} patients`)
        await page.locator('.record-picker').last().click()
        await checkDialog(`${context} doctors`)
        await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
        await checkDialog(`${context} validation`)
      }
    }
  }
  expect(issues).toEqual([])
})

test('document model list, editor, and fill fit all widths, palettes, and themes', async ({ page }) => {
  test.setTimeout(180_000)
  await mockApi(page, { authenticated: true })
  const model = {
    id: '123e4567-e89b-42d3-a456-426614174001', name: 'Modelo Sintético', title: 'Modelo Sintético', body: 'Documento de teste para {{nome}} e {{cpf}}.',
    fields: [{ key: 'nome', label: 'Nome' }, { key: 'cpf', label: 'CPF' }], revision: 1, updated_at: '2026-10-02T12:00:00Z',
  }
  await page.route('**/api/document-models**', (route) => route.request().method() === 'GET'
    ? route.fulfill({ json: [model] })
    : route.fulfill({ contentType: 'text/html', body: '<h1>Documento sintético</h1>' }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nova homologação médica' })).toBeVisible()
  const issues: string[] = []
  const navigateToModels = async () => {
    if (await page.getByRole('button', { name: 'Abrir navegação' }).isVisible()) {
      await page.getByRole('button', { name: 'Abrir navegação' }).click()
      await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: 'Modelos', exact: true }).click()
    } else {
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Modelos', exact: true }).click()
    }
    await expect(page.getByRole('region', { name: 'Modelos de documentos' })).toBeVisible()
  }
  const checkOverflow = async (width: number, palette: string, theme: string, mode: string) => {
    await page.setViewportSize({ width, height: 900 })
    const overflow = await page.evaluate(() => [
      document.documentElement,
      document.body,
      document.querySelector('.models-page'),
      document.querySelector('.models-grid'),
      document.querySelector('.models-editor'),
    ].filter((element): element is HTMLElement => Boolean(element && getComputedStyle(element).display !== 'none'))
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => `${element.className || element.tagName}:${element.scrollWidth}>${element.clientWidth}`))
    if (overflow.length) issues.push(`${width}px ${palette}/${theme}/${mode}: ${overflow.join(', ')}`)
  }

  for (const [paletteLabel, paletteKey] of palettes) {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Abrir configurações' }).click()
    await page.getByRole('button', { name: paletteLabel, exact: true }).last().click()
    await page.getByTestId('settings-close').click()
    for (const theme of ['light', 'dark'] as const) {
      const currentTheme = await page.locator('html').evaluate((html) => html.classList.contains('dark') ? 'dark' : 'light')
      if (currentTheme !== theme) await page.getByTitle('Alternar Tema Claro/Escuro').click()
      await expect.poll(() => page.locator('html').evaluate((html) => html.classList.contains('dark') ? 'dark' : 'light')).toBe(theme)
      await navigateToModels()
      for (const width of viewports) await checkOverflow(width, paletteKey, theme, 'list')
      await page.getByRole('article').getByRole('button', { name: 'Editar', exact: true }).click()
      for (const width of viewports) await checkOverflow(width, paletteKey, theme, 'editor')
      await page.getByRole('button', { name: 'Voltar aos modelos' }).click()
      await page.getByRole('article').getByRole('button', { name: 'Preencher e emitir', exact: true }).click()
      for (const width of viewports) await checkOverflow(width, paletteKey, theme, 'fill')
    }
  }
  expect(issues, `Document model overflow findings (${issues.length}):\n${issues.join('\n')}`).toEqual([])
})

test('preview capture: synthetic UI evidence', async ({ page }, testInfo) => {
  page.on('dialog', (dialog) => void dialog.accept())
  test.setTimeout(180_000)
  test.skip(process.env.CAPTURE_PREVIEW !== '1', 'Set CAPTURE_PREVIEW=1 to refresh user-facing screenshots')
  const output = path.resolve(process.env.PREVIEW_OUTPUT_DIR || '../../../outputs/preview')
  await mkdir(output, { recursive: true })
  const capture = async (name: string) => page.screenshot({ path: path.join(output, `${name}.png`), animations: 'disabled' })
  const api = await mockApi(page)
  const model = {
    id: '123e4567-e89b-42d3-a456-426614174002', name: 'Modelo sintético de declaração', title: 'Modelo sintético de declaração',
    body: 'Declaro para fins de teste que {{nome}} apresentou CPF {{cpf}}.',
    fields: [{ key: 'nome', label: 'Nome' }, { key: 'cpf', label: 'CPF' }], revision: 1, updated_at: '2026-10-02T12:00:00Z',
  }
  await page.route('**/api/document-models**', (route) => route.request().method() === 'GET'
    ? route.fulfill({ json: [model] })
    : route.fulfill({ contentType: 'text/html', body: '<!doctype html><h1>Documento sintético</h1>' }))
  await page.route(/^https:\/\/(portal\.cfm\.org\.br|website\.cfo\.org\.br|maismedicos\.saude\.gov\.br)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<title>Synthetic council fixture</title>' })
  )

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    api.authenticated = false
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Entrar no Sistema' })).toBeVisible()
    await capture(`login-${width}`)
    api.authenticated = true
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Nova homologação médica' })).toBeVisible()
    await capture(`workspace-${width}`)
    if (width === 375) {
      await page.getByPlaceholder('Dr. Nome do Médico').scrollIntoViewIfNeeded()
      await capture('workspace-375-scrolled')
      await page.evaluate(() => window.scrollTo(0, 0))
    }

    await page.getByRole('button', { name: 'Abrir configurações' }).click()
    await capture(`settings-${width}`)
    await page.keyboard.press('Escape')

    await page.getByTitle('Alternar Tema Claro/Escuro').click()
    await page.getByRole('button', { name: 'Abrir configurações' }).click()
    await capture(`settings-${width}-dark`)
    await page.keyboard.press('Escape')
    const openDarkPatientDirectory = async () => {
      if (width < 1024) {
        await page.getByRole('button', { name: 'Abrir navegação' }).click()
        await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: 'Pacientes' }).click()
      } else {
        await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Pacientes' }).click()
      }
    }
    await openDarkPatientDirectory()
    await capture(`patients-${width}-dark`)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
    await capture(`validation-${width}-dark`)
    await page.getByRole('button', { name: 'Entendi, vou preencher' }).click()
    await page.getByTitle('Alternar Tema Claro/Escuro').click()

    const openDirectory = async (label: string) => {
      if (width < 1024) {
        await page.getByRole('button', { name: 'Abrir navegação' }).click()
        await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: label }).click()
      } else {
        await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: label }).click()
      }
    }
    await openDirectory('Pacientes')
    await capture(`patients-${width}`)
    await page.keyboard.press('Escape')
    await openDirectory('Médicos')
    await capture(`doctors-${width}`)
    await page.keyboard.press('Escape')

    await page.locator('select').nth(1).selectOption('CRM')
    await page.getByRole('button', { name: 'Consultar Registro CRM' }).click()
    await capture(`consultation-${width}`)
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
    await capture(`validation-${width}`)
    await page.getByRole('button', { name: 'Entendi, vou preencher' }).click()

    await page.getByPlaceholder('Digite o nome completo do paciente').fill('Pessoa Sintética Payload')
    await page.locator('input[placeholder="000.000.000-00"]').fill('11122233344')
    await page.getByPlaceholder('Ex: Analista de Sistemas, Motorista').fill('Cargo Sintético')
    await page.getByPlaceholder('Ex: Empresa XYZ Ltda').fill('Empresa Fictícia')
    await page.locator('input[type="date"]').fill('2026-01-02')
    await page.getByPlaceholder('Ex: 3 dias').fill('3')
    await page.getByLabel('Não Informado').check()
    await page.getByPlaceholder('Dr. Nome do Médico').fill('Profissional Sintético Payload')
    await page.getByPlaceholder('123456').fill('98765')
    await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
    await expect(page.getByText('Pré-visualização do Documento')).toBeVisible()
    await capture(`preview-${width}`)
    await page.getByRole('button', { name: 'Fechar pré-visualização' }).click()

    if (width < 1024) {
      await page.getByRole('button', { name: 'Abrir navegação' }).click()
      await page.getByRole('dialog', { name: 'Navegação principal' }).getByRole('button', { name: 'Modelos', exact: true }).click()
    } else {
      await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Modelos', exact: true }).click()
    }
    await expect(page.getByRole('article').getByRole('heading', { name: 'Modelo sintético de declaração' })).toBeVisible()
    await capture(`models-${width}`)
    await page.getByRole('article').getByRole('button', { name: 'Editar', exact: true }).click()
    await capture(`model-edit-${width}`)
    if (width === 375) {
      await page.locator('.models-editor button[type="submit"]').scrollIntoViewIfNeeded()
      await capture('model-edit-375-scrolled')
    }
    await page.getByRole('button', { name: 'Voltar aos modelos' }).click()
    await page.getByRole('article').getByRole('button', { name: 'Preencher e emitir', exact: true }).click()
    await capture(`model-fill-${width}`)
    await page.getByLabel('Nome', { exact: true }).fill('Pessoa Sintética Preview')
    await page.getByLabel('CPF', { exact: true }).fill('11122233344')
    await page.getByRole('button', { name: 'Emitir documento', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Pré-visualização do Documento' })).toBeVisible()
    await capture(`model-preview-${width}`)
    await page.getByRole('button', { name: 'Fechar pré-visualização' }).click()

    await page.getByTitle('Alternar Tema Claro/Escuro').click()
    await capture(`model-fill-${width}-dark`)
    await page.getByRole('button', { name: 'Voltar aos modelos' }).click()
    await capture(`models-${width}-dark`)
    await page.getByRole('article').getByRole('button', { name: 'Editar', exact: true }).click()
    await capture(`model-edit-${width}-dark`)
    await page.getByRole('button', { name: 'Voltar aos modelos' }).click()
    await page.getByTitle('Alternar Tema Claro/Escuro').click()
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Nova homologação', exact: true }).click()
  for (const [label] of palettes) {
    for (const theme of ['light', 'dark'] as const) {
      await page.getByRole('button', { name: 'Abrir configurações' }).click()
      await page.getByRole('button', { name: label, exact: true }).last().click()
    await page.getByTestId('settings-close').click()
      const currentTheme = await page.locator('html').evaluate((html) => html.classList.contains('dark') ? 'dark' : 'light')
      if (currentTheme !== theme) await page.getByTitle('Alternar Tema Claro/Escuro').click()
      await expect.poll(() => page.locator('html').evaluate((html) => html.classList.contains('dark') ? 'dark' : 'light')).toBe(theme)
      await capture(`theme-${label.toLowerCase().replaceAll(' ', '-')}-${theme}`)
      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await capture(`workspace-${width}-${label.toLowerCase().replaceAll(' ', '-')}-${theme}`)
      }
    }
  }
  await testInfo.attach('preview-output-directory.txt', { body: output, contentType: 'text/plain' })
})


test('flow measurement: synthetic critical path', async ({ page }, testInfo) => {
  test.skip(process.env.MEASURE_FLOW !== '1', 'Opt-in baseline/final measurement')
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  await expect(page.locator('#patient-name')).toBeVisible()
  await page.evaluate(() => {
    const measurement = { clicks: 0, keys: 0, start: performance.now(), printAt: 0, feedbackAt: 0 }
    Object.assign(window, { __flow: measurement })
    document.addEventListener('click', () => measurement.clicks++)
    document.addEventListener('keydown', () => measurement.keys++)
  })
  await page.locator('#patient-name').fill('Pessoa Sintética Um')
  await page.locator('#patient-name').press('ArrowDown')
  await page.locator('#patient-name').press('Enter')
  await page.locator('#doctor-name').fill('Profissional Sintético Um')
  await page.locator('#doctor-name').press('ArrowDown')
  await page.locator('#doctor-name').press('Enter')
  await page.locator('#certificate-days').fill('3')
  await page.getByLabel('Não Informado').check()
  const generatedAt = await page.evaluate(() => performance.now())
  await page.locator('.clinic-footer .btn-primary').click()
  await expect(page.getByRole('dialog', { name: 'Pré-visualização do Documento' })).toBeVisible()
  const feedbackAt = await page.evaluate(() => performance.now())
  await expect.poll(() => page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls)).toBe(1)
  const measurements = await page.evaluate(({ generatedAt, feedbackAt }) => ({
    ...(window as Window & { __flow?: object }).__flow,
    feedbackMs: feedbackAt - generatedAt,
    printObservedMs: performance.now() - generatedAt,
    printCalls: (window as Window & { __printCalls?: number }).__printCalls,
    patientFieldTop: document.querySelector('#patient-name')!.getBoundingClientRect().top,
  }), { generatedAt, feedbackAt })
  await mkdir(process.env.EVIDENCE_DIR || '/workspace/clinical-evidence/baseline', { recursive: true })
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path.join(process.env.EVIDENCE_DIR || '/workspace/clinical-evidence/baseline', `flow-${testInfo.project.name}.json`), JSON.stringify(measurements, null, 2))
})

async function fillCriticalForm(page: Page) {
  await page.locator('#patient-name').fill('Pessoa Sintética Um')
  await page.locator('#patient-name').press('ArrowDown')
  await page.locator('#patient-name').press('Enter')
  await page.locator('#doctor-name').fill('Profissional Sintético Um')
  await page.locator('#doctor-name').press('ArrowDown')
  await page.locator('#doctor-name').press('Enter')
  await page.locator('#certificate-days').fill('3')
  await page.getByLabel('Não Informado').check()
}

test('fastflow: clear confirms only edited work and focuses first missing field', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Limpar Formulário' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.locator('#patient-name').fill('Pessoa Sintética Edição')
  await page.getByRole('button', { name: 'Limpar Formulário' }).click()
  const confirm = page.getByRole('dialog', { name: 'Limpar formulário?' })
  await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused()
  await confirm.getByRole('button', { name: 'Cancelar' }).click()
  await expect(page.locator('#patient-name')).toHaveValue('Pessoa Sintética Edição')
  await page.getByRole('button', { name: 'Limpar Formulário' }).click()
  await confirm.getByRole('button', { name: 'Limpar atendimento' }).click()
  await expect(page.locator('#patient-name')).toHaveValue('')
  await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
  await page.getByRole('button', { name: 'Entendi, vou preencher' }).click()
  await expect(page.locator('#patient-name')).toBeFocused()
})

test('fastflow: local calendar date respects Brazilian day boundaries', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'America/Sao_Paulo' })
  const page = await context.newPage()
  await mockApi(page, { authenticated: true })
  await page.clock.setFixedTime(new Date('2026-10-09T01:30:00Z'))
  await page.goto('/')
  await expect(page.locator('#certificate-date')).toHaveValue('2026-10-08')
  await page.clock.setFixedTime(new Date('2026-10-09T03:30:00Z'))
  await page.getByRole('button', { name: 'Limpar Formulário' }).click()
  await expect(page.locator('#certificate-date')).toHaveValue('2026-10-09')
  await context.close()
})

test('fastflow: one automatic print per identical HTML generation, rerender, load and manual retry', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true })
  await page.goto('/')
  await fillCriticalForm(page)
  await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
  await expect.poll(() => page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls)).toBe(1)
  await page.locator('iframe').evaluate((frame) => { frame.dispatchEvent(new Event('load')); frame.dispatchEvent(new Event('load')) })
  await page.getByRole('button', { name: 'Tela cheia', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls)).toBe(1)
  await page.getByRole('button', { name: 'Imprimir documento', exact: true }).click()
  expect(await page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls)).toBe(2)
  await page.getByRole('button', { name: 'Fechar pré-visualização' }).click()
  await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
  await expect.poll(() => page.evaluate(() => (window as Window & { __printCalls?: number }).__printCalls)).toBe(3)
  expect(state.generateRequests).toHaveLength(2)
  await expect(page.getByRole('dialog', { name: 'Pré-visualização do Documento' })).toBeVisible()
})

test('fastflow: 401 and delayed generation cannot restore data in the next session', async ({ page }) => {
  const state = await mockApi(page, { authenticated: true })
  let release!: () => void
  const response = new Promise<void>((resolve) => { release = resolve })
  let started = false
  await page.route('**/api/generate-html', async (route) => { started = true; await response; await route.fulfill({ contentType: 'text/html', body: previewHtml }) })
  await page.goto('/')
  await fillCriticalForm(page)
  await page.getByRole('button', { name: 'Gerar e imprimir' }).click()
  await expect.poll(() => started).toBe(true)
  await expect(page.locator('.clinic-footer .btn-primary')).toBeDisabled()
  state.directoryStatus = 401
  await page.getByRole('button', { name: 'Atualizar cadastros' }).click()
  await expect(page.getByLabel(/Usuário/)).toBeVisible()
  await page.getByLabel(/Usuário/).fill('usuario-sintetico')
  await page.getByPlaceholder('Sua senha secreta').fill('senha-sintetica')
  state.directoryStatus = 200
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click()
  release()
  await expect(page.locator('#patient-name')).toHaveValue('')
  await expect(page.locator('#doctor-name')).toHaveValue('')
  await expect(page.getByRole('dialog', { name: 'Pré-visualização do Documento' })).toHaveCount(0)
  await expect(page.locator('.clinic-footer .btn-primary')).toBeEnabled()
})

test('fastflow: service worker controllerchange preserves dirty work and exposes safe update', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.addInitScript(() => {
    const container = new EventTarget()
    Object.assign(container, { controller: {}, register: async () => ({ update: async () => undefined, waiting: null, installing: null, addEventListener: () => undefined }) })
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container })
  })
  await page.goto('/')
  await page.locator('#patient-name').fill('Pessoa Sintética Atualização')
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')))
  await expect(page.getByText('Atualização disponível')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Atualizar agora' })).toBeDisabled()
  await expect(page.locator('#patient-name')).toHaveValue('Pessoa Sintética Atualização')
  await page.getByRole('button', { name: 'Limpar Formulário' }).click()
  await page.getByRole('button', { name: 'Limpar atendimento' }).click()
  await expect(page.getByRole('button', { name: 'Atualizar agora' })).toBeEnabled()
})

test('fastflow: template draft, separate titles, assisted fields, search and sort remain safe', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  const models = [
    { id: '123e4567-e89b-42d3-a456-426614174010', name: 'Modelo Zeta', title: 'Título clínico Z', body: 'Olá {{nome}}', fields: [{ key: 'nome', label: 'Nome' }], revision: 2, updated_at: '2026-10-08T12:00:00Z' },
    { id: '123e4567-e89b-42d3-a456-426614174011', name: 'Modelo Alfa', title: 'Título clínico A', body: 'Texto sintético', fields: [], revision: 1, updated_at: '2026-10-01T12:00:00Z' },
  ]
  await page.route('**/api/document-models', (route) => route.fulfill({ json: models }))
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button', { name: 'Modelos', exact: true }).click()
  await page.getByLabel('Ordenar modelos').selectOption('name')
  await expect(page.getByRole('article').first().getByRole('heading')).toHaveText('Modelo Alfa')
  await page.getByLabel('Buscar modelos').fill('Zeta')
  await expect(page.getByRole('article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await page.getByLabel('Nome do modelo').fill('Rascunho sintético')
  await expect(page.getByLabel('Título do documento')).toHaveValue('Título clínico Z')
  await page.getByLabel('Nome do campo').fill('Cargo')
  await page.getByRole('button', { name: 'Adicionar campo', exact: true }).click()
  await expect(page.getByLabel('Texto do modelo')).toHaveValue(/{{cargo}}/)
  await page.getByText('Prévia do texto', { exact: true }).click()
  await expect(page.locator('.model-live-preview')).toContainText('[Cargo]')
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.getByRole('button', { name: 'Voltar aos modelos', exact: true }).click()
  await expect(page.getByLabel('Nome do modelo')).toHaveValue('Rascunho sintético')
  await page.getByRole('navigation').getByRole('button', { name: 'Nova homologação', exact: true }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Modelos', exact: true }).click()
  await expect(page.getByLabel('Nome do modelo')).toHaveValue('Rascunho sintético')
  page.once('dialog', (dialog) => void dialog.dismiss())
  await page.getByRole('navigation').getByRole('button', { name: 'Modelos', exact: true }).click()
  await expect(page.getByLabel('Título do documento')).toHaveValue('Título clínico Z')
})

test('fastflow: languages, collapse, density, reduced effects and 200 percent layout', async ({ page }) => {
  await mockApi(page, { authenticated: true })
  await page.goto('/')
  await page.getByRole('button', { name: 'Recolher navegação' }).click()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Modelos', exact: true })).toHaveAttribute('title', 'Modelos')
  await page.getByRole('button', { name: 'Abrir configurações' }).click()
  await page.getByLabel('Modo compacto').check()
  await page.getByLabel('Reduzir transparência').check()
  await page.getByRole('button', { name: 'English (US)' }).click()
  await expect(page.getByRole('dialog', { name: 'System settings' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Español' }).click()
  await expect(page.getByRole('dialog', { name: 'Configuración del sistema' })).toBeVisible()
  await page.getByTestId('settings-close').click()
  await expect(page.locator('.clinic-footer .btn-primary')).toContainText('Generar e imprimir')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact')
  await expect(page.locator('html')).toHaveAttribute('data-transparency', 'reduced')
  await expect(page.locator('.clinic-shell')).toHaveClass(/collapsed/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 640, height: 450 })
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
  await page.locator('#doctor-register-number').focus()
  const effects = await page.locator('.clinic-topbar').evaluate((element) => ({ blur: getComputedStyle(element).backdropFilter, animation: getComputedStyle(element).animationDuration }))
  expect(effects.blur).toBe('none')
})
