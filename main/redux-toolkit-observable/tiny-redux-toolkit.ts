/**
 * This file provide some hooks which leverages RxJS to mimic Redux-toolkit + Redux-observable
 * which is supposed to be used independently within any React component in case your component has 
 * complicated async state change logic.
 * 
 * - it is small and supposed to be well performed
 * - it does not use ImmerJS, you should take care of immutability of state by yourself
 * - because there is no ImmerJS, you can put any type of Object in state including those are not friendly by ImmerJS
 */
import * as rx from 'rxjs';
import * as op from 'rxjs/operators';
export interface Action<S> {
  type: string;
  reducer?(old: S): S | void;
}

export interface PayloadAction<S, P = any> {
  type: string;
  payload: P;
  reducer?(old: S, payload: P): S | void;
}

export interface Reducers<S> {
  /** Returning `undefined / void` has same effect of returning old state reference,
   * Returning a brand new state object for immutability in normal case.
   */
  [type: string]: (state: S, payload?: any) => S | void;
}

export type Actions<S, R extends Reducers<S>> = {
  [K in keyof R]: R[K] extends (s: any) => any ? ActionCreatorWithoutPayload<S> :
    R[K] extends (s: any, payload: infer P) => any ? ActionCreatorWithPayload<S, P> : ActionCreatorWithPayload<S, unknown>;
};

export type ActionCreator<S, P> = ActionCreatorWithoutPayload<S> | ActionCreatorWithPayload<S, P>;
interface ActionCreatorWithoutPayload<S> {
  (): Action<S>;
  type: string;
}

interface ActionCreatorWithPayload<S, P> {
  (payload: P): PayloadAction<S, P>;
  type: string;
}

type OutputActionObs<S, R extends Reducers<any>, K extends keyof R> =
  rx.Observable<R[K] extends (s: S) => any ? Action<S> : R[K] extends (s: S, payload: infer P) => any ? PayloadAction<S, P> : PayloadAction<S, unknown>>;
  // rx.Observable<PayloadAction<any, Parameters<R[K]>[1] extends undefined ? void : Parameters<R[K]>[1], K>>;

type OfTypePipeOp<S, R extends Reducers<S>, K extends keyof R> = (src: rx.Observable<PayloadAction<S> | Action<S>>) => OutputActionObs<S, R, K>;

/** same as ofPayloadAction() , to filter action stream by type, unlike ofPayloadAction(), parameter is a string instead of actionCreator */
export interface OfTypeFn<S, R extends Reducers<S>> {
  <K1 extends keyof R>(actionType: K1): OfTypePipeOp<S, R, K1>;
  <K1 extends keyof R, K2 extends keyof R>(actionType: K1, actionType2: K2): OfTypePipeOp<S, R, K1 | K2>;
  <K1 extends keyof R, K2 extends keyof R, K3 extends keyof R>(actionType: K1, actionType2: K2, actionType3: K3): OfTypePipeOp<S, R, K1 | K2 | K3>;
  <K extends keyof R>(...actionTypes: K[]): OfTypePipeOp<S, R, K>;
}

export type EpicFactory<S, R extends Reducers<S>> = (slice: Slice<S, R>, ofType: OfTypeFn<S, R>) => Epic<S>;
export interface Slice<S, R extends Reducers<S>> {
  name: string | number;
  state$: rx.BehaviorSubject<S>;
  dispatch: (action: PayloadAction<S>) => void;
  /** Action creators bound with dispatcher */
  actionDispatcher: Actions<S, R>;
  /** Action creators */
  actions: Actions<S, R>;
  destroy: () => void;
  addEpic(epicFactory: EpicFactory<S, R>): void;
}

export type Epic<S> = (actions: rx.Observable<PayloadAction<any> | Action<any>>, states: rx.BehaviorSubject<S>) => rx.Observable<Action<any>>;

type PayloadTypeOfAction<ActionCreatorType> = ActionCreatorType extends ActionCreatorWithoutPayload<any> ? void :
  ActionCreatorType extends ActionCreatorWithPayload<any, infer P> ? P : never;

/** filter action stream by type */
export function ofPayloadAction<S, A extends ActionCreator<S, any>>(actionCreators: A):
  (source: rx.Observable<PayloadAction<any> | Action<any>>) => rx.Observable<PayloadAction<S, PayloadTypeOfAction<A>>>;
export function ofPayloadAction<S, A extends ActionCreator<S, any>, S1, A1 extends ActionCreator<S1, any>>(actionCreators: A, actionCreators1: A1):
  (source: rx.Observable<PayloadAction<any> | Action<any>>) => rx.Observable<PayloadAction<S, PayloadTypeOfAction<A>> | PayloadAction<S1, PayloadTypeOfAction<A1>>>;
export function ofPayloadAction<S, A extends ActionCreator<S, any>, S1, A1 extends ActionCreator<S1, any>, S2, A2 extends ActionCreator<S2, any>>(actionCreators: A, actionCreators1: A1, actionCreators2: A2):
  (source: rx.Observable<PayloadAction<any> | Action<any>>) => rx.Observable<PayloadAction<S, PayloadTypeOfAction<A>> | PayloadAction<S1, PayloadTypeOfAction<A1>> | PayloadAction<S2, PayloadTypeOfAction<A2>>>;
export function ofPayloadAction<A extends ActionCreator<any, any>>(
  ...actionCreators: A[]):
  (source: rx.Observable<PayloadAction<any> | Action<any>>) => rx.Observable<PayloadAction<unknown, PayloadTypeOfAction<A>>> {
  return function(src: rx.Observable<PayloadAction<any>>) {
    return src.pipe(
      op.filter(action => actionCreators.some(ac => action.type === ac.type))
    );
  };
}

