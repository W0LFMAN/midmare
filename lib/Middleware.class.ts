import { Context } from "./Context.class";
import {Router} from "./Router.class";

export namespace Middleware {
    export interface Middleware {
        (ctx: Context.Context, next: NextCallback): void;
        param?: string;
        router? : Router.Router;
        method?: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'trace' | 'connect' | string;
        [key: string]: any;
    }

    export interface NextCallback {
        (err?: Error): void;
    }

}