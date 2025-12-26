declare module 'safe-eval' {
  export default function safeEval(code: string, context?: object, options?: object): any;
}
