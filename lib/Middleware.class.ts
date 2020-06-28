import { Context } from "./Context.class";
import {Router} from "./Router.class";

export namespace Middleware {
    export interface Middleware {
        (ctx: Context.Context, next: NextCallback): void;
        param?: string;
        router? : Router.Router;
    }

    export interface NextCallback {
        (err?: Error): void;
    }

}