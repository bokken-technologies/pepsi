import Canvas, {
    useState,
    useEffect,
    Position,
    Label,
    View,
    Justify,
    AlignItems
} from 'bokken/canvas';

import Engine from 'bokken/engine';

export function FramesPerSecond() {
    const [framesPerSecond, setFramesPerSecond] = useState(0);

    useEffect(() => {
        let lastFrame = Engine.frameCount;
        let lastTime = Engine.now();

        const intervalId = Engine.setInterval(() => {
            const now = Engine.now();
            const currentFrame = Engine.frameCount;

            const deltaFrames = currentFrame - lastFrame;
            const deltaTime = now - lastTime;

            if (deltaTime > 0) {
                setFramesPerSecond(Math.round((deltaFrames / deltaTime) * 1000));
            }

            lastFrame = currentFrame;
            lastTime = now;
        }, 500);

        return () => Engine.clearInterval(intervalId);
    }, []);

    let color = 0x000000FF;
    
    return (
        <View style={{
            position: Position.Absolute,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
        }}>
            <View style={{
                position: Position.Absolute,
                top: 15,
                right: 15,
                backgroundColor: 0x00000000,
                paddingTop: 6,
                paddingBottom: 6,
                paddingLeft: 12,
                paddingRight: 12,
                borderRadius: 4,
                justifyContent: Justify.Center,
                alignItems: AlignItems.Center
            }}>
                <Label style={{
                    color,
                    fontSize: 20,
                    fontBold: true,
                    textAlign: 'center',
                }}>
                    {`${framesPerSecond} FPS`}
                </Label>
            </View>
        </View>
    );
}