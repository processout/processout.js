module ProcessOut {
    const { div } = elements;
    export interface TickProps {
        state?: 'pending' | 'completed' | 'idle'
    }

    export const StatusTick = ({ state = 'idle' }: TickProps) => (
        div({ className: `status-tick ${state}` },
            Tick()
        )
    )
}