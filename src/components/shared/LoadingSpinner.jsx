export default function LoadingSpinner({ className = 'py-24' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-9 h-9 border-2 border-secondary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
