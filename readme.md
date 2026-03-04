## About this fork

This package is a fork of `copyfiles` with security and maintenance updates:
- **Why this fork:** the original project has been largely inactive for ~5 years and carries known dependency vulnerabilities. The intermediate fork we pulled from was updated about a year ago but has since gone dormant as well.
- **What changed:** upgraded vulnerable dependencies (notably `glob`) and modernized supporting tooling so the API/CLI continue to work on current Node.js versions.
- Original repository: [https://github.com/calvinmetcalf/copyfiles](https://github.com/calvinmetcalf/copyfiles)

### Install

```bash
npm install copyfiles-fixed
```
### Command Line

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

copy some files, give it a bunch of arguments, (which can include globs), the last one
is the out directory (which it will create if necessary).  Note: on windows globs must be **double quoted**, everybody else can quote however they please.

```bash
copyfiles-fixed foo foobar foo/bar/*.js out
```

you now have a directory called out, with the files foo and foobar in it, it also has a directory named foo with a directory named
bar in it that has all the files from foo/bar that match the glob.

If all the files are in a folder that you don't want in the path out path, ex:

```bash
copyfiles-fixed something/*.js out
```

which would put all the js files in `out/something`, you can use the `--up` (or `-u`) option

```bash
copyfiles-fixed -u 1 something/*.js out
```

which would put all the js files in `out`

you can also just do -f which will flatten all the output into one directory, so with files ./foo/a.txt and ./foo/bar/b.txt

```bash
copyfiles-fixed -f ./foo/*.txt ./foo/bar/*.txt out
```

will put a.txt and b.txt into out

if your terminal doesn't support globstars then you can quote them

```bash
copyfiles-fixed -f ./foo/**/*.txt out
```

does not work by default on a mac

but

```bash
copyfiles-fixed -f "./foo/**/*.txt" out
```

does.

You could quote globstars as a part of input:
```bash
copyfiles-fixed some.json "./some_folder/*.json" ./dist/ && echo 'JSON files copied.'
```

You can use the -e option to exclude some files from the pattern, so to exclude all files ending in .test.js you could do

```bash
copyfiles-fixed -e "**/*.test.js" -f ./foo/**/*.js out
```

Other options include

- `-a` or `--all` which includes files that start with a dot.
- `-s` or `--soft` to soft copy, which will not overwrite existing files.
- `-F` or `--follow` which follows symbolinks

## copyup

also creates a `copyup` command which is identical to `copyfiles` but `-up` defaults to 1

### Programic API

```js
var copyfiles = require('copyfiles-fixed');

copyfiles([paths], opt, callback);
```
takes an array of paths, last one is the destination path, also takes an optional argument which the -u option if a number, otherwise if it's `true` it's the flat option or if it is an object it is a hash of the various options (the long version e.g. up, all, flat, exclude, error, verbose, follow, and soft)  

### Tilde support for home directory
when the src/dest path start with tilde for home directory under windows, please make sure -u or -f is added in options or use copyup command. if not you will get `Error: Illegal characters in path.`
