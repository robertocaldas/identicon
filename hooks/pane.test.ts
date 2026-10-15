import { expect, test } from 'claude-code/testing'


const setup = (on: any) => {
  on('command.register', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.render', () => null)
  on('session.start', (_$: unknown, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('process.run', (_$: unknown, e: { argv: string[] }) =>
    e.argv.includes('origin')
      ? { value: { exitCode: 0, stdout: 'git@github.com:Owner/Repo.git\n', stderr: '' } }
      : { value: { exitCode: 0, stdout: '/x/repo\n', stderr: '' } },
  )
}

const PANE = (placement: 'dock' | 'inline') => ({
  plugin: 'identicon',
  surface: 'terminal',
  component: 'Pane',
  requestId: 'identicon',
  props: { isFocused: false, bodyColumns: 22, placement, scroll: { offset: 0, bodyRows: 30 } },
  viewport: { columns: 160, rows: 40, isFullscreen: placement === 'dock' },
})

test('top, cell shape 2.4: 4 rows of 10 half blocks', { options: { position: 'top', cellShape: '2.4' } }, async ($, on) => {
  setup(on)
  await $.session.start({ cwd: '/x/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE('dock') as never)
  const cells = (await ui.findAll({ type: 'Text' })).filter(el => el.props.backgroundColor)
  expect(cells).toHaveLength(40)
  expect((await ui.drawn()).props).toMatchObject({ justifyContent: 'flex-start' })
})

test('bottom, default shape: 8 wide, filling the dock', { options: { position: 'bottom' } }, async ($, on) => {
  setup(on)
  await $.session.start({ cwd: '/x/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE('dock') as never)
  const cells = (await ui.findAll({ type: 'Text' })).filter(el => el.props.backgroundColor)
  expect(cells).toHaveLength(32)
  expect((await ui.drawn()).props).toMatchObject({ justifyContent: 'flex-end', height: 30 })
})

test('a click steps the shape', { options: { position: 'top', cellShape: '2.0' } }, async ($, on) => {
  setup(on)
  const sets: unknown[] = []
  on('config.list' as never, (() => ({ value: [{ key: 'identicon.cellShape' }, { key: 'identicon.position' }] })) as never)
  on('config.set', ((_$: unknown, e: { key: string; value: string }) => {
    sets.push({ key: e.key, value: e.value })
    return { value: e.value }
  }) as never)
  await $.session.start({ cwd: '/x/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE('dock') as never)
  await ui.press({ key: 'row-2' } as never)
  expect(sets).toEqual([{ key: 'identicon.cellShape', value: '2.2' }])
})

test('a click past the last shape moves to the other end', { options: { position: 'bottom', cellShape: '2.4' } }, async ($, on) => {
  setup(on)
  const sets: unknown[] = []
  on('config.list' as never, (() => ({ value: [{ key: 'identicon.cellShape' }, { key: 'identicon.position' }] })) as never)
  on('config.set', ((_$: unknown, e: { key: string; value: string }) => {
    sets.push({ key: e.key, value: e.value })
    return { value: e.value }
  }) as never)
  await $.session.start({ cwd: '/x/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE('dock') as never)
  await ui.press({ key: 'row-2' } as never)
  expect(sets).toEqual([
    { key: 'identicon.cellShape', value: '2.0' },
    { key: 'identicon.position', value: 'top' },
  ])
})
