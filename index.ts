import {Application} from "./lib/Application.class";

export default function mid(options?: Application.IOptions) {
    return new Application.Application(options);
}

export * from './lib/Router.class';
export * from './lib/Route.class';
export * from './lib/Middleware.class';
export * from './lib/Context.class';
export * from './lib/Application.class';