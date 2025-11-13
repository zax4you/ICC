import clsx from "clsx";

export default function Button({
  children,
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={clsx(
        "px-4 py-2 rounded-md bg-bg2 border border-border text-text1 hover:bg-bg transition disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
