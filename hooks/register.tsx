import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { HEIGHT, TILE, identicon, lastPart, normaliseRemote, widthFor } from './identicon'

const PANE = 'identicon'
const SHAPES = ['2.0', '2.2', '2.4']
const picture = atom({ plugin: 'identicon', key: 'picture' } as const, null)

export const register: Register = (on, options) => {
  const isBottom = options.position === 'bottom'
  const shape = SHAPES.includes(String(options.cellShape)) ? String(options.cellShape) : SHAPES[0]
  const width = widthFor(Number(shape))

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'identicon', description: 'Show or hide the repo identicon pane' })

    const git = async (...args: string[]) => {
      try {
        const { exitCode, stdout } = await $.process.run(['git', ...args], { cwd: e.cwd })
        return exitCode === 0 ? stdout.trim() : ''
      } catch {
        return ''
      }
    }
    const remote = await git('remote', 'get-url', 'origin')
    const root = await git('rev-parse', '--show-toplevel')
    const seed = remote ? normaliseRemote(remote) : lastPart(root || e.cwd)
    await update($, picture, () => identicon(seed, width))
    void $.ui.open({ id: PANE, title: lastPart(seed), columns: width })

    return next(e)
  })

  on('command.run', { command: 'identicon' }, async $ => {
    const isOpen = (await $.ui.panes()).some(pane => pane.id === PANE)
    if (isOpen) {
      await $.ui.close({ id: PANE })
      return { text: 'Identicon pane closed.' }
    }
    const seed = (await read($, picture))?.seed ?? 'unknown'
    await $.ui.open({ id: PANE, title: lastPart(seed), columns: width })

    return { text: `Identicon pane opened (seed: ${seed}).` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const pic = await read($, picture)
    if (pic === null) {
      return <Text dimColor>…</Text>
    }

    const lines = Array.from({ length: HEIGHT / 2 }, (_, line) => [pic.cells[line * 2], pic.cells[line * 2 + 1]])
    // Docked, the body is the dock's full height; inline it fits the tree.
    const height = isBottom && e.props.placement === 'dock' ? e.props.scroll.bodyRows : undefined

    // A click steps through the shapes, then moves the icon to the other end
    // and starts the shapes again. Each /config change reloads the mod; both
    // writes go out together so a reload can't cut the second one off.
    const step = async () => {
      const rows = await $.config.list()
      const keyOf = (field: string) => rows.find(r => r.key.startsWith('identicon') && r.key.endsWith(`.${field}`))?.key
      const shapeKey = keyOf('cellShape')
      const positionKey = keyOf('position')
      const isLast = SHAPES.indexOf(shape) === SHAPES.length - 1
      const writes = [shapeKey && $.config.set({ key: shapeKey, value: isLast ? SHAPES[0] : SHAPES[SHAPES.indexOf(shape) + 1] })]
      if (isLast) {
        writes.push(positionKey && $.config.set({ key: positionKey, value: isBottom ? 'top' : 'bottom' }))
      }
      await Promise.all(writes)
    }

    // Upper half block: its colour is the top cell, the background the bottom one.
    // A Button holds one line, so each row is one, all pressing the same.
    return (
      <Box flexDirection="column" alignItems="center" justifyContent={isBottom ? 'flex-end' : 'flex-start'} height={height}>
        {/* Buttons stretch to the row; a Box of the icon's width keeps it centred. */}
        <Box flexDirection="column" width={width}>
          {lines.map(([top, bottom], line) => (
            <Button key={`row-${line}`} label={`Cell shape ${shape}`} plain onPress={step}>
              {top.map((isOn, col) => (
                <Text color={isOn ? pic.color : TILE} backgroundColor={bottom[col] ? pic.color : TILE}>
                  ▀
                </Text>
              ))}
            </Button>
          ))}
        </Box>
      </Box>
    )
  })
}
