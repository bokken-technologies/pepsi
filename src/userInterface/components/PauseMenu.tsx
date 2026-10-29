import Canvas, { Label, View, Button } from "bokken/canvas";
import { defaultStore, Screen } from "../../store.ts";

export function PauseMenu() {
    return (
        <View
            style={{
                position: 'Absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 0xF4C2C2AA,
                justifyContent: 'Center',
                alignItems: 'Center',
            }}
        >
            <View
                style={{
                    width: 380,
                    backgroundColor: 0xFFFFFFEE,
                    borderColor: 0xD9534FFF,
                    borderLeftWidth: 4,
                    padding: 24,
                    flexDirection: 'Column',
                    alignItems: 'Start',
                    gap: 12,
                }}
            >
                {/* Paused Title */}
                <Label style={{ color: 0xD9534FFF, fontSize: 24, fontBold: true, marginBottom: 8, letterSpacing: 1 }}>
                    GAME PAUSED
                </Label>

                {/* Resume Button */}
                <Button
                    style={{
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        backgroundColor: 0xFFFFFFFF,
                        borderColor: 0xD9534FFF,
                        borderLeftWidth: 4,
                        alignItems: 'Start',
                        hoverBackgroundColor: 0xFFFFFFAA,
                    }}
                    onClick={() => defaultStore.setState({ screen: Screen.Playing })}
                >
                    <Label style={{ color: 0x333333FF, fontSize: 18, fontBold: true }}>
                        Resume Game
                    </Label>
                </Button>

                {/* Main Menu Button */}
                <Button
                    style={{
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        backgroundColor: 0xFFFFFFFF,
                        borderColor: 0xC87D7DFF,
                        borderLeftWidth: 4,
                        alignItems: 'Start',
                        hoverBackgroundColor: 0xFFFFFFAA,
                    }}
                    onClick={() => defaultStore.setState({ screen: Screen.MainMenu })}
                >
                    <Label style={{ color: 0x555555FF, fontSize: 18, fontBold: true }}>
                        Back to main menu
                    </Label>
                </Button>

                {/* Footer Hint */}
                <Label style={{ color: 0xC87D7DFF, fontSize: 12, marginTop: 8 }}>
                    Press ESC to resume
                </Label>
            </View>
        </View>
    );
}