const sliceCount4Name: {[name: string]: number} = {};

export interface SliceOptions<S, R extends Reducers<S>> {
  name: string;
  initialState: S;
  reducers: R;
  /** Generate unique ID as part of slice's name, default: true */
  generateId?: boolean;
  debug?: boolean;
  rootStore?: rx.BehaviorSubject<{[k: string]: S}>;
}

/**
 * Reducers and initialState are reused cross multiple component
 * 
 *  Slice --- Component instance (state, actions)
 */
export function createSlice<S extends {error?: Error}, R extends Reducers<S>>(opt: SliceOptions<S, R>): Slice<S, R> {
  let name = opt.name;
  if (opt.generateId === undefined || opt.generateId === true) {
    if (sliceCount4Name[name] == null) {
      sliceCount4Name[name] = 0;
    }
    opt.name = name = name + (++sliceCount4Name[name]);
  }
  const actionCreators = {} as Actions<S, R>;
  const actionDispatcher = {} as Actions<S, R>;

  for (const [key, reducer] of Object.entries(opt.reducers)) {
    const type = name + '/' + key;
    const creator = ((payload: any) => {
      const action = {type, payload, reducer};
      return action;
    }) as any;
    creator.type = type;
    actionCreators[key as keyof R] = creator;

    actionDispatcher[key as keyof R] = ((payload?: any) => {
      const action = (creator as ActionCreatorWithPayload<S, any>)(payload);
      dispatch(action);
      return action;
    }) as any;
    actionDispatcher[key as keyof R].type = creator.type;
  }

  const state$ = new rx.BehaviorSubject<S>(opt.initialState);
  const unprocessedAction$ = new rx.Subject<PayloadAction<S> | Action<S>>();
  const action$ = new rx.Subject<PayloadAction<S> | Action<S>>();


  function ofType<S, R extends Reducers<S>, T extends keyof R>(
    ...actionTypes: T[]) {
    return function(src: rx.Observable<PayloadAction<any>>) {
      return src.pipe(
        op.filter(action => actionTypes.some(ac => action.type === name + '/' + ac))
      );
    };
  }

  function dispatch(action: PayloadAction<S> | Action<S>) {
    unprocessedAction$.next(action);
  }

  const sub = rx.merge(
    state$.pipe(
      op.tap(state => {
        if (opt.debug) {
          // tslint:disable-next-line: no-console
          console.log(`%c ${name} internal:state`, 'color: black; background: #e98df5;', state);
        }
      }),
      op.distinctUntilChanged()
      // op.tap(state => onStateChange(state))
    ),
    unprocessedAction$.pipe(
      op.tap(action => {
        if (opt.debug) {
          // tslint:disable-next-line: no-console
          console.log(`%c ${name} internal:action`, 'color: black; background: #fae4fc;', action.type);
        }
      }),
      op.tap(action => {
        if (action.reducer) {
          const currState = state$.getValue();
          const newState = action.reducer(currState, (action as PayloadAction<S>).payload);
          if (newState !== undefined) {
            state$.next({...newState});
          } else {
            state$.next({...currState});
          }
        }
        action$.next(action);
      }),
      op.catchError((err, caught) => {
        console.error(err);
        dispatch({type: 'reducer error',
          reducer(s: S) {
            return {...s, error: err};
          }
        });
        return caught;
      })
    ),
    opt.rootStore ? state$.pipe(
      op.tap(state => opt.rootStore!.next({...opt.rootStore?.getValue(), [opt.name]: state}))
     ) : rx.EMPTY
  ).subscribe();

  function destroy() {
    dispatch({
      type: '__OnDestroy'
    });
    sub.unsubscribe();
  }

  function addEpic(epic: Epic<S>) {
    epic(action$, state$).pipe(
      op.takeUntil(unprocessedAction$.pipe(op.filter(action => action.type === '__OnDestroy'), op.take(1))),
      op.tap(action => dispatch(action)),
      op.catchError((err, caught) => {
        console.error(err);
        dispatch({type: 'epic error',
          reducer(s: S) {
            return {...s, error: err};
          }
        });
        return caught;
      })
    ).subscribe();
  }

  const slice: Slice<S, R> = {
    name,
    state$,
    actions: actionCreators,
    dispatch,
    actionDispatcher,
    destroy,
    addEpic(epicFactory: EpicFactory<S, R>) {
      const epic = epicFactory(slice, ofType as OfTypeFn<S, R>);
      addEpic(epic);
    }
  };
  return slice;
}

const demoSlice = createSlice({
  name: 'demo',
  initialState: {} as {ok?: boolean; error?: Error;},
  reducers: {
    hellow(s, greeting: {data: string}) {},
    world(s) {}
  }
});
demoSlice.addEpic((slice, ofType) => {
  return (action$, state$) => {
    return rx.merge(
      action$.pipe(
        ofType('hellow', 'hellow'),
        op.map(action => slice.actions.world())
      ),
      action$.pipe(
        ofType('world'),
        op.tap(action => slice.actionDispatcher.hellow({data: 'yes'}))
      ),
      action$.pipe(
        ofPayloadAction(slice.actions.hellow),
        op.tap(action => typeof action.payload.data === 'string')
      ),
      action$.pipe(
        ofPayloadAction(slice.actions.world),
        op.tap(action => slice.actionDispatcher.hellow({data: 'yes'}))
      ),
      action$.pipe(
        ofPayloadAction(slice.actionDispatcher.hellow, slice.actionDispatcher.world),
        op.tap(action => action.payload)
      )
    ).pipe(op.ignoreElements());
  };
});
