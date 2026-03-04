## About this fork

This package is a fork of `copyfiles` with security and maintenance updates:
- **Why this fork:** the original project has been largely inactive for ~5 years and carries known dependency vulnerabilities. The intermediate fork we pulled from was updated about a year ago but has since gone dormant as well.
- **What changed:** upgraded vulnerable dependencies (notably `glob`) and modernized supporting tooling so the API/CLI continue to work on current Node.js versions.
- Original repository: [https://github.com/calvinmetcalf/copyfiles](https://github.com/calvinmetcalf/copyfiles)

## Install

```bash
npm install copyfiles-fixed
```

## Command line

```bash
  Usage: copyfiles-fixed [options] inFile [more files ...] outDirectory

  Options:
    -u, --up       slice a path off the bottom of the paths               [number]
    -a, --all      include files & directories begining with a dot (.)   [boolean]
    -f, --flat     flatten the output                                    [boolean]
    -e, --exclude  pattern or glob to exclude (may be passed multiple times)
    -E, --error    throw error if nothing is copied                      [boolean]
    -V, --verbose  print more information to console                     [boolean]
    -s, --soft     do not overwrite destination files if they exist      [boolean]
    -F, --follow   follow symbolink links                                [boolean]
    -v, --version  Show version number                                   [boolean]
    -h, --help     Show help                                             [boolean]
```

Copy one or more files (including globs); the last argument is the output directory, which will be created if needed. On Windows, globs must be **double quoted**. Other shells may use single or double quotes.

```bash
copyfiles-fixed foo foobar foo/bar/*.js out
```

This produces an `out` directory containing `foo`, `foobar`, and a nested `foo/bar` folder with all matches from `foo/bar/*.js`.

If you want to omit a leading folder from the output path, use `--up`:

```bash
copyfiles-fixed something/*.js out
```

This would place the JS files under `out/something`. To drop that folder, use:

```bash
copyfiles-fixed -u 1 something/*.js out
```

To flatten all outputs into one directory:

```bash
copyfiles-fixed -f ./foo/*.txt ./foo/bar/*.txt out
```

This puts `a.txt` and `b.txt` directly into `out`.

If your terminal doesn’t support globstars, quote the pattern:

```bash
copyfiles-fixed -f ./foo/**/*.txt out
```

This does not work by default on macOS, but quoting does:

```bash
copyfiles-fixed -f "./foo/**/*.txt" out
```

You can also quote globstars within mixed inputs:

```bash
copyfiles-fixed some.json "./some_folder/*.json" ./dist/ && echo 'JSON files copied.'
```

To exclude files, pass one or more `-e` patterns:

```bash
copyfiles-fixed -e "**/*.test.js" -f ./foo/**/*.js out
```

Other options include:
- `-a` or `--all` to include dotfiles.
- `-s` or `--soft` to skip overwriting existing files.
- `-F` or `--follow` to follow symbolic links.

## copyup

The package also provides a `copyup` command, identical to `copyfiles`, but with `--up` defaulting to `1` (equivalent to running `copyfiles -u 1 ...`).

## Programmatic API

```js
var copyfiles = require('copyfiles-fixed');

copyfiles([paths], opt, callback);
```

`paths` is an array where the last entry is the destination path. The optional `opt` argument can be:
- a number (equivalent to `--up`),
- `true` (equivalent to `--flat`), or
- an options object (e.g. `up`, `all`, `flat`, `exclude`, `error`, `verbose`, `follow`, `soft`).

## Tilde support for home directory

If source or destination paths begin with a tilde (`~`) on Windows, make sure to include `-u` or `-f` in options (or use the `copyup` command). Otherwise you may see `Error: Illegal characters in path.`
