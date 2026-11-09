import TubeSpinner from "../assets/icon/tube-spinner.svg"

type LoaderProps = {
    className?: string
    containerClassName?: string
    text?: string
}

const Loader: React.FC<LoaderProps> = ({ className, containerClassName = "h-screen", text }) => {
    return (
        <div role="status" aria-label={text || "Loading"} className={`flex justify-center items-center gap-2 ${containerClassName}`}>
            <img src={TubeSpinner} alt="" className={`animate-spin ${className}`} width="24" height="24" />
            {text && <span>{text}</span>}
        </div>
    )
}

export default Loader