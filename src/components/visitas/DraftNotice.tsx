import { HelperText } from "react-native-paper";
import { useSyncStore } from "../../context/syncContext";
import useVisitaStore from "../../context/visitaContext";
import { View } from "react-native";
import Button from "../_default/button/ActionButton";
export default function DraftNotice() {
  const error = useSyncStore((state) => state.draftError);
  if (!error) return null;
  return (
    <View>
      <HelperText type="error" accessibilityLiveRegion="assertive">
        {error}
      </HelperText>
      <Button onPress={() => useVisitaStore.getState().updateVisita({})}>
        Tentar salvar novamente
      </Button>
    </View>
  );
}
