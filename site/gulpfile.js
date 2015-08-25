var paths = {
  templates: 'templates'
};

var argv = require('yargs').argv;

// grab our gulp packages
var gulp  = require('gulp'),
    gutil = require('gulp-util'),
    clean = require('gulp-clean'),
    fileinclude = require('gulp-file-include'),
    rename = require('gulp-rename'),
    path = require('path'),
    awspublish = require("gulp-awspublish"),
    fs = require("fs"),
    aws = require("./aws");


// create a default task and just log a message
gulp.task('default', function() {
  return gutil.log('Gulp is running!')
});

// creates a distribution folder
gulp.task('makedist',['fileinclude'],function() {
  return gutil.log('Finished makedist task.')
});


// applies the fileincludes to the templates
gulp.task('fileinclude',['move'], function() {
  return gulp.src(path.join(paths.templates, '*.tpl.html'))
      .pipe(fileinclude())
      .pipe(rename({
        extname: ""
      }))
      .pipe(rename({
        extname: ".html"
      }))
      .pipe(gulp.dest('dist'));
});


var filesToMove = [
  './css/**/*.*',
  './fonts/**/*.*',
  './js/**/*.*'
];

// cleans the distribution folder
gulp.task('clean', function(){
  return gulp.src(['dist/*'], {read:false})
      .pipe(clean());
});

// moves the files to the distribution folder
gulp.task('move',['clean'], function(){
  // the base option sets the relative root for the set of files,
  // preserving the folder structure
  gulp.src(filesToMove, { base: './' })
      .pipe(gulp.dest('dist'));
});

// publishes the dist folder to S3 bucket/userguide
gulp.task('publish', function() {

  // create a new publisher using S3 options
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  var publisher = awspublish.create({
      "accessKeyId": argv.awskey,
      "secretAccessKey": argv.awssecret,
      "region": "eu-west-1" ,
    params: {
      Bucket: "jdt.trispark.com"
    }
  });

  // define custom headers
  var headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public'
    // ...
  };

  return gulp.src('./dist/**')
      .pipe(rename(function (path) {
        path.dirname  = '/userguide/' + path.dirname;
      }))
    // gzip, Set Content-Encoding headers and add .gz extension
    //  .pipe(awspublish.gzip({ ext: '.gz' }))

    // publisher will add Content-Length, Content-Type and headers specified above
    // If not specified it will set x-amz-acl to public-read by default
      .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
      .pipe(publisher.cache())

    // print upload updates to console
      .pipe(awspublish.reporter());
});



