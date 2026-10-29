import Canvas, { Label, View, Button } from "bokken/canvas";
import { defaultStore, Screen } from "../../store.ts";

export function MainMenu() {
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
                alignItems: 'Start',
                paddingLeft: 80,
            }}
        >
            <View
                style={{
                    width: 380,
                    flexDirection: 'Column',
                    alignItems: 'Start',
                    gap: 8,
                }}
            >
                {/* Game Title */}
                <Label style={{ color: 0xD9534FFF, fontSize: 44, fontBold: true, marginBottom: 24, letterSpacing: 2 }}>
                    Pepsi
                </Label>

                {/* Start Game Button */}
                <Button
                    style={{
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        backgroundColor: 0xFFFFFFCC,
                        borderColor: 0xD9534FFF,
                        borderLeftWidth: 4,
                        alignItems: 'Start',
                        hoverBackgroundColor: 0xFFFFFFFF,
                    }}
                    onClick={() => defaultStore.setState({ screen: Screen.Playing })}
                >
                    <Label style={{ color: 0x333333FF, fontSize: 18, fontBold: true }}>
                        Play Game
                    </Label>
                </Button>

                {/* Settings Button */}
                <Button
                    style={{
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        backgroundColor: 0xFFFFFFCC,
                        borderColor: 0xC87D7DFF,
                        borderLeftWidth: 4,
                        alignItems: 'Start',
                        hoverBackgroundColor: 0xFFFFFFFF,
                    }}
                    onClick={() => defaultStore.setState({ screen: Screen.Settings })}
                >
                    <Label style={{ color: 0x555555FF, fontSize: 18, fontBold: true }}>
                        Settings
                    </Label>
                </Button>

                {/* Credits Button */}
                <Button
                    style={{
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        backgroundColor: 0xFFFFFFCC,
                        borderColor: 0xC87D7DFF,
                        borderLeftWidth: 4,
                        alignItems: 'Start',
                        hoverBackgroundColor: 0xFFFFFFFF,
                    }}
                    onClick={() => defaultStore.setState({ screen: Screen.Credits })}
                >
                    <Label style={{ color: 0x555555FF, fontSize: 18, fontBold: true }}>
                        Credits
                    </Label>
                </Button>

                {/* Quit / Exit Button */}
                <Button
                    style={{
                        width: '100%',
                        paddingTop: 10,
                        paddingBottom: 10,
                        paddingLeft: 16,
                        backgroundColor: 0xFFFFFFCC,
                        borderColor: 0xC87D7DFF,
                        borderLeftWidth: 4,
                        alignItems: 'Start',
                        hoverBackgroundColor: 0xFFFFFFFF,
                    }}
                    onClick={() => {}}
                >
                    <Label style={{ color: 0x555555FF, fontSize: 18, fontBold: true }}>
                        Quit
                    </Label>
                </Button>
            </View>
        </View>
    );
}
