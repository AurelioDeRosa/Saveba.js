# Saveba.js #

[Saveba.js](https://github.com/AurelioDeRosa/Saveba.js) is a JavaScript library that, relying on the [Network Information API](http://w3c.github.io/netinfo/), tries to save bandwidth to users having a slow connection by removing unnecessary* resources (at the moment images only).

*An explanation of what's considered an unnecessary resource can be found in the "[How does Saveba.js work](#how-does-savebajs-work)" section.

## Demo ##
To see Saveba.js in action you can take a look at the [live demo](http://aurelio.audero.it/demo/saveba.js/).

## Notes on Saveba.js ##

This library is intended more as a proof-of-concept of what is possible to do using the Network Information API than something you should use on your website, at least at the moment. In the [demo](demo/index.html) provided in this repository, I show a possible use case for Saveba.js. Using the library, the demo removes unnecessary resources but also offers a way to load them in case the user wants to.

## Notes on the Network Information API ##

The current specifications of the [Network Information API](http://w3c.github.io/netinfo/) integrates the [previous version](https://github.com/w3c/netinfo/blob/2a5b119f2bab96e3707ac85a3bc3ddfe2e69e112/index.html) (more details in section "[Previous versions](#previous-versions)") and try to address all the [criticisms](#criticisms) directed to the previous proposal. This version adds a `downlinkMax` property to the already defined `type` property, exposed through the `window.navigator` object.

The `downlinkMax` property represents the maximum downlink speed, in megabits per second (Mbps). Some examples of values are: `2` for an UMTS connection, `10` for an Ethernet connection, and `100` for an LTE
connection. You can find more values in the [table of maximum downlink speeds](http://w3c.github.io/netinfo/#max-downlink-table) reported in the specifications.

The `type` property returns the user agent's connection type and can assume one of the following values:

* `bluetooth`
* `cellular`
* `ethernet`
* `none`
* `wifi`
* `other`
* `unknown`

### Previous versions ###

The [previous version of the specifications](https://github.com/w3c/netinfo/blob/2a5b119f2bab96e3707ac85a3bc3ddfe2e69e112/index.html) defined an interface that exposed only the `type` property described in section "[Notes on the Network Information API](#notes-on-the-network-information-api)". This version of the specifications is what most modern browsers (Chrome 38, Opera 25, Firefox 31+)  support, so it's the one developers can use today.

The previous version superseded [the older specifications](http://www.w3.org/TR/2012/WD-netinfo-api-20121129/) that exposed two properties: `bandwidth` and `metered`. The first was a double representing an estimation of the current bandwidth in megabytes per second (MB/s), while the second was a Boolean that specified if the network connection of the device was subject to limitations. This even older version of the API is implemented in versions of Firefox prior to 31.

To learn more on this API, you can read my article [HTML5: Network Information API](code.tutsplus.com/tutorials/html5-network-information-api--cms-21598).

### Criticisms ###

The previous version of the specifications has been widely criticized by many developers. The main critique is that knowing only the type of the connection (Wi-Fi, Ethernet, and so on) isn't a good indication of the actual speed. For example, a user visiting a website on a 4G connection (exposed under the `cellular` value) may have a faster connection than another user on a Wi-Fi connection (exposed under the `wifi` value). This very concern has been expressed also by [Sindre Sorhus](https://twitter.com/sindresorhus) that in [a tweet](https://twitter.com/sindresorhus/status/505703515248156672) has ironically written:

> Future: "Best viewed on Wifi", "Sorry, ur connection [fast 4g] isnt fast enough for this experience, try wifi [slow]"

The debate on this API is really open as demonstrated by the continue evolution of the specifications and by [Paul Irish](https://twitter.com/paul_irish) that in [a post on Google+](https://plus.google.com/+PaulIrish/posts/Tio3suW88cu) asked:

> Question: is it worth exposing more information about the type of cellular (and other) connections? E.g. HSPA vs LTE, 2G vs 3G vs 4G. If yes, how would you use it? Concrete use cases would go a long way here! And if not, why not?﻿

Whether you think it's worth or not, the current specifications are a mere W3C editor's draft, so there is still time to contribute to the discussion and provide your feedback.

## How does Saveba.js work ##

Saveba.js relies on the information exposed by the Network Information API (all versions but the newest because it isn't supported by any browser) to retrieve the information of the user's connection and replace zero or more resources (currently images only) with a placeholder, based on the connection in use. Resources that are already in the browser's cache are shown regardless of the type of connection.

Specifically, Saveba.js performs one of the following operations:

* Replaces all non-cached images for slow connections
* Replaces non-content images (images having an empty `alt` attribute) that aren't in the browser's cache for average connections*
* Do nothing for fast connections

*Available in oldest specifications only. More on this in "[How connections are classified](#how-connections-are-classified)".

### How connections are classified ###

A **slow connection** is a connection whose `type` is `cellular` or `bluetooth`. In case the oldest specifications are supported, a slow connection is a metered one (`metered` property set to `true`) or a connection whose speed ranges from 0 to `slowMax` (more on this in "[Configuration](#configuration)" section).

An **average connection** is a connection that isn't metered and whose speed ranges from two values passed to the library (from `slowMax` to `fastMin`). Because this level depends on the `metered` property and the `speed` of the connection, it's only available in browsers that support the oldest specifications.

A **fast connection** is a connection whose `type` is `wifi` or `ethernet`.

The library does nothing also in case of an absent (`none`), unknown (`unknown`), or unspecified (`other`) connection.

## How to use ##

To use Saveba.js, download the JavaScript file contained in the "src" folder and include it in your web page.

```
<script src="path/to/saveba.js"></script>
```

That's it!

The library will do its work and expose a global object called `saveba`, available as a property of the `window` object.

### `destroy([elements])` ###

For the reasons described in the [Criticisms](#criticisms) section, Saveba.js is far from being perfect and 100% reliable. Therefore, you may want to remove the effect of this library allowing a user on a detected slow or average connection to see all the resources of the web page. To achieve this goal, you can invoke the `destroy()` method of the `saveba` object.

Let's say that the page has a button whose ID is `restore-resources`. You can add an event listener to the click event that restores all the resources as shown below:

```
<script>
document.getElementById('restore-resources').addEventListener('click', function(event) {
   saveba.destroy();
});
</script>
```

Alternatively, if you want to remove the changes of the library on a specific element or a collection of elements you can pass either the element or the collection to `destroy()` as shown below:

```
<script>
document.getElementById('restore-resources').addEventListener('click', function(event) {
   saveba.destroy(document.getElementById('image-1'));
});
</script>
```

or even:

```
<script>
document.getElementById('restore-resources').addEventListener('click', function(event) {
   saveba.destroy(document.querySelectorAll('img'));
});
</script>
```

### Configuration ###

Saveba.js has few options you can set after you've included the library. The options are exposed through the `defaults` property of `saveba` and are:

* `ignoredElements` (`Array` or `NodeList`. Default: `[]`): A set of elements the library must ignore;
* `slowMax` (`Number`. Default: `0.5`): The maximum speed after which a connection isn't considered slow anymore;
* `fastMin` (`Number`. Default: `2`): The minimum speed a connection must have to be considered fast.

Let's say that you want to avoid the optimizations for all the elements having class `ignore`, you can write in your pages:

```
<script src="path/to/saveba.js"></script>
<script>
   saveba.defaults.ignoredElements = document.getElementsByClassName('ignore');
</script>
```

## Browsers supported ##

Saveba.js uses the [Network Information API](http://w3c.github.io/netinfo/), so it works in the same browsers that support this API, and specifically:

- Firefox 30+. Prior to Firefox 31, the browser supports the oldest version of the API. In Firefox 31 the API [has been disabled on desktop](https://developer.mozilla.org/en-US/Firefox/Releases/31/Site_Compatibility)
- Chrome 38+, but it's only available in Chrome for Android, Chrome for iOS, and ChromeOS
- Opera 25+
- Browser for Android 2.2+

## Special thanks ##

A special thanks goes to [Ilya Grigorik](https://twitter.com/igrigorik) and [Steve Souders](https://twitter.com/Souders) (in alphabetical order) for their invaluable suggestions and comments that helped me in creating this library.

## License ##

[Saveba.js](https://github.com/AurelioDeRosa/Saveba.js) is dual licensed under [MIT](http://www.opensource.org/licenses/MIT) and [GPL-3.0](http://opensource.org/licenses/GPL-3.0)

## Author ##

[Aurelio De Rosa](http://www.audero.it) ([@AurelioDeRosa](https://twitter.com/AurelioDeRosa))
