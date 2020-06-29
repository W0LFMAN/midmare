"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const uuid_1 = require("uuid");
var Context;
(function (Context_1) {
    class Context {
        constructor(options) {
            this.options = options;
            this.__store = new Map;
            this.matched = [];
            this.path = this.options.path;
            this.app = this.options.app;
            this.set('__uuid', uuid_1.v4());
        }
        set(key, val) {
            this.__store.set(key, val);
            return val;
        }
        get(key) {
            return this.__store.get(key);
        }
        store() {
            return new Map(this.__store);
        }
        restore(newStore) {
            return this.__store = newStore;
        }
        error(err) {
            throw err;
        }
        send(path, data, saveCtxStore) {
            this.options.app.send(path, data, saveCtxStore);
        }
    }
    Context_1.Context = Context;
})(Context = exports.Context || (exports.Context = {}));
//# sourceMappingURL=Context.class.js.map