import { mutate } from 'zen-cerebellum';

/** Filter an array of object that corresponds to a filtering value
  @param filterValue (string) : value to use as filter
  @param list (array) : array to process
  @return array : new filtered array
*/
export const filterList = (filter = '', list = []) => {

  //bypass if no filter value
  if (!filter) return list;
  //check if any string properties of an object matches the filter
  const filterDelegate = (obj) => Object.keys(obj).some(key => {
    const value = obj[key];
    if (value && typeof value === 'string') {
      return value ? value.toLowerCase().indexOf(filter.toLowerCase()) !== -1 : false;
    }
  });
  //apply it to array
  return list.filter(x => filterDelegate(x));
}

/** Sort an array of object through a property in either ascending or decending order
  @param prop (string) : property to sort on
  @param order (string) : sorting order ('asc' or 'desc')
  @param list (array) : array to process
  @return array : new sorted array
*/
const sorterList = (prop = 'name', order = 'asc', list = []) => {

  return list.sort((compA, compB) => {
    let a = compA;
    let b = compB;
    //if a prop is provided to sort by, assume each element is an object with a property called `prop`.
    if (prop) {
      a = compA[prop];
      b = compB[prop];
    }

    if (a > b) return order === 'asc' ? 1 : -1;
    if (a < b) return order === 'asc' ? -1 : 1;
    return 0;
  });
};

/** Reverse all items in array.
  @param list (array) : array to process
  @return array : new reversed array
*/
const reverserList = list => list.slice().reverse();

/** Compute the total number of pages that can be made from an array.
  @param per (number) : number of items for each page
  @param list (array) : array to process
  @return number : total available pages
*/
const totalPages = (per = 10, list = []) => {

  const total = Math.ceil(list.length / per);
  return total ? total : 0;
};

/** Compute a slice of array starting at `start` up to `per`
  @param page (number) : starting page
  @param per (number) : number of items for each page
  @param list (array) : array to process
  @return array : new sliced array
*/
const slicerList = (page = 1, per = 10, list = []) => {

  const start = (Math.max(page, 1) - 1) * per;
  const end = per === 0 ? list.length : start + per;
  return end === list.length ? list.slice(start) : list.slice(start, end);
};

//defined default actions name
const PAG_GOTO_PAGE = 'PAG_GOTO_PAGE';
const PAG_NEXT_PAGE = 'PAG_NEXT_PAGE';
const PAG_PREV_PAGE = 'PAG_PREV_PAGE';
const PAG_FILTER = 'PAG_FILTER';
const PAG_SORT = 'PAG_SORT';
const PAG_CHANGE_PER = 'PAG_CHANGE_PER';
const PAG_RESET = 'PAG_RESET';

/** Actions generator for pagination
  @param type (string) : prefix identifier to use for actions type.
  @return object : where keys are the available pagination actions
*/
export function generateActionsPaginate(type) {

  const gotoPage = page => ({
    type: `${type}_${PAG_GOTO_PAGE}`,
    payload: page
  });

  const sortBy = by => ({
    type: `${type}_${PAG_SORT}`,
    payload: by
  });

  const filterWith = filter => ({
    type: `${type}_${PAG_FILTER}`,
    payload: filter
  });

  const changePer = per => ({
    type: `${type}_${PAG_CHANGE_PER}`,
    payload: per
  });

  const reset = () => ({
    type: `${type}_${PAG_RESET}`
  });

  return {
    gotoPage,
    sortBy,
    filterWith,
    changePer,
    reset
  }
}

//default pagination options
const defaultOptions = {
  page: 1,
  total: 0,
  per: 10,
  order: 'asc',
  by: 'Id',
  filter: ''
};

//no effect extractor
const noop = x => x;

/** Transducer that extends a reducer with pagination abilities
  @param type (string) : reducer identifier
  @param reducer (function) : reducer to augment
  @param extractor (function) : Optional. Function to extract part of the wrapped state where pagination occurs
  @param initOptions (object) : Optional. Default pagination options
  @returns high order reducer with pagination
 */
