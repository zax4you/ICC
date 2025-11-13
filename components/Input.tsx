import clsx from "clsx";

export default function Input({
  label,
  className,
  ...props
}: {
  label?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      {label && (
        <label className="text-text2 text-sm">{label}</label>
      )}
      <input
        {...props}
        className={clsx(
          "w-full px-3 py-2 rounded-md bg-bg2 border border-border text-text1 focus:outline-none focus:ring-1 focus:ring-accent",
          className
        )}
      />
    </div>
  );
}
