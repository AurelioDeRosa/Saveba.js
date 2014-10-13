/* jshint browser: true */
/* exported saveba */
var saveba = (function (window, document) {
   'use strict';

   // Default values.
   // Later exposed as saveba.defaults
   var defaults = {
      // A NodeList or an Array of elements the library must ignore
      ignoredElements: [],
      // A Number specifying the maximum speed in MB/s after which
      // a connection isn't considered slow anymore
      slowMax: 0.5,
      // A Number specifying the minimum speed in MB/s after which
      // a connection is considered fast
      fastMin: 2
   };

   // The base64 encode of a transparent GIF used to replace
   // the "src" attribute of the targeted <img>s
   var transparentGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

   var saveba = function() {
      var connection = window.navigator.connection    ||
                       window.navigator.mozConnection ||
                       null;

      // API not supported. Can't optimize the website
      if (!connection) {
         return false;
      }

      // Test whether the API supported is compliant with the old specifications
      var oldApi = 'metered' in connection;
      var slowConnection = (oldApi && (connection.metered || connection.bandwidth < defaults.slowMax)) ||
         (!oldApi && (connection.type === 'bluetooth' || connection.type === 'cellular'));
      var averageConnection = oldApi &&
         !connection.metered &&
         connection.bandwidth >= defaults.slowMax &&
         connection.bandwidth < defaults.fastMin;

      // The connection is fast enough to load all the resources specified,
      // the type of the connection used is unknown, or there is no connection at all
      if (!slowConnection && !averageConnection) {
         return true;
      }

      var elements;
      if (slowConnection) {
         // Select all images (non-content images and content images)
         elements = document.querySelectorAll('img');
      } else if (averageConnection) {
         // Select non-content images only
         elements = document.querySelectorAll('img[alt=""]');
      }
      elements = [].slice.call(elements);

      if (!(defaults.ignoredElements instanceof Array)) {
         defaults.ignoredElements = [].slice.apply(defaults.ignoredElements);
      }

      // Filter the resources specified in the ignoredElements property and
      // those that are in the browser's cache.
      // More info: http://stackoverflow.com/questions/7844982/using-image-complete-to-find-if-image-is-cached-on-chrome
      elements = elements.filter(function(element) {
         return defaults.ignoredElements.indexOf(element) === -1 ? !element.complete : false;
      });

      // Replace the targeted resources with a 1x1 px, transparent GIF
      for(var i = 0; i < elements.length; i++) {
         elements[i].dataset.saveba = elements[i].src;
         elements[i].src = transparentGif;
      }

      return true;
   };

    var destroy = function() {
       // Retrieve all the hidden images
       var elements = [].slice.call(document.querySelectorAll('[data-saveba]'));

       // Restore the src attribute and remove the data-saveba attribute
       for(var i = 0; i < elements.length; i++) {
          elements[i].src = elements[i].dataset.saveba;
          delete elements[i].dataset.saveba;
       }
    };

   // Expose the object containing the default values
   saveba.defaults = defaults;

   // Expose the destroy method
   saveba.destroy = destroy;

   // Run the function when the DOM is ready
   window.addEventListener('DOMContentLoaded', saveba);

   return saveba;

})(window, document);