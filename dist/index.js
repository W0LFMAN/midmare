"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_class_1 = require("./lib/Application.class");
const Router_class_1 = require("./lib/Router.class");
const http_1 = require("http");
function mid(options) {
    return new Application_class_1.Application.Application(options);
}
exports.default = mid;
__exportStar(require("./lib/Router.class"), exports);
__exportStar(require("./lib/Route.class"), exports);
__exportStar(require("./lib/Middleware.class"), exports);
__exportStar(require("./lib/Context.class"), exports);
__exportStar(require("./lib/Application.class"), exports);
const r = new Router_class_1.Router.HttpRouter({});
r.process('/', function get(ctx) {
    ctx.status = 200;
    ctx.body = '<h1>Hello World!</h1>';
    return;
});
r.process('/ololo', function get(ctx) {
    ctx.redirect('/');
});
const server = http_1.createServer(r.routes());
server.listen(3000);
//# sourceMappingURL=index.js.map