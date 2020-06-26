import {Middleware} from "./Middleware.class";
import {Router} from "./Router.class";
import {Context} from "./Context.class";

export namespace Route {
    import PathSeparator = Router.PathSeparator;

    export class Route extends Middleware.Middleware {
        protected readonly path: string;
        constructor(path: string, public readonly options: IOptions) {
            super(options);
            this.path = path.length === 1 &&
                        path === PathSeparator ?
                            path :
                                path.length > 1 && path[path.length - 1] === PathSeparator ?
                                    path.trim().slice(0, path.length - 1) : PathSeparator;
        }

        handle(ctx: Context.Context) {
            this.options.callback(ctx, err => ctx.next(err));
        }
    }

    export interface IOptions extends Middleware.IOptions {
        path: string;
    }
}