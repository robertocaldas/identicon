import { expect, test } from 'claude-code/testing'

import { HEIGHT, identicon, lastPart, normaliseRemote, widthFor } from './identicon'

test('same seed draws the same picture', () => {
  expect(identicon('github.com/a/b', 8)).toEqual(identicon('github.com/a/b', 8))
})

test('different seeds draw different pictures', () => {
  expect(identicon('github.com/a/b', 8).cells).not.toEqual(identicon('github.com/a/c', 8).cells)
})

test('picture is mirrored at every width', () => {
  for (const width of [8, 9, 10]) {
    const { cells, color } = identicon('hydro-agent', width)
    expect(cells.length).toBe(HEIGHT)
    for (const row of cells) {
      expect(row.length).toBe(width)
      expect(row).toEqual([...row].reverse())
    }
    expect(color).toMatch(/^#[0-9a-f]{6}$/)
  }
})

test('cell shape sets the width', () => {
  expect([2, 2.2, 2.4].map(widthFor)).toEqual([8, 9, 10])
})

test('ssh and https remotes of one repo share a seed', () => {
  expect(normaliseRemote('git@github.com:Owner/Repo.git')).toBe('github.com/owner/repo')
  expect(normaliseRemote('https://github.com/Owner/Repo')).toBe('github.com/owner/repo')
})

test('folder name from Windows and POSIX paths', () => {
  expect(lastPart('C:\\Users\\me\\repo')).toBe('repo')
  expect(lastPart('/Users/me/repo/')).toBe('repo')
})
