const gulp = require('gulp');
const ts = require('gulp-typescript');
const terser = require('gulp-terser');
const sm = require('gulp-sourcemaps');

gulp.task('default', (done) => {
  const tsRes = gulp
    .src(['*.ts', 'lib/*.ts', 'lib/**/*.ts'], { base: './' })
    .pipe(sm.init())
    .pipe(ts({ ...require('./tsconfig.json').compilerOptions }));
  
  return tsRes.js.pipe(terser())
    .pipe(sm.write('./'))
    .pipe(gulp.dest('./dist'))
    .on('end', function() {
      tsRes.dts.pipe(gulp.dest('./dist')).on('end', done)
    });
});