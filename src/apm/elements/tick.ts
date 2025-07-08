module ProcessOut {
    const { div } = elements;
    export interface TickProps {
        state?: 'pending' | 'completed' | 'idle'
    }

    export const Tick = ({ state = 'idle' }: TickProps) => (
        div({ className: `tick ${state}` },
            div({ className: "tick-icon" }))
    )
}