
/* eslint-disable  no-console */
var unzip = require('gulp-unzip');
import * as fs from 'fs-extra';
var gulp = require('gulp');

fs.mkdirsSync('dist/static');
gulp.src('webui-static.zip')
.pipe(unzip())
.pipe(gulp.dest('dist/static'))
.on('end', () => console.log('Unzip webui-static.zip to dist/static'));
