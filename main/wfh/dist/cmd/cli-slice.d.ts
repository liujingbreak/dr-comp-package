import { PayloadAction } from '@reduxjs/toolkit';
export interface CliState {
    /** key is package name */
    extensions: Map<string, CliExtension>;
    version: string;
    osLang?: string;
    osCountry?: string;
}
export interface CliExtension {
    pkName: string;
    pkgFilePath: string;
    funcName?: string;
}
export declare const cliSlice: import("@reduxjs/toolkit").Slice<CliState, {
    updateExtensions(draft: import("immer/dist/internal").WritableDraft<CliState>, { payload }: PayloadAction<CliExtension[]>): void;
    plinkUpgraded(d: import("immer/dist/internal").WritableDraft<CliState>, { payload: newVersion }: PayloadAction<string>): void;
    updateLocale(d: import("immer/dist/internal").WritableDraft<CliState>, { payload: [lang, country] }: PayloadAction<[string, string]>): void;
} & import("../../../redux-toolkit-observable/dist/redux-toolkit-observable").ExtraSliceReducers<CliState>, "cli">;
export declare const cliActionDispatcher: import("@reduxjs/toolkit").CaseReducerActions<{
    updateExtensions(draft: import("immer/dist/internal").WritableDraft<CliState>, { payload }: PayloadAction<CliExtension[]>): void;
    plinkUpgraded(d: import("immer/dist/internal").WritableDraft<CliState>, { payload: newVersion }: PayloadAction<string>): void;
    updateLocale(d: import("immer/dist/internal").WritableDraft<CliState>, { payload: [lang, country] }: PayloadAction<[string, string]>): void;
} & import("../../../redux-toolkit-observable/dist/redux-toolkit-observable").ExtraSliceReducers<CliState>>;
export declare function getState(): CliState;
export declare function getStore(): import("rxjs").Observable<CliState>;
export declare function availabeCliExtension(): void;
