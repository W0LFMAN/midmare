"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
var Context;
(function (Context_1) {
    class Context {
        constructor(options) {
            this.options = options;
            this.__store = new Map;
            this.matched = [];
            this.__pathStory = new Set;
            this.path = this.options.path;
            this.app = this.options.app;
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
        send(path, data) {
            this.options.app.send(path, data, this);
        }
    }
    Context_1.Context = Context;
})(Context = exports.Context || (exports.Context = {}));
//# sourceMappingURL=Context.class.js.map