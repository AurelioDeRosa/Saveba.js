/* jshint browser: true */
/* exported saveba */
var saveba = (function (window, document) {
   'use strict';

   var connection = window.navigator.connection    ||
                    window.navigator.mozConnection ||
                    null;

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

   var ConnectionTypes = {
      'SLOW_CONNECTION': 0,
      'AVERAGE_CONNECTION': 1,
      'FAST_CONNECTION': 2
   };

   // The base64 encode of a transparent GIF used to replace
   // the "src" attribute of the targeted <img>s
   var transparentGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

   function detectConnectionCategory() {
      // Test whether the API supported is compliant with the old specifications
      var oldApi = 'metered' in connection;

      if (
         (oldApi && (connection.metered || connection.bandwidth < defaults.slowMax)) ||
         (!oldApi && (connection.type === 'bluetooth' || connection.type === 'cellular'))
      ) {
         return ConnectionTypes.SLOW_CONNECTION;
      } else if (
         oldApi && !connection.metered &&
         connection.bandwidth >= defaults.slowMax &&
         connection.bandwidth < defaults.fastMin
      ) {
         return ConnectionTypes.AVERAGE_CONNECTION;
      } else {
         return ConnectionTypes.FAST_CONNECTION;
      }
   }

   var saveba = function() {
      // API not supported. Can't optimize the website
      if (!connection) {
         return false;
      }

      // Convert the ignoredElements property into an actual Array if it isn't
      if (!(defaults.ignoredElements instanceof Array)) {
         defaults.ignoredElements = [].slice.apply(defaults.ignoredElements);
      }

      var connectionType = detectConnectionCategory();

      // The connection is fast enough to load all the resources specified,
      // the type of the connection used is unknown, or there is no connection at all
      if (connectionType === ConnectionTypes.FAST_CONNECTION) {
         return true;
      }

      var elements;
      if (connectionType === ConnectionTypes.SLOW_CONNECTION) {
         // Select all images (non-content images and content images)
         elements = document.querySelectorAll('img');
      } else if (connectionType === ConnectionTypes.AVERAGE_CONNECTION) {
         // Select non-content images only
         elements = document.querySelectorAll('img[alt=""]');
      }
      elements = [].slice.call(elements);

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

    var destroy = function(elements) {
       // If the method is called without the parameter,
       // it acts upon all the modified elements.
       // Otherwise it converts the given parameter into
       // an actual array.
       if (!elements) {
          // Retrieve all the hidden images
          elements = [].slice.call(document.querySelectorAll('[data-saveba]'));
       } else if (elements instanceof Element) {
          elements = [elements];
       } else if (!(elements instanceof Array)) {
          elements = [].slice.call(elements);
       }

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
   document.addEventListener('DOMContentLoaded', saveba);

   return saveba;

})(window, document);