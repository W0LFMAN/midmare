const gulp = require('gulp');
const ts = require('gulp-typescript');
const terser = require('gulp-terser');
const { Transform } = require('stream');
const { spawn } = require('child_process');

gulp.task('default', (done) => {
  const tsRes = gulp
    .src(['*.ts', 'lib/*.ts', 'lib/**/*.ts'], { base: './' })
    .pipe(ts({ ...require('./tsconfig.json').compilerOptions }));
  
  return tsRes.js.pipe(terser())
    .pipe(gulp.dest('./dist')).on('end', () => {
      tsRes.dts.pipe(gulp.dest('./dist')).on('end', done)
    });
});