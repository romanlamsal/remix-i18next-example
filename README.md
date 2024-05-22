# Remix i18next Example

## 1. Initial Setup

### Add the necessary deps

```shell
pnpm add i18next
```

### Create an i18n config

Initially, we just want to have one string translated to english.

```ts
// app/lib/i18next.ts
import i18next from "i18next"

// we need to be able to await the init call later on, hence we assign an exported const
// the returned value is a function that accepts a string and runs it against the translations defined below
export const t = i18next.init({
    // so we do not have to specify the namespace when translating strings
    defaultNS: "foo",
    fallbackNS: "foo",
    // set the default language, unless otherwise specified, to english
    lng: "en",
    // resources are always of the form [LANG].[NAMESPACE].key
    resources: {
        en: {
            foo: {
                helloWorld: "Hello World",
            },
        },
    },
})
```

### Use i18next in your UI

```tsx
// app/routes/_index.tsx
import { t } from "~/lib/i18next"

export default function Index() {
    return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
            <h1>{t("helloWorld")}</h1>
        </div>
    )
}
```

### Problem: top-level await

Building your app in this stage won't work. We use a top level `await` in our `i18next.ts` which is only supported in 
ESM.

## 2. Add server and client entries

Since we want to avoid top level `await`s, we have to add logic to our server and client entries to await the init 
before rendering. We will also add `react-i18next` which will give us a handy hook to bridge the gap towards react.

We will also use this later to switch languages before rendering. This allows us to make sure that our initial server
and client paint will have the same content and remix keeps quiet about that.

### Add react-i18next

```shell
pnpm add react-i18next
```

### Switch from `init` to `createInstance`

We want to create an i18next instance, which comes preconfigured, so we only have to call `i18nextInstance.init()`.

```diff
// app/lib/i18next.ts
import i18next from "i18next"

// we need to be able to await the init call later on, hence we assign an exported const
// the returned value is a function that accepts a string and runs it against the translations defined below
- export const t = i18next.init({
+ export const i18nextInstance = i18next.createInstance({
    // so we do not have to specify the namespace when translating strings
    defaultNS: "foo",
    fallbackNS: "foo",
    // set the default language, unless otherwise specified, to english
    lng: "en",
    // resources are always of the form [LANG].[NAMESPACE].key
    resources: {
        en: {
            foo: {
                helloWorld: "Hello World",
            },
        },
    },
})
```

### Optional: Reveal entry.server.tsx and entry.client.tsx

If you have both your `app/entry.server.tsx` and `app/entry.client.tsx` in place, skip this step. Otherwise: 

```shell
# Add both
pnpm remix reveal

# Adds one... 
pnpm remix reveal entry.server
# ... or the other
pnpm remix reveal entry.client
```

###  Add `await init` to entry.server

All we have to do is `await i18nextInstance.init()` and we're good.

```diff
// app/entry.server.tsx
/* keep the imports */
+ import { i18nextInstance } from "~/lib/i18next"

/* all the other things */

- function handleBrowserRequest(
+ async function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
+ await i18nextInstance.init()

  return new Promise((resolve, reject) => {
    /* ... */
  }
```

###  Add callback to entry.client

```diff
import { RemixBrowser } from "@remix-run/react"
import { startTransition, StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
+ import { i18nextInstance } from "~/lib/i18next"

+ i18nextInstance.init().then(() => {
    startTransition(() => {
        hydrateRoot(
            document,
            <StrictMode>
                <RemixBrowser />
            </StrictMode>,
        )
    })
+ }
```

### Add react-i18next to our i18next instance

```diff
import i18next from "i18next"
+ import { initReactI18next } from "react-i18next"

// we need to be able to await the init call later on, hence we assign an exported const
export const i18nextInstance = i18next.createInstance({
    // so we do not have to specify the namespace when translating strings
    defaultNS: "foo",
    fallbackNS: "foo",
    // set the default language, unless otherwise specified, to english
    lng: "en",
    // resources are always of the form [LANG].[NAMESPACE].key
    resources: {
        en: {
            foo: {
                helloWorld: "Hello World",
            },
        },
    },
- })
+ }).use(initReactI18next)
```

### Use the translation hook in our component

```diff
// app/routes/_index.tsx
- import { t } from "~/lib/i18next"
+ import { useTranslation } from "react-i18next"

export default function Index() {
+   const { t } = useTranslation()
    return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
            <h1>{t("helloWorld")}</h1>
        </div>
    )
}
```

## 3.1 Changing language - Setup

In order to switch languages from the UI and rerender everything without reloading the entire page we have
to bridge the gap between server and client language. We have to take care of two things:
- server: what language is the client working
- client: what is the current language of the document

### Server: adding i18next cookie

We can use remix to read and write a simple cookie which contains the current language.

```ts
// app/lib/i18next.server.ts
import { createCookie } from "@remix-run/node"

export const i18nextCookie = createCookie("i18next", {
    sameSite: "lax",
    path: "/",
})

export const getCurrentLang = async (request: Request): Promise<string | void> => {
    return await i18nextCookie.parse(request.headers.get("Cookie"))
}
```

```diff
// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react"
+ import { LoaderFunctionArgs } from "@remix-run/node"
+ import { getCurrentLang, i18nextCookie } from "~/lib/i18next.server"
+ import { i18nextInstance } from "~/lib/i18next"
+ 
+ export const loader = async ({ request }: LoaderFunctionArgs) => {
+     const currentLang = getCurrentLang(request)
+ 
+     // set the cookie if not present
+     if (!currentLang) {
+         return new Response("", {
+             headers: {
+                 "Set-Cookie": await i18nextCookie.serialize(i18nextInstance.language),
+             },
+         })
+     }
+ }

export function Layout({ children }: { children: React.ReactNode }) {
    /* ... */
}
```