import { mutate, addElement, removeElement, replaceElement } from 'zen-cerebellum';

/** Generates all action creators for CRUD data management.
  @param type (string) : type associated to data management.

  @param endpointBuilder (function) : allow to generate an URI endpoint.
    Method arguments :
      @param state (object) : redux state tree
      @param method (string) : CRUD action type
      @param options (object) : (optionnal) extra information passed to the CRUD action.
        Properties :
          @param element (object) : object/item being altered
          @param mutations (object) : key values of mutated properties
          @param params (object) : extra queriable data for READ action
      @param executeParams : (optionnal) result of 'canExecute' predicate if existing

  @param canExecute (function) : (optionnal) predicate indicating whether CRUD action shall occur or not
    Method arguments :
      @param state (object): redux state tree
      @param method (string) : CRUD action type
      @param options (object) : (optionnal) extra information passed to the CRUD action. See also 'endpointBuilder'.

  @return object containing 4 CRUD actions (each action being a redux asycnhronous action [RAA] that dispatch a web-api action [WAA]).
*/
export function generateActionCreatorsCRUD(type, endpointBuilder, canExecute) {

  //launch CRUD action
  function execute(method, options) {

    //returns redux asynchronous action for lazy evaluation
    return function(dispatch, getState) {

      const { element, mutations, params } = options;
      const state = getState();

      const executeParams = canExecute ? canExecute(state, method, options) : true;
      //exit if not allowed
      if (!executeParams) return null;

      //payload depends on action type : use object for create, mutations for update/patch, and params for read...
      let payload = null;
      switch (method) {
        case 'CREATE':
          payload = element;
          break;
        case 'UPDATE':
        case 'PATCH':
          payload = mutations;
          break;
        case 'READ':
          payload = params;
          break;
      }

      //always pass original object in action meta property (to have info on current mutated element in WebAPI response).
      const meta = element ? { genuine: element } : null;

      //retrieve endpoint and append element identifier if necessary
      let endpoint = endpointBuilder(state, method, options, executeParams);
      if (method === 'PATCH' || method === 'UPDATE' || method === 'DELETE') {
        endpoint += `/${element.Id}/`;
      }

      //build and dispatch WAA
      return dispatch({
        type,
        payload,
        meta,
        api: {
          method,
          endpoint
        }
      });
    };
  }

  //export all CRUD atomic actions
  return {
    create: (newObject) => execute('CREATE', { element: newObject }),
    read: (params) => execute('READ', { params }),
    update: (element, mutations) => execute('PATCH', { element, mutations }),
    delete: (element) => execute('DELETE', { element })
  }
}

/** Generates a CRUD reducer managing DATA set through normalized WebAPI.
  @param type (string) : type associated to managed data.

  @return function : CRUD reducer.
*/
export function generateReducerCRUD(type) {

  const initialState = {
    fetching: false,
    pending: false,
    items: []
  }

  return function reducerCRUD(state = initialState, action) {

    switch (action.type) {

      case `${type}_READ_REQUEST`:
        return mutate(state, {
          fetching: true
        });

      case `${type}_READ_RESPONSE`:
        return mutate(state, {
          fetching: false,
          items: action.payload
        });

      case `${type}_CREATE_RESPONSE`:
        //action.payload is the complete object sent back by server
        return mutate(state, {
          items: addElement(state.items, action.payload)
        });

      case `${type}_DELETE_RESPONSE`:
        return mutate(state, {
          items: removeElement(state.items, action.meta.genuine)
        });

      case `${type}_PATCH_RESPONSE`:
        //action.meta.genuine is the original object used by front-end
        //merge it with server response
        return mutate(state, {
          items: replaceElement(state.items, action.meta.genuine, action.payload)
        });
    }
    return state;
  }
}
