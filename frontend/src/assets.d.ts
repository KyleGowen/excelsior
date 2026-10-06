/** Static browser assets are handled by Vite, never by a Node runtime module. */
declare module '*.png' { const url:string; export default url; }
declare module '*.webp' { const url:string; export default url; }
