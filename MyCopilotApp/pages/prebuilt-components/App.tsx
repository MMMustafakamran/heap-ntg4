// HARNESS: not from the doc. The page has four separate snippets; this switcher shows one at a time.
import { useState } from "react";
import { Button, View } from "react-native";
import DropInApp from "./DropInApp";
import PropsApp from "./PropsApp";
import BottomSheetApp from "./BottomSheetApp";
import PopupApp from "./PopupApp";

const VARIANTS = { "Drop-in": DropInApp, Props: PropsApp, "Bottom sheet": BottomSheetApp, Popup: PopupApp };
type Key = keyof typeof VARIANTS;

export default function PrebuiltComponentsPage() {
  const [v, setV] = useState<Key>("Drop-in");
  const Variant = VARIANTS[v];
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {(Object.keys(VARIANTS) as Key[]).map((k) => (
          <Button key={k} title={k} onPress={() => setV(k)} />
        ))}
      </View>
      <Variant key={v} />
    </View>
  );
}
