import { createWebApi } from 'zen-cerebellum';

//default reducer options
const defaultOptions = { withReset: true };

/** Generates a basic reducer : store response (as is) of a web service API.
  @param type (string) : default type associated to web-api
  @param initialState : (optionnal) object for reducer state initialization.
  @param options (object) : options for reducer behavior
    @param withReset : reset reducer to initial state when web service is called
 */
export function generateBasicReducer(type, initialState = [], options = {}) {

  //merge default options with passed ones
  const opts = Object.assign({}, defaultOptions, options);

  return function reducer(state = initialState, action) {

    if (action.type === `${type}_READ_RESPONSE`) {
      return action.payload;
    } else if (action.type === `${type}_READ_REQUEST` && opts.withReset) {
      return initialState;
    }
    return state;
  }
}

/** Generates an action creator for loading data.
  @param type (string) : type associated to load/fetch web-api
  @param endpointBuilder (function) : allow to generate an URI endpoint
  @param canRun (function) : (optionnal) predicate indicating whether loading shall occur or not
  @return RAA that dispatch a WAA LOAD action.
*/
export function generateLoadActionCreator(type, endpointBuilder, canRun) {

  return createWebApi(type, 'READ', endpointBuilder, canRun);
}
