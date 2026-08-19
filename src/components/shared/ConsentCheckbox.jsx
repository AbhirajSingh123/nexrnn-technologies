export default function ConsentCheckbox({ register, error, id = 'consent' }) {
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 w-4 h-4 accent-primary shrink-0"
          {...register('consent')}
        />
        <label htmlFor={id} className="text-xs text-muted normal-case leading-relaxed">
          By contacting us, you agree to our{' '}
          <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
            Privacy Policy
          </a>
          .
        </label>
      </div>
      {error && <p className="mt-1.5 text-xs text-primary normal-case">{error.message}</p>}
    </div>
  );
}