export function paginated(type, reducer, extractor = noop, initOptions = {}) {

  //compute options
  const options = mutate(defaultOptions, initOptions);

  //Enhance the state with:
  //- base : original wrapped state
  //- pageList : an array which represents the current page.
  //- cacheList : internal cache (already filtered/sorted/ordered) against which pagination is computed.
  //- pagination parameters (page, total, per, order, by, filter)
  const initialState = mutate({
    base: reducer(undefined, {}),
    pageList: [],
    cacheList: [],
  }, options);

  return function transducer(state = initialState, action) {

    //check if match the reducer identifier type
    if (action.type.indexOf(type) !== 0) return state;

    //get current state properties
    const { cacheList, page, per, order, by, filter } = state;
    //list is the complete original array from the base reducer
    const list = extractor(state.base);

    switch (action.type) {

      //reset pagination
      case `${type}_${PAG_RESET}`:
        {
          //reset up existing data with initial pagination options
          const newCache = sorterList(options.by, options.order, filterList(options.filter, list));

          return mutate(state, mutate(options, {
            cacheList: newCache,
            pageList: slicerList(options.page, options.per, newCache),
            total: totalPages(options.per, newCache)
          }));
        }

        //goto a specific page
      case `${type}_${PAG_GOTO_PAGE}`:
        {
          const newPage = action.payload;
          return mutate(state, {
            page: newPage,
            pageList: slicerList(newPage, per, cacheList)
          });
        }

        //go to next page (or jump to the beginning)
      case `${type}_${PAG_NEXT_PAGE}`:
        {
          let nextPage = page + 1;
          if (nextPage > list.length - 1) nextPage = 0;

          return mutate(state, {
            page: nextPage,
            pageList: slicerList(nextPage, per, cacheList)
          });
        }

        //go to previous page (or jump to the end)
      case `${type}_${PAG_PREV_PAGE}`:
        {
          let prevPage = page - 1;
          if (prevPage < 0) prevPage = list.length - 1;

          return mutate(state, {
            page: prevPage,
            pageList: slicerList(prevPage, per, cacheList)
          });
        }

        //filter the list
      case `${type}_${PAG_FILTER}`:
        {
          const newFilter = action.payload;
          const newCache = sorterList(by, order, filterList(newFilter, list));
          const newTotalPages = totalPages(per, newCache);
          const newPage = page <= newTotalPages ? page : 1;

          return mutate(state, {
            page: newPage,
            filter: newFilter,
            cacheList: newCache,
            pageList: slicerList(newPage, per, newCache),
            total: newTotalPages
          });
        }

        //sort the list
      case `${type}_${PAG_SORT}`:
        {
          const newBy = action.payload;
          const newOrder = newBy === by && order === 'asc' ? 'desc' : 'asc';
          //use reverse if sorted using same property
          const newCache = newBy === by ? reverserList(cacheList) : sorterList(newBy, newOrder, filterList(filter, list));

          return mutate(state, {
            by: newBy,
            order: newOrder,
            cacheList: newCache,
            pageList: slicerList(page, per, newCache)
          });
        }

        //change pagination dimension
      case `${type}_${PAG_CHANGE_PER}`:
        {
          const newPer = action.payload;
          const newTotalPages = totalPages(newPer, cacheList);
          //keep same page if possible
          const newPage = Math.min(page, newTotalPages);

          return mutate(state, {
            page: newPage,
            per: newPer,
            pageList: slicerList(newPage, newPer, cacheList),
            total: newTotalPages
          });
        }
    }

    //here, proxy others action to wrapped reducer

    //reset up all base data with existing pagination parameters
    const newBase = reducer(state.base, action);
    const newCache = sorterList(by, order, filterList(filter, extractor(newBase)));

    return mutate(state, {
      base: newBase,
      cacheList: newCache,
      pageList: slicerList(page, per, newCache),
      total: totalPages(per, newCache)
    });
  };
}
