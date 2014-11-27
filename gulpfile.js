var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    del = require('del');

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
  return gulp.src('src/scss/fancy.scss')
    .pipe(sass({ style: 'expanded', sourcemapPath: '../../scss/' }))
    .on('error', function(err) { console.log(err.message); })
    .pipe(autoprefixer({ browsers: ['> 1%', 'Android > 2.2', 'iOS > 5', 'Firefox >= 20', 'Chrome >= 20', 'ExplorerMobile > 9'] }))
    .pipe(gulp.dest('dist/css/'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/css/'));
});

/**
 * ---------- scripts task ----------
 */

gulp.task('scripts', function() {
  return gulp.src('src/scripts/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(concat('fancy.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
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

gulp.task('default', ['clean'], function() {
  gulp.start('sass', 'scripts');
});
