import { toEmailHref, isMobileDevice } from '@/utils/email';

/**
 * Email anchor jo har jagah kaam karta hai:
 *  - Desktop: Gmail web compose naye tab me (default mail client na ho to bhi)
 *  - Mobile: native mailto: (Gmail/Mail app)
 * Usage: <EmailLink href={`mailto:x@y.com?subject=...&body=...`}>Text</EmailLink>
 * Plain mailto (bina params) bhi chalega.
 */
export default function EmailLink({ href, className = '', children, ...rest }) {
  const mobile = isMobileDevice();
  return (
    <a
      href={toEmailHref(href)}
      className={className}
      {...(mobile ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
      {...rest}
    >
      {children}
    </a>
  );
}
