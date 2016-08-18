import $ from 'jquery';

/**
  Helpers methods for :
    - callback aggregator utility
    - Promise/A+ compliance

  For now, all is delegated/proxied to jQuery Deferred.
*/

//aggregate promises into a master promise
export const syncPromises = $.when;

/** Creates a self resolved promise. noop = NO OPeration.
  Useful in Redux Asynchronous Action creators to returns noop promise instead of null.
*/
export const noop = () => $.Deferred().resolve().promise();

/** Abstraction for promise creation
  @param fn (function) : function to be promisified.
  @returns object : Promise 'thenable' object interface
*/
export function waitForIt(fn) {

  const defer = $.Deferred();

  fn(defer.resolve, defer.reject);

  return defer.promise();
}
