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

  @param endpointBuilder (function) : allow to generate an URI endpoint.
    Method arguments :
      @param state : redux state tree
      @param runParams : result of 'canRun' predicate if existing
      @param payload : (optionnal) payload argument passed to the load action

  @param canRun (function) : (optionnal) predicate indicating whether loading shall occur or not
    Method arguments :
      @param state : redux state tree
      @param payload : (optionnal) payload argument passed to the load action

  @return RAA that dispatch a WAA LOAD action.
*/
export function generateLoadActionCreator(type, endpointBuilder, canRun) {

  //create the RAA
  return function load(payload) {

    return function(dispatch, getState) {

      const state = getState();

      const runParams = canRun ? canRun(state, payload) : true;
      //exit if not allowed
      if (!runParams) return null;

      //dispatch WAA
      return dispatch({
        type,
        payload,
        api: {
          endpoint: endpointBuilder(state, runParams, payload)
        }
      });
    }
  }
}
