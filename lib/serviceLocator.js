/**
  Central registry used to implement basic inversion of control (IoC) between specific layer and generic packages.
*/
class ServiceLocator {

  constructor() {
    //internal storage
    this.storage = {};
  }

  /** Declare a new service to be used later.
    @param key (string) : service unique identifier.
    @param service (object or function) : service instance to register.
    @returns object : ServiceLocator instance (to chain calls).
  */
  declare(key, service) {

    this.storage[key] = service;
    return this;
  }

  /** Get the service associated to the key.
    @param key (string) : service unique identifier.
    @returns object or function : service instance if previously registered, null otherwise.
  */
  get(key) {

    return this.storage[key];
  }
}

//export singleton instance
export default new ServiceLocator();
