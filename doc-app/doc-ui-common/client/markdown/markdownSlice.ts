import { PayloadAction } from '@reduxjs/toolkit';
import { stateFactory, ofPayloadAction } from '@wfh/redux-toolkit-observable/es/state-factory-browser';
import * as op from 'rxjs/operators';
import * as rx from 'rxjs';
import axiosObs from 'axios-observable';

export interface MarkdownState {
  /** value is markdown url */
  markdowns: {[key: string]: string};

  contents: {[key: string]: string};
}

const initialState: MarkdownState = {
  markdowns: {},
  contents: {}
};

const markdownSlice = stateFactory.newSlice({
  name: 'markdown',
  initialState,
  reducers: {
    registerFiles(s, {payload}: PayloadAction<MarkdownState['markdowns']>) {
      Object.assign(s.markdowns, payload);
    },
    getHtml(s, action: PayloadAction<string>) {}
  }
});

export const dispatcher = stateFactory.bindActionCreators(markdownSlice);

const releaseEpic = stateFactory.addEpic<{Markdown: MarkdownState}>((action$, state$) => {
  return rx.merge(
    action$.pipe(ofPayloadAction(markdownSlice.actions.getHtml),
      op.mergeMap(({payload: key}) => {
        return axiosObs.get<string>(getState().markdowns[key])
        .pipe(
          op.tap(res => {
            dispatcher._change(s => s.contents[key] = res.data);
          })
        );
      })
    )
  ).pipe(
    op.catchError((ex, src) => {
      // tslint:disable-next-line: no-console
      console.error(ex);
      // gService.toastAction('网络错误\n' + ex.message);
      return src;
    }),
    op.ignoreElements()
  );
});

export function getState() {
  return stateFactory.sliceState(markdownSlice);
}

export function getStore() {
  return stateFactory.sliceStore(markdownSlice);
}

if (module.hot) {
  module.hot.dispose(data => {
    stateFactory.removeSlice(markdownSlice);
    releaseEpic();
  });
}
