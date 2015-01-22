/* jshint browser: true */
/* exported saveba */
var saveba = (function (window, document) {
   'use strict';

   // Deal with the prefixed connection object exposed in Firefox
   var connection = window.navigator.connection    ||
                    window.navigator.mozConnection ||
                    null;

   // If the connection object is exposed, create an object that unifies
   // all the versions of the Network Information API's specifications
   if (connection !== null) {
      connection = {
         metered: !!connection.metered,
         // The value of downlinkMax is expressed in Megabits per second,
         // so it needs to be converted in Megabytes per second
         speed: 'downlinkMax' in connection ? connection.downlinkMax / 8 :
            'bandwidth' in connection ? connection.bandwidth : Infinity,
         type: connection.type
      };
   }

   // Default values.
   // Later exposed as saveba.defaults
   var defaults = {
      // A NodeList or an Array of elements the library must ignore
      ignoredElements: [],
      // A Number specifying the maximum speed in MB/s (Megabytes per second)
      // after which a connection isn't considered slow anymore
      slowMax: 0.5,
      // A Number specifying the minimum speed in MB/s (Megabytes per second)
      // after which a connection is considered fast
      fastMin: 2
   };

   // Define the constants for the different connection types used by the library
   var ConnectionTypes = {
      NONE: 0,
      SLOW: 1,
      AVERAGE: 2,
      FAST: 3
   };

   // The base64 encode of a transparent GIF used to replace
   // the "src" attribute of the targeted <img>s
   var transparentGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

   // The function that starting from the local connection object categorizes the connection
   function categorizeConnection() {
      if (connection.type === 'none') {
         return ConnectionTypes.NONE;
      } else if (
         connection.metered ||
         connection.speed < defaults.slowMax ||
         (connection.type === 'bluetooth' || connection.type === 'cellular')
      ) {
         return ConnectionTypes.SLOW;
      } else if (
         !connection.metered &&
         connection.speed >= defaults.slowMax && connection.speed < defaults.fastMin
      ) {
         return ConnectionTypes.AVERAGE;
      } else {
         return ConnectionTypes.FAST;
      }
   }

   var saveba = function() {
      // API not supported. Can't optimize the website
      if (!connection) {
         return false;
      }

      var connectionType = categorizeConnection();

      // The connection is fast enough to load all the resources specified,
      // the type of the connection used is unknown, or there is no connection at all
      if (connectionType === ConnectionTypes.NONE || connectionType === ConnectionTypes.FAST) {
         return true;
      }

      // Convert the ignoredElements property into an actual Array if it isn't
      if (!(defaults.ignoredElements instanceof Array)) {
         defaults.ignoredElements = [].slice.apply(defaults.ignoredElements);
      }

      var elements;
      if (connectionType === ConnectionTypes.SLOW) {
         // Select all images (non-content images and content images)
         elements = document.querySelectorAll('img');
      } else if (connectionType === ConnectionTypes.AVERAGE) {
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