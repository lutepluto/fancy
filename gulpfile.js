var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    del = require('del');

/**
 * ---------- sass task ----------
 */

gulp.task('watch', function() {

  // watch .scss files
  gulp.watch('scss/*.scss', ['sass']);

});

/**
 * ---------- sass task ----------
 */

gulp.task('sass', function() {
  return gulp.src('scss/fancy.scss')
    .pipe(sass({ style: 'expanded', sourcemapPath: '../../scss/' }))
    .on('error', function(err) { console.log(err.message); })
    .pipe(autoprefixer())
    .pipe(gulp.dest('dist/css/'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/css/'));
});

/**
 * ---------- clean task ----------
 */

gulp.task('clean', function(cb) {
  del(['dist/css'], cb);
});

/**
 * ---------- default task ----------
 */

gulp.task('default', ['clean'], function() {
  gulp.start('sass');
});
