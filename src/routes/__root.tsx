import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import stylesheet from "../styles.css?url";
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Achmad Rizki Ramadhan — Fullstack & Cloud" },
      {
        name: "description",
        content:
          "Achmad Rizki Ramadhan’s portfolio. Fullstack developer, cloud enthusiast, and solving problems with AI.",
      },
    ],
    links: [
      { rel: "stylesheet", href: stylesheet },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootDocument,
  notFoundComponent: () => (
    <main id="main" className="not-found">
      <h1>404</h1>
      <p>Page not found</p>
      <a href="/">Back to profile</a>
    </main>
  ),
});
function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t='system';try{t=localStorage.getItem('portfolio-theme')||'system'}catch(e){}document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})()`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
