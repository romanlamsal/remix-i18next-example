import { createCookie } from "@remix-run/node"

export const i18nextCookie = createCookie("i18next", {
    sameSite: "lax",
    path: "/",
})

export const getCurrentLang = async (request: Request): Promise<string | void> => {
    return await i18nextCookie.parse(request.headers.get("Cookie"))
}
