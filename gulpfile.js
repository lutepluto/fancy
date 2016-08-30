'use strict'

var gulp = require('gulp')
var sass = require('gulp-ruby-sass')
var postcss = require('gulp-postcss')
var autoprefixer = require('autoprefixer')
var cleanCss = require('gulp-clean-css')
var rename = require('gulp-rename')

gulp.task('sass', function() {
  return sass('src/scss/fancy.scss', {
    style: 'expanded'
  })
  .on('error', sass.logError)
  .pipe(postcss([
    autoprefixer({ browsers: ['> 1%', 'Android > 4.1', 'iOS > 7'] })
  ]))
  .pipe(gulp.dest('dist/css'))
  .pipe(cleanCss())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest('dist/css'))
})

gulp.task('watch', function() {
  gulp.watch('src/scss/*.scss', ['sass'])
})
