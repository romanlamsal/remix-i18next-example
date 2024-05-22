import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react"
import { LoaderFunctionArgs } from "@remix-run/node"
import { getCurrentLang, i18nextCookie } from "~/lib/i18next.server"
import { i18nextInstance } from "~/lib/i18next"

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const currentLang = getCurrentLang(request)

    // set the cookie if not present
    if (!currentLang) {
        return new Response("", {
            headers: {
                "Set-Cookie": await i18nextCookie.serialize(i18nextInstance.language),
            },
        })
    }

    return null
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    return <Outlet />
}
