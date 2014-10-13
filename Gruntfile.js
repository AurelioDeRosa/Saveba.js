module.exports = function (grunt) {
   'use strict';

   require('load-grunt-tasks')(grunt);

   var config = {
      src: 'src',
      dist: 'dist'
   };

   grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      config: config,

      uglify: {
         options: {
            banner: '/*! Saveba.js <%= pkg.version %> | Aurelio De Rosa (@AurelioDeRosa) | MIT/GPL-3.0 Licensed */\n'
         },
         dist: {
            files: {
               '<%= config.dist %>/saveba.min.js': ['<%= config.src %>/saveba.js']
            }
         }
      },
      jshint: {
         files: ['Gruntfile.js', 'src/**/*.js'],
         options: {
            jshintrc: '.jshintrc',
            reporter: require('jshint-stylish')
         }
      },
      watch: {
         files: ['<%= jshint.files %>'],
         tasks: ['jshint']
      }
   });

   grunt.registerTask('default', [
      'jshint',
      'uglify'
   ]);
};