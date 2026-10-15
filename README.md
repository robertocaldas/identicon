# identicon

A Claude Code mod that draws a GitHub-style identicon of the current repo in a docked pane.

The picture comes from a hash of the `origin` remote URL (ssh and https clones match), else the repo
root's name, else the folder name. Clicking it steps through the cell shapes, then moves it to the other end
of the pane. `/identicon` shows or hides the pane.

The pane docks beside the transcript in the fullscreen layout, from 110 columns.

## Install

At the prompt of a terminal session:

```
/plugin install identicon --marketplace robertocaldas/identicon
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install identicon --marketplace robertocaldas/identicon
```

## Options

Set them on the install screen or in `/config`.

| Option | Values | Meaning |
|---|---|---|
| Position | `top`, `bottom` | Where the icon sits in the pane |
| Cell shape | `2.0`, `2.2`, `2.4` | Your terminal cell's height as a multiple of its width, so the icon draws square |
