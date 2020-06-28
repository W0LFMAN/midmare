import {Application} from "./lib/Application.class";

const app = new Application.Application({});

app
    .use((ctx, next) => {
        ctx.set('lalka', 'Ololo');
        console.log('1', ctx);
        next();
    })
    .use((ctx, next) => {
        console.log('2', ctx);
        next();
    })
    .process('/some-route', (ctx) => {
        console.log('3', ctx.get('data'));
        ctx.send('/lalka/someparam', 'Send to another route.', ctx);
    })
    .process('/lalka/:id', (ctx) => {
        console.log('4', ctx.get('data'), ctx.params, ctx.path);
    })
    .init();


app.send('/some-route', 'Some sended message!');


setTimeout(() => console.log('ended'),1000000000);