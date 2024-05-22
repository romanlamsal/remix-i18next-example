import { useTranslation } from "react-i18next"

export default function Index() {
    const { t } = useTranslation()

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
            <h1>{t("helloWorld")}</h1>
        </div>
    )
}
