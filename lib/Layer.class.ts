import { pathToRegexp, compile, parse } from 'path-to-regexp';
import {Middleware} from "./Middleware.class";
import {Router} from "./Router.class";
import {Context} from "./Context.class";

export namespace Layer {
    import Dict = NodeJS.Dict;
    import Path = Router.Path;
    import NextCallback = Middleware.NextCallback;

    export type Callback = (...args: any[]) => void;
    export type AnyDict = { [key: string]: any };

    export class Layer {
        protected readonly regexp: RegExp;
        protected readonly paramNames = [];
        protected readonly stack: Middleware.Middleware[] = [];

        constructor(protected readonly path: string, middleware: Callback[] | Callback, protected readonly options: Dict<any> = {} as AnyDict) {
            this.regexp = pathToRegexp(this.path, this.paramNames, options);
            this.stack = Array.isArray(middleware) ?
                middleware.map(fn => new Middleware.Middleware({ callback: fn })) :
                [new Middleware.Middleware({ callback: middleware })];

            if(this.stack.some(mw => typeof mw.callback !== 'function')) throw TypeError('All middleware should have callback function.');
        }

        match(path: Path) {
            return this.regexp.test(path);
        }

        params(path, captures, existingParams) {
            const params = existingParams || {};
            for (let len = captures.length, i=0; i<len; i++) {
                if (this.paramNames[i]) {
                    params[this.paramNames[i].name] = captures[i];
                }
            }

            return params;
        }

        param (param, fn) {
            const stack = this.stack;
            const params = this.paramNames;
            const middleware = function (ctx: Context.Context, next: NextCallback) {
                return fn.call(this, ctx.params[param], ctx, next);
            } as MWare;

            middleware.param = param;

            const names = params.map(function (p) {
                return p.name;
            });

            const x = names.indexOf(param);
            if (x > -1) {
                stack.some(function (mw, i) {
                    if (!mw.callback.param || names.indexOf(fn.param) > x) {
                        stack.splice(i, 0, new Middleware.Middleware({ callback: middleware }));
                        return true;
                    }
                });
            }

            return this;
        };

        captures (path) {
            return this.options.ignoreCaptures ? [] : path.match(this.regexp).slice(1);
        };
    }

    export interface MWare {
        (...args: any[]) : any;
        param: string;
    }
}