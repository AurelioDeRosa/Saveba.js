(function (root, factory) {
   'use strict';

   if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define([], factory);
   } else if (typeof module === 'object' && module.exports) {
      // Node. Does not work with strict CommonJS, but
      // only CommonJS-like environments that support module.exports,
      // like Node.
      module.exports = factory();
   } else {
      // Browser globals (root is window)
      root.saveba = factory();
   }
} (this, function () {
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

   /**
    * Checks if the connection is slow
    *
    * @param {Object} connection The connection to test
    * @param {Object} settings The object containing the settings of the user
    *
    * @returns {boolean} true if the connection is slow; false otherwise
    */
   function isSlowConnection(connection, settings) {
      return connection.metered ||
         connection.speed < settings.slowMax ||
         connection.speed === Infinity &&
         (connection.type === 'bluetooth' || connection.type === 'cellular');
   }

   /**
    * Categorizes the connection based on the connection object
    *
    * @param {Object} connection The connection to test
    * @param {Object} settings The object containing the settings of the user
    *
    * @returns {number} the connection type
    */
   function categorizeConnection(connection, settings) {
      if (connection.type === 'none') {
         return ConnectionTypes.NONE;
      } else if (isSlowConnection(connection, settings)) {
         return ConnectionTypes.SLOW;
      } else if (
         !connection.metered &&
         connection.speed >= settings.slowMax && connection.speed < settings.fastMin
      ) {
         return ConnectionTypes.AVERAGE;
      } else {
         return ConnectionTypes.FAST;
      }
   }

   /**
    * Retrieves the elements to process based on the connection type
    * and the user settings
    *
    * @param {Object} connection The connection to test
    * @param {Object} settings The object containing the settings of the user
    *
    * @returns {HTMLElement[]} The elements to process
    */
   function getElements(connection, settings) {
      var connectionType = categorizeConnection(connection, settings);
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
      return elements.filter(function (element) {
         return settings.ignoredElements.indexOf(element) === -1 ? !element.complete : false;
      });
   }

   function saveba() {
      // API not supported. Can't optimize the website
      if (!connection) {
         return false;
      }

      var connectionType = categorizeConnection(connection, defaults);

      // The connection is fast enough to load all the resources specified,
      // the type of the connection used is unknown, or there is no connection at all
      if (connectionType === ConnectionTypes.NONE || connectionType === ConnectionTypes.FAST) {
         return true;
      }

      // Convert the ignoredElements property into an actual Array if it isn't
      if (!(defaults.ignoredElements instanceof Array)) {
         defaults.ignoredElements = [].slice.apply(defaults.ignoredElements);
      }

      // Replace the targeted resources with a 1x1 px, transparent GIF
      getElements(connection, defaults)
         .forEach(function (element) {
            element.dataset.saveba = element.src;
            element.src = transparentGif;
         });

      return true;
   }

   function destroy(elements) {
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
      for (var i = 0; i < elements.length; i++) {
         elements[i].src = elements[i].dataset.saveba;
         delete elements[i].dataset.saveba;
      }
   }

   // Expose the object containing the default values
   saveba.defaults = defaults;

   // Expose the destroy method
   saveba.destroy = destroy;

   // Run the function when the DOM is ready
   document.addEventListener('DOMContentLoaded', saveba);

   return saveba;

}));