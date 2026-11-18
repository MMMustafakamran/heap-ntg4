// HARNESS: not from the docs. One app holds every doc page. The page is picked by deep link
// `copilotqa://page/<id>` (adb: am start -a android.intent.action.VIEW -d copilotqa://page/<id>),
// so the probe and recorder switch pages without a rebuild. Default page: the quickstart (./App.tsx).
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { PAGES } from "./pages/registry";

const idOf = (url?: string | null) => url?.match(/^copilotqa:\/\/page\/([\w-]+)/)?.[1] ?? null;

export default function Harness() {
  const [id, setId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Linking.getInitialURL().then((u) => { setId(idOf(u)); setReady(true); });
    const sub = Linking.addEventListener("url", ({ url }) => setId(idOf(url)));
    return () => sub.remove();
  }, []);

  if (!ready) return null;
  const Page = PAGES[id ?? "quickstart"];
  if (!Page) return <View style={{ padding: 24 }}><Text>HARNESS: no page "{id}"</Text></View>;
  return <Page key={id ?? "quickstart"} />;
}
