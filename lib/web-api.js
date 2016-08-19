import { noop } from 'zen-cerebellum';

/** Generates an action creator for a Web API call.
  @param type (string) : type identifier associated to the web-api

  @param method (string) : Web API verb (READ, CREATE, UPDATE, PATCH, DELETE)

  @param endpointBuilder (function) : allow to generate an URI endpoint.
    Method arguments :
      @param state : redux state tree
      @param runParams : result of 'canExecute' predicate if existing
      @param payload : (optionnal) payload argument passed to the web-api action

  @param canExecute (function) : (optionnal) predicate indicating whether web-api call shall occur or not
    Method arguments :
      @param state : redux state tree
      @param payload : (optionnal) payload argument passed to the web-api action

  @return RAA that dispatch a WAA action.
*/
export function createWebApi(type, method = 'READ', endpointBuilder, canExecute) {

  //create the RAA
  return function call(payload, meta = null) {

    return function(dispatch, getState) {

      const state = getState();

      const execParams = canExecute ? canExecute(state, payload) : true;
      //exit if not allowed
      if (!execParams) return noop();

      //dispatch WAA
      return dispatch({
        type,
        payload,
        meta,
        api: {
          method,
          endpoint: endpointBuilder(state, execParams, payload)
        }
      });
    }
  }
}
