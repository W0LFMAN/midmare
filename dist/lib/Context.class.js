"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
var Context;
(function (Context_1) {
    class Context {
        constructor(options) {
            this.options = options;
            this.matched = [];
            this.__pathStory = new Set;
            this.path = this.options.path;
            this.app = this.options.app;
        }
        set(key, val) {
            this[key] = val;
            return val;
        }
        get(key) {
            return this[key];
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
        assert(bool, err) {
            if (!Boolean(bool)) {
                this.error(err);
            }
        }
        send(path, data) {
            this.options.app.send(path, data, this);
        }
    }
    Context_1.Context = Context;
})(Context = exports.Context || (exports.Context = {}));
//# sourceMappingURL=Context.class.js.map