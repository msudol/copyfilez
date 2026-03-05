'use strict';
var test = require('tape');
var copyfiles = require('../');
var { rimraf } = require('rimraf');
var fs = require('fs');
var { mkdirp: mkdirpAsync } = require('mkdirp');
var cp = require('child_process');
var { globSync } = require('glob');
var path = require('path');
var nodeExec = process.execPath;
function runCli(args) {
  var script = path.resolve(__dirname, '..', 'copyfiles');
  return cp.spawnSync(nodeExec, [script].concat(args));
}
function runCopyup(args) {
  var script = path.resolve(__dirname, '..', 'copyup');
  return cp.spawnSync(nodeExec, [script].concat(args));
}
const mkdirp = (path, cb) => {
  mkdirpAsync(path).then(()=>{
    cb();
  }, cb);
}
function after() {
  return rimraf('output')
    .then(function () {
      return rimraf('input');
    });
}
function before() {
  return rimraf('output')
    .then(function () {
      return rimraf('input');
    })
    .then(function () {
      return mkdirpAsync('input/other');
    });
}

test('API: basic copy', function (t) {
  t.test('setup', before);
  t.test('should copy only matching .txt files', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output/input', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt'], 'should contain only .txt files');
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('API: preserve file modes', function (t) {
  t.test('setup', before);
  t.test('should copy files and preserve mode bits', function (t) {
    fs.writeFileSync('input/a.txt', 'a', {
      mode: 33261
    });
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output/input', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt'], 'should contain only .txt files');
        if (process.platform !== 'win32') {
          t.equals(fs.statSync('output/input/a.txt').mode, 33261, 'mode should be preserved');
        } else {
          t.ok(true, 'mode check skipped on Windows');
        }
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('API: exclude patterns', function (t) {
  t.test('setup', before);
  t.test('should exclude files matching exclude globs', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js.txt', 'c');
    fs.writeFileSync('input/d.ps.txt', 'd');
    copyfiles( ['input/*.txt', 'output'], {
      exclude: ['**/*.js.txt', '**/*.ps.txt']
    }, function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output/input', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt'], 'excluded files should not be present');
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('CLI: exclude with -e flag', function (t) {
  t.test('setup', before);
  t.test('should exclude files via CLI -e option', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js.txt', 'c');
    fs.writeFileSync('input/d.ps.txt', 'd');
  runCli(['-e', '**/*.js.txt', '-e', '**/*.ps.txt', 'input/*.txt', 'output']);
    fs.readdir('output/input', function (err, files) {
      t.error(err, 'output directory should exist');
      t.deepEquals(files, ['a.txt', 'b.txt'], 'excluded files should not be present');
      t.end();
    });
  });
  t.test('teardown', after);
});
test('API: include dotfiles with all option', function (t) {
  t.test('setup', before);
  t.test('should include dotfiles when all is true', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/.c.txt', 'c');
    copyfiles( ['input/*.txt', 'output'], {
      all: true
    }, function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output/input', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['.c.txt', 'a.txt', 'b.txt'], 'dotfiles should be included');
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('CLI: include dotfiles with -a flag', function (t) {
  t.test('setup', before);
  t.test('should include dotfiles via CLI -a option', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/.c.txt', 'c');
  runCli(['-a', 'input/*.txt', 'output']);
    fs.readdir('output/input', function (err, files) {
      t.error(err, 'output directory should exist');
      t.deepEquals(files, ['.c.txt', 'a.txt', 'b.txt'], 'dotfiles should be included');
      t.end();
    });
  });
  t.test('teardown', after);
});
test('CLI: error when nothing copied with -E flag', function (t) {
  t.test('setup', before);
  t.test('should exit with error when no files match', function (t) {
    fs.writeFileSync('input/.c.txt', 'c');
  var out = runCli(['-E', 'input/*.txt', 'output']);
    t.ok(out.status, 'exit code should be non-zero');
    t.end();
  });
  t.test('teardown', after);
});
test('CLI: include dotfiles with --all flag', function (t) {
  t.test('setup', before);
  t.test('should include dotfiles via CLI --all option', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/.c.txt', 'c');
  runCli(['--all', 'input/*.txt', 'output']);
    fs.readdir('output/input', function (err, files) {
      t.error(err, 'output directory should exist');
      t.deepEquals(files, ['.c.txt', 'a.txt', 'b.txt'], 'dotfiles should be included');
      t.end();
    });
  });
  t.test('teardown', after);
});
test('API: soft copy does not overwrite existing files', function (t) {
  t.test('setup', before);
  t.test('should preserve existing destination files', function (t) {
    mkdirp('output/input/other', function(){
      fs.writeFileSync('input/a.txt', 'inputA');
      fs.writeFileSync('output/input/a.txt', 'outputA');
      t.equal( fs.readFileSync('output/input/a.txt').toString(), 'outputA', 'existing file has original content' )
      fs.writeFileSync('input/b.txt', 'b');
      fs.writeFileSync('input/other/c.txt', 'inputC');
      fs.writeFileSync('output/input/other/c.txt', 'outputC');
      fs.writeFileSync('input/other/d.txt', 'd');
      copyfiles(['input/**/*.txt', 'output'], {soft:true}, function (err) {
        t.error(err, 'copy should not error');
        fs.readdir('output/input', function (err, files) {
          t.error(err, 'output directory should exist');
          t.deepEquals(files, ['a.txt', 'b.txt', 'other'], 'all expected entries should be present');
          t.equal( fs.readFileSync('output/input/a.txt').toString(), 'outputA', 'existing file should not be overwritten' )
          t.equal( fs.readFileSync('output/input/b.txt').toString(), 'b', 'new file should be copied')
          t.equal( fs.readFileSync('output/input/other/c.txt').toString(), 'outputC', 'existing nested file should not be overwritten')
          t.end();
        });
      });
    })
  });
  t.test('teardown', after);
});
test('CLI: soft copy with -s flag', function (t) {
  t.test('setup', before);
  t.test('should not overwrite existing files via CLI -s option', function (t) {
    mkdirp('output/input/other', function(){
      fs.writeFileSync('input/a.txt', 'inputA');
      fs.writeFileSync('output/input/a.txt', 'outputA');
      t.equal( fs.readFileSync('output/input/a.txt').toString(), 'outputA', 'existing file has original content' )
      fs.writeFileSync('input/b.txt', 'b');
      fs.writeFileSync('input/other/c.txt', 'inputC');
      fs.writeFileSync('output/input/other/c.txt', 'outputC');
      fs.writeFileSync('input/other/d.txt', 'd');
  runCli(['-s', 'input/**/*.txt', 'output']);

      fs.readdir('output/input', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt', 'other'], 'all expected entries should be present');
        t.equal( fs.readFileSync('output/input/a.txt').toString(), 'outputA', 'existing file should not be overwritten' )
        t.equal( fs.readFileSync('output/input/b.txt').toString(), 'b', 'new file should be copied')
        t.equal( fs.readFileSync('output/input/other/c.txt').toString(), 'outputC', 'existing nested file should not be overwritten')
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('CLI: soft copy with --soft flag', function (t) {
  t.test('setup', before);
  t.test('should not overwrite existing files via CLI --soft option', function (t) {
    mkdirp('output/input/other', function(){
      fs.writeFileSync('input/a.txt', 'inputA');
      fs.writeFileSync('output/input/a.txt', 'outputA');
      t.equal( fs.readFileSync('output/input/a.txt').toString(), 'outputA', 'existing file has original content' )
      fs.writeFileSync('input/b.txt', 'b');
      fs.writeFileSync('input/other/c.txt', 'inputC');
      fs.writeFileSync('output/input/other/c.txt', 'outputC');
      fs.writeFileSync('input/other/d.txt', 'd');
  runCli(['--soft', 'input/**/*.txt', 'output']);

      fs.readdir('output/input', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt', 'other'], 'all expected entries should be present');
        t.equal( fs.readFileSync('output/input/a.txt').toString(), 'outputA', 'existing file should not be overwritten' )
        t.equal( fs.readFileSync('output/input/b.txt').toString(), 'b', 'new file should be copied')
        t.equal( fs.readFileSync('output/input/other/c.txt').toString(), 'outputC', 'existing nested file should not be overwritten')
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('API: strip path segments with up option', function (t) {
  t.test('setup', before);
  t.test('should strip one path segment from output', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js', 'c');
    copyfiles(['input/*.txt', 'output'], 1, function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt'], 'files should be at output root');
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('CLI: strip path segments with -u flag', function (t) {
  t.test('setup', before);
  t.test('should strip one path segment via CLI -u option', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js', 'c');
  runCli(['-u', '1', 'input/*.txt', 'output']);
    fs.readdir('output', function (err, files) {
      t.error(err, 'output directory should exist');
      t.deepEquals(files, ['a.txt', 'b.txt'], 'files should be at output root');
      t.end();
    });
  });
  t.test('teardown', after);
});
test('CLI: copyup defaults to --up 1', function (t) {
  t.test('setup', before);
  t.test('should strip one path segment by default', function (t) {
    fs.writeFileSync('input/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/c.js', 'c');
  runCopyup(['input/*.txt', 'output']);
    fs.readdir('output', function (err, files) {
      t.error(err, 'output directory should exist');
      t.deepEquals(files, ['a.txt', 'b.txt'], 'files should be at output root');
      t.end();
    });
  });
  t.test('teardown', after);
});
test('API: strip two path segments with up option', function (t) {
  t.test('setup', before);
  t.test('should strip two path segments from output', function (t) {
    fs.writeFileSync('input/other/a.txt', 'a');
    fs.writeFileSync('input/other/b.txt', 'b');
    fs.writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], 2, function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt'], 'files should be at output root');
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('API: flatten output with flat option', function (t) {
  t.test('setup', before);
  t.test('should flatten all files into output root', function (t) {
    fs.writeFileSync('input/other/a.txt', 'a');
    fs.writeFileSync('input/b.txt', 'b');
    fs.writeFileSync('input/other/c.js', 'c');
    copyfiles(['input/**/*.txt', 'output'], true, function (err) {
      t.error(err, 'copy should not error');
      fs.readdir('output', function (err, files) {
        t.error(err, 'output directory should exist');
        t.deepEquals(files, ['a.txt', 'b.txt'], 'all files should be flat in output');
        t.end();
      });
    });
  });
  t.test('teardown', after);
});
test('API: follow symbolic links', function (t) {
  t.test('setup', before);
  t.test('should copy files through symlinks when follow is enabled', function (t) {
    fs.mkdirSync('input/origin');
    fs.mkdirSync('input/origin/inner');
    fs.writeFileSync('input/origin/inner/a.txt', 'a');
  var linkType = process.platform === 'win32' ? 'junction' : undefined;
  fs.symlinkSync('origin', 'input/dest', linkType);
    copyfiles(['input/**/*.txt', 'output'], { up: 1, follow: true }, function (err) {
      t.error(err, 'copy should not error');
      const files = globSync('output/**/*.txt').map(function (filePath) {
        return filePath.replace(/\\/g, '/');
      });
      t.deepEquals(files, ['output/origin/inner/a.txt', 'output/dest/inner/a.txt'], 'should include files from both real and symlinked paths');
      t.end();
    });
  });
  t.test('teardown', after);
});
