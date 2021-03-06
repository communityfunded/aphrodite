(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.afrododi = {})));
}(this, (function (exports) { 'use strict';

  function hash(str) {
    var hash = 5381,
        i    = str.length;

    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
  }

  var stringHash = hash;

  /* ::
  type ObjectMap = { [id:string]: any };
  */

  var UPPERCASE_RE = /([A-Z])/g;
  var UPPERCASE_RE_TO_KEBAB = function UPPERCASE_RE_TO_KEBAB(match /* : string */) {
      return (/* : string */'-' + String(match.toLowerCase())
      );
  };

  var kebabifyStyleName = function kebabifyStyleName(string /* : string */) /* : string */{
      var result = string.replace(UPPERCASE_RE, UPPERCASE_RE_TO_KEBAB);
      if (result[0] === 'm' && result[1] === 's' && result[2] === '-') {
          return '-' + String(result);
      }
      return result;
  };

  /**
   * CSS properties which accept numbers but are not in units of "px".
   * Taken from React's CSSProperty.js
   */
  var isUnitlessNumber = {
      animationIterationCount: true,
      borderImageOutset: true,
      borderImageSlice: true,
      borderImageWidth: true,
      boxFlex: true,
      boxFlexGroup: true,
      boxOrdinalGroup: true,
      columnCount: true,
      flex: true,
      flexGrow: true,
      flexPositive: true,
      flexShrink: true,
      flexNegative: true,
      flexOrder: true,
      gridRow: true,
      gridColumn: true,
      fontWeight: true,
      lineClamp: true,
      lineHeight: true,
      opacity: true,
      order: true,
      orphans: true,
      tabSize: true,
      widows: true,
      zIndex: true,
      zoom: true,

      // SVG-related properties
      fillOpacity: true,
      floodOpacity: true,
      stopOpacity: true,
      strokeDasharray: true,
      strokeDashoffset: true,
      strokeMiterlimit: true,
      strokeOpacity: true,
      strokeWidth: true
  };

  /**
   * Taken from React's CSSProperty.js
   *
   * @param {string} prefix vendor-specific prefix, eg: Webkit
   * @param {string} key style name, eg: transitionDuration
   * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
   * WebkitTransitionDuration
   */
  function prefixKey(prefix, key) {
      return prefix + key.charAt(0).toUpperCase() + key.substring(1);
  }

  /**
   * Support style names that may come passed in prefixed by adding permutations
   * of vendor prefixes.
   * Taken from React's CSSProperty.js
   */
  var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

  // Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
  // infinite loop, because it iterates over the newly added props too.
  // Taken from React's CSSProperty.js
  Object.keys(isUnitlessNumber).forEach(function (prop) {
      prefixes.forEach(function (prefix) {
          isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
      });
  });

  var stringifyValue = function stringifyValue(key /* : string */
  , prop /* : any */
  ) /* : string */{
      if (typeof prop === "number") {
          if (isUnitlessNumber[key]) {
              return "" + prop;
          } else {
              return prop + "px";
          }
      } else {
          return '' + prop;
      }
  };

  var stringifyAndImportantifyValue = function stringifyAndImportantifyValue(key /* : string */
  , prop /* : any */
  ) {
      return (/* : string */importantify(stringifyValue(key, prop))
      );
  };

  // Turn a string into a hash string of base-36 values (using letters and numbers)
  // eslint-disable-next-line no-unused-vars
  var hashString = function hashString(string /* : string */, key /* : ?string */) {
      return (/* string */stringHash(string).toString(36)
      );
  };

  // Hash a javascript object using JSON.stringify. This is very fast, about 3
  // microseconds on my computer for a sample object:
  // http://jsperf.com/test-hashfnv32a-hash/5
  //
  // Note that this uses JSON.stringify to stringify the objects so in order for
  // this to produce consistent hashes browsers need to have a consistent
  // ordering of objects. Ben Alpert says that Facebook depends on this, so we
  // can probably depend on this too.
  var hashObject = function hashObject(object /* : ObjectMap */) {
      return (/* : string */hashString(JSON.stringify(object))
      );
  };

  // Given a single style value string like the "b" from "a: b;", adds !important
  // to generate "b !important".
  var importantify = function importantify(string /* : string */) {
      return (/* : string */
          // Bracket string character access is very fast, and in the default case we
          // normally don't expect there to be "!important" at the end of the string
          // so we can use this simple check to take an optimized path. If there
          // happens to be a "!" in this position, we follow up with a more thorough
          // check.
          string[string.length - 10] === '!' && string.slice(-11) === ' !important' ? string : String(string) + ' !important'
      );
  };

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  // Use the fastest means possible to execute a task in its own turn, with
  // priority over other events including IO, animation, reflow, and redraw
  // events in browsers.
  //
  // An exception thrown by a task will permanently interrupt the processing of
  // subsequent tasks. The higher level `asap` function ensures that if an
  // exception is thrown by a task, that the task queue will continue flushing as
  // soon as possible, but if you use `rawAsap` directly, you are responsible to
  // either ensure that no exceptions are thrown from your task, or to manually
  // call `rawAsap.requestFlush` if an exception is thrown.
  var browserRaw = rawAsap;
  function rawAsap(task) {
      if (!queue.length) {
          requestFlush();
      }
      // Equivalent to push, but avoids a function call.
      queue[queue.length] = task;
  }

  var queue = [];
  // `requestFlush` is an implementation-specific method that attempts to kick
  // off a `flush` event as quickly as possible. `flush` will attempt to exhaust
  // the event queue before yielding to the browser's own event loop.
  var requestFlush;
  // The position of the next task to execute in the task queue. This is
  // preserved between calls to `flush` so that it can be resumed if
  // a task throws an exception.
  var index = 0;
  // If a task schedules additional tasks recursively, the task queue can grow
  // unbounded. To prevent memory exhaustion, the task queue will periodically
  // truncate already-completed tasks.
  var capacity = 1024;

  // The flush function processes all tasks that have been scheduled with
  // `rawAsap` unless and until one of those tasks throws an exception.
  // If a task throws an exception, `flush` ensures that its state will remain
  // consistent and will resume where it left off when called again.
  // However, `flush` does not make any arrangements to be called again if an
  // exception is thrown.
  function flush() {
      while (index < queue.length) {
          var currentIndex = index;
          // Advance the index before calling the task. This ensures that we will
          // begin flushing on the next task the task throws an error.
          index = index + 1;
          queue[currentIndex].call();
          // Prevent leaking memory for long chains of recursive calls to `asap`.
          // If we call `asap` within tasks scheduled by `asap`, the queue will
          // grow, but to avoid an O(n) walk for every task we execute, we don't
          // shift tasks off the queue after they have been executed.
          // Instead, we periodically shift 1024 tasks off the queue.
          if (index > capacity) {
              // Manually shift all values starting at the index back to the
              // beginning of the queue.
              for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                  queue[scan] = queue[scan + index];
              }
              queue.length -= index;
              index = 0;
          }
      }
      queue.length = 0;
      index = 0;
  }

  // `requestFlush` is implemented using a strategy based on data collected from
  // every available SauceLabs Selenium web driver worker at time of writing.
  // https://docs.google.com/spreadsheets/d/1mG-5UYGup5qxGdEMWkhP6BWCz053NUb2E1QoUTU16uA/edit#gid=783724593

  // Safari 6 and 6.1 for desktop, iPad, and iPhone are the only browsers that
  // have WebKitMutationObserver but not un-prefixed MutationObserver.
  // Must use `global` or `self` instead of `window` to work in both frames and web
  // workers. `global` is a provision of Browserify, Mr, Mrs, or Mop.

  /* globals self */
  var scope = typeof commonjsGlobal !== "undefined" ? commonjsGlobal : self;
  var BrowserMutationObserver = scope.MutationObserver || scope.WebKitMutationObserver;

  // MutationObservers are desirable because they have high priority and work
  // reliably everywhere they are implemented.
  // They are implemented in all modern browsers.
  //
  // - Android 4-4.3
  // - Chrome 26-34
  // - Firefox 14-29
  // - Internet Explorer 11
  // - iPad Safari 6-7.1
  // - iPhone Safari 7-7.1
  // - Safari 6-7
  if (typeof BrowserMutationObserver === "function") {
      requestFlush = makeRequestCallFromMutationObserver(flush);

  // MessageChannels are desirable because they give direct access to the HTML
  // task queue, are implemented in Internet Explorer 10, Safari 5.0-1, and Opera
  // 11-12, and in web workers in many engines.
  // Although message channels yield to any queued rendering and IO tasks, they
  // would be better than imposing the 4ms delay of timers.
  // However, they do not work reliably in Internet Explorer or Safari.

  // Internet Explorer 10 is the only browser that has setImmediate but does
  // not have MutationObservers.
  // Although setImmediate yields to the browser's renderer, it would be
  // preferrable to falling back to setTimeout since it does not have
  // the minimum 4ms penalty.
  // Unfortunately there appears to be a bug in Internet Explorer 10 Mobile (and
  // Desktop to a lesser extent) that renders both setImmediate and
  // MessageChannel useless for the purposes of ASAP.
  // https://github.com/kriskowal/q/issues/396

  // Timers are implemented universally.
  // We fall back to timers in workers in most engines, and in foreground
  // contexts in the following browsers.
  // However, note that even this simple case requires nuances to operate in a
  // broad spectrum of browsers.
  //
  // - Firefox 3-13
  // - Internet Explorer 6-9
  // - iPad Safari 4.3
  // - Lynx 2.8.7
  } else {
      requestFlush = makeRequestCallFromTimer(flush);
  }

  // `requestFlush` requests that the high priority event queue be flushed as
  // soon as possible.
  // This is useful to prevent an error thrown in a task from stalling the event
  // queue if the exception handled by Node.js’s
  // `process.on("uncaughtException")` or by a domain.
  rawAsap.requestFlush = requestFlush;

  // To request a high priority event, we induce a mutation observer by toggling
  // the text of a text node between "1" and "-1".
  function makeRequestCallFromMutationObserver(callback) {
      var toggle = 1;
      var observer = new BrowserMutationObserver(callback);
      var node = document.createTextNode("");
      observer.observe(node, {characterData: true});
      return function requestCall() {
          toggle = -toggle;
          node.data = toggle;
      };
  }

  // The message channel technique was discovered by Malte Ubl and was the
  // original foundation for this library.
  // http://www.nonblocking.io/2011/06/windownexttick.html

  // Safari 6.0.5 (at least) intermittently fails to create message ports on a
  // page's first load. Thankfully, this version of Safari supports
  // MutationObservers, so we don't need to fall back in that case.

  // function makeRequestCallFromMessageChannel(callback) {
  //     var channel = new MessageChannel();
  //     channel.port1.onmessage = callback;
  //     return function requestCall() {
  //         channel.port2.postMessage(0);
  //     };
  // }

  // For reasons explained above, we are also unable to use `setImmediate`
  // under any circumstances.
  // Even if we were, there is another bug in Internet Explorer 10.
  // It is not sufficient to assign `setImmediate` to `requestFlush` because
  // `setImmediate` must be called *by name* and therefore must be wrapped in a
  // closure.
  // Never forget.

  // function makeRequestCallFromSetImmediate(callback) {
  //     return function requestCall() {
  //         setImmediate(callback);
  //     };
  // }

  // Safari 6.0 has a problem where timers will get lost while the user is
  // scrolling. This problem does not impact ASAP because Safari 6.0 supports
  // mutation observers, so that implementation is used instead.
  // However, if we ever elect to use timers in Safari, the prevalent work-around
  // is to add a scroll event listener that calls for a flush.

  // `setTimeout` does not call the passed callback if the delay is less than
  // approximately 7 in web workers in Firefox 8 through 18, and sometimes not
  // even then.

  function makeRequestCallFromTimer(callback) {
      return function requestCall() {
          // We dispatch a timeout with a specified delay of 0 for engines that
          // can reliably accommodate that request. This will usually be snapped
          // to a 4 milisecond delay, but once we're flushing, there's no delay
          // between events.
          var timeoutHandle = setTimeout(handleTimer, 0);
          // However, since this timer gets frequently dropped in Firefox
          // workers, we enlist an interval handle that will try to fire
          // an event 20 times per second until it succeeds.
          var intervalHandle = setInterval(handleTimer, 50);

          function handleTimer() {
              // Whichever timer succeeds will cancel both timers and
              // execute the callback.
              clearTimeout(timeoutHandle);
              clearInterval(intervalHandle);
              callback();
          }
      };
  }

  // This is for `asap.js` only.
  // Its name will be periodically randomized to break any code that depends on
  // its existence.
  rawAsap.makeRequestCallFromTimer = makeRequestCallFromTimer;

  // rawAsap provides everything we need except exception management.

  // RawTasks are recycled to reduce GC churn.
  var freeTasks = [];
  // We queue errors to ensure they are thrown in right order (FIFO).
  // Array-as-queue is good enough here, since we are just dealing with exceptions.
  var pendingErrors = [];
  var requestErrorThrow = browserRaw.makeRequestCallFromTimer(throwFirstError);

  function throwFirstError() {
      if (pendingErrors.length) {
          throw pendingErrors.shift();
      }
  }

  /**
   * Calls a task as soon as possible after returning, in its own event, with priority
   * over other events like animation, reflow, and repaint. An error thrown from an
   * event will not interrupt, nor even substantially slow down the processing of
   * other events, but will be rather postponed to a lower priority event.
   * @param {{call}} task A callable object, typically a function that takes no
   * arguments.
   */
  var browserAsap = asap;
  function asap(task) {
      var rawTask;
      if (freeTasks.length) {
          rawTask = freeTasks.pop();
      } else {
          rawTask = new RawTask();
      }
      rawTask.task = task;
      browserRaw(rawTask);
  }

  // We wrap tasks with recyclable task objects.  A task object implements
  // `call`, just like a function.
  function RawTask() {
      this.task = null;
  }

  // The sole purpose of wrapping the task is to catch the exception and recycle
  // the task object after its single use.
  RawTask.prototype.call = function () {
      try {
          this.task.call();
      } catch (error) {
          if (asap.onerror) {
              // This hook exists purely for testing purposes.
              // Its name will be periodically randomized to break any code that
              // depends on its existence.
              asap.onerror(error);
          } else {
              // In a web browser, exceptions are not fatal. However, to avoid
              // slowing down the queue of pending tasks, we rethrow the error in a
              // lower priority turn.
              pendingErrors.push(error);
              requestErrorThrow();
          }
      } finally {
          this.task = null;
          freeTasks[freeTasks.length] = this;
      }
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var MAP_EXISTS = typeof Map !== 'undefined';

  var OrderedElements = function () {
      /* ::
      elements: {[string]: any};
      keyOrder: string[];
      */

      function OrderedElements() {
          _classCallCheck(this, OrderedElements);

          this.elements = {};
          this.keyOrder = [];
      }

      _createClass(OrderedElements, [{
          key: 'forEach',
          value: function () {
              function forEach(callback /* : (string, any) => void */) {
                  for (var i = 0; i < this.keyOrder.length; i++) {
                      // (value, key) to match Map's API
                      callback(this.elements[this.keyOrder[i]], this.keyOrder[i]);
                  }
              }

              return forEach;
          }()
      }, {
          key: 'set',
          value: function () {
              function set(key /* : string */, value /* : any */, shouldReorder /* : ?boolean */) {
                  if (!this.elements.hasOwnProperty(key)) {
                      this.keyOrder.push(key);
                  } else if (shouldReorder) {
                      var index = this.keyOrder.indexOf(key);
                      this.keyOrder.splice(index, 1);
                      this.keyOrder.push(key);
                  }

                  if (value == null) {
                      this.elements[key] = value;
                      return;
                  }

                  if (MAP_EXISTS && value instanceof Map || value instanceof OrderedElements) {
                      // We have found a nested Map, so we need to recurse so that all
                      // of the nested objects and Maps are merged properly.
                      var nested = this.elements.hasOwnProperty(key) ? this.elements[key] : new OrderedElements();
                      value.forEach(function (value, key) {
                          nested.set(key, value, shouldReorder);
                      });
                      this.elements[key] = nested;
                      return;
                  }

                  if (!Array.isArray(value) && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                      // We have found a nested object, so we need to recurse so that all
                      // of the nested objects and Maps are merged properly.
                      var _nested = this.elements.hasOwnProperty(key) ? this.elements[key] : new OrderedElements();
                      var keys = Object.keys(value);
                      for (var i = 0; i < keys.length; i += 1) {
                          _nested.set(keys[i], value[keys[i]], shouldReorder);
                      }
                      this.elements[key] = _nested;
                      return;
                  }

                  this.elements[key] = value;
              }

              return set;
          }()
      }, {
          key: 'get',
          value: function () {
              function get(key /* : string */) /* : any */{
                  return this.elements[key];
              }

              return get;
          }()
      }, {
          key: 'has',
          value: function () {
              function has(key /* : string */) /* : boolean */{
                  return this.elements.hasOwnProperty(key);
              }

              return has;
          }()
      }, {
          key: 'addStyleType',
          value: function () {
              function addStyleType(styleType /* : any */) /* : void */{
                  var _this = this;

                  if (MAP_EXISTS && styleType instanceof Map || styleType instanceof OrderedElements) {
                      styleType.forEach(function (value, key) {
                          _this.set(key, value, true);
                      });
                  } else {
                      var keys = Object.keys(styleType);
                      for (var i = 0; i < keys.length; i++) {
                          this.set(keys[i], styleType[keys[i]], true);
                      }
                  }
              }

              return addStyleType;
          }()
      }]);

      return OrderedElements;
  }();

  var capitalizeString_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = capitalizeString;
  function capitalizeString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  module.exports = exports["default"];
  });

  unwrapExports(capitalizeString_1);

  var prefixProperty_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = prefixProperty;



  var _capitalizeString2 = _interopRequireDefault(capitalizeString_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function prefixProperty(prefixProperties, property, style) {
    if (prefixProperties.hasOwnProperty(property)) {
      var newStyle = {};
      var requiredPrefixes = prefixProperties[property];
      var capitalizedProperty = (0, _capitalizeString2.default)(property);
      var keys = Object.keys(style);
      for (var i = 0; i < keys.length; i++) {
        var styleProperty = keys[i];
        if (styleProperty === property) {
          for (var j = 0; j < requiredPrefixes.length; j++) {
            newStyle[requiredPrefixes[j] + capitalizedProperty] = style[property];
          }
        }
        newStyle[styleProperty] = style[styleProperty];
      }
      return newStyle;
    }
    return style;
  }
  module.exports = exports['default'];
  });

  unwrapExports(prefixProperty_1);

  var prefixValue_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = prefixValue;
  function prefixValue(plugins, property, value, style, metaData) {
    for (var i = 0, len = plugins.length; i < len; ++i) {
      var processedValue = plugins[i](property, value, style, metaData);

      // we can stop processing if a value is returned
      // as all plugin criteria are unique
      if (processedValue) {
        return processedValue;
      }
    }
  }
  module.exports = exports["default"];
  });

  unwrapExports(prefixValue_1);

  var addNewValuesOnly_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = addNewValuesOnly;
  function addIfNew(list, value) {
    if (list.indexOf(value) === -1) {
      list.push(value);
    }
  }

  function addNewValuesOnly(list, values) {
    if (Array.isArray(values)) {
      for (var i = 0, len = values.length; i < len; ++i) {
        addIfNew(list, values[i]);
      }
    } else {
      addIfNew(list, values);
    }
  }
  module.exports = exports["default"];
  });

  unwrapExports(addNewValuesOnly_1);

  var isObject_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isObject;
  function isObject(value) {
    return value instanceof Object && !Array.isArray(value);
  }
  module.exports = exports["default"];
  });

  unwrapExports(isObject_1);

  var createPrefixer_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = createPrefixer;



  var _prefixProperty2 = _interopRequireDefault(prefixProperty_1);



  var _prefixValue2 = _interopRequireDefault(prefixValue_1);



  var _addNewValuesOnly2 = _interopRequireDefault(addNewValuesOnly_1);



  var _isObject2 = _interopRequireDefault(isObject_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function createPrefixer(_ref) {
    var prefixMap = _ref.prefixMap,
        plugins = _ref.plugins;

    function prefixAll(style) {
      for (var property in style) {
        var value = style[property];

        // handle nested objects
        if ((0, _isObject2.default)(value)) {
          style[property] = prefixAll(value);
          // handle array values
        } else if (Array.isArray(value)) {
          var combinedValue = [];

          for (var i = 0, len = value.length; i < len; ++i) {
            var processedValue = (0, _prefixValue2.default)(plugins, property, value[i], style, prefixMap);
            (0, _addNewValuesOnly2.default)(combinedValue, processedValue || value[i]);
          }

          // only modify the value if it was touched
          // by any plugin to prevent unnecessary mutations
          if (combinedValue.length > 0) {
            style[property] = combinedValue;
          }
        } else {
          var _processedValue = (0, _prefixValue2.default)(plugins, property, value, style, prefixMap);

          // only modify the value if it was touched
          // by any plugin to prevent unnecessary mutations
          if (_processedValue) {
            style[property] = _processedValue;
          }

          style = (0, _prefixProperty2.default)(prefixMap, property, style);
        }
      }

      return style;
    }

    return prefixAll;
  }
  module.exports = exports['default'];
  });

  var createPrefixer = unwrapExports(createPrefixer_1);

  var isPrefixedValue_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isPrefixedValue;
  var regex = /-webkit-|-moz-|-ms-/;

  function isPrefixedValue(value) {
    return typeof value === 'string' && regex.test(value);
  }
  module.exports = exports['default'];
  });

  unwrapExports(isPrefixedValue_1);

  var calc_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = calc;



  var _isPrefixedValue2 = _interopRequireDefault(isPrefixedValue_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  var prefixes = ['-webkit-', '-moz-', ''];
  function calc(property, value) {
    if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && value.indexOf('calc(') > -1) {
      return prefixes.map(function (prefix) {
        return value.replace(/calc\(/g, prefix + 'calc(');
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(calc_1);

  var crossFade_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = crossFade;



  var _isPrefixedValue2 = _interopRequireDefault(isPrefixedValue_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // http://caniuse.com/#search=cross-fade
  var prefixes = ['-webkit-', ''];
  function crossFade(property, value) {
    if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && value.indexOf('cross-fade(') > -1) {
      return prefixes.map(function (prefix) {
        return value.replace(/cross-fade\(/g, prefix + 'cross-fade(');
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(crossFade_1);

  var cursor_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = cursor;
  var prefixes = ['-webkit-', '-moz-', ''];

  var values = {
    'zoom-in': true,
    'zoom-out': true,
    grab: true,
    grabbing: true
  };

  function cursor(property, value) {
    if (property === 'cursor' && values.hasOwnProperty(value)) {
      return prefixes.map(function (prefix) {
        return prefix + value;
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(cursor_1);

  var filter_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = filter;



  var _isPrefixedValue2 = _interopRequireDefault(isPrefixedValue_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // http://caniuse.com/#feat=css-filter-function
  var prefixes = ['-webkit-', ''];
  function filter(property, value) {
    if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && value.indexOf('filter(') > -1) {
      return prefixes.map(function (prefix) {
        return value.replace(/filter\(/g, prefix + 'filter(');
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(filter_1);

  var flex_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = flex;
  var values = {
    flex: ['-webkit-box', '-moz-box', '-ms-flexbox', '-webkit-flex', 'flex'],
    'inline-flex': ['-webkit-inline-box', '-moz-inline-box', '-ms-inline-flexbox', '-webkit-inline-flex', 'inline-flex']
  };

  function flex(property, value) {
    if (property === 'display' && values.hasOwnProperty(value)) {
      return values[value];
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(flex_1);

  var flexboxIE_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = flexboxIE;
  var alternativeValues = {
    'space-around': 'distribute',
    'space-between': 'justify',
    'flex-start': 'start',
    'flex-end': 'end'
  };
  var alternativeProps = {
    alignContent: 'msFlexLinePack',
    alignSelf: 'msFlexItemAlign',
    alignItems: 'msFlexAlign',
    justifyContent: 'msFlexPack',
    order: 'msFlexOrder',
    flexGrow: 'msFlexPositive',
    flexShrink: 'msFlexNegative',
    flexBasis: 'msFlexPreferredSize'
  };

  function flexboxIE(property, value, style) {
    if (alternativeProps.hasOwnProperty(property)) {
      style[alternativeProps[property]] = alternativeValues[value] || value;
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(flexboxIE_1);

  var flexboxOld_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = flexboxOld;
  var alternativeValues = {
    'space-around': 'justify',
    'space-between': 'justify',
    'flex-start': 'start',
    'flex-end': 'end',
    'wrap-reverse': 'multiple',
    wrap: 'multiple',
    flex: 'box',
    'inline-flex': 'inline-box'
  };

  var alternativeProps = {
    alignItems: 'WebkitBoxAlign',
    justifyContent: 'WebkitBoxPack',
    flexWrap: 'WebkitBoxLines',
    flexGrow: 'WebkitBoxFlex'
  };

  function flexboxOld(property, value, style) {
    if (property === 'flexDirection' && typeof value === 'string') {
      if (value.indexOf('column') > -1) {
        style.WebkitBoxOrient = 'vertical';
      } else {
        style.WebkitBoxOrient = 'horizontal';
      }
      if (value.indexOf('reverse') > -1) {
        style.WebkitBoxDirection = 'reverse';
      } else {
        style.WebkitBoxDirection = 'normal';
      }
    }
    if (alternativeProps.hasOwnProperty(property)) {
      style[alternativeProps[property]] = alternativeValues[value] || value;
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(flexboxOld_1);

  var gradient_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = gradient;



  var _isPrefixedValue2 = _interopRequireDefault(isPrefixedValue_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  var prefixes = ['-webkit-', '-moz-', ''];

  var values = /linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient/gi;

  function gradient(property, value) {
    if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && values.test(value)) {
      return prefixes.map(function (prefix) {
        return value.replace(values, function (grad) {
          return prefix + grad;
        });
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(gradient_1);

  var imageSet_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = imageSet;



  var _isPrefixedValue2 = _interopRequireDefault(isPrefixedValue_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // http://caniuse.com/#feat=css-image-set
  var prefixes = ['-webkit-', ''];
  function imageSet(property, value) {
    if (typeof value === 'string' && !(0, _isPrefixedValue2.default)(value) && value.indexOf('image-set(') > -1) {
      return prefixes.map(function (prefix) {
        return value.replace(/image-set\(/g, prefix + 'image-set(');
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(imageSet_1);

  var position_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = position;
  function position(property, value) {
    if (property === 'position' && value === 'sticky') {
      return ['-webkit-sticky', 'sticky'];
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(position_1);

  var sizing_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = sizing;
  var prefixes = ['-webkit-', '-moz-', ''];

  var properties = {
    maxHeight: true,
    maxWidth: true,
    width: true,
    height: true,
    columnWidth: true,
    minWidth: true,
    minHeight: true
  };
  var values = {
    'min-content': true,
    'max-content': true,
    'fill-available': true,
    'fit-content': true,
    'contain-floats': true
  };

  function sizing(property, value) {
    if (properties.hasOwnProperty(property) && values.hasOwnProperty(value)) {
      return prefixes.map(function (prefix) {
        return prefix + value;
      });
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(sizing_1);

  var uppercasePattern = /[A-Z]/g;
  var msPattern = /^ms-/;
  var cache = {};

  function hyphenateStyleName(string) {
      return string in cache
      ? cache[string]
      : cache[string] = string
        .replace(uppercasePattern, '-$&')
        .toLowerCase()
        .replace(msPattern, '-ms-');
  }

  var hyphenateStyleName_1 = hyphenateStyleName;

  var hyphenateProperty_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = hyphenateProperty;



  var _hyphenateStyleName2 = _interopRequireDefault(hyphenateStyleName_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function hyphenateProperty(property) {
    return (0, _hyphenateStyleName2.default)(property);
  }
  module.exports = exports['default'];
  });

  unwrapExports(hyphenateProperty_1);

  var transition_1 = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = transition;



  var _hyphenateProperty2 = _interopRequireDefault(hyphenateProperty_1);



  var _isPrefixedValue2 = _interopRequireDefault(isPrefixedValue_1);



  var _capitalizeString2 = _interopRequireDefault(capitalizeString_1);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  var properties = {
    transition: true,
    transitionProperty: true,
    WebkitTransition: true,
    WebkitTransitionProperty: true,
    MozTransition: true,
    MozTransitionProperty: true
  };


  var prefixMapping = {
    Webkit: '-webkit-',
    Moz: '-moz-',
    ms: '-ms-'
  };

  function prefixValue(value, propertyPrefixMap) {
    if ((0, _isPrefixedValue2.default)(value)) {
      return value;
    }

    // only split multi values, not cubic beziers
    var multipleValues = value.split(/,(?![^()]*(?:\([^()]*\))?\))/g);

    for (var i = 0, len = multipleValues.length; i < len; ++i) {
      var singleValue = multipleValues[i];
      var values = [singleValue];
      for (var property in propertyPrefixMap) {
        var dashCaseProperty = (0, _hyphenateProperty2.default)(property);

        if (singleValue.indexOf(dashCaseProperty) > -1 && dashCaseProperty !== 'order') {
          var prefixes = propertyPrefixMap[property];
          for (var j = 0, pLen = prefixes.length; j < pLen; ++j) {
            // join all prefixes and create a new value
            values.unshift(singleValue.replace(dashCaseProperty, prefixMapping[prefixes[j]] + dashCaseProperty));
          }
        }
      }

      multipleValues[i] = values.join(',');
    }

    return multipleValues.join(',');
  }

  function transition(property, value, style, propertyPrefixMap) {
    // also check for already prefixed transitions
    if (typeof value === 'string' && properties.hasOwnProperty(property)) {
      var outputValue = prefixValue(value, propertyPrefixMap);
      // if the property is already prefixed
      var webkitOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function (val) {
        return !/-moz-|-ms-/.test(val);
      }).join(',');

      if (property.indexOf('Webkit') > -1) {
        return webkitOutput;
      }

      var mozOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function (val) {
        return !/-webkit-|-ms-/.test(val);
      }).join(',');

      if (property.indexOf('Moz') > -1) {
        return mozOutput;
      }

      style['Webkit' + (0, _capitalizeString2.default)(property)] = webkitOutput;
      style['Moz' + (0, _capitalizeString2.default)(property)] = mozOutput;
      return outputValue;
    }
  }
  module.exports = exports['default'];
  });

  unwrapExports(transition_1);

  var w = ["Webkit"];
  var m = ["Moz"];
  var ms = ["ms"];
  var wm = ["Webkit", "Moz"];
  var wms = ["Webkit", "ms"];
  var wmms = ["Webkit", "Moz", "ms"];

  var staticPrefixData = {
    plugins: [calc_1, crossFade_1, cursor_1, filter_1, flex_1, flexboxIE_1, flexboxOld_1, gradient_1, imageSet_1, position_1, sizing_1, transition_1],
    prefixMap: { "transform": wms, "transformOrigin": wms, "transformOriginX": wms, "transformOriginY": wms, "backfaceVisibility": w, "perspective": w, "perspectiveOrigin": w, "transformStyle": w, "transformOriginZ": w, "animation": w, "animationDelay": w, "animationDirection": w, "animationFillMode": w, "animationDuration": w, "animationIterationCount": w, "animationName": w, "animationPlayState": w, "animationTimingFunction": w, "appearance": wm, "userSelect": wmms, "fontKerning": w, "textEmphasisPosition": w, "textEmphasis": w, "textEmphasisStyle": w, "textEmphasisColor": w, "boxDecorationBreak": w, "clipPath": w, "maskImage": w, "maskMode": w, "maskRepeat": w, "maskPosition": w, "maskClip": w, "maskOrigin": w, "maskSize": w, "maskComposite": w, "mask": w, "maskBorderSource": w, "maskBorderMode": w, "maskBorderSlice": w, "maskBorderWidth": w, "maskBorderOutset": w, "maskBorderRepeat": w, "maskBorder": w, "maskType": w, "textDecorationStyle": wm, "textDecorationSkip": wm, "textDecorationLine": wm, "textDecorationColor": wm, "filter": w, "fontFeatureSettings": wm, "breakAfter": wmms, "breakBefore": wmms, "breakInside": wmms, "columnCount": wm, "columnFill": wm, "columnGap": wm, "columnRule": wm, "columnRuleColor": wm, "columnRuleStyle": wm, "columnRuleWidth": wm, "columns": wm, "columnSpan": wm, "columnWidth": wm, "writingMode": wms, "flex": wms, "flexBasis": w, "flexDirection": wms, "flexGrow": w, "flexFlow": wms, "flexShrink": w, "flexWrap": wms, "alignContent": w, "alignItems": w, "alignSelf": w, "justifyContent": w, "order": w, "transitionDelay": w, "transitionDuration": w, "transitionProperty": w, "transitionTimingFunction": w, "backdropFilter": w, "scrollSnapType": wms, "scrollSnapPointsX": wms, "scrollSnapPointsY": wms, "scrollSnapDestination": wms, "scrollSnapCoordinate": wms, "shapeImageThreshold": w, "shapeImageMargin": w, "shapeImageOutside": w, "hyphens": wmms, "flowInto": wms, "flowFrom": wms, "regionFragment": wms, "textOrientation": w, "boxSizing": m, "textAlignLast": m, "tabSize": m, "wrapFlow": ms, "wrapThrough": ms, "wrapMargin": ms, "touchAction": ms, "gridTemplateColumns": ms, "gridTemplateRows": ms, "gridTemplateAreas": ms, "gridTemplate": ms, "gridAutoColumns": ms, "gridAutoRows": ms, "gridAutoFlow": ms, "grid": ms, "gridRowStart": ms, "gridColumnStart": ms, "gridRowEnd": ms, "gridRow": ms, "gridColumn": ms, "gridColumnEnd": ms, "gridColumnGap": ms, "gridRowGap": ms, "gridArea": ms, "gridGap": ms, "textSizeAdjust": ["ms", "Webkit"], "borderImage": w, "borderImageOutset": w, "borderImageRepeat": w, "borderImageSlice": w, "borderImageSource": w, "borderImageWidth": w }
  };

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  var prefixAll = createPrefixer(staticPrefixData);

  /* ::
  import type { SheetDefinition } from './index.js';
  type StringHandlers = { [id:string]: Function };
  type SelectorCallback = (selector: string) => string[];
  export type SelectorHandler = (
      selector: string,
      baseSelector: string,
      callback: SelectorCallback
  ) => string[] | string | null;
  */

  /**
   * `selectorHandlers` are functions which handle special selectors which act
   * differently than normal style definitions. These functions look at the
   * current selector and can generate CSS for the styles in their subtree by
   * calling the callback with a new selector.
   *
   * For example, when generating styles with a base selector of '.foo' and the
   * following styles object:
   *
   *   {
   *     ':nth-child(2n)': {
   *       ':hover': {
   *         color: 'red'
   *       }
   *     }
   *   }
   *
   * when we reach the ':hover' style, we would call our selector handlers like
   *
   *   handler(':hover', '.foo:nth-child(2n)', callback)
   *
   * Since our `pseudoSelectors` handles ':hover' styles, that handler would call
   * the callback like
   *
   *   callback('.foo:nth-child(2n):hover')
   *
   * to generate its subtree `{ color: 'red' }` styles with a
   * '.foo:nth-child(2n):hover' selector. The callback would return an array of CSS
   * rules like
   *
   *   ['.foo:nth-child(2n):hover{color:red !important;}']
   *
   * and the handler would then return that resulting CSS.
   *
   * `defaultSelectorHandlers` is the list of default handlers used in a call to
   * `generateCSS`.
   *
   * @name SelectorHandler
   * @function
   * @param {string} selector: The currently inspected selector. ':hover' in the
   *     example above.
   * @param {string} baseSelector: The selector of the parent styles.
   *     '.foo:nth-child(2n)' in the example above.
   * @param {function} generateSubtreeStyles: A function which can be called to
   *     generate CSS for the subtree of styles corresponding to the selector.
   *     Accepts a new baseSelector to use for generating those styles.
   * @returns {string[] | string | null} The generated CSS for this selector, or
   *     null if we don't handle this selector.
   */
  var defaultSelectorHandlers /* : SelectorHandler[] */ = [
  // Handle pseudo-selectors, like :hover and :nth-child(3n)
  function () {
      function pseudoSelectors(selector, baseSelector, generateSubtreeStyles) {
          if (selector[0] !== ":") {
              return null;
          }
          return generateSubtreeStyles(baseSelector + selector);
      }

      return pseudoSelectors;
  }(),

  // Handle media queries (or font-faces)
  function () {
      function mediaQueries(selector, baseSelector, generateSubtreeStyles) {
          if (selector[0] !== "@") {
              return null;
          }
          // Generate the styles normally, and then wrap them in the media query.
          var generated = generateSubtreeStyles(baseSelector);
          return [String(selector) + '{' + String(generated.join('')) + '}'];
      }

      return mediaQueries;
  }()];

  /**
   * Generate CSS for a selector and some styles.
   *
   * This function handles the media queries and pseudo selectors that can be used
   * in afrododi styles.
   *
   * @param {string} selector: A base CSS selector for the styles to be generated
   *     with.
   * @param {Object} styleTypes: A list of properties of the return type of
   *     StyleSheet.create, e.g. [styles.red, styles.blue].
   * @param {Array.<SelectorHandler>} selectorHandlers: A list of selector
   *     handlers to use for handling special selectors. See
   *     `defaultSelectorHandlers`.
   * @param stringHandlers: See `generateCSSRuleset`
   * @param useImportant: See `generateCSSRuleset`
   *
   * To actually generate the CSS special-construct-less styles are passed to
   * `generateCSSRuleset`.
   *
   * For instance, a call to
   *
   *     generateCSS(".foo", [{
   *       color: "red",
   *       "@media screen": {
   *         height: 20,
   *         ":hover": {
   *           backgroundColor: "black"
   *         }
   *       },
   *       ":active": {
   *         fontWeight: "bold"
   *       }
   *     }], defaultSelectorHandlers);
   *
   * with the default `selectorHandlers` will make 5 calls to
   * `generateCSSRuleset`:
   *
   *     generateCSSRuleset(".foo", { color: "red" }, ...)
   *     generateCSSRuleset(".foo:active", { fontWeight: "bold" }, ...)
   *     // These 2 will be wrapped in @media screen {}
   *     generateCSSRuleset(".foo", { height: 20 }, ...)
   *     generateCSSRuleset(".foo:hover", { backgroundColor: "black" }, ...)
   */
  var generateCSS = function generateCSS(selector /* : string */
  , styleTypes /* : SheetDefinition[] */
  , selectorHandlers /* : SelectorHandler[] */
  , stringHandlers /* : StringHandlers */
  , useImportant /* : boolean */
  ) /* : string[] */{
      var merged = new OrderedElements();

      for (var i = 0; i < styleTypes.length; i++) {
          merged.addStyleType(styleTypes[i]);
      }

      var plainDeclarations = new OrderedElements();
      var generatedStyles = [];

      // TODO(emily): benchmark this to see if a plain for loop would be faster.
      merged.forEach(function (val, key) {
          // For each key, see if one of the selector handlers will handle these
          // styles.
          var foundHandler = selectorHandlers.some(function (handler) {
              var result = handler(key, selector, function (newSelector) {
                  return generateCSS(newSelector, [val], selectorHandlers, stringHandlers, useImportant);
              });
              if (result != null) {
                  // If the handler returned something, add it to the generated
                  // CSS and stop looking for another handler.
                  if (Array.isArray(result)) {
                      generatedStyles.push.apply(generatedStyles, _toConsumableArray(result));
                  } else {
                      // eslint-disable-next-line
                      console.warn('WARNING: Selector handlers should return an array of rules.' + 'Returning a string containing multiple rules is deprecated.', handler);
                      generatedStyles.push('@media all {' + String(result) + '}');
                  }
                  return true;
              }
          });
          // If none of the handlers handled it, add it to the list of plain
          // style declarations.
          if (!foundHandler) {
              plainDeclarations.set(key, val, true);
          }
      });
      var generatedRuleset = generateCSSRuleset(selector, plainDeclarations, stringHandlers, useImportant, selectorHandlers);

      if (generatedRuleset) {
          generatedStyles.unshift(generatedRuleset);
      }

      return generatedStyles;
  };

  /**
   * Helper method of generateCSSRuleset to facilitate custom handling of certain
   * CSS properties. Used for e.g. font families.
   *
   * See generateCSSRuleset for usage and documentation of paramater types.
   */
  var runStringHandlers = function runStringHandlers(declarations /* : OrderedElements */
  , stringHandlers /* : StringHandlers */
  , selectorHandlers /* : SelectorHandler[] */
  ) /* : void */{
      if (!stringHandlers) {
          return;
      }

      var stringHandlerKeys = Object.keys(stringHandlers);
      for (var i = 0; i < stringHandlerKeys.length; i++) {
          var key = stringHandlerKeys[i];
          if (declarations.has(key)) {
              // A declaration exists for this particular string handler, so we
              // need to let the string handler interpret the declaration first
              // before proceeding.
              //
              // TODO(emily): Pass in a callback which generates CSS, similar to
              // how our selector handlers work, instead of passing in
              // `selectorHandlers` and have them make calls to `generateCSS`
              // themselves. Right now, this is impractical because our string
              // handlers are very specialized and do complex things.
              declarations.set(key, stringHandlers[key](declarations.get(key), selectorHandlers),

              // Preserve order here, since we are really replacing an
              // unprocessed style with a processed style, not overriding an
              // earlier style
              false);
          }
      }
  };

  var transformRule = function transformRule(key /* : string */
  , value /* : string */
  , transformValue /* : function */
  ) {
      return (/* : string */String(kebabifyStyleName(key)) + ':' + String(transformValue(key, value)) + ';'
      );
  };

  var arrayToObjectKeysReducer = function arrayToObjectKeysReducer(acc, val) {
      acc[val] = true;
      return acc;
  };

  /**
   * Generate a CSS ruleset with the selector and containing the declarations.
   *
   * This function assumes that the given declarations don't contain any special
   * children (such as media queries, pseudo-selectors, or descendant styles).
   *
   * Note that this method does not deal with nesting used for e.g.
   * psuedo-selectors or media queries. That responsibility is left to  the
   * `generateCSS` function.
   *
   * @param {string} selector: the selector associated with the ruleset
   * @param {Object} declarations: a map from camelCased CSS property name to CSS
   *     property value.
   * @param {Object.<string, function>} stringHandlers: a map from camelCased CSS
   *     property name to a function which will map the given value to the value
   *     that is output.
   * @param {bool} useImportant: A boolean saying whether to append "!important"
   *     to each of the CSS declarations.
   * @returns {string} A string of raw CSS.
   *
   * Examples:
   *
   *    generateCSSRuleset(".blah", { color: "red" })
   *    -> ".blah{color: red !important;}"
   *    generateCSSRuleset(".blah", { color: "red" }, {}, false)
   *    -> ".blah{color: red}"
   *    generateCSSRuleset(".blah", { color: "red" }, {color: c => c.toUpperCase})
   *    -> ".blah{color: RED}"
   *    generateCSSRuleset(".blah:hover", { color: "red" })
   *    -> ".blah:hover{color: red}"
   */
  var generateCSSRuleset = function generateCSSRuleset(selector /* : string */
  , declarations /* : OrderedElements */
  , stringHandlers /* : StringHandlers */
  , useImportant /* : boolean */
  , selectorHandlers /* : SelectorHandler[] */
  ) /* : string */{
      // Mutates declarations
      runStringHandlers(declarations, stringHandlers, selectorHandlers);

      var originalElements = Object.keys(declarations.elements).reduce(arrayToObjectKeysReducer, Object.create(null));

      // NOTE(emily): This mutates handledDeclarations.elements.
      var prefixedElements = prefixAll(declarations.elements);

      var elementNames = Object.keys(prefixedElements);
      if (elementNames.length !== declarations.keyOrder.length) {
          // There are some prefixed values, so we need to figure out how to sort
          // them.
          //
          // Loop through prefixedElements, looking for anything that is not in
          // sortOrder, which means it was added by prefixAll. This means that we
          // need to figure out where it should appear in the sortOrder.
          for (var i = 0; i < elementNames.length; i++) {
              if (!originalElements[elementNames[i]]) {
                  // This element is not in the sortOrder, which means it is a prefixed
                  // value that was added by prefixAll. Let's try to figure out where it
                  // goes.
                  var originalStyle = void 0;
                  if (elementNames[i][0] === 'W') {
                      // This is a Webkit-prefixed style, like "WebkitTransition". Let's
                      // find its original style's sort order.
                      originalStyle = elementNames[i][6].toLowerCase() + elementNames[i].slice(7);
                  } else if (elementNames[i][1] === 'o') {
                      // This is a Moz-prefixed style, like "MozTransition". We check
                      // the second character to avoid colliding with Ms-prefixed
                      // styles. Let's find its original style's sort order.
                      originalStyle = elementNames[i][3].toLowerCase() + elementNames[i].slice(4);
                  } else {
                      // if (elementNames[i][1] === 's') {
                      // This is a Ms-prefixed style, like "MsTransition".
                      originalStyle = elementNames[i][2].toLowerCase() + elementNames[i].slice(3);
                  }

                  if (originalStyle && originalElements[originalStyle]) {
                      var originalIndex = declarations.keyOrder.indexOf(originalStyle);
                      declarations.keyOrder.splice(originalIndex, 0, elementNames[i]);
                  } else {
                      // We don't know what the original style was, so sort it to
                      // top. This can happen for styles that are added that don't
                      // have the same base name as the original style.
                      declarations.keyOrder.unshift(elementNames[i]);
                  }
              }
          }
      }

      var transformValue = useImportant === false ? stringifyValue : stringifyAndImportantifyValue;

      var rules = [];
      for (var _i = 0; _i < declarations.keyOrder.length; _i++) {
          var key = declarations.keyOrder[_i];
          var value = prefixedElements[key];
          if (Array.isArray(value)) {
              // inline-style-prefixer returns an array when there should be
              // multiple rules for the same key. Here we flatten to multiple
              // pairs with the same key.
              for (var j = 0; j < value.length; j++) {
                  rules.push(transformRule(key, value[j], transformValue));
              }
          } else {
              rules.push(transformRule(key, value, transformValue));
          }
      }

      if (rules.length) {
          return String(selector) + '{' + String(rules.join("")) + '}';
      } else {
          return "";
      }
  };

  var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  /* ::
  import type { SheetDefinition, SheetDefinitions } from './index.js';
  import type { MaybeSheetDefinition } from './exports.js';
  import type { SelectorHandler } from './generate.js';

  export type StyleContext = {
      styleTag?: HTMLStyleElement,
      alreadyInjected: { [string]: boolean },
      injectionBuffer: string[],
      isBuffering: boolean,
  };
  */

  var createContext = function createContext() {
      return (/* : StyleContext */{
              // The current <style> tag we are inserting into, or null if we haven't
              // inserted anything yet. We could find this each time using
              // `document.querySelector("style[data-afrododi"])`, but holding onto it is
              // faster.
              styleTag: undefined,

              // This is a map from afrododi's generated class names to `true` (acting as a
              // set of class names)
              alreadyInjected: {},

              // This is the buffer of styles which have not yet been flushed.
              injectionBuffer: [],

              // A flag to tell if we are already buffering styles. This could happen either
              // because we scheduled a flush call already, so newly added styles will
              // already be flushed, or because we are statically buffering on the server.
              isBuffering: false
          }
      );
  };

  // Inject a set of rules into a <style> tag in the head of the document. This
  // will automatically create a style tag and then continue to use it for
  // multiple injections. It will also use a style tag with the `data-afrododi`
  // tag on it if that exists in the DOM. This could be used for e.g. reusing the
  // same style tag that server-side rendering inserts.
  var injectStyleTag = function injectStyleTag(context /* : StyleContext */, cssRules /* : string[] */) {
      if (context.styleTag == null) {
          // Try to find a style tag with the `data-afrododi` attribute first.
          context.styleTag = document.querySelector("style[data-afrododi]") /* : any */;

          // If that doesn't work, generate a new style tag.
          if (context.styleTag == null) {
              // Taken from
              // http://stackoverflow.com/questions/524696/how-to-create-a-style-tag-with-javascript
              var head = document.head || document.getElementsByTagName('head')[0];
              context.styleTag = document.createElement('style');

              context.styleTag.type = 'text/css';
              context.styleTag.setAttribute("data-afrododi", "");
              if (context.styleTag) head.appendChild(context.styleTag);
          }
      }

      // $FlowFixMe
      var sheet = context.styleTag.styleSheet || context.styleTag.sheet /* : any */;

      if (sheet.insertRule) {
          var numRules = sheet.cssRules.length;
          cssRules.forEach(function (rule) {
              try {
                  sheet.insertRule(rule, numRules);
                  numRules += 1;
              } catch (e) {
                  // The selector for this rule wasn't compatible with the browser
              }
          });
      } else if (context.styleTag) {
          // $FlowFixMe
          context.styleTag.innerText = (context.styleTag.innerText || '') + cssRules.join('');
      }
  };

  // Custom handlers for stringifying CSS values that have side effects
  // (such as fontFamily, which can cause @font-face rules to be injected)
  var stringHandlers = {
      // With fontFamily we look for objects that are passed in and interpret
      // them as @font-face rules that we need to inject. The value of fontFamily
      // can either be a string (as normal), an object (a single font face), or
      // an array of objects and strings.
      fontFamily: function () {
          function fontFamily(context /* : StyleContext */, val) {
              if (Array.isArray(val)) {
                  var nameMap = {};

                  val.forEach(function (v) {
                      nameMap[fontFamily(v)] = true;
                  });

                  return Object.keys(nameMap).join(",");
              } else if ((typeof val === 'undefined' ? 'undefined' : _typeof$1(val)) === "object") {
                  injectStyleOnce(context, val.src, "@font-face", [val], false);
                  return '"' + String(val.fontFamily) + '"';
              } else {
                  return val;
              }
          }

          return fontFamily;
      }(),

      // With animationName we look for an object that contains keyframes and
      // inject them as an `@keyframes` block, returning a uniquely generated
      // name. The keyframes object should look like
      //  animationName: {
      //    from: {
      //      left: 0,
      //      top: 0,
      //    },
      //    '50%': {
      //      left: 15,
      //      top: 5,
      //    },
      //    to: {
      //      left: 20,
      //      top: 20,
      //    }
      //  }
      // TODO(emily): `stringHandlers` doesn't let us rename the key, so I have
      // to use `animationName` here. Improve that so we can call this
      // `animation` instead of `animationName`.
      animationName: function () {
          function animationName(context /* : StyleContext */, val, selectorHandlers) {
              if (Array.isArray(val)) {
                  return val.map(function (v) {
                      return animationName(v, selectorHandlers);
                  }).join(",");
              } else if ((typeof val === 'undefined' ? 'undefined' : _typeof$1(val)) === "object") {
                  // Generate a unique name based on the hash of the object. We can't
                  // just use the hash because the name can't start with a number.
                  // TODO(emily): this probably makes debugging hard, allow a custom
                  // name?
                  var name = 'keyframe_' + String(hashObject(val));

                  // Since keyframes need 3 layers of nesting, we use `generateCSS` to
                  // build the inner layers and wrap it in `@keyframes` ourselves.
                  var finalVal = '@keyframes ' + name + '{';

                  // TODO see if we can find a way where checking for OrderedElements
                  // here is not necessary. Alternatively, perhaps we should have a
                  // utility method that can iterate over either a plain object, an
                  // instance of OrderedElements, or a Map, and then use that here and
                  // elsewhere.
                  if (val instanceof OrderedElements) {
                      val.forEach(function (valVal, valKey) {
                          finalVal += generateCSS(valKey, [valVal], selectorHandlers, stringHandlers, false).join('');
                      });
                  } else {
                      Object.keys(val).forEach(function (key) {
                          finalVal += generateCSS(key, [val[key]], selectorHandlers, stringHandlers, false).join('');
                      });
                  }
                  finalVal += '}';

                  injectGeneratedCSSOnce(context, name, [finalVal]);

                  return name;
              } else {
                  return val;
              }
          }

          return animationName;
      }()
  };

  var injectGeneratedCSSOnce = function injectGeneratedCSSOnce(context /* : StyleContext */, key, generatedCSS) {
      var _context$injectionBuf;

      if (context.alreadyInjected[key]) {
          return;
      }

      if (!context.isBuffering) {
          // We should never be automatically buffering on the server (or any
          // place without a document), so guard against that.
          if (typeof document === "undefined") {
              throw new Error("Cannot automatically buffer without a document");
          }

          // If we're not already buffering, schedule a call to flush the
          // current styles.
          context.isBuffering = true;
          browserAsap(function () {
              return flushToStyleTag(context);
          });
      }

      (_context$injectionBuf = context.injectionBuffer).push.apply(_context$injectionBuf, _toConsumableArray$1(generatedCSS));
      context.alreadyInjected[key] = true;
  };

  var injectStyleOnce = function injectStyleOnce(context /* : StyleContext */
  , key /* : string */
  , selector /* : string */
  , definitions /* : SheetDefinition[] */
  , useImportant /* : boolean */
  ) {
      var selectorHandlers /* : SelectorHandler[] */ = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : [];

      if (context.alreadyInjected[key]) {
          return;
      }

      var generated = generateCSS(selector, definitions, selectorHandlers, stringHandlers, useImportant);

      injectGeneratedCSSOnce(context, key, generated);
  };

  var startBuffering = function startBuffering() /* : StyleContext */{
      var context = createContext();
      context.isBuffering = true;

      return context;
  };

  var flushToArray = function flushToArray(context /* : StyleContext */) {
      context.isBuffering = false;
      var ret = context.injectionBuffer;
      context.injectionBuffer = [];
      return ret;
  };

  var flushToString = function flushToString(context /* : StyleContext */) {
      return flushToArray(context).join('');
  };

  var flushToStyleTag = function flushToStyleTag(context /* : StyleContext */) {
      var cssRules = flushToArray(context);
      if (cssRules.length > 0) {
          injectStyleTag(context, cssRules);
      }
  };

  var getRenderedClassNames = function getRenderedClassNames(context /* : StyleContext */) /* : string[] */{
      return Object.keys(context.alreadyInjected);
  };

  var addRenderedClassNames = function addRenderedClassNames(context /* : StyleContext */, classNames /* : string[] */) {
      classNames.forEach(function (className) {
          context.alreadyInjected[className] = true;
      });
  };

  var processStyleDefinitions = function processStyleDefinitions(styleDefinitions /* : any[] */
  , classNameBits /* : string[] */
  , definitionBits /* : Object[] */
  , length /* : number */
  ) /* : number */{
      for (var i = 0; i < styleDefinitions.length; i += 1) {
          // Filter out falsy values from the input, to allow for
          // `css(a, test && c)`
          if (styleDefinitions[i]) {
              if (Array.isArray(styleDefinitions[i])) {
                  // We've encountered an array, so let's recurse
                  length += processStyleDefinitions(styleDefinitions[i], classNameBits, definitionBits, length);
              } else {
                  classNameBits.push(styleDefinitions[i]._name);
                  definitionBits.push(styleDefinitions[i]._definition);
                  length += styleDefinitions[i]._len;
              }
          }
      }
      return length;
  };

  /**
   * Inject styles associated with the passed style definition objects, and return
   * an associated CSS class name.
   *
   * @param {boolean} useImportant If true, will append !important to generated
   *     CSS output. e.g. {color: red} -> "color: red !important".
   * @param {(Object|Object[])[]} styleDefinitions style definition objects, or
   *     arbitrarily nested arrays of them, as returned as properties of the
   *     return value of StyleSheet.create().
   */
  var injectAndGetClassName = function injectAndGetClassName(context /* : StyleContext */
  , useImportant /* : boolean */
  , styleDefinitions /* : MaybeSheetDefinition[] */
  , selectorHandlers /* : SelectorHandler[] */
  ) /* : string */{
      var classNameBits = [];
      var definitionBits = [];

      // Mutates classNameBits and definitionBits and returns a length which we
      // will append to the hash to decrease the chance of hash collisions.
      var length = processStyleDefinitions(styleDefinitions, classNameBits, definitionBits, 0);

      // Break if there aren't any valid styles.
      if (classNameBits.length === 0) {
          return "";
      }

      var className = void 0;
      {
          className = classNameBits.length === 1 ? '_' + String(classNameBits[0]) : '_' + String(hashString(classNameBits.join())) + String((length % 36).toString(36));
      }

      injectStyleOnce(context, className, '.' + String(className), definitionBits, useImportant, selectorHandlers);

      return className;
  };

  /*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  */
  /* eslint-disable no-unused-vars */
  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;

  function toObject(val) {
  	if (val === null || val === undefined) {
  		throw new TypeError('Object.assign cannot be called with null or undefined');
  	}

  	return Object(val);
  }

  function shouldUseNative() {
  	try {
  		if (!Object.assign) {
  			return false;
  		}

  		// Detect buggy property enumeration order in older V8 versions.

  		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
  		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
  		test1[5] = 'de';
  		if (Object.getOwnPropertyNames(test1)[0] === '5') {
  			return false;
  		}

  		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
  		var test2 = {};
  		for (var i = 0; i < 10; i++) {
  			test2['_' + String.fromCharCode(i)] = i;
  		}
  		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
  			return test2[n];
  		});
  		if (order2.join('') !== '0123456789') {
  			return false;
  		}

  		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
  		var test3 = {};
  		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
  			test3[letter] = letter;
  		});
  		if (Object.keys(Object.assign({}, test3)).join('') !==
  				'abcdefghijklmnopqrst') {
  			return false;
  		}

  		return true;
  	} catch (err) {
  		// We don't expect any of the above to throw, but better to be safe.
  		return false;
  	}
  }

  var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
  	var from;
  	var to = toObject(target);
  	var symbols;

  	for (var s = 1; s < arguments.length; s++) {
  		from = Object(arguments[s]);

  		for (var key in from) {
  			if (hasOwnProperty.call(from, key)) {
  				to[key] = from[key];
  			}
  		}

  		if (getOwnPropertySymbols) {
  			symbols = getOwnPropertySymbols(from);
  			for (var i = 0; i < symbols.length; i++) {
  				if (propIsEnumerable.call(from, symbols[i])) {
  					to[symbols[i]] = from[symbols[i]];
  				}
  			}
  		}
  	}

  	return to;
  };

  var n="function"===typeof Symbol&&Symbol.for,p=n?Symbol.for("react.element"):60103,q=n?Symbol.for("react.portal"):60106,r=n?Symbol.for("react.fragment"):60107,t=n?Symbol.for("react.strict_mode"):60108,u=n?Symbol.for("react.profiler"):60114,v=n?Symbol.for("react.provider"):60109,w$1=n?Symbol.for("react.context"):60110,x=n?Symbol.for("react.concurrent_mode"):60111,y=n?Symbol.for("react.forward_ref"):60112,z=n?Symbol.for("react.suspense"):60113,A=n?Symbol.for("react.memo"):
  60115,B=n?Symbol.for("react.lazy"):60116,C="function"===typeof Symbol&&Symbol.iterator;function aa(a,b,e,c,d,g,h,f){if(!a){a=void 0;if(void 0===b)a=Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var l=[e,c,d,g,h,f],m=0;a=Error(b.replace(/%s/g,function(){return l[m++]}));a.name="Invariant Violation";}a.framesToPop=1;throw a;}}
  function D(a){for(var b=arguments.length-1,e="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=0;c<b;c++)e+="&args[]="+encodeURIComponent(arguments[c+1]);aa(!1,"Minified React error #"+a+"; visit %s for the full message or use the non-minified dev environment for full errors and additional helpful warnings. ",e);}var E={isMounted:function(){return !1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},F={};
  function G(a,b,e){this.props=a;this.context=b;this.refs=F;this.updater=e||E;}G.prototype.isReactComponent={};G.prototype.setState=function(a,b){"object"!==typeof a&&"function"!==typeof a&&null!=a?D("85"):void 0;this.updater.enqueueSetState(this,a,b,"setState");};G.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate");};function H(){}H.prototype=G.prototype;function I(a,b,e){this.props=a;this.context=b;this.refs=F;this.updater=e||E;}var J=I.prototype=new H;
  J.constructor=I;objectAssign(J,G.prototype);J.isPureReactComponent=!0;var K={current:null,currentDispatcher:null},L=Object.prototype.hasOwnProperty,M={key:!0,ref:!0,__self:!0,__source:!0};
  function N(a,b,e){var c=void 0,d={},g=null,h=null;if(null!=b)for(c in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(g=""+b.key),b)L.call(b,c)&&!M.hasOwnProperty(c)&&(d[c]=b[c]);var f=arguments.length-2;if(1===f)d.children=e;else if(1<f){for(var l=Array(f),m=0;m<f;m++)l[m]=arguments[m+2];d.children=l;}if(a&&a.defaultProps)for(c in f=a.defaultProps,f)void 0===d[c]&&(d[c]=f[c]);return {$$typeof:p,type:a,key:g,ref:h,props:d,_owner:K.current}}
  function ba(a,b){return {$$typeof:p,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}function O(a){return "object"===typeof a&&null!==a&&a.$$typeof===p}function escape(a){var b={"=":"=0",":":"=2"};return "$"+(""+a).replace(/[=:]/g,function(a){return b[a]})}var P=/\/+/g,Q=[];function R(a,b,e,c){if(Q.length){var d=Q.pop();d.result=a;d.keyPrefix=b;d.func=e;d.context=c;d.count=0;return d}return {result:a,keyPrefix:b,func:e,context:c,count:0}}
  function S(a){a.result=null;a.keyPrefix=null;a.func=null;a.context=null;a.count=0;10>Q.length&&Q.push(a);}
  function T(a,b,e,c){var d=typeof a;if("undefined"===d||"boolean"===d)a=null;var g=!1;if(null===a)g=!0;else switch(d){case "string":case "number":g=!0;break;case "object":switch(a.$$typeof){case p:case q:g=!0;}}if(g)return e(c,a,""===b?"."+U(a,0):b),1;g=0;b=""===b?".":b+":";if(Array.isArray(a))for(var h=0;h<a.length;h++){d=a[h];var f=b+U(d,h);g+=T(d,f,e,c);}else if(null===a||"object"!==typeof a?f=null:(f=C&&a[C]||a["@@iterator"],f="function"===typeof f?f:null),"function"===typeof f)for(a=f.call(a),h=
  0;!(d=a.next()).done;)d=d.value,f=b+U(d,h++),g+=T(d,f,e,c);else"object"===d&&(e=""+a,D("31","[object Object]"===e?"object with keys {"+Object.keys(a).join(", ")+"}":e,""));return g}function V(a,b,e){return null==a?0:T(a,"",b,e)}function U(a,b){return "object"===typeof a&&null!==a&&null!=a.key?escape(a.key):b.toString(36)}function ca(a,b){a.func.call(a.context,b,a.count++);}
  function da(a,b,e){var c=a.result,d=a.keyPrefix;a=a.func.call(a.context,b,a.count++);Array.isArray(a)?W(a,c,e,function(a){return a}):null!=a&&(O(a)&&(a=ba(a,d+(!a.key||b&&b.key===a.key?"":(""+a.key).replace(P,"$&/")+"/")+e)),c.push(a));}function W(a,b,e,c,d){var g="";null!=e&&(g=(""+e).replace(P,"$&/")+"/");b=R(b,g,c,d);V(a,da,b);S(b);}
  var X={Children:{map:function(a,b,e){if(null==a)return a;var c=[];W(a,c,null,b,e);return c},forEach:function(a,b,e){if(null==a)return a;b=R(null,null,b,e);V(a,ca,b);S(b);},count:function(a){return V(a,function(){return null},null)},toArray:function(a){var b=[];W(a,b,null,function(a){return a});return b},only:function(a){O(a)?void 0:D("143");return a}},createRef:function(){return {current:null}},Component:G,PureComponent:I,createContext:function(a,b){void 0===b&&(b=null);a={$$typeof:w$1,_calculateChangedBits:b,
  _currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null};a.Provider={$$typeof:v,_context:a};return a.Consumer=a},forwardRef:function(a){return {$$typeof:y,render:a}},lazy:function(a){return {$$typeof:B,_ctor:a,_status:-1,_result:null}},memo:function(a,b){return {$$typeof:A,type:a,compare:void 0===b?null:b}},Fragment:r,StrictMode:t,Suspense:z,createElement:N,cloneElement:function(a,b,e){null===a||void 0===a?D("267",a):void 0;var c=void 0,d=objectAssign({},a.props),g=a.key,h=a.ref,f=a._owner;
  if(null!=b){void 0!==b.ref&&(h=b.ref,f=K.current);void 0!==b.key&&(g=""+b.key);var l=void 0;a.type&&a.type.defaultProps&&(l=a.type.defaultProps);for(c in b)L.call(b,c)&&!M.hasOwnProperty(c)&&(d[c]=void 0===b[c]&&void 0!==l?l[c]:b[c]);}c=arguments.length-2;if(1===c)d.children=e;else if(1<c){l=Array(c);for(var m=0;m<c;m++)l[m]=arguments[m+2];d.children=l;}return {$$typeof:p,type:a.type,key:g,ref:h,props:d,_owner:f}},createFactory:function(a){var b=N.bind(null,a);b.type=a;return b},isValidElement:O,version:"16.7.0",
  unstable_ConcurrentMode:x,unstable_Profiler:u,__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED:{ReactCurrentOwner:K,assign:objectAssign}},Y={default:X},Z=Y&&X||Y;var react_production_min=Z.default||Z;

  var react = createCommonjsModule(function (module) {

  {
    module.exports = react_production_min;
  }
  });

  var reactIs_production_min = createCommonjsModule(function (module, exports) {
  Object.defineProperty(exports,"__esModule",{value:!0});
  var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.async_mode"):60111,m=b?Symbol.for("react.concurrent_mode"):60111,n=b?Symbol.for("react.forward_ref"):60112,p=b?Symbol.for("react.suspense"):60113,q=b?Symbol.for("react.memo"):
  60115,r=b?Symbol.for("react.lazy"):60116;function t(a){if("object"===typeof a&&null!==a){var u=a.$$typeof;switch(u){case c:switch(a=a.type,a){case l:case m:case e:case g:case f:case p:return a;default:switch(a=a&&a.$$typeof,a){case k:case n:case h:return a;default:return u}}case r:case q:case d:return u}}}function v(a){return t(a)===m}exports.typeOf=t;exports.AsyncMode=l;exports.ConcurrentMode=m;exports.ContextConsumer=k;exports.ContextProvider=h;exports.Element=c;exports.ForwardRef=n;
  exports.Fragment=e;exports.Lazy=r;exports.Memo=q;exports.Portal=d;exports.Profiler=g;exports.StrictMode=f;exports.Suspense=p;exports.isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===m||a===g||a===f||a===p||"object"===typeof a&&null!==a&&(a.$$typeof===r||a.$$typeof===q||a.$$typeof===h||a.$$typeof===k||a.$$typeof===n)};exports.isAsyncMode=function(a){return v(a)||t(a)===l};exports.isConcurrentMode=v;exports.isContextConsumer=function(a){return t(a)===k};
  exports.isContextProvider=function(a){return t(a)===h};exports.isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};exports.isForwardRef=function(a){return t(a)===n};exports.isFragment=function(a){return t(a)===e};exports.isLazy=function(a){return t(a)===r};exports.isMemo=function(a){return t(a)===q};exports.isPortal=function(a){return t(a)===d};exports.isProfiler=function(a){return t(a)===g};exports.isStrictMode=function(a){return t(a)===f};
  exports.isSuspense=function(a){return t(a)===p};
  });

  unwrapExports(reactIs_production_min);
  var reactIs_production_min_1 = reactIs_production_min.typeOf;
  var reactIs_production_min_2 = reactIs_production_min.AsyncMode;
  var reactIs_production_min_3 = reactIs_production_min.ConcurrentMode;
  var reactIs_production_min_4 = reactIs_production_min.ContextConsumer;
  var reactIs_production_min_5 = reactIs_production_min.ContextProvider;
  var reactIs_production_min_6 = reactIs_production_min.Element;
  var reactIs_production_min_7 = reactIs_production_min.ForwardRef;
  var reactIs_production_min_8 = reactIs_production_min.Fragment;
  var reactIs_production_min_9 = reactIs_production_min.Lazy;
  var reactIs_production_min_10 = reactIs_production_min.Memo;
  var reactIs_production_min_11 = reactIs_production_min.Portal;
  var reactIs_production_min_12 = reactIs_production_min.Profiler;
  var reactIs_production_min_13 = reactIs_production_min.StrictMode;
  var reactIs_production_min_14 = reactIs_production_min.Suspense;
  var reactIs_production_min_15 = reactIs_production_min.isValidElementType;
  var reactIs_production_min_16 = reactIs_production_min.isAsyncMode;
  var reactIs_production_min_17 = reactIs_production_min.isConcurrentMode;
  var reactIs_production_min_18 = reactIs_production_min.isContextConsumer;
  var reactIs_production_min_19 = reactIs_production_min.isContextProvider;
  var reactIs_production_min_20 = reactIs_production_min.isElement;
  var reactIs_production_min_21 = reactIs_production_min.isForwardRef;
  var reactIs_production_min_22 = reactIs_production_min.isFragment;
  var reactIs_production_min_23 = reactIs_production_min.isLazy;
  var reactIs_production_min_24 = reactIs_production_min.isMemo;
  var reactIs_production_min_25 = reactIs_production_min.isPortal;
  var reactIs_production_min_26 = reactIs_production_min.isProfiler;
  var reactIs_production_min_27 = reactIs_production_min.isStrictMode;
  var reactIs_production_min_28 = reactIs_production_min.isSuspense;

  var reactIs = createCommonjsModule(function (module) {

  {
    module.exports = reactIs_production_min;
  }
  });

  /**
   * Copyright 2015, Yahoo! Inc.
   * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
   */

  var REACT_STATICS = {
      childContextTypes: true,
      contextType: true,
      contextTypes: true,
      defaultProps: true,
      displayName: true,
      getDefaultProps: true,
      getDerivedStateFromError: true,
      getDerivedStateFromProps: true,
      mixins: true,
      propTypes: true,
      type: true
  };

  var KNOWN_STATICS = {
      name: true,
      length: true,
      prototype: true,
      caller: true,
      callee: true,
      arguments: true,
      arity: true
  };

  var FORWARD_REF_STATICS = {
      '$$typeof': true,
      render: true,
      defaultProps: true,
      displayName: true,
      propTypes: true
  };

  var TYPE_STATICS = {};
  TYPE_STATICS[reactIs.ForwardRef] = FORWARD_REF_STATICS;

  var defineProperty = Object.defineProperty;
  var getOwnPropertyNames = Object.getOwnPropertyNames;
  var getOwnPropertySymbols$1 = Object.getOwnPropertySymbols;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var getPrototypeOf = Object.getPrototypeOf;
  var objectPrototype = Object.prototype;

  function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
      if (typeof sourceComponent !== 'string') {
          // don't hoist over string (html) components

          if (objectPrototype) {
              var inheritedComponent = getPrototypeOf(sourceComponent);
              if (inheritedComponent && inheritedComponent !== objectPrototype) {
                  hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
              }
          }

          var keys = getOwnPropertyNames(sourceComponent);

          if (getOwnPropertySymbols$1) {
              keys = keys.concat(getOwnPropertySymbols$1(sourceComponent));
          }

          var targetStatics = TYPE_STATICS[targetComponent['$$typeof']] || REACT_STATICS;
          var sourceStatics = TYPE_STATICS[sourceComponent['$$typeof']] || REACT_STATICS;

          for (var i = 0; i < keys.length; ++i) {
              var key = keys[i];
              if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
                  var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
                  try {
                      // Avoid failures from read-only properties
                      defineProperty(targetComponent, key, descriptor);
                  } catch (e) {}
              }
          }

          return targetComponent;
      }

      return targetComponent;
  }

  var hoistNonReactStatics_cjs = hoistNonReactStatics;

  var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

  var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  /* ::
  import type {ComponentType, Node} from 'react';
  import type {StyleContext} from './inject.js';

  export type Context = {
      Consumer: ComponentType < {
          children: (value: StyleContext) => Node
      } > ,
      Provider: ComponentType < {
          value: StyleContext
      } >
  };
  */

  function getDisplayName(WrappedComponent /* : ComponentType */) {
      return WrappedComponent.displayName || WrappedComponent.name || 'Component';
  }

  var CSSContext /* : Context */ = react.createContext();

  function withCSS(WrappedComponent /* : ComponentType */) {
      var withDisplayName = 'withCSS(' + String(getDisplayName(WrappedComponent)) + ')';

      var Wrapper = function (_React$Component) {
          _inherits(Wrapper, _React$Component);

          function Wrapper(props) {
              _classCallCheck$1(this, Wrapper);

              var _this = _possibleConstructorReturn(this, (Wrapper.__proto__ || Object.getPrototypeOf(Wrapper)).call(this, props));

              _this.renderContext = _this.renderContext.bind(_this);
              _this.css = _this.css.bind(_this);
              return _this;
          }

          _createClass$1(Wrapper, [{
              key: 'css',
              value: function () {
                  function css(context /* : StyleContext */) {
                      // Avoid a circular import
                      var _require = require('./index'),
                          css = _require.css;

                      return function () /* : MaybeSheetDefinition[] */{
                          for (var _len = arguments.length, styleDefinitions = Array(_len), _key = 0; _key < _len; _key++) {
                              styleDefinitions[_key] = arguments[_key];
                          }

                          return css(context, styleDefinitions);
                      };
                  }

                  return css;
              }()
          }, {
              key: 'render',
              value: function () {
                  function render() {
                      return react.createElement(
                          CSSContext.Consumer,
                          null,
                          this.renderContext
                      );
                  }

                  return render;
              }()
          }, {
              key: 'renderContext',
              value: function () {
                  function renderContext(context /* : StyleContext */) {
                      return react.createElement(WrappedComponent, _extends({}, this.props, { css: this.css(context) }));
                  }

                  return renderContext;
              }()
          }]);

          return Wrapper;
      }(react.Component);

      Wrapper.displayName = withDisplayName;
      Wrapper.WrappedComponent = WrappedComponent;

      return hoistNonReactStatics_cjs(Wrapper, WrappedComponent, {});
  }

  var CSSProvider = CSSContext.Provider;

  /* ::
  import type { SelectorHandler } from './generate.js';
  import type { StyleContext } from './inject.js';
  export type SheetDefinition = { [id:string]: any };
  export type SheetDefinitions = SheetDefinition | SheetDefinition[];
  type RenderFunction = (context: StyleContext) => string;
  type AsyncRenderFunction = (context: StyleContext) => Promise<string>;
  type Extension = {
      selectorHandler: SelectorHandler
  };
  export type MaybeSheetDefinition = SheetDefinition | false | null | void
  */

  var unminifiedHashFn = function unminifiedHashFn(str /* : string */, key /* : string */) {
      return String(key) + '_' + String(hashString(str));
  };

  // StyleSheet.create is in a hot path so we want to keep as much logic out of it
  // as possible. So, we figure out which hash function to use once, and only
  // switch it out via minify() as necessary.
  //
  // This is in an exported function to make it easier to test.
  var initialHashFn = function initialHashFn() {
      return hashString;
  };

  var hashFn = initialHashFn();

  var StyleSheet = {
      create: function () {
          function create(sheetDefinition /* : SheetDefinition */) /* : Object */{
              var mappedSheetDefinition = {};
              var keys = Object.keys(sheetDefinition);

              for (var i = 0; i < keys.length; i += 1) {
                  var key = keys[i];
                  var val = sheetDefinition[key];
                  var stringVal = JSON.stringify(val);

                  mappedSheetDefinition[key] = {
                      _len: stringVal.length,
                      _name: hashFn(stringVal, key),
                      _definition: val
                  };
              }

              return mappedSheetDefinition;
          }

          return create;
      }(),


      createContext: createContext,

      rehydrate: function () {
          function rehydrate(context /* : StyleContext */) {
              var renderedClassNames /* : string[] */ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

              addRenderedClassNames(context, renderedClassNames);
          }

          return rehydrate;
      }()
  };

  /**
   * Utilities for using afrododi server-side.
   *
   * This can be minified out in client-only bundles by replacing `typeof window`
   * with `"object"`, e.g. via Webpack's DefinePlugin:
   *
   *   new webpack.DefinePlugin({
   *     "typeof window": JSON.stringify("object")
   *   })
   */
  var StyleSheetServer = typeof window !== 'undefined' ? null : {
      renderStatic: function () {
          function renderStatic(renderFunc /* : RenderFunction */) {
              var context = startBuffering();
              var html = renderFunc(context);
              var cssContent = flushToString(context);

              return {
                  html: html,
                  css: {
                      content: cssContent,
                      renderedClassNames: getRenderedClassNames(context)
                  }
              };
          }

          return renderStatic;
      }(),
      renderStaticAsync: function () {
          function renderStaticAsync(renderFunc /* : AsyncRenderFunction */) {
              var context = startBuffering();

              return renderFunc(context).then(function (html /* : string */) {
                  var cssContent = flushToString(context);

                  return {
                      html: html,
                      css: {
                          content: cssContent,
                          renderedClassNames: getRenderedClassNames(context)
                      }
                  };
              });
          }

          return renderStaticAsync;
      }()
  };

  /**
   * Utilities for using afrododi in tests.
   *
   * Not meant to be used in production.
   */
  var StyleSheetTestUtils = null;

  /**
   * Generate the afrododi API exports, with given `selectorHandlers` and
   * `useImportant` state.
   */
  function makeExports(useImportant /* : boolean */
  ) {
      var selectorHandlers /* : SelectorHandler[] */ = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultSelectorHandlers;

      return {
          StyleSheet: Object.assign({}, StyleSheet, {

              /**
               * Returns a version of the exports of afrododi (i.e. an object
               * with `css` and `StyleSheet` properties) which have some
               * extensions included.
               *
               * @param {Array.<Object>} extensions: An array of extensions to
               *     add to this instance of afrododi. Each object should have a
               *     single property on it, defining which kind of extension to
               *     add.
               * @param {SelectorHandler} [extensions[].selectorHandler]: A
               *     selector handler extension. See `defaultSelectorHandlers` in
               *     generate.js.
               *
               * @returns {Object} An object containing the exports of the new
               *     instance of afrododi.
               */
              extend: function () {
                  function extend(extensions /* : Extension[] */) {
                      var extensionSelectorHandlers = extensions
                      // Pull out extensions with a selectorHandler property
                      .map(function (extension) {
                          return extension.selectorHandler;
                      })
                      // Remove nulls (i.e. extensions without a selectorHandler property).
                      .filter(function (handler) {
                          return handler;
                      });

                      return makeExports(useImportant, selectorHandlers.concat(extensionSelectorHandlers));
                  }

                  return extend;
              }()
          }),

          StyleSheetServer: StyleSheetServer,
          StyleSheetTestUtils: StyleSheetTestUtils,

          minify: function () {
              function minify(shouldMinify /* : boolean */) {
                  hashFn = shouldMinify ? hashString : unminifiedHashFn;
              }

              return minify;
          }(),
          css: function () {
              function css(context /* : StyleContext */) /* : MaybeSheetDefinition[] */{
                  if (!context || !context.hasOwnProperty('injectionBuffer')) {
                      throw new Error('The css() function was called without a StyleContext instance. Consider using the withCSS() higher-order component instead.');
                  }

                  for (var _len = arguments.length, styleDefinitions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                      styleDefinitions[_key - 1] = arguments[_key];
                  }

                  return injectAndGetClassName(context, useImportant, styleDefinitions, selectorHandlers);
              }

              return css;
          }(),


          CSSProvider: CSSProvider,
          withCSS: withCSS,

          flushToStyleTag: flushToStyleTag,
          injectAndGetClassName: injectAndGetClassName,
          defaultSelectorHandlers: defaultSelectorHandlers
      };
  }

  var useImportant = true; // Add !important to all style definitions

  var afrododi = makeExports(useImportant);

  var StyleSheet$1 = afrododi.StyleSheet,
      StyleSheetServer$1 = afrododi.StyleSheetServer,
      StyleSheetTestUtils$1 = afrododi.StyleSheetTestUtils,
      css = afrododi.css,
      minify = afrododi.minify,
      flushToStyleTag$1 = afrododi.flushToStyleTag,
      injectAndGetClassName$1 = afrododi.injectAndGetClassName,
      defaultSelectorHandlers$1 = afrododi.defaultSelectorHandlers,
      CSSProvider$1 = afrododi.CSSProvider,
      withCSS$1 = afrododi.withCSS;

  exports.StyleSheet = StyleSheet$1;
  exports.StyleSheetServer = StyleSheetServer$1;
  exports.StyleSheetTestUtils = StyleSheetTestUtils$1;
  exports.css = css;
  exports.minify = minify;
  exports.flushToStyleTag = flushToStyleTag$1;
  exports.injectAndGetClassName = injectAndGetClassName$1;
  exports.defaultSelectorHandlers = defaultSelectorHandlers$1;
  exports.CSSProvider = CSSProvider$1;
  exports.withCSS = withCSS$1;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=afrododi.umd.js.map
