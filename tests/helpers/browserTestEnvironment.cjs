const {TestEnvironment}=require('jest-environment-jsdom');
const {Request,Response,Headers,AbortController,AbortSignal}=globalThis;
module.exports=class extends TestEnvironment { async setup(){await super.setup();Object.assign(this.global,{Request,Response,Headers,AbortController,AbortSignal});} };
