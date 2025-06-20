import KeepAlive from "react-activation"

const DAFKeepAlive = ({ children }: { children: React.ReactNode }) => {
    return <KeepAlive autoFreeze={false}>{children}</KeepAlive>
}

export default DAFKeepAlive;