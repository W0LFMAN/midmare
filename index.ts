import {Application} from "./lib/Application.class";
import {Router} from "./lib/Router.class";
import { createServer } from "http";

export default function mid(options?: Application.IOptions) {
    return new Application.Application(options);
}

export * from './lib/Router.class';
export * from './lib/Route.class';
export * from './lib/Middleware.class';
export * from './lib/Context.class';
export * from './lib/Application.class';

const r = new Router.HttpRouter({});

r.process('/', function get(ctx) {
    ctx.status = 200;
    ctx.body = '<h1>Hello World!</h1>';
    return;
});

r.process('/ololo', function get(ctx) {
    ctx.redirect('/');
});

const server = createServer(r.routes());
server.listen(3000);