"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Route = void 0;
const path_to_regexp_1 = require("path-to-regexp");
var Route;
(function (Route_1) {
    class Route {
        constructor(path, middleware, options = {}) {
            this.path = path;
            this.options = options;
            this.name = '';
            this.stack = [];
            this.paramNames = [];
            this.regexp = path_to_regexp_1.pathToRegexp(this.path, this.paramNames, options);
            this.stack = Array.isArray(middleware) ?
                middleware :
                [middleware];
            this.stack.forEach(mw => mw.name && (mw.method = mw.name.toString()));
            if (this.stack.some(mw => typeof mw !== 'function'))
                throw TypeError('All middleware should have callback function.');
        }
        match(path) {
            return this.regexp.test(path);
        }
        params(captures, existingParams) {
            const params = existingParams || {};
            for (let len = captures.length, i = 0; i < len; i++) {
                if (this.paramNames[i]) {
                    params[this.paramNames[i].name] = captures[i];
                }
            }
            return params;
        }
        param(param, fn) {
            const stack = this.stack;
            const params = this.paramNames;
            const middleware = function (ctx, next) {
                return fn.call(this, ctx.params[param], ctx, next);
            };
            middleware.param = param;
            const names = params.map(function (p) {
                return p.name;
            });
            const x = names.indexOf(param);
            if (x > -1) {
                stack.some((mw, i) => {
                    if (!mw.param || names.indexOf(fn.param) > x) {
                        stack.splice(i, 0, middleware);
                        return true;
                    }
                    return false;
                });
            }
            return this;
        }
        ;
        captures(path) {
            return this.options.ignoreCaptures ? [] : path.match(this.regexp).slice(1);
        }
        ;
        setPrefix(prefix) {
            if (this.path) {
                this.path = (this.path !== '/' || this.options.strict === true) ? `${prefix}${this.path}` : prefix;
                this.paramNames = [];
                this.regexp = path_to_regexp_1.pathToRegexp(this.path, this.paramNames, this.options);
            }
            return this;
        }
        ;
    }
    Route_1.Route = Route;
})(Route = exports.Route || (exports.Route = {}));
//# sourceMappingURL=Route.class.js.map