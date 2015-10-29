'use strict'

var gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    del = require('del');

var plugins = gulpLoadPlugins()

/**
 * ---------- sass task ----------
 */

gulp.task('watch', function() {

  // watch .scss files
  gulp.watch(['src/scss/*.scss', 'src/scss/**/*.scss'], ['sass']);

  // watch .js files
  gulp.watch('src/scripts/**/*.js', ['scripts']);

});

/**
 * ---------- sass task ----------
 */

gulp.task('sass', function() {
  return plugins.rubySass('src/scss/fancy.scss', {
      style: 'expanded',
      sourcemap: true
    })
    .on('error', plugins.rubySass.logError)
    .pipe(plugins.autoprefixer({ browsers: ['> 1%', 'Android > 4.0', 'iOS > 6'] }))
    .pipe(gulp.dest('dist/css/'))
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.minifyCss())
    .pipe(gulp.dest('dist/css/'));
});

/**
 * ---------- scripts task ----------
 */

gulp.task('scripts', function() {
  return gulp.src('src/scripts/*.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    .pipe(plugins.concat('fancy.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.uglify())
    .pipe(gulp.dest('dist/js'));
});

/**
 * ---------- clean task ----------
 */

gulp.task('clean', function(cb) {
  del(['dist/css', 'dist/js'], cb);
});

/**
 * ---------- default task ----------
 */

gulp.task('default', ['clean', 'sass', 'scripts']);
