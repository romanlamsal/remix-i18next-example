import i18next from "i18next"
import { initReactI18next } from "react-i18next"

// we need to be able to await the init call later on, hence we assign an exported const
export const i18nextInstance = i18next
    .createInstance({
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
    .use(initReactI18next)
