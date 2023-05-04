import "./index.css"
import { ErrorBoundary, Match, Switch, render } from "solid-js/web"
import { LoginPage, simpleRouter, SettingsPage } from '../../../packages/ui/src'
import { nav } from "../../../packages/ui/src/core/dg"

	const user = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInUserName"
	const pass = "ctl01$TemplateBody$WebPartManager1$gwpciNewContactSignInCommon$ciNewContactSignInCommon$signInPassword"

	const urlx = "https://datagrove_servr/iCore/Contacts/Sign_In.aspx?LoginRedirect=true&returnurl=%2fMBRR%2fiSamples%2fMemberR%2fDefault.aspx%3fhkey%3d96ddafab-81a2-4e33-8182-2bdb8439d828"



function App() {
    simpleRouter()
    return <div>
        <ErrorBoundary fallback={(e) => <div>{e.message}</div>}>
            <Switch>
                <Match when={nav() == "/" || nav()==""} >
                    <LoginPage />
                </Match>
                <Match when={nav() == "settings"} >
                    <SettingsPage/>
                </Match>
                <Match when={true}>
                    <div>Not Found "{nav()}"</div>
                </Match>
            </Switch>
        </ErrorBoundary>

    </div>
}
render(() => (<App />), document.getElementById("app")!)

